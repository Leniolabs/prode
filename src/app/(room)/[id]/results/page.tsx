import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  getUserProde,
  getProdeRoom,
  getRanking,
  getUserRanking,
  isUserRegisteredToRoom,
  registerUserToRoom,
} from '@/utils/queries'
import { filterUniquePredicate } from '@/utils/array'
import { shouldPasswordCheck, roomEmailCheck } from '@/utils/redirect'
import ResultsClient from './ResultsClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  const room = await getProdeRoom(id)
  if (!room) redirect('/rooms')

  const userInRoom = await isUserRegisteredToRoom(room, user)
  if (!userInRoom) {
    if (shouldPasswordCheck(room)) redirect(`/${id}/checkpassword`)
    else if (!roomEmailCheck(room, user)) redirect('/rooms')
    await registerUserToRoom(room, user)
  }

  const userProde = await getUserProde(room, user)
  if (!userProde) redirect('/rooms')

  const ranking = await getRanking(room, 0, 10)
  const userRanking = await getUserRanking(room, userProde)

  return (
    <ResultsClient
      id={id}
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
      }}
      ranking={[...ranking.slice(0, 10), ...(userRanking ? [userRanking] : [])].filter(
        filterUniquePredicate((a, b) => a.id === b.id)
      )}
    />
  )
}
