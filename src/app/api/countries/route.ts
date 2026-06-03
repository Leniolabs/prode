import { prisma } from '@/lib'
import { NextResponse } from 'next/server'

export async function GET() {
  const countries = await prisma.country.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(countries)
}
