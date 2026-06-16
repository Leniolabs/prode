import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { getUserByEmail } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

function getUserEmailDomain(user: { email: string | null }) {
  if (!user.email) return null
  const parts = user.email.split('@')
  return parts.length === 2 ? parts[1] : null
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const [rooms, userProdeNotTemplate, prode] = await Promise.all([
    prisma.prodeRoom.findMany({
      where: {
        deletedAt: null,
        AND: [
          {
            OR: [
              { public: true },
              { UserProde: { some: { userId: user.id, deletedAt: null } } },
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
        userId: true,
        emailDomain: true,
        public: true,
        pointsWinner: true,
        pointsGoals: true,
        pointsPenal: true,
        _count: { select: { UserProde: { where: { deletedAt: null } } } },
        UserProde: { where: { userId: user.id, deletedAt: null } },
      },
    }),
    prisma.userProde.findMany({
      where: { userId: user.id, template: false, deletedAt: null },
      include: { prodeRoom: true },
    }),
    prisma.prode.findFirst({ select: { prodeEnd: true } }),
  ])

  const { finalsStarted } = await import('@/utils/queries')

  return NextResponse.json({
    finalsStarted: await finalsStarted(),
    prodeEnd: prode?.prodeEnd?.toISOString() ?? null,
    rooms: rooms.map((room) => {
      const isCreator = room.userId === user.id

      return {
        id: room.id,
        name: room.name,
        hasPassword: !!room.password,
        playerCount: room._count.UserProde,
        open: room.password && !!room.UserProde.length,
        alreadyJoin: !!room.UserProde.length,
        isCreator,
        ...(isCreator
          ? {
              room: {
                id: room.id,
                name: room.name,
                password: room.password,
                public: room.public,
                emailDomain: room.emailDomain,
                pointsWinner: room.pointsWinner,
                pointsGoals: room.pointsGoals,
                pointsPenal: room.pointsPenal,
              },
            }
          : {}),
      }
    }),
    userRanking: {
      id: user.id,
      name: user.name,
      image: user.image,
      prodePublic: user.prodePublic,
      dark: user.dark,
      background: user.background,
    },
    registeredProdes: userProdeNotTemplate.length,
  })
}
