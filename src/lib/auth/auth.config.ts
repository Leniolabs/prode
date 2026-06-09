import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import GitHub from 'next-auth/providers/github'
import Twitter from 'next-auth/providers/twitter'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

const hasCredentials = (id?: string, secret?: string): id is string =>
  Boolean(id && secret)

const oauthProviders: NextAuthConfig['providers'] = []

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

if (
  hasCredentials(process.env.AZURE_AD_CLIENT_ID, process.env.AZURE_AD_CLIENT_SECRET) &&
  process.env.AZURE_AD_TENANT_ID
) {
  oauthProviders.push(
    MicrosoftEntraID({
      // Keep the provider id as 'azure-ad' so the already-registered redirect
      // URI (/api/auth/callback/azure-ad) and the signIn('azure-ad') call stay
      // valid. The underlying implementation is the maintained Entra provider;
      // the deprecated 'azure-ad' provider throws on the callback in this beta.
      id: 'azure-ad',
      name: 'Microsoft',
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
  )
}

export const authConfig: NextAuthConfig = {
  providers: oauthProviders,
  pages: { signIn: '/' },
}