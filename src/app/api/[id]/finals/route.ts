import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'
import { getAllowedMatchesToModify, getProdeRoom, syncronizeFinalsTemplate } from '@/utils/queries'

export const POST = withAuth(async (req, { user }, routeCtx) => {
  const { id } = await routeCtx.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })

  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const userProde = await prisma.userProde.findFirst({
    where: {
      prodeRoomId: id,
      userId: user.id,
    },
    include: {
      finalsMatches: true,
      prode: true,
    },
  })
  if (!userProde) return NextResponse.json({}, { status: 400 })

  const updateMatches = matches.filter((match: { matchId: string }) =>
    userProde.finalsMatches.find((x) => x.matchId === match.matchId)
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
      .map((match: { matchId: string; goalsLeft: number; goalsRight: number; penaltisLeft: number; penaltisRight: number }) =>
        prisma.prodeUserFinalsMatch.update({
          data: {
            goalsLeft: match.goalsLeft,
            goalsRight: match.goalsRight,
            penaltisLeft: match.penaltisLeft,
            penaltisRight: match.penaltisRight,
          },
          where: {
            userProdeId_matchId: {
              matchId: match.matchId as string,
              userProdeId: userProde.id,
            },
          },
        })
      ),
    prisma.prodeUserFinalsMatch.createMany({
      data: createMatches
        .filter((match: { matchId: string }) => allowedMatchesToModify.includes(match.matchId))
        .map((match: { matchId: string; countryLeftId?: string; countryRightId?: string; goalsLeft: number; goalsRight: number; penaltisLeft: number; penaltisRight: number }) => ({
          ...match,
          userProdeId: userProde.id,
        })),
    }),
  ])

  await syncronizeFinalsTemplate(room, user)

  return NextResponse.json({}, { status: 201 })
})
