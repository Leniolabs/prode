import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

const devProvider =
  process.env.NODE_ENV === 'development'
    ? [
        Credentials({
          id: 'dev',
          name: 'Dev',
          credentials: { email: {} },
          async authorize(credentials) {
            if (!credentials?.email) return null
            const email = credentials.email as string
            const user = await prisma.user.upsert({
              where: { email },
              create: { email, name: email.split('@')[0] },
              update: {},
            })
            if (user.blocked) return null
            return { id: user.id, name: user.name, email: user.email, image: user.image }
          },
        }),
      ]
    : []

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [...(authConfig.providers as any[]), ...devProvider],
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database' },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
      if (dbUser?.blocked) return '/blocked'
      return true
    },
    async session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id
      }
      return session
    },
  },
})

export { withAuth } from './withAuth'
export type { AuthContext } from './withAuth'
export * from './passwords'
