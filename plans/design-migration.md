# Prode UI Design Migration Plan

Status: Planning only. No code changes are proposed for execution yet. This document is the deliverable.

Author context: synthesized from a direct codebase audit plus five focused reviews (frontend architecture, design-system consistency, accessibility, mobile responsiveness, and effort/risk).

Figma source file: `GJUFzuOp1X2y4JC6jHRM0U` (Prode). Four desktop frames reviewed: Presentation/Login (`2005:13607`), Group Stage #1 / Join a group (`2019:29056`), Group Stage #2 / Create new prode (`2010:32154`), Group Stage #3 / Group predictions + standings (`2010:41841`).

---

## 1. Executive Summary

This is a rebrand and restyle, not a rebuild. The four Figma screens replace the current "Lenio Prode / Qatar 2022" visual identity with an "Improving / FIFA World Cup 2026" identity: a new blue-to-dark gradient palette, the Poppins typeface, green-headed white cards, and an Improving footer logo. The existing routes, data fetching, session gating, scoring inputs, and component structure are sound and should be preserved. The work is concentrated in styling and a small number of markup and asset changes.

The single most important technical fact: the codebase styles with **SCSS Modules** (45 `*.module.scss` files) and **Source Sans Pro**. It does **not** use Tailwind. The repository's `AGENTS.md` / `CLAUDE.md` describe a Tailwind 4 / Next 16 / Prisma 7 target that has not landed. My recommendation is to perform this migration in SCSS Modules in place and leave the Tailwind conversion to its own future migration. Mixing a framework swap into this rebrand would add high risk with no user-visible benefit.

The highest-leverage preparatory step is introducing a centralized token layer (`src/styles/_tokens.scss`). Today every color is a raw hex literal duplicated across dozens of files, so the rebrand surface is roughly 47 color assignments across 18+ files. A token file converts each subsequent change into a one-line substitution and prevents drift.

Three findings need decisions before parts of the work can start:
1. The create-prode form in Figma shows a fourth scoring field, "Puntos por podio", that does not exist in the current schema or form. If it is a genuinely new field this escalates from a UI restyle to a backend change.
2. The Figma frames are desktop-only (1512px). The group-stage screen in particular has no mobile design, and its two-pane layout does not reflow acceptably to phones without a UX decision.
3. The new green card header with white text fails WCAG AA contrast (1.98:1). The design needs a darker header text or a darker header fill.

Estimated effort with no surprises: **11 to 18 working days**, rising to **15 to 22 days** if the "podio" field becomes a schema change. The group-stage screen is the largest single item (XL).

---

## 2. Verified Current State

| Area | Reality | Note |
|---|---|---|
| Framework | Next.js 15.5, App Router (`src/app/`), React 19 | `AGENTS.md` claims Next 16; not true |
| ORM | Prisma 6.19, client at `src/generated/prisma` | `AGENTS.md` claims Prisma 7; not true |
| Styling | SCSS Modules, 45 `*.module.scss`, `className()` helper at `src/utils/classname.ts` | `AGENTS.md` claims Tailwind 4; not installed (no config, not in `package.json`) |
| Font | Source Sans Pro via Google Fonts `@import` in `src/styles/globals.css:1` | Target is Poppins |
| Data | TanStack Query 5 hitting `/api/*-page-data` route handlers | Unaffected by restyle |
| Tokens | None. Zero SCSS variables, zero CSS custom properties. All colors hardcoded | Primary blocker to a clean rebrand |
| Visual tests | `harness:baseline` / `harness:check` screenshot 6 routes and diff via SHA-256 (no tolerance) | Every restyle breaks baselines; re-baselining is mandatory |

Implicit current palette (to be replaced): dark navy `#1f2740` (15+ uses), slate `#233042` (11 uses), `#354156`, `#3b4871`, accent `#ffca30` (kept), table/section lavender `#cbd2e9`, card body `#f6f5f5cc`. The score-state semantic colors `#309e3a` (exact), `#0093dd` (winner), `#f9aa51` (wrong) are gameplay semantics, not brand colors, and should survive the rebrand as separate tokens.

