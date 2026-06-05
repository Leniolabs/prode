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

  if (room.prode.stage !== 'FINALS') return NextResponse.json({ redirect: `/${id}/groups` }, { status: 200 })

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
  const nextMatches = getNextMatches(matches, timezone)
  const todayMatches = getTodayMatches(matches, timezone)

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
    finalsStarted: room.prode.stage === 'FINALS',
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
    nextMatches: nextMatches.length ? nextMatches : null,
  })
}
