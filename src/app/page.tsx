import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserByEmail, finalsStarted, prodeEnded } from '@/utils/queries'
import prisma from '@/lib/prisma'
import HomeClient from './_components/HomeClient'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const session = await auth()
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null

  if (!user) {
    return <HomeClient authError={error as 'OAuthAccountNotLinked' | undefined} />
  }

  if (user.blocked) redirect('/blocked')

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

    if (await prodeEnded()) {
      redirect(`/${room.id}/results`)
    }

    if (await finalsStarted()) {
      redirect(`/${room.id}/finals`)
    }

    redirect(`/${room.id}/groups`)
  }

  if (await finalsStarted()) redirect('/finals')
  redirect('/groups')
}
