import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserByEmail } from '@/utils/queries'
import prisma from '@/lib/prisma'
import NewProdeClient from './NewProdeClient'

export default async function Page() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  const userProdeNotTemplate = await prisma.userProde.findMany({
    where: {
      userId: user.id,
      template: false,
    },
    include: {
      prodeRoom: true,
    },
  })

  return (
    <NewProdeClient
      userRanking={{
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        dark: user.dark,
        background: user.background,
        email: user.email,
      }}
      registeredProdes={userProdeNotTemplate.length}
    />
  )
}