Target palette (from Figma named styles): Improving Blue `#005596`, Light Blue `#4597D3`, Green `#5BC2A7`, accent yellow `#FFCA30` / `#F5BB41`, dark navy `#00192C` / `#112632`, neutral gray `#A7A8A9`. Page background is a blue-to-dark vertical gradient; footer is a horizontal `#4597D3 → #5BC2A7` bar.

---

## 3. Screen-by-Screen Mapping (Current → Figma)

### Screen 1: Presentation / Login (`2005:13607`)

Current route: `src/app/(auth)/login/page.tsx` (and an identical duplicate at `src/app/page.tsx`).
Supporting components: `src/components/view/Index/Register.tsx`, `LeniCamel.tsx`; `src/components/common/{RegisterButton, PageLogo, HomeTitle, BrandLogo}`.

| Current | Figma target |
|---|---|
| `<Image src="/qatar.png">`, alt "Qatar Logo" | FIFA 2026 trophy "26" logo |
| `<HomeTitle>Lenio Prode</HomeTitle>` (48px, `#354156` bg, yellow offset shadow) | "Prode" 80px Poppins Bold, white, on gradient, plus "(SPORTS LOTTERY)" subtitle |
| `<Register>` rendering up to three OAuth provider tiles (Google, GitHub, Microsoft) | A "Login" divider, then a single white "Sign In with Google" button |
| `<LeniCamel>` Qatar camel art | Removed; not present in design |
| `<BrandLogo>` animated Leniolabs SVG in footer | Improving logo image |
| Static PNG background | Blue-to-dark gradient |

Open question: does the login screen keep all current providers or only Google? The Figma shows Google only.

### Screen 2: Join a group / Rooms list (`2019:29056`)

Current route: `src/app/rooms/page.tsx`.
Supporting components: `src/components/common/Table`, `src/layout/Card`, `PasswordModal`, `Button`, header.

| Current | Figma target |
|---|---|
| Card with dark `#1f2740` title bar, `#f6f5f5cc` body, no radius/shadow | White body, green `#5BC2A7` header "Unite a un grupo", 8px radius, soft shadow |
| Table: name, players, member?, action; lavender header | Name, members (icon + count), edit pencil, "Entrar" button; locked rows show a lock icon and disabled "Entrar" |
| "Create" buttons in header | Prominent yellow `#F5BB41` "Crea Nuevo Prode" CTA above the card, with an "o" divider |
| Solid dark footer | Gradient footer bar with Improving logo |
| Top header welcome message | Header bar: trophy icon, "Bienvenidos al Prode!", deadline line with yellow-highlighted date |

### Screen 3: Create new prode (`2010:32154`)

Current route: `src/app/new-prode/page.tsx`.
Supporting components: `src/components/common/Form/*`, `Toggle`, `Card`, `Button`.

| Current | Figma target |
|---|---|
| Card with dark title bar | White card, green `#5BC2A7` "Crear nuevo prode" header |
| Sections: General (name, password, email-domain, public toggle), Puntajes (winner, goals, penalties) | General (name, password optional, "Mi prode es público" No/Si toggle), Puntajes (ganador de partido, goles, penales, **podio**) |
| `Toggle` off-state muted red `#cd5367`, on `#69b29a` | Neutral gray off, green on |
| Single Create button in footer | "Cancelar" outlined + "Guardar" filled `#4597D3` |
| Inputs: 1px `#1f274050`, no radius | 1px `#A7A8A9`, 8px radius; labels `#005596` Poppins Medium 18px |

Mismatches to resolve: the current form has an `emailDomain` field not shown in Figma, and Figma adds a "podio" point field absent from the schema. Figma also shows explicit Cancel/Save buttons versus the current single Create.

### Screen 4: Group predictions + standings (`2010:41841`)

Current route: `src/app/(room)/[id]/groups/page.tsx`.
Supporting components: `src/components/view/Groups/*` (`GroupsContainer`, `CardsContainer`, `GroupsRankingContainer`, `LeniCard`), `MatchInput`, `Table`, `ContainerHeader`, `Header`.

