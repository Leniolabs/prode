import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isUserBlocked } from '@/utils/queries'
import BlockedClient from './BlockedClient'

export default async function Page() {
  const session = await auth()

  if (session?.user?.email) {
    const userBlocked = await isUserBlocked(session.user.email)
    if (!userBlocked) {
      redirect('/rooms')
    }
  }

  return <BlockedClient />
}
