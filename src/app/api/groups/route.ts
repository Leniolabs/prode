import { unstable_getServerSession as getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib'
import {
  getAllowedMatchesToModify,
  getUserByEmail,
  groupSubmissionsEnded,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const userProde = await prisma.userProde.findFirst({
    where: { userId: user.id, prodeRoomId: null, template: true },
    include: { matches: true, prode: true },
  })
  if (!userProde) return NextResponse.json({}, { status: 404 })
  if (groupSubmissionsEnded(userProde)) return NextResponse.json({}, { status: 403 })

  const updateMatches = matches.filter((match: any) =>
    userProde.matches.find((x) => x.matchId === match.matchId)
  )
  const createMatches = matches.filter(
    (match: any) => !updateMatches.find((x: any) => x.matchId === match.matchId)
  )

  const allowedMatchesToModify = await getAllowedMatchesToModify(
    matches.map((match: any) => match.matchId),
    userProde.prode.groupSubmissionsEnd
  )

  await prisma.$transaction([
    ...updateMatches
      .filter((match: any) => allowedMatchesToModify.includes(match.matchId))
      .map((match: any) =>
        prisma.prodeUserGroupMatch.update({
          data: { goalsLeft: match.goalsLeft, goalsRight: match.goalsRight },
          where: { userProdeId_matchId: { matchId: match.matchId, userProdeId: userProde.id } },
        })
      ),
    prisma.prodeUserGroupMatch.createMany({
      data: createMatches
        .filter((match: any) => allowedMatchesToModify.includes(match.matchId))
        .map((match: any) => ({ ...match, userProdeId: userProde.id })),
    }),
  ])

  return NextResponse.json({ matches })
}
