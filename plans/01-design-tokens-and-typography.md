# Plan 01: Design Tokens and Typography

Status: Ready to execute after Plan 00 is complete.

Depends on: Plan 00 (tokens scaffold exists, `@use` alias confirmed, gradient stops documented, product decisions on dark-mode and per-user backgrounds resolved).

---

## Goal

Update `src/styles/_tokens.scss` with the full Improving/WC-2026 brand palette, swap the global font from Source Sans Pro to Poppins, resolve the dark-mode conflict in `globals.css`, and wire the token file into every SCSS module that contains hard-coded hex values. After this phase all screens render with the new colors and font. No markup or component logic changes.

This is the highest-leverage phase: it touches the largest number of files but each change is mechanical (replace hex literal with a token reference). Batching the largest visual diff here keeps later phases focused on structure.

---

## Files Likely Affected

### Globals

| File | Change |
|---|---|
| `src/styles/globals.css` | Replace Source Sans Pro `@import` with Poppins; update `font-family`; resolve dark-mode block |
| `src/app/layout.tsx` | Optionally add `next/font/google` for Poppins (preferred over raw `@import`) |
| `src/styles/_tokens.scss` | Replace placeholder values with final brand values |

### Layout SCSS modules

| File | Primary change |
|---|---|
| `src/layout/Layout/Layout.module.scss` | Background: static PNG → brand gradient |
| `src/layout/Card/Card.module.scss` | Card header: `#1f2740` → `$color-card-header` (green), body: `#f6f5f5cc` → white, add radius and shadow |
| `src/layout/Footer/Footer.module.scss` | Background: `#1f2740cc` → horizontal gradient |
| `src/layout/Header/Header.module.scss` | Header background color token |
| `src/layout/ContainerHeader/ContainerHeader.module.scss` | Title bar color |
| `src/layout/Container/Container.module.scss` | If any hardcoded colors are present |

### Component SCSS modules (color tokens only)

| File | What changes |
|---|---|
| `src/components/common/Button/Button.module.scss` | Primary: `#ffca30` stays as `$color-accent-yellow`; secondary: `#3b4871` → `$color-brand-blue`; add `$radius-button`; `border-color` token |
| `src/components/common/Table/Table.module.scss` | Header row: `#cbd2e9` → `$color-table-header` (new token); stripe color |
| `src/components/common/Form/Form.module.scss` | Section title bg `#cbd2e9` → token; input border `#1f274050` → token; legend color token |
| `src/components/common/Toggle/Toggle.module.scss` | Off: `#cd5367` → `$color-toggle-off`; on: `#69b29a` → `$color-toggle-on` |
| `src/components/common/Modal/Modal.module.scss` | Header color token |
| `src/components/common/PasswordModal/PasswordModal.module.scss` | If colors are present |
| `src/components/common/MatchInput/MatchInput.module.scss` | Remap state colors to new semantic tokens (correct/winner/wrong tokens stay; border/bg tokens update) |
| `src/components/common/Header/DesktopHeader/DesktopHeader.module.scss` | Background token |
| `src/components/common/Header/MobileHeader/MobileHeader.module.scss` | Background token |
| `src/components/common/Header/HeaderMenu/HeaderMenu.module.scss` | Colors |
| `src/components/common/HomeTitle/HomeTitle.module.scss` | Background/text color tokens |
| `src/components/common/RegisterButton/RegisterButton.module.scss` | Colors |
| `src/components/common/BrandLogo/BrandLogo.module.scss` | If any colors |
| `src/components/common/Warning/Warning.module.scss` | Colors |
| `src/styles/CommonStyles.module.scss` | Any shared color values |
| `src/styles/Home.module.css` | Colors (if still in use) |

---

## Step-by-Step Checklist

### 1. Update `_tokens.scss` with final brand values

Replace every placeholder value from Phase 00 with the confirmed Figma values:

