import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import { hashPassword, verifyPassword } from '@/lib/auth/passwords'
import prisma from '@/lib/prisma'
import { getProdeRoom, isUserRegisteredToRoom, registerUserToRoom } from '@/utils/queries'

export const POST = withAuth(async (req, { user }, routeCtx) => {
  const { id } = await routeCtx.params
  if (!id) return NextResponse.json({}, { status: 404 })

  const { password: submittedPassword } = await req.json()

  const room = await getProdeRoom(id)
  if (!room) return NextResponse.json({}, { status: 404 })

  if (
    room.emailDomain &&
    (!user.email || !user.email.endsWith(`@${room.emailDomain}`))
  ) {
    return NextResponse.json({ allowed: false, code: 'EMAIL_DOMAIN' })
  }

  // Password check with lazy migration: prefer bcrypt hash, fall back to legacy
  // plaintext and migrate on first successful use.
  if (room.passwordHash || room.password) {
    let passwordCorrect = false

    if (room.passwordHash) {
      // New path: compare with bcrypt hash
      passwordCorrect = await verifyPassword(submittedPassword, room.passwordHash)
    } else if (room.password) {
      // Legacy path: plaintext compare + lazy migration
      passwordCorrect = room.password === submittedPassword
      if (passwordCorrect) {
        // Migrate on the fly: hash and clear plaintext
        const newHash = await hashPassword(submittedPassword)
        await prisma.prodeRoom.update({
          where: { id },
          data: { passwordHash: newHash, password: null },
        })
      }
    }

    if (!passwordCorrect) {
      return NextResponse.json({ allowed: false, code: 'WRONG_PASSWORD' })
    }
  }

  const userIsRegistered = await isUserRegisteredToRoom(room, user)
  if (!userIsRegistered) {
    await registerUserToRoom(room, user)
    return NextResponse.json({ allowed: true })
  }

  return NextResponse.json({}, { status: 400 })
})
