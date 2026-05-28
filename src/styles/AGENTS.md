# `src/styles/`: Global CSS

Global CSS only. After Migration H this means Tailwind 4 directives and global resets in `globals.css`. Component-level styling belongs inline as Tailwind classes in the component file, not as a separate CSS file in this directory.

## Target conventions

> ✅ `globals.css` is the only file that should exist here after Migration H. It contains `@import "tailwindcss"` (Tailwind 4 syntax) and any global reset or base rules that cannot be expressed as utility classes.
> ✅ No `*.module.scss` files here. Component styles go inline as Tailwind classes in the component's `.tsx` file.
> ✅ No component-specific rules in `globals.css`. If a rule applies to only one component, it is a Tailwind class, not a global rule.
> ✅ `globals.css` is imported once, from `src/app/layout.tsx`.

## Retained warnings

> ⚠️ Retained warning until Migration H lands: SCSS modules are still active. The `styles/` directory may contain SCSS globals or reset files carried over from the Pages Router era. Do not add new SCSS files. New global styles go in `globals.css` with Tailwind syntax.
> ⚠️ Retained warning until Migration A lands: global styles may still live at `styles/` at the repo root. Migration A moves them to `src/styles/`.

## Imports

- Import `globals.css` only from `src/app/layout.tsx`.
- No TypeScript imports reference this directory.
