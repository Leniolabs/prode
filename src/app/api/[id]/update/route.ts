import { unstable_getServerSession as getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib'
import { getProdeRoom, getUserByEmail } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })
  if (room.userId !== user.id) return NextResponse.json({}, { status: 401 })

  const { name, password, pointsGoals, pointsWinner, pointsPenal, public: isPublic, emailDomain } =
    await req.json()

  const newRoom = await prisma.prodeRoom.update({
    where: { id: room.id },
    data: {
      name,
      password: password ? password : null,
      public: isPublic ? true : false,
      pointsWinner: pointsWinner || 1,
      pointsGoals: pointsGoals || 3,
      pointsPenal: pointsPenal || 5,
      emailDomain: emailDomain ? emailDomain.replace('@', '') : null,
    },
  })

  return NextResponse.json({ id: newRoom.id })
}
