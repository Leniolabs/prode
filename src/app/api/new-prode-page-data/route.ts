import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { getUserByEmail } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const [userProdeNotTemplate, prode] = await Promise.all([
    prisma.userProde.findMany({
      where: { userId: user.id, template: false },
      include: { prodeRoom: true },
    }),
    prisma.prode.findFirst({ select: { prodeEnd: true } }),
  ])

  return NextResponse.json({
    userRanking: {
      id: user.id,
      name: user.name,
      image: user.image,
      prodePublic: user.prodePublic,
      dark: user.dark,
      background: user.background,
    },
    registeredProdes: userProdeNotTemplate.length,
    prodeEnd: prode?.prodeEnd?.toISOString() ?? null,
  })
}
