# `src/types/`: Ambient type declarations

Ambient `.d.ts` files only. The primary use case is augmenting the Auth.js 5 `Session` and `User` types with the app's extra fields (`blocked`, `prodePublic`, `background`, `dark`). No runtime code lives here: no functions, no constants, no `export default`, no `import` statements that are not type-only.

## Target conventions

> ✅ Every file is a `.d.ts` declaration file. If you find yourself writing a function or a constant, it belongs in `@/lib/` or `@/utils/` instead.
> ✅ Auth.js session augmentation lives in `next-auth.d.ts` (or `auth.d.ts`): declare module `'next-auth'` to extend the `Session` and `User` interfaces with app-specific fields.
> ✅ Global ambient declarations (third-party modules without types, `window.*` extensions) live in `globals.d.ts`.
> ✅ Types that are specific to one module stay in that module's own `types.ts`, not here. This directory is for cross-cutting ambient declarations only.

## Retained warnings

> ⚠️ Retained warning until Migration D lands: the Auth.js 5 session shape is not yet wired. Until then, session types come from `next-auth@4`. The augmentation in this directory targets the Auth.js 5 `next-auth@5` module shape.

## Imports

- Type-only imports (`import type { ... }`) are acceptable.
- No runtime imports. `.d.ts` files with runtime imports will cause compiler errors.
