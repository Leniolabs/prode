import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({}, { status: 401 })
  if (user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({}, { status: 403 })

  const matches = await prisma.match.findMany({
    where: {
      stage: {
        notIn: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H', 'GROUP_I', 'GROUP_J', 'GROUP_K', 'GROUP_L'],
      },
    },
    include: {
      userResults: { where: { userProde: { userId: user.id } } },
    },
  })

  return NextResponse.json({
    matches: matches
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((match) => ({
        id: match.id,
        date: match.date.toISOString(),
        stage: match.stage,
        filled: match.filled,
        goalsLeft: match.goalsLeft ?? null,
        countryLeftId: match.countryLeftId,
        penaltisLeft: match.penaltisLeft ?? null,
        goalsRight: match.goalsRight ?? null,
        countryRightId: match.countryRightId,
        penaltisRight: match.penaltisRight ?? null,
      })),
  })
}
