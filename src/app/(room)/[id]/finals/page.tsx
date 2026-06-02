import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  getUserProde,
  getProdeRoom,
  getRanking,
  getUserRanking,
  getUserFinalMatches,
  registerUserToRoom,
} from '@/utils/queries'
import { filterUniquePredicate } from '@/utils/array'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import { shouldPasswordCheck, roomEmailCheck } from '@/utils/redirect'
import RoomFinalsClient from './RoomFinalsClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  const room = await getProdeRoom(id)
  if (!room) redirect('/rooms')

  if (room.prode.stage !== 'FINALS') {
    redirect(`/${id}/groups`)
  }

  let userProdeId = (await getUserProde(room, user))?.id
  if (!userProdeId) {
    if (shouldPasswordCheck(room)) redirect(`/${id}/checkpassword`)
    else if (!roomEmailCheck(room, user)) redirect('/rooms')
    userProdeId = (await registerUserToRoom(room, user))?.id
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) redirect('/rooms')

  const matches = await getUserFinalMatches(room, user)
  const ranking = await getRanking(room, 0, 10)
  const userRanking = await getUserRanking(room, userProde)

  const nextMatches = getNextMatches(matches)
  const todayMatches = getTodayMatches(matches)

  return (
    <RoomFinalsClient
      userProdeId={userProdeId!}
      id={id}
      name={room.name}
      roomAdmin={room.userId === user.id}
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
      submissionsEnded={false}
      finalsStarted={room.prode.stage === 'FINALS'}
      userRanking={{
        id: user.id,
        name: user.name,
        image: user.image,
        email: user.email,
        prodePublic: user.prodePublic,
        dark: user.dark,
        background: user.background,
        ranking: userRanking?.ranking ?? 0,
        points: userRanking?.points ?? 0,
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
