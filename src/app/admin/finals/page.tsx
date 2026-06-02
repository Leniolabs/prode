import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/ownership'
import prisma from '@/lib/prisma'
import AdminFinalsClient from './AdminFinalsClient'

export default async function Page() {
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  if (!isAdmin(session.user.email)) redirect('/')

  const matches = await prisma.match.findMany({
    where: {
      stage: {
        notIn: ['GROUP_A','GROUP_B','GROUP_C','GROUP_D','GROUP_E','GROUP_F','GROUP_G','GROUP_H','GROUP_I','GROUP_J','GROUP_K','GROUP_L'],
      },
    },
  })

  return (
    <AdminFinalsClient
      matches={matches
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map((match) => ({
          id: match.id,
          date: match.date.toISOString(),
          stage: match.stage,
          filled: match.filled,
          goalsLeft: match.goalsLeft ?? null,
          countryLeftId: match.countryLeftId,
          penaltisLeft: match.penaltisLeft ?? null,
          goalsRight: match.goalsRight ?? null,
          countryRightId: match.countryRightId,
          penaltisRight: match.penaltisRight ?? null,
        }))}
    />
  )
}
