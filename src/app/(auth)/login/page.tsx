import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserByEmail, finalsStarted } from '@/utils/queries'
import prisma from '@/lib/prisma'
import LoginClient from './LoginClient'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}) {
  const { error, callbackUrl } = await searchParams

  const session = await auth()
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null

  if (!user) {
    return <LoginClient authError={error as 'OAuthAccountNotLinked' | undefined} callbackUrl={callbackUrl} />
  }

  if (user.blocked) redirect('/blocked')

  if (callbackUrl) redirect(callbackUrl)

  const userProdeNotTemplate = await prisma.userProde.findMany({
    where: {
      userId: user.id,
      template: false,
    },
    include: {
      prodeRoom: true,
    },
  })

  if (userProdeNotTemplate.length > 1) {
    redirect('/rooms')
  } else if (userProdeNotTemplate.length === 1 && userProdeNotTemplate[0]?.prodeRoom) {
    const room = userProdeNotTemplate[0].prodeRoom

    if (await finalsStarted()) {
      redirect(`/${room.id}/finals`)
    }

    redirect(`/${room.id}/groups`)
  }

  if (await finalsStarted()) redirect('/finals')
  redirect('/groups')
}
