import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import { hashPassword } from '@/lib/auth/passwords'
import prisma from '@/lib/prisma'
import { registerUserToRoom } from '@/utils/queries'

export const POST = withAuth(async (req, { user }) => {
  const prode = await prisma.prode.findFirst()
  if (!prode)
    return NextResponse.json({ error: 'PRODE_DOESNT_EXISTS' }, { status: 400 })

  const {
    name,
    password,
    pointsGoals,
    pointsWinner,
    pointsPenal,
    public: isPublic,
    emailDomain,
  } = await req.json()

  const passwordHash = password ? await hashPassword(password) : null

  const newRoom = await prisma.prodeRoom.create({
    data: {
      created: new Date(),
      prodeId: prode.id,
      userId: user.id,
      name: name,
      password: null,
      passwordHash,
      public: isPublic ? true : false,
      pointsWinner: pointsWinner || 1,
      pointsGoals: pointsGoals || 3,
      pointsPenal: pointsPenal || 5,
      emailDomain: emailDomain ? emailDomain.replace('@', '') : null,
    },
  })

  await registerUserToRoom(newRoom, user)

  return NextResponse.json({ id: newRoom.id })
})
