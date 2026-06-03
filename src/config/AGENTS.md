# `src/config/`: App-level settings and env validation

Validated environment variables, app-level constants, and `settings.ts` live here. No business logic, no Prisma calls, and no React. This directory is the single place to read from `process.env`; every other module imports the validated value from here instead of reading `process.env` directly.

## Target conventions

> ✅ `settings.ts` is the primary export: it reads and validates every required env var at import time, throwing early if a required var is missing.
> ✅ App-level constants (base URLs, feature flags, pagination limits, etc.) are declared here as typed exports.
> ✅ No business logic: no score calculations, no DB queries, no auth decisions.
> ✅ Import this module in server-only code where possible. If a constant is needed in a client component, export it from a separate `clientSettings.ts` file that contains only public values.

## Retained warnings

> ⚠️ Retained warning until Migration A lands: `settings.ts` currently lives at the repo root. Migration A moves it into `src/config/settings.ts` and updates all import paths.
> ⚠️ Retained warning until Migration B lands: env validation is informal (no schema library). After Migration B, the preferred approach is a typed validation step (e.g. with `zod` or manual guards) so missing vars fail at startup rather than at call time.

## Imports

- Use `@/config/settings` (or `@/config/clientSettings`) in callers.
- No imports from `@/lib/`, `@/components/`, or `@/hooks/` inside this directory.
