import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import {
  finalsStarted,
  getUserByEmail,
  getUserTemplateProde,
  createTemplateUserProde,
  getUserTemplateGroupMatches,
} from '@/utils/queries'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  let userProdeId = (await getUserTemplateProde(user))?.id
  if (!userProdeId) userProdeId = (await createTemplateUserProde(user))?.id

  const matches = await getUserTemplateGroupMatches(user)
  const prode = await prisma.prode.findFirst()
  const nextMatches = getNextMatches(matches)
  const todayMatches = getTodayMatches(matches)

  return NextResponse.json({
    userProdeId,
    submissionEndsAt: prode?.groupSubmissionsEnd.toISOString() ?? new Date().toISOString(),
    finalsStarted: await finalsStarted(),
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
    nextMatches: nextMatches.length ? nextMatches : null,
  })
}
