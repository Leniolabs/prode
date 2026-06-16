import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import {
  getAllowedFinalMatchesToModify,
  getProdeRoom,
  getUserByEmail,
  syncronizeFinalsTemplate,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })

  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const userProde = await prisma.userProde.findFirst({
    where: { prodeRoomId: id, userId: user.id, deletedAt: null },
    include: { finalsMatches: true, prode: true },
  })
  if (!userProde) return NextResponse.json({}, { status: 400 })

  const updateMatches = matches.filter((match: any) =>
    userProde.finalsMatches.find((x) => x.matchId === match.matchId)
  )
  const createMatches = matches.filter(
    (match: any) => !updateMatches.find((x: any) => x.matchId === match.matchId)
  )

  const allowedMatchesToModify = await getAllowedFinalMatchesToModify(
    matches.map((match: any) => match.matchId)
  )

  await prisma.$transaction([
    ...updateMatches
      .filter((match: any) => allowedMatchesToModify.includes(match.matchId))
      .map((match: any) =>
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
        .filter((match: any) => allowedMatchesToModify.includes(match.matchId))
        .map((match: any) => ({ ...match, userProdeId: userProde.id })),
    }),
  ])

  await syncronizeFinalsTemplate(room, user)

  return NextResponse.json({}, { status: 201 })
}
