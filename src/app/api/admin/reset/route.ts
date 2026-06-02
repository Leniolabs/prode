import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/withAuth'
import prisma from '@/lib/prisma'

export const POST = withAuth(async () => {
  const prode = await prisma.prode.findFirst({
    where: {
      prodeEnd: {
        gte: new Date(),
      },
    },
  })
  if (!prode) return NextResponse.json({}, { status: 404 })

  await prisma.$transaction([
    prisma.match.updateMany({
      data: {
        goalsLeft: null,
        goalsRight: null,
        penaltisLeft: null,
        penaltisRight: null,
        filled: false,
      },
    }),
    prisma.match.updateMany({
      data: {
        countryLeftId: null,
        countryRightId: null,
      },
      where: {
        stage: {
          notIn: [
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
    }),
  ])

  return NextResponse.json({})
}, { ownership: 'admin' })
