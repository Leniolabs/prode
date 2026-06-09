import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role!== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const prode = await prisma.prode.findFirst({ where: { prodeEnd: { gte: new Date() } } })
  if (!prode) return NextResponse.json({}, { status: 404 })

  await prisma.$transaction([
    prisma.match.updateMany({
      data: { goalsLeft: null, goalsRight: null, penaltisLeft: null, penaltisRight: null, filled: false },
    }),
    prisma.match.updateMany({
      data: { countryLeftId: null, countryRightId: null },
      where: {
        stage: {
          notIn: ['GROUP_A', 'GROUP_B', 'GROUP_C', 'GROUP_D', 'GROUP_E', 'GROUP_F', 'GROUP_G', 'GROUP_H', 'GROUP_I', 'GROUP_J', 'GROUP_K', 'GROUP_L'],
        },
      },
    }),
  ])

  return NextResponse.json({})
}
