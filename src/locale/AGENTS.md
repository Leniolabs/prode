# `src/locale/`: i18n string tables

Per-locale string tables and the `useLocalizedText` hook live here. Each locale is one file: `es.ts` for Spanish, `en.ts` for English. The string tables are plain TypeScript objects keyed by string identifier. No domain logic, no Prisma calls, no scoring math belongs here.

## Target conventions

> ✅ Each locale file exports a single `const` object of type `LocaleStrings` (the canonical shape defined in this directory's `types.ts`).
> ✅ `useLocalizedText` is the only hook in this directory. It reads the active locale from context and returns the matching string table.
> ✅ String values are plain display strings only: no JSX, no component references.
> ✅ All locale keys are defined in every locale file. A missing key in one locale is a compile error, not a silent fallback.
> ✅ New strings go in every locale file at the same time. Partial translations ship with a placeholder rather than missing the key.

## Retained warnings

> ⚠️ Retained warning until Migration A lands: the locale files currently live at `locale/` at the repo root. Migration A moves them to `src/locale/` and updates the import alias.

## Imports

- Use `@/locale/...` aliases in callers.
- `useLocalizedText` may import from `'react'` only. No imports from `@/lib/`, `@/components/`, or `@/utils/`.
- Locale data files (`es.ts`, `en.ts`) have no imports at all: they are pure data.
