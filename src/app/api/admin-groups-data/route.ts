import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { Stage } from "@/generated/prisma"
import { NextRequest, NextResponse } from 'next/server'

const GROUP_STAGES: Stage[] = [
  Stage.GROUP_A, Stage.GROUP_B, Stage.GROUP_C, Stage.GROUP_D, Stage.GROUP_E, Stage.GROUP_F,
  Stage.GROUP_G, Stage.GROUP_H, Stage.GROUP_I, Stage.GROUP_J, Stage.GROUP_K, Stage.GROUP_L,
]

// Admin-only feed of the SYSTEM/reference group results. Deliberately carries no
// per-user prediction data — /admin/groups edits the official outcomes everyone
// is scored against, not the admin's own picks.
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({}, { status: 401 })
  if (user.role !== 'ADMIN') return NextResponse.json({}, { status: 403 })

  const matches = await prisma.match.findMany({
    where: { stage: { in: GROUP_STAGES } },
  })

  return NextResponse.json({
    matches: matches
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((match) => ({
        id: match.id,
        date: match.date.toISOString(),
        stage: match.stage,
        filled: match.filled,
        goalsLeft: match.filled ? match.goalsLeft : null,
        countryLeftId: match.countryLeftId,
        goalsRight: match.filled ? match.goalsRight : null,
        countryRightId: match.countryRightId,
      })),
  })
}
