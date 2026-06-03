/**
 * Public API for the auth engine layer.
 *
 * Consumers: API routes (via withAuth), server-side page helpers.
 *
 * NOTE: Auth.js 5 target exports `{ auth, handlers, signIn, signOut }`.
 * While this project is on Next.js 13 / next-auth v4 the exported `auth`
 * function wraps `getServerSession` so call-sites are forward-compatible.
 */
export { auth } from './session'
export { withAuth } from './withAuth'
export type { AuthContext } from './withAuth'
