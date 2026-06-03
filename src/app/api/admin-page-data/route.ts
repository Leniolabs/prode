import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') ?? '0', 10)
  const pageLength = parseInt(searchParams.get('pageLength') ?? '30', 10)

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({}, { status: 401 })
  if (user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({}, { status: 403 })

  const rooms = await prisma.prodeRoom.findMany({
    select: {
      id: true,
      password: true,
      name: true,
      public: true,
      _count: true,
      emailDomain: true,
      UserProde: { where: { userId: user.id } },
    },
    skip: pageLength * page,
    take: pageLength,
  })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, blocked: true },
    skip: pageLength * page,
    take: pageLength,
  })

  const userCount = await prisma.user.count()
  const roomCount = await prisma.prodeRoom.count()
  const prodeCount = await prisma.userProde.count({ where: { prodeRoomId: { not: null } } })

  return NextResponse.json({
    userCount,
    roomCount,
    prodeCount,
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      public: room.public,
      password: room.password,
      emailDomain: room.emailDomain,
      playerCount: room._count.UserProde,
    })),
    users,
  })
}
