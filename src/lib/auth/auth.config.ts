import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'
import Twitter from 'next-auth/providers/twitter'

const hasCredentials = (id?: string, secret?: string): id is string =>
  Boolean(id && secret)

const oauthProviders = []

if (hasCredentials(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET)) {
  oauthProviders.push(
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  )
}

if (hasCredentials(process.env.FACEBOOK_ID, process.env.FACEBOOK_SECRET)) {
  oauthProviders.push(
    Facebook({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
  )
}

if (hasCredentials(process.env.GITHUB_ID, process.env.GITHUB_SECRET)) {
  oauthProviders.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  )
}

if (hasCredentials(process.env.TWITTER_ID, process.env.TWITTER_SECRET)) {
  oauthProviders.push(
    Twitter({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
    }),
  )
}

export const authConfig: NextAuthConfig = {
  providers: oauthProviders,
  pages: { signIn: '/' },
}
