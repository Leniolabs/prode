import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async () => {
  const prode = await prisma.prode.findFirst({
    where: {
      prodeEnd: {
        gte: new Date(),
      },
    },
  })

  if (!prode || prode.stage === 'FINALS') return NextResponse.json({})

  await prisma.prode.update({
    data: {
      stage: 'FINALS',
    },
    where: {
      id: prode.id,
    },
  })

  return NextResponse.json({})
}, { ownership: 'admin' })
