import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  getUserProde,
  getProdeRoom,
  countUsersInProdeRoom,
  getUserRanking,
  getFullRanking,
  registerUserToRoom,
} from '@/utils/queries'
import { shouldPasswordCheck, roomEmailCheck } from '@/utils/redirect'
import RankingClient from './RankingClient'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string; pageLength?: string }>
}) {
  const { id } = await params
  const { page: pageStr, pageLength: pageLengthStr } = await searchParams
  const page = parseInt(pageStr || '0', 10)
  const pageLength = parseInt(pageLengthStr || '30', 10)

  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  const room = await getProdeRoom(id)
  if (!room) redirect('/rooms')

  let userProdeId = (await getUserProde(room, user))?.id
  if (!userProdeId) {
    if (shouldPasswordCheck(room)) redirect(`/${id}/checkpassword`)
    else if (!roomEmailCheck(room, user)) redirect('/rooms')
    userProdeId = (await registerUserToRoom(room, user))?.id
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) redirect('/rooms')

  const totalUsers = await countUsersInProdeRoom(room.id)
  const totalPages = Math.ceil((totalUsers || 0) / (pageLength || 1))

  const ranking = (await getFullRanking(room, page, pageLength)).map((rank) => ({
    ...rank,
    isAdmin: rank.userId === room.userId,
  }))
  const userRanking = await getUserRanking(room, userProde)

  return (
    <RankingClient
      id={id}
      userProdeId={userProdeId!}
      roomAdmin={room.userId === user.id}
      name={room.name}
      finalsStarted={room.prode.stage === 'FINALS'}
      room={
        room.userId === user.id
          ? {
              id: room.id,
              name: room.name,
              password: room.password,
              public: room.public,
              emailDomain: room.emailDomain,
              pointsWinner: room.pointsWinner,
              pointsGoals: room.pointsGoals,
              pointsPenal: room.pointsPenal,
            }
          : undefined
      }
      userRanking={{
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        email: user.email,
        ranking: userRanking?.ranking ?? 0,
        points: userRanking?.points ?? 0,
        dark: user.dark,
        background: user.background,
        GROUP_A: 0,
        GROUP_B: 0,
        GROUP_C: 0,
        GROUP_D: 0,
        GROUP_E: 0,
        GROUP_F: 0,
        GROUP_G: 0,
        GROUP_H: 0,
        FINALS_8: 0,
        FINALS_4: 0,
        FINALS_2: 0,
        FINAL: 0,
        isAdmin: room.userId === user.id,
      }}
      page={page}
      totalPages={totalPages}
      totalPlayers={totalUsers}
      ranking={ranking}
    />
  )
}
