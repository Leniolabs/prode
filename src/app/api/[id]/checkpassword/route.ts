import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import { getProdeRoom, isUserRegisteredToRoom, registerUserToRoom } from '@/utils/queries'

export const POST = withAuth(async (req, { user }, routeCtx) => {
  const { id } = await routeCtx.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const { password } = await req.json()

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })

  if (
    room.emailDomain &&
    (!user.email || !user.email.endsWith(`@${room.emailDomain}`))
  ) {
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
})
