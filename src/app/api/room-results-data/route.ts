import { auth } from "@/lib/auth"
import {
  getProdeRoom,
  getUserByEmail,
  getUserProde,
  getUserRanking,
  getRanking,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'
import { knockoutPhaseAccess } from '@/lib/bracket'

function shouldPasswordCheck(room: { password: string | null }) {
  return !!room.password
}

function roomEmailCheck(room: { emailDomain: string | null }, user: { email: string | null }) {
  if (!room.emailDomain) return true
  return !!user.email && user.email.endsWith(`@${room.emailDomain}`)
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const userInRoom = await isUserRegisteredToRoom(room, user)
  if (!userInRoom) {
    if (shouldPasswordCheck(room)) return NextResponse.json({ redirect: `/${id}/checkpassword` }, { status: 200 })
    else if (!roomEmailCheck(room, user)) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })
    await registerUserToRoom(room, user)
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const ranking = await getRanking(room, 0, 10)
  const userRanking = await getUserRanking(room, userProde)

  const filterUnique = <T>(arr: T[], eq: (a: T, b: T) => boolean) =>
    arr.filter((item, index) => arr.findIndex((x) => eq(x, item)) === index)

  return NextResponse.json({
    id,
    roomAdmin: room.userId === user.id,
    name: room.name,
    finalsStarted: (await knockoutPhaseAccess()).roundOf32Open,
    room:
      room.userId === user.id
        ? {
            id: room.id,
            name: room.name,
            password: room.password,
            public: room.public,
            emailDomain: room.emailDomain,
            pointsWinner: room.pointsWinner,
            pointsGoals: room.pointsGoals,
            pointsPenal: room.pointsPenal,
          }
        : null,
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
    ranking: filterUnique(
      [...ranking.slice(0, 10), ...(userRanking ? [userRanking] : [])],
      (a, b) => a.id === b.id
    ),
  })
}
