import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'
import { getUserProdeById } from '@/utils/queries'

export const DELETE = withAuth(async (req, { user }, routeCtx) => {
  const { id: userProdeId } = await routeCtx.params
  if (!userProdeId) return NextResponse.json({}, { status: 404 })

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde || user.id === userProde.userId)
    return NextResponse.json({}, { status: 404 })

  if (userProde.prodeRoom?.userId !== user.id)
    return NextResponse.json({}, { status: 401 })

  await prisma.userProde.deleteMany({
    where: {
      id: userProde.id,
    },
  })

  return NextResponse.json({})
})
