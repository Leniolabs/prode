import { auth } from "@/lib/auth"
import {
  getProdeRoom,
  getUserByEmail,
  getUserProde,
  getUserRanking,
  getRanking,
  getUserGroupMatches,
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

  let userProde = await getUserProde(room, user)
  if (!userProde) {
    if (shouldPasswordCheck(room)) return NextResponse.json({ redirect: `/${id}/checkpassword` }, { status: 200 })
    else if (!roomEmailCheck(room, user)) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })
    await registerUserToRoom(room, user)
    userProde = await getUserProde(room, user)
  }

  let userProdeId = userProde?.id
  if (!userProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const [matches, ranking, userRanking] = await Promise.all([
    getUserGroupMatches(room, user),
    getRanking(room, 0, 10),
    getUserRanking(room, userProde),
  ])
  const nextMatches = getNextMatches(matches, timezone)
  const todayMatches = getTodayMatches(matches, timezone)

  const filterUnique = <T>(arr: T[], eq: (a: T, b: T) => boolean) =>
    arr.filter((item, index) => arr.findIndex((x) => eq(x, item)) === index)

  const fullRanking = filterUnique(
    [...ranking, ...(userRanking ? [{ id: '', gap: true }, userRanking] : [])],
    (a: any, b: any) => a.id === b.id
  ).filter((x: any, i: number, arr: any[]) => !(!x.id && i === arr.length - 1))

  return NextResponse.json({
    id,
    userProdeId,
    roomAdmin: room.userId === user.id,
    canEditResults: user.role === 'ADMIN',
    name: room.name,
    room: {
      id: room.id,
      name: room.name,
      pointsWinner: room.pointsWinner,
      pointsGoals: room.pointsGoals,
      pointsPenal: room.pointsPenal,
      ...(room.userId === user.id ? { password: room.password, public: room.public, emailDomain: room.emailDomain } : {}),
    },
    finalsStarted: room.prode.stage === 'FINALS',
    submissionEndsAt: room.prode.groupSubmissionsEnd.toISOString(),
    userRanking: {
      id: user.id,
      name: user.name,
      image: user.image,
      prodePublic: user.prodePublic,
      ranking: userRanking?.ranking,
      points: userRanking?.points,
      dark: user.dark,
      background: user.background,
    },
    ranking: fullRanking,
    matches,
    todayMatches: todayMatches.length ? todayMatches : null,
    nextMatches: nextMatches.length ? nextMatches : null,
  })
}
