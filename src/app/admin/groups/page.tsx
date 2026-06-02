import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/ownership'
import prisma from '@/lib/prisma'
import AdminGroupsClient from './AdminGroupsClient'

export default async function Page() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  if (!isAdmin(session.user.email)) redirect('/')

  const matches = await prisma.match.findMany({
    where: {
      stage: {
        in: ['GROUP_A','GROUP_B','GROUP_C','GROUP_D','GROUP_E','GROUP_F','GROUP_G','GROUP_H','GROUP_I','GROUP_J','GROUP_K','GROUP_L'],
      },
    },
    include: {
      countryLeft: true,
      countryRight: true,
    },
  })

  return (
    <AdminGroupsClient
      matches={matches
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((match) => ({
          id: match.id,
          date: match.date.toISOString(),
          stage: match.stage,
          filled: match.filled,
          goalsLeft: match.filled ? match.goalsLeft : null,
          countryLeftId: match.countryLeftId,
          goalsRight: match.filled ? match.goalsRight : null,
          countryRightId: match.countryRightId,
        }))}
    />
  )
}
