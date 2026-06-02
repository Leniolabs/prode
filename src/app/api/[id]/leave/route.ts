import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'
import { deleteUserProde, getUserProdeById } from '@/utils/queries'

export const DELETE = withAuth(async (req, { user }, routeCtx) => {
  const { id: userProdeId } = await routeCtx.params
  if (!userProdeId) return NextResponse.json({}, { status: 404 })

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde || !userProde.prodeRoom) return NextResponse.json({}, { status: 404 })

  const isAdmin = userProde.userId === user.id

  const usersLength = await prisma.userProde.count({
    where: {
      prodeRoomId: userProde.prodeRoomId,
    },
  })

  if (userProde.prodeRoomId) {
    if (usersLength > 1 && isAdmin) {
      const firstUserProde = await prisma.userProde.findFirst({
        where: {
          prodeRoomId: userProde.prodeRoomId,
          userId: {
            not: userProde.userId,
          },
        },
      })
      if (firstUserProde) {
        await prisma.prodeRoom.update({
          where: {
            id: userProde.prodeRoomId,
          },
          data: {
            userId: firstUserProde.userId,
          },
        })

        await deleteUserProde(userProde.id)
      }
    } else {
      await deleteUserProde(userProde.id)
      await prisma.prodeRoom.deleteMany({
        where: {
          id: userProde.prodeRoomId,
        },
      })
    }
  }

  return NextResponse.json({})
})
