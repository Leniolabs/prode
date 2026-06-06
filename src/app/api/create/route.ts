import { auth } from "@/lib/auth"
import { prisma } from '@/lib'
import { getUserByEmail, registerUserToRoom } from '@/utils/queries'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json([], { status: 401 })

  const user = await getUserByEmail(session.user.email)
  if (!user) return NextResponse.json({}, { status: 401 })

  const prode = await prisma.prode.findFirst()
  if (!prode) return NextResponse.json({ error: 'PRODE_DOESNT_EXISTS' }, { status: 400 })

  const {
    name, password, pointsGoals, pointsWinner, pointsPenal,
    public: isPublic, emailDomain,
  } = await req.json()

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'ROOM_NAME_REQUIRED' }, { status: 400 })
  }

  const newRoom = await prisma.prodeRoom.create({
    data: {
      created: new Date(),
      prodeId: prode.id,
      userId: user.id,
      name,
      password: password ? password : null,
      public: isPublic ? true : false,
      pointsWinner: pointsWinner || 1,
      pointsGoals: pointsGoals || 3,
      pointsPenal: pointsPenal || 5,
      emailDomain: emailDomain ? emailDomain.replace('@', '') : null,
    },
  })

  await registerUserToRoom(newRoom, user)
  return NextResponse.json({ id: newRoom.id })
}
