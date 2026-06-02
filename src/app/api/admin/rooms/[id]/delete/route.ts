import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async (req, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  if (!id) return NextResponse.json({}, { status: 404 })

  await prisma.$transaction([
    prisma.prodeUserFinalsMatch.deleteMany({
      where: {
        userProde: {
          prodeRoomId: id,
        },
      },
    }),
    prisma.prodeUserGroupMatch.deleteMany({
      where: {
        userProde: {
          prodeRoomId: id,
        },
      },
    }),
    prisma.userProde.deleteMany({
      where: {
        prodeRoomId: id,
      },
    }),
    prisma.prodeRoom.delete({
      where: {
        id,
      },
    }),
  ])

  return NextResponse.json({})
}, { ownership: 'admin' })
