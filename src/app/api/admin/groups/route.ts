import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async (req) => {
  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const prode = await prisma.prode.findFirst({
    where: {
      prodeEnd: {
        gte: new Date(),
      },
    },
  })
  if (!prode) return NextResponse.json({}, { status: 400 })

  await prisma.$transaction(
    matches.map((match: { id: string; goalsLeft: number; goalsRight: number }) =>
      prisma.match.update({
        data: {
          goalsLeft: match.goalsLeft,
          goalsRight: match.goalsRight,
          filled: true,
        },
        where: {
          id: match.id,
        },
      })
    )
  )

  return NextResponse.json({ matches })
}, { ownership: 'admin' })
