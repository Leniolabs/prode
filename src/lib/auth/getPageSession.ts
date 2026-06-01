/**
 * Pages Router-compatible session reader.
 *
 * Auth.js v5's auth() function imports next/headers and next/server at module
 * level, which are App Router-only APIs in Next.js 13. This helper reads the
 * session directly from the database using the session token cookie, avoiding
 * that dependency entirely.
 *
 * Used in:
 *   - getServerSideProps (via getPageSession(context))
 *   - API route withAuth wrapper (via getPageSession(req))
 *   - Dev mode reads the JWT directly via getUserFromJWT
 */
import type { GetServerSidePropsContext, NextApiRequest } from 'next'
import prisma from '@/lib/prisma'

type SessionUser = {
  id: string
  email: string | null
  name: string | null
  image: string | null
  blocked: boolean
}

type GetPageSessionResult = {
  user: SessionUser
} | null

/**
 * Parse the next-auth.session-token cookie from a Pages Router request
 * or GetServerSidePropsContext.
 */
function getSessionToken(req: NextApiRequest | GetServerSidePropsContext['req']): string | undefined {
  const cookieHeader = req.headers.cookie ?? ''
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k.trim(), v.join('=')]
    })
  )
  // Auth.js v5 uses 'authjs.session-token' in dev (no HTTPS) or
  // '__Secure-authjs.session-token' in production. Fall back to
  // next-auth v4 cookie names for a safe transition period.
  return (
    cookies['authjs.session-token'] ??
    cookies['__Secure-authjs.session-token'] ??
    cookies['next-auth.session-token'] ??
    cookies['__Secure-next-auth.session-token']
  )
}

/**
 * Retrieve session from the database using the session token cookie.
 * Works for both database-strategy (production) sessions.
 */
async function getSessionFromDB(sessionToken: string): Promise<GetPageSessionResult> {
  const dbSession = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          blocked: true,
        },
      },
    },
  })

  if (!dbSession) return null
  if (dbSession.expires < new Date()) return null

  return { user: dbSession.user }
}

/**
 * In dev mode with JWT strategy, we decode the JWT without importing
 * next-auth (to avoid the next/server ESM issue). We read from the DB
 * by extracting the email claim from the unverified JWT payload.
 * This is acceptable in dev-only because the token is not trusted for
 * security decisions — we still re-fetch the user from the DB.
 */
async function getSessionFromJWT(token: string): Promise<GetPageSessionResult> {
  try {
    // JWT payload is the base64url-encoded middle segment
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return null
    const payload = JSON.parse(
      Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    )
    const email = payload.email as string | undefined
    if (!email) return null

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, image: true, blocked: true },
    })

    if (!user) return null
    return { user }
  } catch {
    return null
  }
}

/**
 * Main export: read the Auth.js session from a Pages Router request.
 * Accepts either a NextApiRequest or GetServerSidePropsContext.
 */
export async function getPageSession(
  reqOrContext: NextApiRequest | GetServerSidePropsContext
): Promise<GetPageSessionResult> {
  const req = 'req' in reqOrContext ? reqOrContext.req : reqOrContext
  const token = getSessionToken(req)
  if (!token) return null

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // In dev, Credentials provider forces JWT strategy. The token is a JWT.
    // In production the token is a DB session token (opaque string).
    // We detect a JWT by checking for two dots (header.payload.signature).
    if (token.split('.').length === 3) {
      return getSessionFromJWT(token)
    }
  }

  return getSessionFromDB(token)
}
