import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const { name, image, prodePublic, background, dark } = await req.json()

  await prisma.user.update({
    where: { email: session.user.email },
    data: { name, image, prodePublic, background, dark },
  })

  return NextResponse.json({})
}
