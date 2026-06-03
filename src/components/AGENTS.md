# `components/` tutor

This directory (after Migration A: `src/components/`) holds all React feature components for the app.

## Directory layout

```
components/
  common/    generic, reusable widgets (BrandLogo, Button, Form, Modal, ...)
  layout/    page-shell primitives (Card, Container, Header, Footer, Layout)
  view/      page-specific feature panels (Finals/, Groups/, Index/, ShareVideo/, Winners/)
```

> ⚠️ Retained warning until Migration A lands: `layout/` currently lives here as `components/layout/`. After Migration A it is promoted to `src/layout/` as a sibling of `src/components/`. New shell primitives (Card, Container, Header, Footer) go into `components/layout/` for now and will move automatically when Migration A runs. Do not add layout primitives to `common/` or `view/`.

## Target conventions

> ✅ Target convention: every component is `Name.tsx` plus an `index.ts` barrel. The barrel re-exports the default export so callers import from the directory, not the file directly.

> ✅ Target convention: `common/` holds generic, page-agnostic widgets. `view/` holds page-specific feature panels. After Migration A, shell primitives live in `src/layout/`, not in `components/`.

> ✅ Target convention: after Migration H, components use Tailwind classes inline. No `Name.module.scss` file.

> ⚠️ Retained warning until Migration H lands: components currently use `Name.module.scss` files for styling. New components must follow the same `Name.tsx + Name.module.scss + index.ts` pattern until Migration H is in flight. Do not introduce a different styling approach mid-codebase.

> ✅ Target convention: modal, dropdown, tooltip, select, and switch primitives come from Radix UI after Migration H. Do not roll a new hand-built primitive for any of those patterns. Planned mappings: `Modal`/`PasswordModal` to `@radix-ui/react-dialog`, `HeaderMenu` to `@radix-ui/react-dropdown-menu`, `CountrySelect`/`LocaleSelect` to `@radix-ui/react-select`, `Toggle` to `@radix-ui/react-switch`, `Warning` to `@radix-ui/react-tooltip`.

> ✅ Target convention (after Migration L): bracket components in `view/Finals/` read the `Stage` enum dynamically. They are not hardcoded to the WC 2022 shape (8 groups, Round of 16). The WC 2026 Round of 32 stages (`FINALS_16_*`) must render without adding another layer of hardcoded conditions.

## Import rules

- Import components via path alias: `import { Button } from '@/components/common/Button'`.
- Relative imports are only acceptable within the same component directory.
- Components must not import from `lib/` directly for domain logic. Pass data as props or use a hook that wraps the query.

## What does NOT belong here

- Cross-cutting domain logic (move to `src/lib/`).
- Pure utility functions with no React dependency (move to `src/utils/`).
- Page-shell primitives after Migration A (move to `src/layout/`).
