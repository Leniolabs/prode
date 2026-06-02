import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getUserByEmail,
  finalsStarted,
  getUserTemplateGroupMatches,
  getUserTemplateProde,
  createTemplateUserProde,
} from '@/utils/queries'
import { getNextMatches, getTodayMatches } from '@/utils/date'
import GroupsClient from './GroupsClient'

export default async function Page() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const user = await getUserByEmail(session.user.email)
  if (!user) redirect('/login')

  let userProdeId = (await getUserTemplateProde(user))?.id
  if (!userProdeId) {
    userProdeId = (await createTemplateUserProde(user))?.id
  }

  const matches = await getUserTemplateGroupMatches(user)
  const nextMatches = getNextMatches(matches)
  const todayMatches = getTodayMatches(matches)

  return (
    <GroupsClient
      userProdeId={userProdeId!}
      submissionsEnded={false}
      finalsStarted={await finalsStarted()}
      userRanking={{
        id: user.id,
        name: user.name,
        image: user.image,
        prodePublic: user.prodePublic,
        dark: user.dark,
        background: user.background,
        email: user.email,
      }}
      matches={matches}
      todayMatches={todayMatches.length ? todayMatches : null}
      nextMatches={nextMatches.length ? nextMatches : null}
    />
  )
}
