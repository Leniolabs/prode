import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role!== 'ADMIN') return NextResponse.json({}, { status: 401 })

  const prode = await prisma.prode.findFirst({ where: { prodeEnd: { gte: new Date() } } })
  if (!prode || prode.stage === 'FINALS') return NextResponse.json({})

  await prisma.prode.update({ data: { stage: 'FINALS' }, where: { id: prode.id } })

  return NextResponse.json({})
}
