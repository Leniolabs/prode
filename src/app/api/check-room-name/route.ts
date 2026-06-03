import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const name = req.nextUrl.searchParams.get('name')
  if (!name) return NextResponse.json({ allowed: false })

  const room = await prisma.prodeRoom.findFirst({ where: { name } })
  return NextResponse.json({ allowed: !room })
}
