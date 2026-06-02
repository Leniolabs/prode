import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async (req) => {
  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const prode = await prisma.prode.findFirst({})
  if (!prode) return NextResponse.json({}, { status: 400 })

  await prisma.$transaction(
    matches.map((match: {
      id: string
      goalsLeft: number | null
      goalsRight: number | null
      countryLeftId: string | null
      countryRightId: string | null
      penaltisLeft: number | null
      penaltisRight: number | null
    }) =>
      prisma.match.update({
        data: {
          countryLeftId: match.countryLeftId,
          goalsLeft: match.goalsLeft,
          countryRightId: match.countryRightId,
          goalsRight: match.goalsRight,
          penaltisLeft: match.penaltisLeft,
          penaltisRight: match.penaltisRight,
          filled: !!(
            match.countryLeftId &&
            match.countryRightId &&
            (match.goalsLeft || match.goalsLeft === 0) &&
            (match.goalsRight || match.goalsRight === 0)
          ),
        },
        where: {
          id: match.id,
        },
      })
    )
  )

  return NextResponse.json({ matches })
}, { ownership: 'admin' })
