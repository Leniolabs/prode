import { auth } from "@/lib/auth"
import {
  getProdeRoom,
  getUserByEmail,
  getUserProde,
  getUserRanking,
  getRanking,
  getUserFinalMatches,
  registerUserToRoom,
} from '@/utils/queries'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import { knockoutPhaseAccess } from '@/lib/bracket'
import { NextRequest, NextResponse } from 'next/server'

function shouldPasswordCheck(room: { password: string | null }) {
  return !!room.password
}

function roomEmailCheck(room: { emailDomain: string | null }, user: { email: string | null }) {
  if (!room.emailDomain) return true
  return !!user.email && user.email.endsWith(`@${room.emailDomain}`)
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const timezone = req.nextUrl.searchParams.get('timezone') ?? undefined

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const phase = req.nextUrl.searchParams.get('phase') === 'r32' ? 'r32' : 'finals'
  const { roundOf32Open, finalsBracketOpen } = await knockoutPhaseAccess()
  if (phase === 'r32') {
    if (!roundOf32Open) return NextResponse.json({ redirect: `/${id}/groups` }, { status: 200 })
  } else if (!finalsBracketOpen) {
    return NextResponse.json({ redirect: roundOf32Open ? `/${id}/16avos` : `/${id}/groups` }, { status: 200 })
  }

  let userProdeId = (await getUserProde(room, user))?.id
  if (!userProdeId) {
    if (shouldPasswordCheck(room)) return NextResponse.json({ redirect: `/${id}/checkpassword` }, { status: 200 })
    else if (!roomEmailCheck(room, user)) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })
    userProdeId = (await registerUserToRoom(room, user))?.id
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const matches = await getUserFinalMatches(room, user)
  const ranking = await getRanking(room, 0, 10)
  const userRanking = await getUserRanking(room, userProde)
  const todayMatches = getTodayMatches(matches, timezone)
  // Only surface upcoming knockout matches whose participants are already
  // decided (both countries set). Bracket slots still showing TBD are omitted.
  const knownMatches = matches.filter((match) => match.countryLeftId && match.countryRightId)
  const nextMatches = getNextMatches(knownMatches, timezone)

  const filterUnique = <T>(arr: T[], eq: (a: T, b: T) => boolean) =>
    arr.filter((item, index) => arr.findIndex((x) => eq(x, item)) === index)

  const fullRanking = filterUnique(
    [...ranking, ...(userRanking ? [{ id: '', gap: true }, userRanking] : [])],
    (a: any, b: any) => a.id === b.id
  ).filter((x: any, i: number, arr: any[]) => !(!x.id && i === arr.length - 1))

  return NextResponse.json({
    userProdeId,
    id,
    name: room.name,
    roomAdmin: room.userId === user.id,
    room: {
      id: room.id,
      name: room.name,
      pointsWinner: room.pointsWinner,
      pointsGoals: room.pointsGoals,
      pointsPenal: room.pointsPenal,
      ...(room.userId === user.id ? { password: room.password, public: room.public, emailDomain: room.emailDomain } : {}),
    },
    submissionEndsAt: room.prode.finalsSubmissionsEnd.toISOString(),
    finalsSavedAt: userProde.finalsSavedAt ? userProde.finalsSavedAt.toISOString() : null,
    finalsStarted: roundOf32Open,
    roundOf32Open,
    finalsBracketOpen,
    userRanking: {
      id: user.id,
      name: user.name,
      image: user.image,
      prodePublic: user.prodePublic,
      dark: user.dark,
      background: user.background,
      ranking: userRanking?.ranking,
      points: userRanking?.points,
    },
    ranking: fullRanking,
    matches,
    todayMatches: todayMatches.length ? todayMatches : null,
    // Next upcoming knockout matches with known participants. The 16avos page
    // narrows this to FINALS_16 only; /finals shows whatever knockout day is next.
    nextMatches: nextMatches.length ? nextMatches : null,
  })
}
