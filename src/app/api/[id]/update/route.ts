import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const PUT = withAuth(async (req, { room }) => {
  const {
    name,
    password,
    pointsGoals,
    pointsWinner,
    pointsPenal,
    public: isPublic,
    emailDomain,
  } = await req.json()

  const newRoom = await prisma.prodeRoom.update({
    where: {
      id: room!.id,
    },
    data: {
      name,
      password: password ? password : null,
      public: isPublic ? true : false,
      pointsWinner: pointsWinner || 1,
      pointsGoals: pointsGoals || 3,
      pointsPenal: pointsPenal || 5,
      emailDomain: emailDomain ? emailDomain.replace('@', '') : null,
    },
  })

  return NextResponse.json({ id: newRoom.id })
}, { ownership: 'room' })
