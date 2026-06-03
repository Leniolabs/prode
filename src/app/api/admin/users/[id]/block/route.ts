import { unstable_getServerSession as getServerSession } from "next-auth"
import { authOptions } from '@/lib/auth/authOptions'
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.email !== process.env.ADMIN_EMAIL) return NextResponse.json({}, { status: 401 })

  const userToBlock = await prisma.user.findUnique({ where: { id } })
  await prisma.user.update({ where: { id }, data: { blocked: !userToBlock?.blocked } })

  return NextResponse.json({})
}
