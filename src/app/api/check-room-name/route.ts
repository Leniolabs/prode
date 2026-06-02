import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')

  if (!name) return NextResponse.json({ allowed: false })

  const room = await prisma.prodeRoom.findFirst({
    where: {
      name,
    },
  })
  return NextResponse.json({ allowed: !room })
})
