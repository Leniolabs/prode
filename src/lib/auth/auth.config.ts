/**
 * Auth.js 5 target config shape.
 *
 * NOTE: next-auth@5 requires Next.js >=14. This project is on Next.js 13, so
 * the actual NextAuth() initialisation still lives in
 * src/pages/api/auth/[...nextauth].ts (v4 style). This file defines the
 * canonical configuration object that will be wired directly into
 * NextAuth() once Next.js is upgraded (Migration E).
 *
 * For now it re-exports the authOptions from the v4 handler so that any code
 * that imports from @/lib/auth/auth.config gets a stable interface.
 */
export { authOptions as authConfig } from '@/lib/auth/authOptions'
