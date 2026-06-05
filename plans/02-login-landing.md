# Plan 02: Login / Landing Screen

Status: Ready to execute after Plan 01 is complete.

Depends on: Plan 01 (brand tokens and Poppins in place). Also depends on Phase 00 login-providers decision (Google-only vs keep GitHub/Microsoft).

---

## Goal

Restyle the login / landing screen to match the Figma "Presentation" frame (`2005:13607`): swap the Qatar trophy for the FIFA 2026 asset, update the title and subtitle copy, remove the `<LeniCamel>` component, swap `<BrandLogo>` to the Improving logo, and apply any provider changes from the Phase 00 decision. Resolve the `/` vs `/login` route duplication. Fix the most critical accessibility gaps on this screen.

---

## Files Likely Affected

| File | Change |
|---|---|
| `src/app/(auth)/login/page.tsx` | Trophy asset, title text, subtitle addition, remove `<LeniCamel>`, provider button decision |
| `src/app/page.tsx` | Identical to `login/page.tsx` — resolve the duplication (redirect or merge) |
| `src/components/common/BrandLogo/BrandLogo.tsx` | Replace animated Leniolabs SVG with Improving logo `<Image>` |
| `src/components/common/BrandLogo/BrandLogo.module.scss` | Sizing; already updated with tokens in Phase 01 |
| `src/components/common/HomeTitle/HomeTitle.tsx` | Update font size (80px), remove background styling, apply white text token |
| `src/components/common/HomeTitle/HomeTitle.module.scss` | Size, color — already token-wired in Phase 01; confirm values |
| `src/components/view/Index/Register.tsx` | Provider button list, Google-button layout; `<div onClick>` → `<button>` fix |
| `src/components/common/RegisterButton/RegisterButton.tsx` | Semantic fix: `<div>` → `<button>` |
| `src/components/common/RegisterButton/RegisterButton.module.scss` | Style the new button element |
| `src/components/common/PageLogo/PageLogo.tsx` | Swap `/qatar.png` for `/wc2026-trophy.png`; fix the `aria-label` on the wrapping link |
| `src/components/common/LeniCamel/` | Verify this component is no longer rendered; leave the file unless a separate cleanup task is scoped |

---

## Step-by-Step Checklist

### 1. Resolve the `/` vs `/login` route duplication

`src/app/page.tsx` and `src/app/(auth)/login/page.tsx` are byte-identical. This means every change has to be applied twice, and they can drift silently.

- [ ] Decide on the canonical route. Recommended: make `/` redirect to `/login` since Auth.js and `useRequireSession` already redirect unauthenticated users there, and the Figma names the screen "Login".
- [ ] In `src/app/page.tsx`, replace the full page component with a redirect:
  ```tsx
  import { redirect } from 'next/navigation';
  export default function RootPage() {
    redirect('/login');
  }
  ```
- [ ] Apply all remaining changes in this phase only to `src/app/(auth)/login/page.tsx`.
- [ ] Verify that navigating to `/` in the browser redirects to `/login` correctly.

### 2. Swap the trophy asset

- [ ] In `src/components/common/PageLogo/PageLogo.tsx`: change the `<Image>` `src` from `/qatar.png` to `/wc2026-trophy.png` (or whatever filename was exported in Phase 00).
- [ ] Update the `alt` text from `"Qatar Logo"` to `"FIFA World Cup 2026"`.
- [ ] If the `<PageLogo>` component wraps the image in a `<Link>` or `<a>`, add `aria-label="Home"` to that anchor (accessibility fix from the migration plan).
- [ ] Confirm the image renders at the correct size. The Figma shows the trophy as a large centered hero element. Adjust the `width`/`height` props or CSS accordingly.

### 3. Update the title and subtitle

The Figma shows "Prode" at 80px Poppins Bold in white, plus a smaller subtitle "(SPORTS LOTTERY)" below it.

- [ ] In `src/app/(auth)/login/page.tsx`: change the `<HomeTitle>` text content from `"Lenio Prode"` to `"Prode"`.
- [ ] Add a subtitle element below `<HomeTitle>`:
  ```tsx
  <p className={styles.subtitle}>(SPORTS LOTTERY)</p>
  ```
  Add a `.subtitle` rule to the login page's SCSS or to `HomeTitle.module.scss` using the `$color-neutral-gray` or white token for the text.
- [ ] In `src/components/common/HomeTitle/HomeTitle.module.scss`: confirm `font-size` is `80px`, `color: white`, and `font-weight: 700`. These should already be set via tokens from Phase 01; verify the token values are correct.

### 4. Remove `<LeniCamel>`

- [ ] In `src/app/(auth)/login/page.tsx`: remove the `<LeniCamel />` JSX and its import statement.
- [ ] Do not delete `src/components/common/LeniCamel/` yet — removing files is a separate cleanup task. Simply stop rendering it.

### 5. Swap `<BrandLogo>` to Improving logo

`<BrandLogo>` renders the animated Leniolabs SVG and appears in every footer.

- [ ] Open `src/components/common/BrandLogo/BrandLogo.tsx`.
- [ ] Replace the SVG animation with:
  ```tsx
  import Image from 'next/image';
  export function BrandLogo() {
    return (
      <Image
        src="/improving-logo-light.svg"
        alt="Improving"
        width={120}
        height={40}
      />
    );
  }
  ```
  Adjust `width` and `height` to match the Figma footer proportions. Use the light (white) variant since footers use the gradient dark background.
