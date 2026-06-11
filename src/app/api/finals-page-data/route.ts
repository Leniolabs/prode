import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import {
  finalsStarted,
  getUserByEmail,
  getUserTemplateProde,
  createTemplateUserProde,
  getUserTemplateFinalMatches,
} from '@/utils/queries'
import { getTodayMatches } from '@/utils/date'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const timezone = req.nextUrl.searchParams.get('timezone') ?? undefined

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  if (!(await finalsStarted())) return NextResponse.json({ redirect: '/groups' }, { status: 200 })

  let userProdeId = (await getUserTemplateProde(user))?.id
  if (!userProdeId) userProdeId = (await createTemplateUserProde(user))?.id

  const matches = await getUserTemplateFinalMatches(user)
  const prode = await prisma.prode.findFirst()
  const todayMatches = getTodayMatches(matches, timezone)

  return NextResponse.json({
    userProdeId,
    submissionEndsAt: prode?.finalsSubmissionsEnd.toISOString() ?? new Date().toISOString(),
    userRanking: {
      id: user.id,
      name: user.name,
      image: user.image,
      prodePublic: user.prodePublic,
      dark: user.dark,
      background: user.background,
    },
    matches,
    todayMatches: todayMatches.length ? todayMatches : null,
    // On /finals only surface matches happening today (not every future
    // bracket match) — there's no "next upcoming" fallback here.
    nextMatches: null,
  })
}
