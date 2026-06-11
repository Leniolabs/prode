import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { getTodayMatches } from '@/utils/date'
import { NextRequest, NextResponse } from 'next/server'

// Admin-only feed of the SYSTEM/reference knockout results. No per-user data —
// /admin/finals edits the official outcomes everyone is scored against.
export async function GET(req: NextRequest) {
  const timezone = req.nextUrl.searchParams.get('timezone') ?? undefined

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({}, { status: 401 })
  if (user.role!== 'ADMIN') return NextResponse.json({}, { status: 403 })

  const matches = await prisma.match.findMany({
    where: {
      stage: {
        notIn: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H', 'GROUP_I', 'GROUP_J', 'GROUP_K', 'GROUP_L'],
      },
    },
  })

  const mapped = matches
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
    }))

  const todayMatches = getTodayMatches(mapped, timezone)

  return NextResponse.json({
    matches: mapped,
    // Only surface matches happening today (no "next upcoming" fallback).
    todayMatches: todayMatches.length ? todayMatches : null,
  })
}