| Current | Figma target |
|---|---|
| CSS grid: header, "following" (today/next), match cards, ranking. Two-pane only at 1300px+ | Left: 3-column grid of group cards. Right: ~465px "Tabla de posiciones" panel with Posición / Jugador / Puntos, avatars, position dots |
| Cross-route `<Button>` links to `/groups` and `/finals` in header | "Fase de grupos / Fase final" tab strip in the page body, with a points/position indicator chip |
| `<LeniCard>` decorative SVG (594 lines) in the grid | Removed or replaced by a 2026-appropriate decorative element |
| `ContainerHeader` title + sticky save bar | Welcome header bar with trophy and deadline; "Ir a mi Prode" button |
| Match score inputs colored by result state | Same logic; colors remapped to new palette |

This screen carries the most structural change: a new tab component and the removal of `LeniCard`.

---

## 4. Required Component Changes (restyle in place)

These keep their markup and logic; only SCSS values change. Cite paths for execution.

- `src/styles/globals.css`: swap Source Sans Pro `@import` for Poppins (weights 400/500/600/700), update `body` font-family. Reconsider the `@media (prefers-color-scheme: dark)` block (see R3).
- `src/layout/Layout/Layout.module.scss`: replace static PNG background with the brand gradient.
- `src/layout/Header/Header.module.scss` and `src/components/common/Header/DesktopHeader|MobileHeader`: dark `#1F2740CC` to Improving blue gradient.
- `src/layout/Footer/Footer.module.scss`: solid dark to horizontal `#4597D3 → #5BC2A7`, centered Improving logo.
- `src/layout/Card/Card.module.scss`: white body, green header bar, 8px radius, `0px 9px 28px rgba(0,0,0,0.05)` shadow.
- `src/layout/ContainerHeader/ContainerHeader.module.scss`: retitle bar colors; review the `SECONDARY` uppercase variant (likely WC-2022 era, may be removable).
- `src/components/common/Button/Button.module.scss`: add 8px radius; primary `#4597D3`, CTA `#F5BB41` with `#00192C` text, secondary outlined, disabled `#A7A8A9`.
- `src/components/common/Table/Table.module.scss`: header and stripe colors; reduce 20px cell font for mobile.
- `src/components/common/Form/Form.module.scss`: section title bg, input border `#A7A8A9` + 8px radius, label color `#005596`.
- `src/components/common/Toggle/Toggle.module.scss`: off neutral gray, on green.
- `src/components/common/Modal/Modal.module.scss` and `PasswordModal`: header color, 8px radius, shadow.
- `src/components/common/MatchInput/MatchInput.module.scss`: remap state colors to the new palette while keeping the three-state semantics.
- `src/components/view/Groups/Groups.module.scss`: indicator colors; remove the `leniCard` grid rule once the component is removed.
- `src/components/common/HomeTitle/HomeTitle.module.scss`: 80px, white, gradient-friendly (this component may instead be replaced outright on the login screen).

### Markup or structural changes (not purely SCSS)

- `src/app/(auth)/login/page.tsx` + `src/app/page.tsx`: swap trophy asset and alt text, change title text, add subtitle, remove `<LeniCamel>`, adjust `<Register>` to the Google-only button if confirmed. The two files are byte-identical today; resolve the duplication or apply both.
- `src/components/common/BrandLogo/BrandLogo.tsx`: replace the animated Leniolabs SVG with the Improving logo image (used in every footer).
- `src/app/(room)/[id]/groups/page.tsx` and `[id]/view/page.tsx`: remove `<LeniCard>`.
- `Layout` call sites (`rooms`, `new-prode`, groups, view): the per-user `backgroundImage` prop overrides the SCSS background via inline style. After switching to a gradient, remove or gate this prop so it does not hide the new background (see R4).
- `src/app/new-prode/page.tsx`: add Cancel/Save footer; reconcile `emailDomain` and the "podio" field (pending decision).

---

## 5. New Components to Create

1. **TabBar** (`src/components/common/TabBar/`): the "Fase de grupos / Fase final" tab strip shown in the group-stage body, including the points/position indicator chip. Today these are cross-route header buttons; the design promotes them to in-body tabs. This is the only genuinely net-new UI primitive.
2. **Group-stage standings access on mobile** (component or pattern): a tab/toggle or sticky "your position" chip so the standings are reachable without scrolling past all group cards on phones. Required because no mobile design exists and the current DOM order is unusable on small screens. Scope depends on the design decision in Open Questions.
3. **Welcome header content block** (may be a restyle of `ContainerHeader` rather than new): trophy icon plus deadline copy with a highlighted date.

