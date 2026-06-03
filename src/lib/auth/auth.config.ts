import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'
import Twitter from 'next-auth/providers/twitter'

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Twitter({
      clientId: process.env.TWITTER_ID!,
      clientSecret: process.env.TWITTER_SECRET!,
    }),
  ],
  pages: { signIn: '/' },
}
