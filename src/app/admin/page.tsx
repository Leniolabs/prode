import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/ownership'
import prisma from '@/lib/prisma'
import AdminClient from './AdminClient'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageLength?: string }>
}) {
  const { page: pageStr, pageLength: pageLengthStr } = await searchParams
  const page = parseInt(pageStr || '0', 10)
  const pageLength = parseInt(pageLengthStr || '30', 10)

  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  if (!isAdmin(session.user.email)) redirect('/')

  const rooms = await prisma.prodeRoom.findMany({
    select: {
      id: true,
      password: true,
      name: true,
      public: true,
      _count: true,
      emailDomain: true,
    },
    skip: pageLength * page,
    take: pageLength,
  })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      blocked: true,
    },
    skip: pageLength * page,
    take: pageLength,
  })

  const userCount = await prisma.user.count()
  const roomCount = await prisma.prodeRoom.count()
  const prodeCount = await prisma.userProde.count({
    where: {
      prodeRoomId: {
        not: null,
      },
    },
  })

  return (
    <AdminClient
      userCount={userCount}
      roomCount={roomCount}
      prodeCount={prodeCount}
      rooms={rooms.map((room) => ({
        id: room.id,
        name: room.name,
        public: room.public,
        password: room.password,
        emailDomain: room.emailDomain,
        playerCount: room._count.UserProde,
      }))}
      users={users}
    />
  )
}
