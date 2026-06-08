import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role!== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const prode = await prisma.prode.findFirst()
  if (!prode) return NextResponse.json({}, { status: 400 })

  await prisma.$transaction(
    matches.map((match: any) =>
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
        where: { id: match.id },
      })
    )
  )

  return NextResponse.json({ matches })
}