- [ ] Open `src/styles/_tokens.scss`.
- [ ] Set the brand palette:
  ```scss
  // Brand colors
  $color-brand-blue:      #005596;
  $color-brand-light-blue:#4597D3;
  $color-brand-green:     #5BC2A7;
  $color-accent-yellow:   #FFCA30;   // same as current — no visual change
  $color-accent-cta:      #F5BB41;   // CTA button variant
  $color-dark-navy:       #00192C;
  $color-dark-navy-2:     #112632;
  $color-neutral-gray:    #A7A8A9;

  // Surface tokens
  $color-card-header:     $color-brand-green;
  $color-card-header-text:#00192C;   // dark text on green — see R9 in migration plan
  $color-card-body:       #ffffff;
  $color-bg-gradient:     linear-gradient(180deg, #005596 0%, #00192C 100%);
  $color-footer-gradient: linear-gradient(90deg, #4597D3 0%, #5BC2A7 100%);
  $color-table-header:    #E8F4F1;   // light teal; adjust if design specifies exact value

  // Form tokens
  $color-form-label:      $color-brand-blue;
  $color-input-border:    $color-neutral-gray;
  $color-form-legend:     rgba(0, 25, 44, 0.6);  // must be >=4.5:1 on white

  // Toggle
  $color-toggle-off:      $color-neutral-gray;
  $color-toggle-on:       $color-brand-green;

  // Gameplay semantics — DO NOT CHANGE
  $color-correct:         #309e3a;
  $color-winner:          #0093dd;
  $color-wrong:           #f9aa51;

  // Radius
  $radius-card:           8px;
  $radius-input:          8px;
  $radius-button:         8px;

  // Shadow
  $shadow-card:           0px 9px 28px rgba(0, 0, 0, 0.05);
  ```
- [ ] Confirm the gradient stop hex values match the exported Figma values exactly (from Phase 00 documentation). Update if different.

### 2. Resolve dark-mode conflict in `globals.css`

The current `@media (prefers-color-scheme: dark)` block sets `body { background: black; color: white }`, which overrides the new CSS gradient for dark-mode OS users.

- [ ] If the product decision (from Phase 00) is "no dark variant": remove the entire `@media (prefers-color-scheme: dark)` block from `src/styles/globals.css`.
- [ ] If keeping the block is required for another reason: add `color-scheme: only light;` to the `:root` selector in `globals.css` to prevent the OS from applying dark-mode overrides.
- [ ] Do not add any dark-mode Figma styles — only resolve the conflict.

### 3. Swap the font

**Recommended approach: `next/font/google` in `src/app/layout.tsx`** (avoids a render-blocking `@import` and gives automatic font optimization).

- [ ] In `src/app/layout.tsx`:
  ```tsx
  import { Poppins } from 'next/font/google';

  const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-poppins',
    display: 'swap',
  });

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="es" className={poppins.variable}>
        <body>
          ...
        </body>
      </html>
    );
  }
  ```
- [ ] In `src/styles/globals.css`: remove the `@import url('https://fonts.googleapis.com/...')` line and change `font-family` to:
  ```css
  html, body {
    font-family: var(--font-poppins), sans-serif;
  }
  ```
- [ ] If per-user backgrounds are being removed (Phase 00 decision): also remove the `body { background: black }` dark-mode rule here. Otherwise keep it absent (the media query removal in step 2 handles it).

### 4. Wire `_tokens.scss` into layout SCSS modules

For each layout module listed in the files table, add `@use` and replace hex literals:

- [ ] `src/layout/Layout/Layout.module.scss`: replace `background-image: url(...)` with `background: t.$color-bg-gradient;` (and remove `background-size/repeat/position` if the gradient replaces the PNG entirely). If per-user background prop is being retained, add a CSS variable override: `--bg-override: none; background: var(--bg-override, t.$color-bg-gradient);` and set the variable from the inline style in `Layout.tsx`.
- [ ] `src/layout/Card/Card.module.scss`: apply `$color-card-header`, `$color-card-header-text`, `$color-card-body`, `$radius-card`, `$shadow-card`.
- [ ] `src/layout/Footer/Footer.module.scss`: apply `$color-footer-gradient`.
- [ ] `src/layout/Header/Header.module.scss`: apply header background token.
- [ ] `src/layout/ContainerHeader/ContainerHeader.module.scss`: apply title bar token.

### 5. Wire `_tokens.scss` into component SCSS modules

For each component module listed, add `@use 'styles/tokens' as t;` (or `@use '@/styles/tokens' as t;` depending on alias resolution confirmed in Phase 00) at the top and replace hard-coded hex values:

- [ ] `src/components/common/Button/Button.module.scss`
- [ ] `src/components/common/Table/Table.module.scss`
- [ ] `src/components/common/Form/Form.module.scss`
- [ ] `src/components/common/Toggle/Toggle.module.scss`
- [ ] `src/components/common/Modal/Modal.module.scss`
- [ ] `src/components/common/PasswordModal/PasswordModal.module.scss`
- [ ] `src/components/common/MatchInput/MatchInput.module.scss` (gameplay semantic tokens must stay unchanged)
- [ ] `src/components/common/Header/DesktopHeader/DesktopHeader.module.scss`
- [ ] `src/components/common/Header/MobileHeader/MobileHeader.module.scss`
- [ ] `src/components/common/Header/HeaderMenu/HeaderMenu.module.scss`
- [ ] `src/components/common/HomeTitle/HomeTitle.module.scss`
- [ ] `src/components/common/RegisterButton/RegisterButton.module.scss`
- [ ] `src/components/common/Warning/Warning.module.scss`
- [ ] `src/styles/CommonStyles.module.scss`
- [ ] `src/styles/Home.module.css` (if still referenced anywhere — check with `grep -r "Home.module" src/`)

