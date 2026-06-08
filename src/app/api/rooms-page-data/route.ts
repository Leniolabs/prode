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
        AND: [
          {
            OR: [
              { public: true },
              { UserProde: { some: { userId: user.id } } },
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
        UserProde: { where: { userId: user.id } },
      },
    }),
    prisma.userProde.findMany({
      where: { userId: user.id, template: false },
      include: { prodeRoom: true },
    }),
    prisma.prode.findFirst({ select: { prodeEnd: true } }),
  ])

  const { finalsStarted } = await import('@/utils/queries')

  return NextResponse.json({
    finalsStarted: await finalsStarted(),
    prodeEnd: prode?.prodeEnd?.toISOString() ?? null,
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      hasPassword: !!room.password,
      playerCount: room._count.UserProde,
      open: room.password && !!room.UserProde.length,
      alreadyJoin: !!room.UserProde.length,
    })),
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
