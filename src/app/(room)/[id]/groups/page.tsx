import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  getUserProde,
  getProdeRoom,
  getRanking,
  getUserRanking,
  registerUserToRoom,
  getUserGroupMatches,
} from '@/utils/queries'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import { filterUniquePredicate } from '@/utils/array'
import { shouldPasswordCheck, roomEmailCheck } from '@/utils/redirect'
import RoomGroupsClient from './RoomGroupsClient'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string }>
}) {
  const { id } = await params

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

  const matches = await getUserGroupMatches(room, user)
  const ranking = await getRanking(room, 0, 10)
  const userRanking = await getUserRanking(room, userProde)

  const nextMatches = getNextMatches(matches)
  const todayMatches = getTodayMatches(matches)

  return (
    <RoomGroupsClient
      id={id}
      userProdeId={userProdeId!}
      roomAdmin={room.userId === user.id}
      name={room.name}
      room={{
        id: room.id,
        name: room.name,
        pointsWinner: room.pointsWinner,
        pointsGoals: room.pointsGoals,
        pointsPenal: room.pointsPenal,
        password: room.userId === user.id ? room.password : null,
        public: room.userId === user.id ? room.public : false,
        emailDomain: room.userId === user.id ? room.emailDomain : null,
      }}
      finalsStarted={room.prode.stage === 'FINALS'}
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
      }}
      ranking={[
        ...ranking,
        ...(userRanking ? [{ id: '', gap: true, name: null, image: null, email: null, points: 0, ranking: 0 }, userRanking] : []),
      ]
        .filter(filterUniquePredicate((a, b) => a.id === b.id))
        .filter((x, i, arr) => !(!x.id && i === arr.length - 1))}
      matches={matches}
      todayMatches={todayMatches.length ? todayMatches : null}
      nextMatches={nextMatches.length ? nextMatches : null}
    />
  )
}