A replacement decorative asset for `LeniCard` (and possibly `LeniBall` in the header) is an asset decision, not necessarily a new component.

---

## 6. Components That Can Be Reused

- **Data and state**: all `useQuery` page-data fetching, `useRequireSession` gating, `useLocalizedText`, routing, the score-input handlers in the groups page, and the create-form validation are independent of styling and stay untouched.
- **Layout primitives**: `Layout`, `Container`, `Card`, `Footer`, `Header`, `ContainerHeader` keep their structure; only SCSS changes.
- **Responsive shell**: `DesktopHeader` / `MobileHeader` swap cleanly at 1024px and need no structural change. The mobile full-screen menu overlay works as-is.
- **Table**: the `hideInMobile` column mechanism is reusable for the rooms list; new columns (edit icon, member icon) just set `hideInMobile`.
- **Form**: `FormSection` already stacks two columns to one below 1024px.
- **Toggle, Modal, PasswordModal**: structurally match the Figma patterns; restyle only (with a11y caveats below).
- **MatchInput**: logic and result-state model unchanged; recolor only.

`Winners.tsx` (~1849 lines) and `queries.ts` are not in scope and are decoupled from these screens; do not touch them.

---

## 7. Dependencies and Blockers

Blocked until Figma assets are exported and dropped into `public/`:
- FIFA 2026 trophy image (replaces `/qatar.png`).
- Improving logo, light and dark variants (replaces `BrandLogo`, also referenced by `Meta.tsx`, `share.ts`, and the story/video API routes).
- Replacement or removal decision for the `LeniCard` and `LeniBall` decorative SVGs.
- Exact gradient stops for the page background and the footer bar.

Decision blockers:
- "Puntos por podio": rename of `pointsPenal`, a new schema column, or out of scope (gates the create-prode screen).
- Per-user background customization (`User.background`, three PNGs): retain or replace with the fixed gradient.
- Login providers: Google-only or keep GitHub/Microsoft.
- Mobile frames: are any provided, especially for the group-stage screen.

Non-blockers:
- Poppins is free on Google Fonts; no licensing concern. Prefer `next/font/google` in `src/app/layout.tsx` over an `@import`.

Legal:
- FIFA World Cup 2026 trademark and trophy imagery usage should be cleared against the client/Improving agreement before shipping the rebrand. This is a stakeholder sign-off, not an engineering task.

---

## 8. Risk Register

Ranked by likelihood times impact.

