import { auth } from "@/lib/auth"
import {
  getProdeRoom,
  getUserByEmail,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

  const { password } = await req.json()

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })

  if (room.emailDomain && (!user.email || !user.email.endsWith(`@${room.emailDomain}`))) {
    return NextResponse.json({ allowed: false, code: 'EMAIL_DOMAIN' })
  }

  if (room.password && room.password !== password) {
    return NextResponse.json({ allowed: false, code: 'WRONG_PASSWORD' })
  }

  const userIsRegistered = await isUserRegisteredToRoom(room, user)
  if (!userIsRegistered) {
    await registerUserToRoom(room, user)
    return NextResponse.json({ allowed: true })
  }

  return NextResponse.json({}, { status: 400 })
}
