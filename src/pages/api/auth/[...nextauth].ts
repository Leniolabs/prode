import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import TwitterProvider from "next-auth/providers/twitter";

import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "../../../lib";

const isDev = process.env.NODE_ENV === "development";

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/",
  },
  // CredentialsProvider requires JWT session strategy. We only switch in dev so
  // production keeps the database-session setup. After Migration D (Auth.js 5)
  // this whole config moves to lib/auth/auth.config.ts and the strategy gets
  // re-evaluated as part of the cutover plan.
  session: isDev ? { strategy: "jwt" } : undefined,
  callbacks: isDev
    ? {
        async jwt({ token, user }) {
          if (user) {
            token.userId = user.id;
            token.email = user.email;
          }
          return token;
        },
        async session({ session, token }) {
          if (session.user && token.email) {
            session.user.email = token.email as string;
          }
          return session;
        },
      }
    : undefined,
  providers: [
    ...(isDev
      ? [
          CredentialsProvider({
            id: "dev",
            name: "Dev Login",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              if (!credentials?.email) return null;
              const email = credentials.email;
              let user = await prisma.user.findFirst({ where: { email } });
              if (!user) {
                user = await prisma.user.create({
                  data: {
                    email,
                    name: email.split("@")[0],
                  },
                });
              }
              if (user.blocked) return null;
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            },
          }),
        ]
      : []),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_ID,
      clientSecret: process.env.TWITTER_SECRET,
      version: "2.0",
    }),
  ],
};

export default NextAuth(authOptions);
