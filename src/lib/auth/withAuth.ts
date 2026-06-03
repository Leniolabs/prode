/**
 * withAuth — API route wrapper that replaces the hand-rolled auth ladder.
 *
 * The auth ladder that is currently copy-pasted across ~18 API routes:
 *   getSession(req) → 401 → getUserByEmail → 401 → optional room lookup → 403
 *
 * Usage:
 *   export default withAuth(async (req, res, { user }) => { ... })
 *
 *   // With room ownership enforcement:
 *   export default withAuth(handler, { ownership: 'room' })
 *
 * The `ctx` argument passed to the handler is fully typed and always has at
 * least `session` and `user`. When `ownership: 'room'` is set, `ctx.room` is
 * also populated and guaranteed non-null.
 *
 * ⚠️ Retained warning (Migration D): this wrapper is created here but API
 * routes still hand-roll the auth ladder until Migration D migrates them.
 * After Migration D every API route uses this wrapper and the ladder code is
 * deleted from all route files.
 */
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Session } from 'next-auth'
import type { ProdeRoom, User } from '@prisma/client'
import prisma from '@/lib/prisma'
import { auth } from './session'

export type AuthContext = {
  session: Session
  user: User
  room?: ProdeRoom
}

export type WithAuthOptions = {
  /**
   * 'room'  — verifies req.query.id is an existing ProdeRoom owned by the
   *           authenticated user. Populates ctx.room. Returns 404 if room not
   *           found, 403 if owned by someone else.
   *
   * 'admin' — reserved for future admin-only routes (Migration D).
   *           Currently behaves the same as no option (session + user check only).
   */
  ownership?: 'room' | 'admin'
}

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, ctx: AuthContext) => Promise<void>,
  options: WithAuthOptions = {}
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const session = await auth(req as any, res as any)
    if (!session?.user?.email) {
      res.status(401).json({})
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user || user.blocked) {
      res.status(401).json({})
      return
    }

    const ctx: AuthContext = { session, user }

    if (options.ownership === 'room') {
      const id = req.query.id as string
      if (!id) {
        res.status(404).json({})
        return
      }
      const room = await prisma.prodeRoom.findUnique({ where: { id } })
      if (!room) {
        res.status(404).json({})
        return
      }
      if (room.userId !== user.id) {
        res.status(403).json({})
        return
      }
      ctx.room = room
    }

    return handler(req, res, ctx)
  }
}
