import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'
import { getAllowedMatchesToModify } from '@/utils/queries'

export const POST = withAuth(async (req, { user }) => {
  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const userProde = await prisma.userProde.findFirst({
    where: {
      userId: user.id,
      prodeRoomId: null,
      template: true,
    },
    include: {
      matches: true,
      prode: true,
    },
  })
  if (!userProde) return NextResponse.json({}, { status: 404 })

  const updateMatches = matches.filter((match: { matchId: string }) =>
    userProde.matches.find((x) => x.matchId === match.matchId)
  )
  const createMatches = matches.filter(
    (match: { matchId: string }) => !updateMatches.find((x: { matchId: string }) => x.matchId === match.matchId)
  )

  const allowedMatchesToModify = await getAllowedMatchesToModify(
    matches.map((match: { matchId: string }) => match.matchId)
  )

  await prisma.$transaction([
    ...updateMatches
      .filter((match: { matchId: string }) => allowedMatchesToModify.includes(match.matchId))
      .map((match: { matchId: string; goalsLeft: number; goalsRight: number }) =>
        prisma.prodeUserGroupMatch.update({
          data: {
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
          },
          where: {
            userProdeId_matchId: {
              matchId: match.matchId,
              userProdeId: userProde.id,
            },
          },
        })
      ),
    prisma.prodeUserGroupMatch.createMany({
      data: createMatches
        .filter((match: { matchId: string }) => allowedMatchesToModify.includes(match.matchId))
        .map((match: { matchId: string; goalsLeft: number; goalsRight: number }) => ({
          ...match,
          userProdeId: userProde.id,
        })),
    }),
  ])

  return NextResponse.json({ matches })
})
