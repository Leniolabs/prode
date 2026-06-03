import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { getUserByEmail, getUserProdeById } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: userProdeId } = await context.params
  if (!userProdeId) return NextResponse.json({}, { status: 404 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde || user.id === userProde.userId) return NextResponse.json({}, { status: 404 })

  if (userProde.prodeRoom?.userId !== user.id) return NextResponse.json({}, { status: 401 })

  await prisma.userProde.deleteMany({ where: { id: userProde.id } })

  return NextResponse.json({})
}
