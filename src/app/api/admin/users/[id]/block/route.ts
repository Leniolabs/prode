import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async (req, ctx, routeCtx) => {
  const { id } = await routeCtx.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const userToBlock = await prisma.user.findUnique({ where: { id } })

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      blocked: !userToBlock?.blocked,
    },
  })

  return NextResponse.json({})
}, { ownership: 'admin' })
