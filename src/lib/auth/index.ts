/**
 * Public barrel for @/lib/auth.
 *
 * - `handlers`: App Router GET/POST handlers for src/app/api/auth/[...nextauth]/route.ts
 *   (used after Migration G).
 * - `auth`: Auth.js v5 server helper (App Router / middleware only — not safe to
 *   import in Pages Router getServerSideProps on Next.js 13 due to next/server ESM).
 * - `getPageSession`: Pages Router-compatible session reader (reads DB or JWT directly).
 * - `withAuth`: Pages Router API route wrapper.
 * - `isRoomOwner`, `isAdmin`: ownership checks.
 */
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

export const { handlers, auth } = NextAuth(authConfig)

export { authConfig } from './auth.config'
export { withAuth } from './withAuth'
export { getPageSession } from './getPageSession'
export { isRoomOwner, isAdmin } from './ownership'
