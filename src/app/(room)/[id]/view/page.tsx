import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  getUserProdeById,
  getUserProde,
  isUserRegisteredToRoom,
  getUserGroupMatches,
  getUserFinalMatches,
} from '@/utils/queries'
import ViewClient from './ViewClient'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: userProdeId } = await params

  const session = await auth()
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null

  const userProde = await getUserProdeById(userProdeId)
  if (!userProde) redirect('/rooms')

  const viewUser = userProde.user
  if (!viewUser || !viewUser.prodePublic) redirect('/rooms')

  const room = userProde.prodeRoom
  if (!room) redirect('/rooms')

  const viewUserProde = await getUserProde(room, viewUser)
  if (!viewUserProde) redirect('/rooms')

  const userInRoom = user ? await isUserRegisteredToRoom(room, user) : false

  const matches = await getUserGroupMatches(room, viewUser)
  const finalsMatches = await getUserFinalMatches(room, viewUser)

  return (
    <ViewClient
      id={room.id}
      userProdeId={viewUserProde.id}
      name={room.name}
      roomAdmin={room.userId === user?.id}
      userInRoom={userInRoom}
      viewUser={{ id: viewUser.id, name: viewUser.name, image: viewUser.image }}
      room={
        room.userId === user?.id
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
      finalsStarted={room.prode.stage === 'FINALS'}
      userRanking={
        user
          ? {
              id: user.id,
              name: user.name,
              image: user.image,
              email: user.email,
              prodePublic: user.prodePublic,
              background: user.background,
              dark: user.dark,
            }
          : undefined
      }
      matches={matches}
      finalsMatches={finalsMatches}
    />
  )
}
