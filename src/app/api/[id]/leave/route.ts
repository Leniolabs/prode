import { unstable_getServerSession as getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib'
import { deleteUserProde, getUserByEmail, getUserProdeById } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: userProdeId } = await context.params
  if (!userProdeId) return NextResponse.json({}, { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde || !userProde.prodeRoom) return NextResponse.json({}, { status: 404 })

  const isAdmin = userProde.userId === user.id

  const usersLength = await prisma.userProde.count({
    where: { prodeRoomId: userProde.prodeRoomId },
  })

  if (userProde.prodeRoomId) {
    if (usersLength > 1 && isAdmin) {
      const firstUserProde = await prisma.userProde.findFirst({
        where: {
          prodeRoomId: userProde.prodeRoomId,
          userId: { not: userProde.userId },
        },
      })
      if (firstUserProde) {
        await prisma.prodeRoom.update({
          where: { id: userProde.prodeRoomId },
          data: { userId: firstUserProde.userId },
        })
        await deleteUserProde(userProde.id)
      }
    } else {
      await deleteUserProde(userProde.id)
      await prisma.prodeRoom.deleteMany({ where: { id: userProde.prodeRoomId } })
    }
  }

  return NextResponse.json({})
}