| ID | Risk | L×I | Mitigation |
|---|---|---|---|
| R1 | Visual-regression harness breaks on every screen (SHA-256, no tolerance). | Certain × High | Treat re-baselining as a deliberate commit step in each PR: change, `npm run harness:baseline`, commit PNGs. Batch the largest baseline churn (font + tokens) into one PR. |
| R2 | SCSS-vs-Tailwind tension: docs target Tailwind, code is SCSS. | High × Med | Do the rebrand in SCSS in place. Do not install Tailwind as part of this work. Leave the Tailwind conversion to its own migration. |
| R3 | `globals.css` `prefers-color-scheme: dark` sets `body { background:black }`, overriding the new gradient for dark-mode OS users. | High × Med | Remove the media query or set `color-scheme: only light` on `<html>`. Confirm Figma has no dark variant. |
| R4 | Per-user `backgroundImage` inline prop hides the new gradient. `User.dark` is plumbed but unused. | High × Low-Med | Decide retain vs remove. If removing, drop the prop at Layout call sites; optionally clean schema later. |
| R5 | FIFA marks/trophy licensing. | Med × High | Stakeholder sign-off before launch. |
| R6 | God-file `Winners.tsx` could regress from shared component changes; its `finals.png` baseline exists but `finals` is not in the live harness routes. | Low × Med | Add the finals route to the harness before starting, so shared-component changes are caught. |
| R7 | "Podio" field may require schema + scoring changes in both `points.ts` and `raw.ts` (Landmine #1) and `/api/create`. | Confirmed mismatch × Low-Med | Resolve the question first; if it is a new field, scope it as a separate backend task. |
| R8 | Missing mobile designs, especially group-stage standings reachability. | Unknown × Med | Request mobile frames; if unavailable, agree a documented fallback (tab/toggle) before building. |
| R9 | Contrast failures from the new palette: white on green card header is 1.98:1 (fail), Google button text ~4.48:1 (borderline), 50%-opacity form legend ~2.97:1 (fail). | High × Med | Use dark text or darker fill on green headers; use `#00192C` on green; tune legend/date grays to >=4.5:1. |
| R10 | Many interactive elements are `<div onClick>` (RegisterButton, ButtonIcon, Toggle, header menus). Restyle is a natural moment to fix, but scope can creep. | Med × Med | Fix semantics opportunistically per screen; track separately from pure restyle so it does not block the rebrand. |

---

## 9. Accessibility Notes Carried Into the Migration

The redesign is a good moment to close existing gaps, sized here so they can be scheduled deliberately rather than absorbed silently.

Must-fix to reach WCAG AA (sizes in parentheses):
- Replace `<div onClick>` with real `<button>` across `RegisterButton`, `ButtonIcon`, `Toggle`, `HeaderMenu`, mobile hamburger and close (M).
- `Modal` needs `role="dialog"`, `aria-modal`, labelled-by, focus-on-open, focus trap, Escape-to-close (M). Note: a future Radix migration would supply this; coordinate to avoid duplicate effort.
- `FormInput` must associate labels via `htmlFor`/`id`; error element should be `role="alert"`, not a bare `<label>` (S).
- `Toggle` needs `role="switch"` + `aria-checked` (S).
- `PageLogo` link needs an `aria-label`; `CountryFlag` images need `alt`; `UserImage` in the ranking needs a real `alt` (S).
- `Table` `<th>` cells need `scope="col"`; clickable rows need keyboard support (S).
- Fix the contrast pairs in R9 (S, design-side).

These map cleanly onto the screens: form fixes land with Screen 3, table and ranking fixes with Screens 2 and 4, OAuth/modal fixes with Screens 1 and 2.

---

## 10. Mobile Responsiveness Notes

Existing breakpoints in SCSS: 400px, 512px, 600px, 800px, 1024px (the dominant flip), 1300px (group-stage two-pane). The app already handles mobile via media queries, a mobile header, and `hideInMobile` table columns.

Per screen:
- Login (S): already a centered column. Express the 396px content width as `max-width` + `width:90%`; guard `HomeTitle` against overflow on very narrow phones.
- Rooms (S-M): `hideInMobile` works, but the action column's hardcoded `250px` width will overflow on phones, and 20px table text is large. Make the action column fluid and reduce mobile font.
- Create-prode (S): two-column to one-column stacking already works; add the ~721px `max-width` cap and trim padding below 600px.
- Group-stage (L, riskiest): the standings only sit beside the cards at 1300px+. Below that the user must scroll past ~36 match inputs to reach standings. Recommend a tab/toggle between Predictions and Standings on mobile (both already in the DOM; toggle visibility), or a sticky "your position" chip.

The central technical caution: do not translate Figma's absolute pixel widths (1512px frames, 758px logo, 465px panel, `position:absolute` offsets) into CSS literally. Express them as `max-width` constraints with `width:100%` at mobile and `fr`/`%` grid units, matching the existing fluid approach.

---

## 11. Effort Estimation

| Item | Size | Days |
|---|---|---|
| Phase 0 prerequisites (assets, token scaffold, decisions) | S | 0.5-1 |
| Phase 1 token values + Poppins + dark-mode resolution + re-baseline | M | 1-1.5 |
| Screen 1 Login/Landing | M | 1.5-2 |
| Screen 2 Rooms | M | 1.5-2 |
| Screen 3 Create-prode (restyle only) | S-M | 1-2 |
| Screen 4 Group-stage + standings + TabBar | XL | 5-7 |
| Accessibility must-fixes (distributed) | M | included per screen, +1-2 buffer |
| "Podio" field, if it becomes a schema change | adds | +4 |

Total: **11-18 days** nominal, **15-22 days** if "podio" is a new backend field. The group-stage screen dominates and should be planned with its mobile UX decision resolved first.

---

## 12. Prioritized Implementation Phases

Prioritization weighs user impact, risk, reusability, and complexity. The token layer and font come first because they are the highest reusability and lowest risk, and every screen depends on them. The group-stage screen comes last because it has the most structure and an unresolved mobile decision.

**Phase 0 — Prerequisites (unblock everything).** Export Figma assets into `public/`. Resolve the four decision blockers (podio, per-user background, providers, mobile frames). Create `src/styles/_tokens.scss` and wire `@use` into the modules, without yet changing values. Add the finals route to the harness (R6). Confirm Sass path-alias support for `@use` in `next.config.js`.

**Phase 1 — Token layer + typography (highest leverage, lowest risk).** Set the new palette values in `_tokens.scss`. Swap to Poppins. Resolve dark mode (R3). Re-baseline all six harness routes in one commit, isolating the largest baseline churn here. After this phase, all screens already render with correct colors and font.

**Phase 2 — Login / Landing.** Trophy asset and alt text, title and subtitle, remove `<LeniCamel>`, Google-button decision, `BrandLogo` to Improving. Resolve the `/` vs `/login` duplication. OAuth and modal a11y fixes. Re-baseline `login.png`, `index.png`.

**Phase 3 — Rooms list.** Card header, footer gradient, table restyle and mobile font/width fixes, CTA button, header welcome bar. Table and row a11y. Re-baseline `rooms.png`.

**Phase 4 — Create-prode.** Form restyle, Toggle recolor, Cancel/Save footer, input radius and label colors. Form a11y (labels, error roles, switch). If "podio" is confirmed as a new field, branch a separate backend task (schema, `points.ts` + `raw.ts`, `/api/create`). Re-baseline (and `admin.png` if shared).

**Phase 5 — Group-stage + standings (largest).** Build `TabBar`, remove `LeniCard`, recolor indicators and `MatchInput`, welcome header with trophy and deadline, validate the grid at every breakpoint, and implement the agreed mobile standings pattern. Ranking and clickable-row a11y. Re-baseline `id_view.png`, `id_ranking.png`.

Sequencing rationale: Phases 0-1 are shared infrastructure that de-risk everything downstream and deliver immediate visible value. Phases 2-3 are quick, high-visibility wins on simple layouts. Phase 4 is contained but may fork on the podio decision. Phase 5 is deferred to last so its complexity and mobile-design dependency do not block the rest.

---

## 13. Assumptions and Open Questions

Assumptions made in this plan:
- The migration stays on SCSS Modules; Tailwind is out of scope.
- Score-state colors (`#309e3a` / `#0093dd` / `#f9aa51`) are retained as gameplay semantics, distinct from brand tokens.
- The accent yellow `#ffca30` already in code matches the Figma `#FFCA30` and needs no change.
- Existing routes, APIs, and data flow are unchanged by the restyle.

Open questions to send to design and product:
1. Login: Google-only, or keep GitHub and Microsoft?
2. Create-prode: is "Puntos por podio" a new scoring field, a rename of penalties, or out of scope? And is the current `emailDomain` field removed in the new design?
3. Per-user backgrounds (`User.background`, three PNGs): retain or replace with the fixed gradient?
4. Dark mode: is there a dark variant, or should the `prefers-color-scheme` block be removed?
5. Mobile frames: are designs available for all four screens, and specifically how should the group-stage standings appear on phones (tab, toggle, sticky chip)?
6. Card grid columns per breakpoint (Figma shows 3 on desktop): 2 or 3 at tablet, 1 or 2 on phone?
7. Green card header text: confirm dark text or a darker fill to meet contrast (white on `#5BC2A7` fails AA).
8. Tab navigation: should the in-body "Fase de grupos / Fase final" tabs replace the current header links, or coexist?
9. Decorative assets: what replaces `LeniCard` and `LeniBall` for 2026?
10. The `/` and `/login` routes are byte-identical; should one be a redirect?
