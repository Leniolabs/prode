import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { deleteUserProde, getUserByEmail, getUserProdeById } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: userProdeId } = await context.params
  if (!userProdeId) return NextResponse.json({}, { status: 404 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde || !userProde.prodeRoom) return NextResponse.json({}, { status: 404 })

  const isAdmin = userProde.userId === user.id

  // Count only active (non-soft-deleted) members so branching reflects real
  // membership after prior leaves.
  const usersLength = await prisma.userProde.count({
    where: { prodeRoomId: userProde.prodeRoomId, deletedAt: null },
  })

  if (userProde.prodeRoomId) {
    if (usersLength > 1 && isAdmin) {
      const firstUserProde = await prisma.userProde.findFirst({
        where: {
          prodeRoomId: userProde.prodeRoomId,
          userId: { not: userProde.userId },
          deletedAt: null,
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
      // Last/sole member (or a non-promotable admin) leaving: soft-delete the
      // membership and the room so both are recoverable instead of destroyed.
      await deleteUserProde(userProde.id)
      await prisma.prodeRoom.updateMany({
        where: { id: userProde.prodeRoomId },
        data: { deletedAt: new Date() },
      })
    }
  }

  return NextResponse.json({})
}
