import type { NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'
import Twitter from 'next-auth/providers/twitter'
import Credentials from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'

const isDev = process.env.NODE_ENV === 'development'

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: '/' },
  // CredentialsProvider requires JWT strategy. Only switch in dev so
  // production keeps the database-session setup.
  session: isDev ? { strategy: 'jwt' } : { strategy: 'database' },
  callbacks: isDev
    ? {
        async jwt({ token, user }) {
          if (user) {
            token.userId = user.id
            token.email = user.email
          }
          return token
        },
        async session({ session, token }) {
          if (session.user && token.email) {
            session.user.email = token.email as string
            if (token.userId) session.user.id = token.userId as string
          }
          return session
        },
      }
    : {
        async session({ session, user }) {
          if (session.user) {
            session.user.id = user.id
            // @ts-expect-error blocked is an app-specific field not on the Auth.js User type
            session.user.blocked = user.blocked ?? false
          }
          return session
        },
        async signIn({ user }) {
          // @ts-expect-error blocked is an app-specific field not on the Auth.js User type
          if (user.blocked) return false
          return true
        },
      },
  providers: [
    ...(isDev
      ? [
          Credentials({
            id: 'dev',
            name: 'Dev Login',
            credentials: {
              email: { label: 'Email', type: 'email' },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null
              const email = credentials.email as string
              let user = await prisma.user.findFirst({ where: { email } })
              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: email.split('@')[0],
                  },
                })
              }
              if (user.blocked) return null
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            },
          }),
        ]
      : []),
    Facebook({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // Auth.js v5 Twitter provider defaults to OAuth 2.0; the 'version' option
    // was a v4-only escape hatch and is no longer needed.
    Twitter({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
    }),
  ],
}
