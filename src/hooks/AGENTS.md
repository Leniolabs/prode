# `src/hooks/`: React hooks

Custom React hooks only. A hook encapsulates stateful logic, browser API access, or data-fetching coordination that is used across multiple components. No UI rendering belongs here: JSX, `return <...>`, and component definitions all go in `src/components/` or `src/layout/`.

## Target conventions

> ✅ Every file exports exactly one hook. The file name matches the hook name: `useRoomData.ts` exports `useRoomData`.
> ✅ All hook names start with `use`. The TypeScript compiler and linter enforce the Rules of Hooks on any function named `use*`.
> ✅ Hooks may import from `@/lib/*` and `@/utils/*`. They must not import from `@/components/` or `@/layout/`.
> ✅ Data-fetching hooks use `@tanstack/react-query@5` object syntax: `useQuery({ queryKey: [...], queryFn: ... })`.
> ✅ Hooks are pure TypeScript with React imports only. No Prisma, no server-only imports.

## Retained warnings

> ⚠️ Retained warning until Migration E lands: existing data-fetching hooks use `react-query@3` call syntax (`useQuery(['key'], fn)`). Do not add new hooks in the old syntax; new hooks use the TanStack Query 5 object form.
> ⚠️ Retained warning until Migration G lands: some hook logic lives inline inside `pages/` components. Extract it here during or after Migration G.

## Imports

- Use `@/...` aliases. Relative paths only within this directory.
- Import React from `'react'` (React 19; no `import React` needed for JSX if `jsx: automatic` is set, but explicit import is fine).
- Import query utilities from `@tanstack/react-query`.
