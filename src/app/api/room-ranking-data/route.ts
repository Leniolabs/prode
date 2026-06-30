import { auth } from "@/lib/auth"
import {
  countUsersInProdeRoom,
  getFullRanking,
  getProdeRoom,
  getUserByEmail,
  getUserProde,
  getUserRanking,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'
import { knockoutPhaseAccess } from '@/lib/bracket'
import { prisma } from '@/lib/prisma'
import { buildRankingStats } from '@/lib/ranking'

function shouldPasswordCheck(room: { password: string | null }) {
  return !!room.password
}

function roomEmailCheck(room: { emailDomain: string | null }, user: { email: string | null }) {
  if (!room.emailDomain) return true
  return !!user.email && user.email.endsWith(`@${room.emailDomain}`)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const id = searchParams.get('id') ?? ''
  const page = parseInt(searchParams.get('page') ?? '0', 10)
  const pageLength = parseInt(searchParams.get('pageLength') ?? '30', 10)

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  let userProdeId = (await getUserProde(room, user))?.id
  if (!userProdeId) {
    if (shouldPasswordCheck(room)) return NextResponse.json({ redirect: `/${id}/checkpassword` }, { status: 200 })
    else if (!roomEmailCheck(room, user)) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })
    userProdeId = (await registerUserToRoom(room, user))?.id
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) return NextResponse.json({ redirect: '/rooms' }, { status: 200 })

  const totalUsers = await countUsersInProdeRoom(room.id)
  const totalPages = Math.ceil((totalUsers || 0) / (pageLength || 1))

  const [ranking, allRanking, groupPredictions, finalPredictions] = await Promise.all([
    getFullRanking(room, page, pageLength),
    getFullRanking(room, 0, Math.max(totalUsers, 1)),
    prisma.prodeUserGroupMatch.findMany({
      where: {
        userProde: {
          prodeRoomId: room.id,
          deletedAt: null,
        },
      },
      select: {
        userProdeId: true,
        goalsLeft: true,
        goalsRight: true,
        match: {
          select: {
            goalsLeft: true,
            goalsRight: true,
            filled: true,
          },
        },
      },
    }),
    prisma.prodeUserFinalsMatch.findMany({
      where: {
        userProde: {
          prodeRoomId: room.id,
          deletedAt: null,
        },
      },
      select: {
        userProdeId: true,
        goalsLeft: true,
        goalsRight: true,
        penaltisLeft: true,
        penaltisRight: true,
        countryLeftId: true,
        countryRightId: true,
        match: {
          select: {
            id: true,
            goalsLeft: true,
            goalsRight: true,
            countryLeftId: true,
            countryRightId: true,
            filled: true,
          },
        },
      },
    }),
  ])

  const stats = buildRankingStats(
    allRanking.map((rank) => ({
      id: rank.id,
      points: rank.points,
    })),
    groupPredictions,
    finalPredictions,
    userProdeId,
  )

  const rankingRows = ranking.map((rank) => ({
    ...rank,
    isAdmin: rank.userId === room.userId,
  }))
  const userRanking = await getUserRanking(room, userProde)

  return NextResponse.json({
    id,
    userProdeId,
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
    page,
    totalPages,
    totalPlayers: totalUsers,
    ranking: rankingRows,
    stats,
  })
}