### 6. Handle the `Layout.tsx` `backgroundImage` prop

The per-user background prop applies an inline `style` that overrides any CSS background set in the module. After switching to a gradient this will hide it for users whose `background` field is set.

- [ ] If the Phase 00 decision is "remove per-user backgrounds": remove the `style={props.backgroundImage ? { backgroundImage: ... } : undefined}` from `src/layout/Layout/Layout.tsx`. Also remove the `backgroundImage` prop from `LayoutProps`. Update all call sites (`rooms/page.tsx`, `new-prode/page.tsx`, and any others) to stop passing `backgroundImage`.
- [ ] If the Phase 00 decision is "retain per-user backgrounds": do nothing in this phase. The override behavior is preserved intentionally. Add a code comment in `Layout.tsx` noting that the inline style takes precedence over the gradient.

### 7. Re-baseline all harness routes

Every route will look visually different after the font and color changes. This is expected and intentional.

- [ ] Run `npm run harness:baseline` to capture the new state.
- [ ] Run `npm run harness:check` twice to confirm the new baselines are stable.
- [ ] Commit the updated `harness/baseline/*.png` files together with all SCSS changes in a single commit so the diff is reviewable.

---

## Acceptance Criteria

- [ ] `npm run build` passes with no TypeScript or Sass errors.
- [ ] `npm run lint` passes.
- [ ] `npm run test` passes (no test file references colors; all pure-TS tests should be unaffected).
- [ ] `npm run harness:check` passes (i.e., two consecutive runs match after re-baselining).
- [ ] All screens render Poppins as the body font (visible in browser DevTools, Computed Styles).
- [ ] Page background shows the brand gradient (no PNG, no black background on dark-mode OS).
- [ ] Card headers render green (`#5BC2A7`) with dark text.
- [ ] Footer renders the horizontal teal gradient.
- [ ] Gameplay score states (correct green, winner blue, wrong orange) are visually unchanged.
- [ ] No hex literals remain in any SCSS module that was listed in the files table (verify with `grep -rn "#[0-9a-fA-F]\{3,6\}" src/layout src/components/common --include="*.scss"`).

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| `@use` alias resolution fails at build time | Confirmed in Phase 00 step 5; fallback is `includePaths` + relative `@use 'styles/tokens'`. |
| `next/font/google` variable not applied — font does not change | Confirm `className={poppins.variable}` is on `<html>` and `font-family: var(--font-poppins)` is in `globals.css`. |
| Per-user `backgroundImage` inline style hides the gradient | Handled in step 6 based on Phase 00 decision. Do not leave it unresolved. |
| White text on `#5BC2A7` card header fails WCAG AA (1.98:1 contrast) | Use `$color-card-header-text: #00192C` (dark) per the token defined in step 1. Confirm with design that dark text on green header is acceptable. |
| Poppins font fails to load in CI or harness environment (network-isolated) | The harness runs `npm run dev` locally; Poppins loads from Google Fonts. If CI is network-isolated, add `display: 'block'` to `Poppins()` config or self-host. |
| `MatchInput` state colors accidentally overwritten | Gameplay semantic tokens (`$color-correct`, `$color-winner`, `$color-wrong`) are defined separately and must not be renamed or reassigned. |

---

## Commands

```sh
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests (no DB required)
npm test

# Visual baseline — run after all changes are in place
npm run harness:baseline

# Visual check — run twice; hashes must match
npm run harness:check
npm run harness:check

# Full build
npm run build

# Quick scan for remaining hex literals in styled files
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}" src/layout src/components/common --include="*.scss"
```

---

## What Must NOT Change

- Any `.tsx` component logic, props, event handlers, or JSX structure.
- Any API route, data-fetching hook, or Prisma query.
- Gameplay semantic color values (`#309e3a`, `#0093dd`, `#f9aa51`) — these must survive the rebrand as distinct tokens.
- The accent yellow `#FFCA30` / `#ffca30` — already matches the Figma value; update to use the token but do not alter the hex.
- `src/components/view/Winners.tsx` — god-file, out of scope. Do not import tokens into it.
- `src/utils/raw.ts`, `src/utils/points.ts`, `src/utils/queries.ts` — no styling logic; do not touch.
- Prisma schema.
- Existing harness route list in `harness/routes.ts` (the `finals` route was added in Phase 00; do not remove it).
