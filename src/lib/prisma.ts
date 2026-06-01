import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prismaClientSingleton = () => new PrismaClient({ adapter })

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// @ts-ignore
const prisma: ReturnType<typeof prismaClientSingleton> = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma
