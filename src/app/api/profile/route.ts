import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const PATCH = withAuth(async (req, { user }) => {
  const { name, prodePublic, dark, background, image } = await req.json()

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
      image,
      prodePublic,
      background,
      dark,
    },
  })

  return NextResponse.json({})
})
