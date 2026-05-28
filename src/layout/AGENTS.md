# `src/layout/`: Shell primitives

Page-shell primitives only: `Card`, `Header`, `Footer`, `Container`, `Layout`. These are the structural bones of every screen. Feature-specific UI belongs in `src/components/`, not here. Domain logic, Prisma calls, and auth checks do not belong here.

## Target conventions

> ✅ Each primitive lives in its own folder: `Card/`, `Header/`, `Footer/`, `Container/`, `Layout/`. Each folder has `ComponentName.tsx` and an `index.ts` barrel.
> ✅ Primitives are generic and reusable across every route. If a component is tied to one feature or domain concept, it belongs in `src/components/view/` instead.
> ✅ No Prisma imports, no auth imports, no `useSession` inside this directory.
> ✅ After Migration H: styling is Tailwind classes inline. No `*.module.scss` companion files.
> ✅ Radix UI primitives (Dialog, DropdownMenu, Select, etc.) replace hand-rolled modal or dropdown implementations when a shell-level overlay is needed.

## Retained warnings

> ⚠️ Retained warning until Migration A lands: these components currently live at `components/layout/` in the Pages Router tree. Migration A promotes them to `src/layout/` as a top-level directory.
> ⚠️ Retained warning until Migration H lands: each primitive still has a `Name.module.scss` companion file. Do not add new SCSS; new styling uses Tailwind classes. The SCSS files are removed during Migration H.

## Imports

- Use `@/...` aliases. Relative paths only within this directory.
- Do not import from `@/components/`, `@/hooks/`, or `@/lib/` (except shared types from `@/types/`).
