'use client'
import { SessionProvider } from 'next-auth/react'

declare global {
  interface Window { __E2E_SESSION?: unknown }
}

// Read once at module-evaluation time (client only). Playwright's addInitScript
// sets window.__E2E_SESSION before any page scripts run, so this value is
// available synchronously here. Passing it as `session` to SessionProvider sets
// hasInitialSession=true, which prevents the /api/auth/session network fetch
// entirely and makes useSession resolve instantly with the injected state.
// In production the variable is never defined, so this stays undefined and
// SessionProvider behaves normally.
const testSession =
  typeof window !== 'undefined' ? window.__E2E_SESSION : undefined

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider session={testSession as any}>{children}</SessionProvider>
}
