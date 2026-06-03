import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({}, { status: 401 })

  await prisma.$transaction([
    prisma.prodeUserFinalsMatch.deleteMany({ where: { userProde: { prodeRoomId: id } } }),
    prisma.prodeUserGroupMatch.deleteMany({ where: { userProde: { prodeRoomId: id } } }),
    prisma.userProde.deleteMany({ where: { prodeRoomId: id } }),
    prisma.prodeRoom.delete({ where: { id } }),
  ])

  return NextResponse.json({})
}
