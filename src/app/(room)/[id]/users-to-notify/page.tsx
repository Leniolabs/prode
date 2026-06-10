import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

type GroupConfig = {
  key: 'fecha-1' | 'fecha-2' | 'fecha-3'
  title: string
  cutoffLabel: string
  startAt: Date
  endAt?: Date
}

type UserMissingRow = {
  userId: string
  name: string
  email: string
  total: number
}

type PageProps = {
  params: Promise<{ id: string }>
}

const GROUPS: GroupConfig[] = [
  {
    key: 'fecha-1',
    title: 'Fecha 1',
    cutoffLabel: 'hasta el jueves 11/06 - 16:00 ARG / 15:00 CHI',
    startAt: new Date('2026-06-11T19:00:00.000Z'),
    endAt: new Date('2026-06-18T16:00:00.000Z'),
  },
  {
    key: 'fecha-2',
    title: 'Fecha 2',
    cutoffLabel: 'hasta el jueves 18/06 - 13:00 ARG / 12:00 CHI',
    startAt: new Date('2026-06-18T16:00:00.000Z'),
    endAt: new Date('2026-06-24T19:00:00.000Z'),
  },
  {
    key: 'fecha-3',
    title: 'Fecha 3',
    cutoffLabel: 'hasta el miércoles 24/06 - 16:00 ARG / 15:00 CHI',
    startAt: new Date('2026-06-24T19:00:00.000Z'),
  },
]

function isGroupStage(stage: string) {
  return stage.startsWith('GROUP_')
}

export default async function UsersToNotifyByRoomPage({ params }: PageProps) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, blocked: true },
  })

  if (!currentUser || currentUser.blocked) redirect('/login')
  if (!id) redirect('/rooms')
  const room = await prisma.prodeRoom.findUnique({
    where: { id },
    select: { id: true, userId: true, prodeId: true },
  })

  if (!room) redirect('/rooms')
  if (currentUser.role !== 'ADMIN' && currentUser.id !== room.userId) redirect('/rooms')

  const matches = await prisma.match.findMany({
    where: {
      prodeId: room.prodeId,
      stage: {
        in: [
          'GROUP_A',
          'GROUP_B',
          'GROUP_C',
          'GROUP_D',
          'GROUP_E',
          'GROUP_F',
          'GROUP_G',
          'GROUP_H',
          'GROUP_I',
          'GROUP_J',
          'GROUP_K',
          'GROUP_L',
        ],
      },
    },
    select: {
      id: true,
      date: true,
      stage: true,
    },
  })

  const userProdes = await prisma.userProde.findMany({
    where: {
      prodeRoomId: room.id,
      template: false,
    },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const allMatchIds = matches.map((match) => match.id)
  const allUserProdeIds = userProdes.map((userProde) => userProde.id)

  const predictions = allMatchIds.length
    ? await prisma.prodeUserGroupMatch.findMany({
        where: {
          matchId: { in: allMatchIds },
          userProdeId: { in: allUserProdeIds },
        },
        select: {
          userProdeId: true,
          matchId: true,
        },
      })
    : []

  const predictionKeySet = new Set(
    predictions.map((prediction) => `${prediction.userProdeId}:${prediction.matchId}`)
  )

  const groupMatchesByKey = GROUPS.reduce<Record<GroupConfig['key'], string[]>>(
    (acc, group) => {
      acc[group.key] = matches
        .filter((match) => {
          if (!isGroupStage(match.stage)) return false
          if (match.date < group.startAt) return false
          if (group.endAt && match.date >= group.endAt) return false
          return true
        })
        .map((match) => match.id)

      return acc
    },
    {
      'fecha-1': [],
      'fecha-2': [],
      'fecha-3': [],
    }
  )

  const groupedRows = GROUPS.reduce<Record<GroupConfig['key'], UserMissingRow[]>>(
    (acc, group) => {
      const groupMatchIds = groupMatchesByKey[group.key]
      const userTotals = new Map<string, UserMissingRow>()

      for (const userProde of userProdes) {
        const missingForThisUserProde = groupMatchIds.reduce((missingCount, matchId) => {
          const hasPrediction = predictionKeySet.has(`${userProde.id}:${matchId}`)
          return hasPrediction ? missingCount : missingCount + 1
        }, 0)

        if (missingForThisUserProde < 1) continue

        const userId = userProde.user.id
        const existing = userTotals.get(userId)

        if (!existing) {
          userTotals.set(userId, {
            userId,
            name: userProde.user.name ?? '(sin nombre)',
            email: userProde.user.email ?? '',
            total: missingForThisUserProde,
          })
          continue
        }

        existing.total += missingForThisUserProde
      }

      acc[group.key] = Array.from(userTotals.values()).sort((a, b) => {
        if (b.total !== a.total) return b.total - a.total
        return a.name.localeCompare(b.name)
      })

      return acc
    },
    {
      'fecha-1': [],
      'fecha-2': [],
      'fecha-3': [],
    }
  )

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Users to notify</h1>
      <p style={{ marginTop: 0, marginBottom: 24 }}>
        Usuarios con al menos un partido sin resultado por fecha.
      </p>

      {GROUPS.map((group) => {
        const rows = groupedRows[group.key]
        return (
          <section key={group.key} style={{ marginBottom: 28 }}>
            <h2 style={{ marginBottom: 4 }}>
              {group.title}: {group.cutoffLabel}
            </h2>

            {rows.length === 0 ? (
              <p style={{ marginTop: 8 }}>Sin usuarios con partidos incompletos.</p>
            ) : (
              <table cellPadding={8} style={{ borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr>
                    <th align="left">User</th>
                    <th align="left">Email</th>
                    <th align="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${group.key}:${row.userId}`}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td align="right">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )
      })}
    </main>
  )
}
