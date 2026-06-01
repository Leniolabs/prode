import type { NextApiRequest, NextApiResponse } from 'next'
import type { ProdeRoom, User } from '@/generated/prisma'
import { getPageSession } from './getPageSession'
import { isRoomOwner, isAdmin } from './ownership'
import prisma from '@/lib/prisma'

export type AuthContext = {
  user: User
  room?: ProdeRoom
}

type WithAuthOptions = {
  ownership?: 'room' | 'admin'
}

type AuthedHandler<Req extends NextApiRequest = NextApiRequest> = (
  req: Req,
  res: NextApiResponse,
  ctx: AuthContext
) => Promise<void>

export function withAuth<Req extends NextApiRequest = NextApiRequest>(
  handler: AuthedHandler<Req>,
  options: WithAuthOptions = {}
) {
  return async (req: Req, res: NextApiResponse): Promise<void> => {
    const session = await getPageSession(req)

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

    if (options.ownership === 'admin') {
      if (!isAdmin(user.email)) {
        res.status(401).json({})
        return
      }
      await handler(req, res, { user })
      return
    }

    if (options.ownership === 'room') {
      const id = (req.query?.id ?? req.query?.roomId) as string | undefined
      if (!id) {
        res.status(404).json({})
        return
      }

      const room = await prisma.prodeRoom.findUnique({ where: { id } })
      if (!room) {
        res.status(404).json({})
        return
      }

      if (!isRoomOwner(session, room)) {
        res.status(403).json({})
        return
      }

      await handler(req, res, { user, room })
      return
    }

    await handler(req, res, { user })
  }
}
