import { auth } from './index'
import prisma from '@/lib/prisma'
import { isRoomOwner, isAdmin } from './ownership'
import { NextResponse } from 'next/server'
import type { ProdeRoom, User } from '@/generated/prisma'

export type AuthContext = {
  user: User
  room?: ProdeRoom
}

type WithAuthOptions = {
  ownership?: 'room' | 'admin'
}

type RouteContext = { params: Promise<Record<string, string>> }

export function withAuth(
  handler: (req: Request, ctx: AuthContext, routeCtx: RouteContext) => Promise<Response>,
  options: WithAuthOptions = {}
) {
  return async (req: Request, routeCtx: RouteContext): Promise<Response> => {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({}, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.blocked) return NextResponse.json({}, { status: 401 })

    if (options.ownership === 'admin') {
      if (!isAdmin(user.email)) return NextResponse.json({}, { status: 403 })
      return handler(req, { user }, routeCtx)
    }

    if (options.ownership === 'room') {
      const params = await routeCtx.params
      const id = params.id
      if (!id) return NextResponse.json({}, { status: 400 })
      const room = await prisma.prodeRoom.findUnique({ where: { id } })
      if (!room) return NextResponse.json({}, { status: 404 })
      if (!isRoomOwner(session, room)) return NextResponse.json({}, { status: 403 })
      return handler(req, { user, room }, routeCtx)
    }

    return handler(req, { user }, routeCtx)
  }
}
