import type { ProdeRoom } from '@/generated/prisma'

/**
 * Returns true when the authenticated user owns the given room.
 * Accepts any object with a `user.id` field so this works with both
 * Auth.js Session objects and the lightweight session shape returned by
 * getPageSession.
 */
export function isRoomOwner(session: { user?: { id?: string } | null }, room: ProdeRoom): boolean {
  return room.userId === session.user?.id
}

export function isAdmin(userEmail: string | null | undefined): boolean {
  if (!userEmail) return false
  return userEmail === process.env.ADMIN_EMAIL
}
