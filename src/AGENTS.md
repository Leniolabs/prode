# `src/`: Source Root

This is the "where do I put this?" reference for all application code. Every
directory under `src/` has a single responsibility; placing code in the wrong
layer breaks the layered model enforced below.

---

## Layered model

| Layer | Directory | Rule |
|---|---|---|
| UI + routes | `app/` | imports `lib/`, `utils/`, `components/`, `layout/`, `hooks/` |
| Engine | `lib/` | pure TypeScript and Prisma. Never imports React. Never imports from `app/`. |
| Feature UI | `components/` | imports `lib/`, `utils/`, `hooks/`, `layout/`. No circular deps with `app/`. |
| Shell primitives | `layout/` | page-level wrappers (Card, Header, Footer, Container, Layout). No domain logic. |
| React hooks | `hooks/` | may import `lib/` and `utils/`. No UI rendering. |
| Small helpers | `utils/` | pure functions, no React, no domain logic. |
| Ambient types | `types/` | type declarations only. No runtime code. |
| Settings | `config/` | env wiring and app constants. |
| Generated | `generated/` | Prisma client output. Never edit by hand. |
| i18n | `locale/` | string tables and `useLocalizedText`. |
| Global CSS | `styles/` | Tailwind directives and global resets only. |

> **Core rule:** UI imports lib; lib does not import UI. `lib/` never imports
> React. `utils/` never imports React.

---

## Import discipline

- **Path aliases everywhere.** All imports use `@/...` (resolves to `src/...`).
  Example: `import { withAuth } from '@/lib/auth/withAuth'`.
- **Relative paths only inside a single sub-module.** If a file in
  `lib/scoring/` imports a sibling, `./group` is fine. Crossing directory
  boundaries always uses `@/`.
- Never import from `../../pages` or any path that bypasses the alias contract.

---

## Directory responsibilities (quick reference)

| Directory | Lives here | Does NOT live here |
|---|---|---|
| `app/` | Route pages, layouts, API route handlers, `generateMetadata` | Business logic; move that to `lib/` |
| `lib/` | Cross-cutting domain logic: auth, scoring, prisma client | React, JSX, `useState` |
| `components/` | Feature UI components (`Name.tsx + index.ts`) | Shell primitives; move those to `layout/` |
| `layout/` | Page-level shells (Header, Footer, Card, Container, Layout) | Feature-specific UI |
| `hooks/` | `use*` React hooks | Non-hook helper functions; move those to `utils/` |
| `utils/` | Pure helper functions (array, date, classname, share, image) | Anything that imports React or touches Prisma |
| `config/` | `settings.ts`, env validation | Business logic |
| `types/` | Ambient `.d.ts` declarations, Auth.js session shape augments | Runtime code |
| `generated/` | Prisma client (`prisma generate` output) | Hand-written code |
| `locale/` | String tables, `useLocalizedText` | Domain logic |
| `styles/` | `globals.css` with Tailwind directives | Component-scoped styles (use Tailwind classes inline) |

---

## Pointers to sub-tutors

- `src/lib/AGENTS.md`: engine conventions, prisma singleton, auth module, scoring module.
- `src/components/AGENTS.md`: component file structure, Radix primitives, Tailwind migration.
- `src/utils/AGENTS.md`: small-helpers contract, retained warnings for scoring duplication and raw SQL.
- `src/app/api/AGENTS.md`: route-handler convention, `withAuth` usage, response shapes.
