import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const { matches } = await req.json()
  if (!matches) return NextResponse.json({}, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({}, { status: 401 })

  const prode = await prisma.prode.findFirst({ where: { prodeEnd: { gte: new Date() } } })
  if (!prode) return NextResponse.json({}, { status: 400 })

  await prisma.$transaction(
    matches.map((match: any) =>
      prisma.match.update({
        data: { goalsLeft: match.goalsLeft, goalsRight: match.goalsRight, filled: true },
        where: { id: match.id },
      })
    )
  )

  return NextResponse.json({ matches })
}