- [ ] Remove the old SVG markup and any animation CSS from `BrandLogo.module.scss`.
- [ ] This change affects every page's footer (rooms, new-prode, groups, etc.) — intentional; all footers should update simultaneously.

### 6. Apply provider decision

Based on the Phase 00 decision:

- [ ] **If Google-only**: In `src/components/view/Index/Register.tsx`, remove the GitHub and Microsoft provider buttons. Keep only the Google sign-in button. Verify the `auth.config.ts` or `auth.ts` still lists GitHub/Microsoft as providers (do not remove providers from the Auth.js config — only the UI button is removed).
- [ ] **If keeping all providers**: No change to the provider list. Update the button styling to match the Figma's white card button style with provider icon + label.

### 7. Fix `<RegisterButton>` semantics (`<div>` → `<button>`)

`RegisterButton` renders a `<div>` with an `onClick`. This is not keyboard-accessible.

- [ ] In `src/components/common/RegisterButton/RegisterButton.tsx`: change the root element from `<div>` to `<button>` (or `<button type="button">`).
- [ ] Remove any `onClick` assigned to a `<div>` and keep it on the `<button>`.
- [ ] In `RegisterButton.module.scss`: remove `cursor: pointer` if it was on the div (buttons handle this natively); reset button default styles: `background: none; border: none; padding: 0; font: inherit;` then apply the visual styles.
- [ ] Verify the button still shows the provider icon and label correctly.

### 8. Update the login screen layout

The Figma shows a centered column with the gradient background visible (no card wrapper around the login content).

- [ ] Confirm `src/app/(auth)/login/page.tsx` renders `<Layout>` without a `backgroundImage` prop (so the Phase 01 gradient shows).
- [ ] If there is a `backgroundImage` prop being passed: remove it from this page.
- [ ] Verify the login content (trophy, title, subtitle, buttons) is centered on the gradient. No structural changes to `<Container>` or `<Layout>` are needed beyond removing the prop.

### 9. Re-baseline affected routes

- [ ] Run `npm run harness:baseline` to capture `index.png` and `login.png` with the new look.
- [ ] Run `npm run harness:check` twice to confirm stability.
- [ ] Commit the baseline PNGs alongside the component changes.

---

## Acceptance Criteria

- [ ] Navigating to `/` redirects to `/login`.
- [ ] `/login` renders the FIFA 2026 trophy image with correct alt text.
- [ ] Title reads "Prode" at 80px Poppins Bold, white.
- [ ] Subtitle "(SPORTS LOTTERY)" appears below the title.
- [ ] `<LeniCamel>` is not rendered.
- [ ] Footer shows the Improving logo (not the Leniolabs SVG) on all pages.
- [ ] OAuth buttons are `<button>` elements (not `<div>`); they are focusable with Tab and activatable with Enter/Space.
- [ ] Page background shows the brand gradient (no PNG background visible).
- [ ] `npm run build` passes; `npm run lint` passes; `npm test` passes.
- [ ] `npm run harness:check` passes.

---

## Risks / Blockers

| Risk | Mitigation |
|---|---|
| Phase 00 login-providers decision not yet made | The provider list change (step 6) is blocked; complete steps 1–5 and 7–9 first, then apply step 6 once decided. |
| `/` redirect breaks the harness `landing` route (auth: "public") | The harness captures `/` which will now be a server redirect. Playwright follows redirects by default; `index.png` will capture the login page. Verify the harness captures something useful; update the `landing` route spec's `fileName` to `login.png` or keep separate if both are needed. |
| `BrandLogo` change affects all footers simultaneously | This is intentional and desired. Confirm that no other page has a dark-on-dark logo issue (e.g., if any page has a white background footer, the light logo variant won't be visible). Check the Figma for pages with white backgrounds. |
| `HomeTitle` at 80px overflows on narrow phones | Add `word-break: break-word` and `max-width: 90vw` to `HomeTitle.module.scss` as a safeguard. |
| The Improving logo SVG uses `currentColor` or hardcoded dark fills | Test in the browser on the gradient background; if the logo is invisible, use the explicit white/light export from Figma. |

---

## Commands

```sh
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Unit tests
npm test

# Visual baseline
npm run harness:baseline

# Visual check (run twice)
npm run harness:check
npm run harness:check

# Verify the /login route renders (quick smoke test)
npm run dev
# then open http://localhost:3000/login in a browser
```

---

## What Must NOT Change

- Auth.js provider configuration in `src/auth.ts` or `auth.config.ts` — do not remove providers from the config, only from the UI if the decision is Google-only.
- `useRequireSession` logic — the session gating and redirect behavior are unchanged.
- `src/components/view/Index/Register.tsx` data fetching (if any) — only UI markup and provider list.
- All API routes.
- `src/components/common/LeniCamel/` directory and files — not deleted in this phase.
- `public/qatar.png` — not deleted in this phase; keep it to avoid 404s from any routes that still reference it.
- Gameplay and scoring components.
- `harness/routes.ts` — already updated in Phase 00.
