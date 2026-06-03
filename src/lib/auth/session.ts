/**
 * `auth()` — server-side session accessor.
 *
 * Wraps next-auth v4 `unstable_getServerSession` under the Auth.js 5 call
 * signature so route handlers and page `getServerSideProps` can call
 * `auth(req, res)` today and will require no changes when next-auth@5 lands.
 *
 * Usage in API routes:
 *   const session = await auth(req, res)
 *
 * Usage in getServerSideProps:
 *   const session = await auth(context.req, context.res)
 */
import { unstable_getServerSession } from 'next-auth'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Session } from 'next-auth'
// Importing relative to avoid path-alias cycle (lib/ -> pages/).
// After next-auth@5 upgrade, replace with: import { authConfig } from './auth.config'
import { authOptions } from '../../pages/api/auth/[...nextauth]'

export async function auth(
  req: IncomingMessage,
  res: ServerResponse
): Promise<Session | null> {
  // unstable_getServerSession is the v4 server-side session reader.
  // It reads from the database via the Prisma adapter (not JWT).
  // In dev mode with JWT strategy it still works: reads the JWT cookie.
  return unstable_getServerSession(req as any, res as any, authOptions)
}
