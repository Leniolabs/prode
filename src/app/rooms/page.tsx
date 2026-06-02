import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserByEmail, finalsStarted } from '@/utils/queries'
import prisma from '@/lib/prisma'
import { getUserEmailDomain } from '@/utils/email'
import RoomsClient from './RoomsClient'

export default async function Page() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  const rooms = await prisma.prodeRoom.findMany({
    where: {
      AND: [
        {
          OR: [
            { public: true },
            {
              UserProde: {
                some: {
                  userId: user.id,
                },
              },
            },
          ],
        },
        {
          OR: [
            { emailDomain: null },
            { emailDomain: getUserEmailDomain(user) },
          ],
        },
      ],
    },
    select: {
      id: true,
      password: true,
      name: true,
      _count: true,
      UserProde: {
        where: {
          userId: user.id,
        },
      },
    },
  })

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
    <RoomsClient
      finalsStarted={await finalsStarted()}
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        playerCount: room._count.UserProde,
        open: !!(room.password && room.UserProde.length),
        alreadyJoin: !!room.UserProde.length,
      }))}
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
