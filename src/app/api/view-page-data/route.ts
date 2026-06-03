import { unstable_getServerSession as getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth/authOptions'
import {
  getUserByEmail,
  getUserProdeById,
  getUserProde,
  isUserRegisteredToRoom,
  getUserGroupMatches,
  getUserFinalMatches,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userProdeId = req.nextUrl.searchParams.get('id') ?? ''

  const session = await getServerSession(authOptions)
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const viewUser = userProde.user
  if (!viewUser || !viewUser.prodePublic) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const room = userProde.prodeRoom
  if (!room) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const viewUserProde = await getUserProde(room, viewUser)
  if (!viewUserProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const userInRoom = user ? await isUserRegisteredToRoom(room, user) : false
  const matches = await getUserGroupMatches(room, viewUser)
  const finalsMatches = await getUserFinalMatches(room, viewUser)

  return NextResponse.json({
    id: room.id,
    userProdeId: viewUserProde.id,
    name: room.name,
    roomAdmin: room.userId === user?.id,
    userInRoom,
    viewUser: {
      id: viewUser.id,
      name: viewUser.name,
      image: viewUser.image,
    },
    room:
      room.userId === user?.id
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
    finalsStarted: room.prode.stage === 'FINALS',
    userRanking: user
      ? {
          id: user.id,
          name: user.name,
          image: user.image,
          email: user.email,
          prodePublic: user.prodePublic,
          background: user.background,
          dark: user.dark,
        }
      : null,
    matches,
    finalsMatches,
  })
}
