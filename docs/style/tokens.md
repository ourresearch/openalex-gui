# Design Tokens

Single source of truth for color, type, spacing, radii, elevation, and motion in
openalex-gui. Tokens are framework-agnostic; the Vuetify v3 theme (Phase 5)
consumes them via CSS custom properties.

**Light mode only.** Dark mode is out of scope for this guide.

**Inspiration:** Linear (light mode), retuned for OpenAlex (pure-neutral grays,
black accent, no indigo). See `EXPLORE.md` of oxjobs #249 for the raw extraction
from the live Linear app.

> If you are writing or reviewing component code: **never hardcode colors,
> font-sizes, spacings, radii, shadows, or transitions.** Reach for a token. If
> the token you need does not exist, propose it here first — do not invent a
> one-off value in a `<style>` block.

---

## Color

OpenAlex's palette is built from **pure neutrals (chroma 0)** plus a single
**black accent**. Linear's signature cool-indigo tint on neutrals is dropped to
keep our brand crisp.

### Background layers

| Token | Value | Use |
|-------|-------|-----|
| `--ox-bg-base` | `#ffffff` | App canvas / content panel background |
| `--ox-bg-subtle` | `#fafafa` | Subtle alternate surface (sidebar) |
| `--ox-bg-muted` | `#f5f5f5` | Muted surface (hover row, code block bg) |
| `--ox-bg-emphasis` | `#ebebeb` | Pressed / selected row |
| `--ox-bg-inverse` | `#0a0a0a` | Inverse panel (used sparingly, e.g. tooltip) |

### Text tiers

Text colors are pure grays. Use the strongest tier that meets contrast for the
surface.

| Token | Value | Approx use | Min contrast on `--ox-bg-base` |
|-------|-------|------------|--------------------------------|
| `--ox-text-primary` | `#171717` | Body, page titles, primary labels | 16.2 : 1 (AAA) |
| `--ox-text-secondary` | `#3f3f3f` | Body text on dense surfaces | 10.4 : 1 (AAA) |
| `--ox-text-tertiary` | `#5c5c5c` | Section labels, helper text | 7.3 : 1 (AAA) |
| `--ox-text-muted` | `#8a8a8a` | Hint text, placeholder, disabled icon | 3.4 : 1 (AA large) |
| `--ox-text-disabled` | `#bcbcbc` | Disabled control label | 2.0 : 1 (decorative only) |
| `--ox-text-inverse` | `#ffffff` | Text on `--ox-bg-inverse` and on accent fills | — |

### Borders

| Token | Value | Use |
|-------|-------|-----|
| `--ox-border-subtle` | `#f0f0f0` | Hairline between rows |
| `--ox-border-default` | `#e2e2e2` | Card / control border |
| `--ox-border-strong` | `#d4d4d4` | Active / focused control border |

### Accent (single)

| Token | Value | Use |
|-------|-------|-----|
| `--ox-accent` | `#000000` | Primary buttons, primary text-link active state, focus ring |
| `--ox-accent-on` | `#ffffff` | Foreground on accent fills |
| `--ox-accent-hover` | `#1a1a1a` | Accent hover surface |
| `--ox-accent-active` | `#333333` | Accent pressed surface |

**Rules:**
- Black is the ONLY brand accent. Do not introduce a second.
- Blue (below) is a **utility info color**, not the accent. Reserve it for
  hyperlinks and `info`-tier semantic states. Never use blue for primary action
  buttons.

### Semantic colors

Each semantic role has three slots: a foreground (text/icon), a soft bg, and a
border. Values chosen for AA contrast on white.

| Role | `--ox-...-fg` | `--ox-...-bg` | `--ox-...-border` |
|------|---------------|---------------|-------------------|
| `info` | `#1f6feb` | `#eaf2ff` | `#c5dcfd` |
| `success` | `#1a7f37` | `#e6f7ec` | `#b9e3c6` |
| `warning` | `#9a6700` | `#fff4d6` | `#f5d27c` |
| `danger` | `#cf222e` | `#feeceb` | `#fbc6c2` |

`info` doubles as the **link color** (`<a>` default).

### Entity-category colors (existing palette, kept for parity)

These are *category tints*, not part of the neutral system. Use only on entity
chips, donut segments, and category badges — never on chrome.

| Category | Light | Mid | Dark |
|----------|-------|-----|------|
| works (red) | `#ffebee` | `#ef5350` | `#c62828` |
| authors (blue) | `#e3f2fd` | `#42a5f5` | `#1565c0` |
| sources (green) | `#e8f5e9` | `#66bb6a` | `#2e7d32` |
| institutions (orange) | `#fff3e0` | `#ffa726` | `#ef6c00` |
| concepts (purple) | `#f3e5f5` | `#ab47bc` | `#6a1b9a` |
| topics (teal) | `#e0f2f1` | `#26a69a` | `#00695c` |

(Names match the existing Vuetify Material palette already used in
`src/plugins/vuetify.js`. Phase 5 will wire these via tokens instead of direct
Material refs.)

---

## Type

### Font families

| Token | Value |
|-------|-------|
| `--ox-font-sans` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif` |
| `--ox-font-mono` | `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace` |
| `--ox-font-emoji` | `"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` |

**Inter is self-hosted** under `public/fonts/inter/` (Phase 2). Dosis and Roboto
are removed.

### Type scale

All sizes in `rem` (anchored to `16px` root). All weights are valid Inter
weights.

| Token | Size | Weight | Line-height | Letter-spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `--ox-type-display` | `1.5rem` / 24px | 500 | `1.875rem` / 30px (1.25) | `0` | Page title |
| `--ox-type-h1` | `1.25rem` / 20px | 500 | `1.75rem` / 28px (1.4) | `-0.005em` | Top-level section heading |
| `--ox-type-h2` | `1rem` / 16px | 500 | `1.5rem` / 24px (1.5) | `-0.005em` | Sub-section heading |
| `--ox-type-h3` | `0.9375rem` / 15px | 500 | `1.4375rem` / 23px (1.53) | `-0.005em` | Card title, dialog title |
| `--ox-type-body` | `0.875rem` / 14px | 400 | `1.5rem` / 24px (1.71) | `0` | Default reading text |
| `--ox-type-body-emph` | `0.875rem` / 14px | 500 | `1.5rem` / 24px | `0` | Emphasized body |
| `--ox-type-label` | `0.8125rem` / 13px | 500 | `normal` | `0` | Form labels, nav items, button label |
| `--ox-type-caption` | `0.75rem` / 12px | 500 | `1rem` / 16px | `0` | Helper text, badge, small button |
| `--ox-type-mono` | `0.8125rem` / 13px | 400 | `1.6` | `0` | Code, IDs, hex values |
| `--ox-type-prose` | `0.9375rem` / 15px | 400 | `1.6` | `-0.0067em` | Editor / long-form (abstract, comments) |

**Numeric features (Inter):** turn on tabular nums for tables and data displays:
`font-variant-numeric: tabular-nums slashed-zero;` via class `.ox-numeric-tabular`.

### Weight tokens

| Token | Value |
|-------|-------|
| `--ox-weight-regular` | 400 |
| `--ox-weight-medium` | 500 |
| `--ox-weight-semibold` | 600 |
| `--ox-weight-bold` | 700 |

Default weight is 400; emphasis is 500; we **do not use 600/700 in chrome** — they exist only for editor inline `**bold**` content.

---

## Spacing

Base unit **4px**, allowing 2px half-steps for tight controls. Every spacing
value in components MUST come from this scale.

| Token | Value | Common use |
|-------|-------|------------|
| `--ox-space-0` | `0` | Reset |
| `--ox-space-px` | `1px` | Hairline |
| `--ox-space-0_5` | `2px` | Icon-to-text micro-gap |
| `--ox-space-1` | `4px` | Inline gap |
| `--ox-space-1_5` | `6px` | Small-control x-padding |
| `--ox-space-2` | `8px` | Card padding (compact), chip x-padding |
| `--ox-space-2_5` | `10px` | Row vertical padding |
| `--ox-space-3` | `12px` | Default control x-padding |
| `--ox-space-4` | `16px` | Section gap, card padding (default) |
| `--ox-space-5` | `20px` | Card padding (loose) |
| `--ox-space-6` | `24px` | Stack between sub-sections |
| `--ox-space-8` | `32px` | Stack between sections |
| `--ox-space-10` | `40px` | Page top padding |
| `--ox-space-12` | `48px` | Major section gap |
| `--ox-space-16` | `64px` | Page-level vertical rhythm |

### Control heights (snap-to)

Controls snap to a small height set so different controls align in a row.

| Token | Value | Use |
|-------|-------|-----|
| `--ox-height-xs` | `24px` | Chip, badge |
| `--ox-height-sm` | `28px` | Small button, sidebar nav item |
| `--ox-height-md` | `32px` | Default button, input, select |
| `--ox-height-lg` | `40px` | Search input, large action |
| `--ox-height-xl` | `48px` | Page-level hero input |

### Layout

| Token | Value | Use |
|-------|-------|-----|
| `--ox-sidebar-width` | `232px` | Default sidebar (collapse not in scope) |
| `--ox-topbar-height` | `44px` | App top bar |
| `--ox-content-max` | `1120px` | Centered content container |
| `--ox-prose-max` | `680px` | Long-form reading width (abstract, descriptions) |

### Breakpoints (Vuetify v3 default — kept)

| Name | Range |
|------|-------|
| `xs` | `< 600px` |
| `sm` | `600–960px` |
| `md` | `960–1264px` |
| `lg` | `1264–1904px` |
| `xl` | `> 1904px` |

---

## Radii

| Token | Value | Use |
|-------|-------|-----|
| `--ox-radius-xs` | `4px` | Tag, badge |
| `--ox-radius-sm` | `6px` | Inline block (code, callout) |
| `--ox-radius-md` | `8px` | Default — input, select, button, card |
| `--ox-radius-lg` | `12px` | Modal, large dialog |
| `--ox-radius-pill` | `9999px` | Pill button, status pill |
| `--ox-radius-circle` | `50%` | Avatar, icon-only round button |

---

## Elevation (shadows)

Linear-style: extremely subtle. The visual hierarchy is carried by border + bg
contrast, not by big blur shadows.

| Token | Value | Use |
|-------|-------|-----|
| `--ox-elev-0` | `none` | Flat — most surfaces |
| `--ox-elev-1` | `0 3px 6px -2px rgba(0,0,0,0.02), 0 1px 1px 0 rgba(0,0,0,0.04)` | Buttons, avatars, default cards |
| `--ox-elev-2` | `0 0 0 1px var(--ox-border-default), 0 3px 6px -2px rgba(0,0,0,0.02), 0 1px 1px 0 rgba(0,0,0,0.04)` | Popovers, dropdowns, command palette |
| `--ox-elev-3` | `0 5px 10px 1px rgba(0,0,0,0.12)` | Floating callouts, drag previews |
| `--ox-elev-overlay` | `0 12px 32px -8px rgba(0,0,0,0.18), 0 4px 12px -4px rgba(0,0,0,0.08)` | Modals on backdrop |

**Backdrop for modals:** `background: rgba(0,0,0,0.32);` (token: `--ox-overlay-scrim`).

---

## Focus ring

Single ring style across all interactive controls.

| Token | Value |
|-------|-------|
| `--ox-focus-ring-width` | `2px` |
| `--ox-focus-ring-offset` | `2px` |
| `--ox-focus-ring-color` | `#000000` (= `--ox-accent`) |
| `--ox-focus-ring` | `0 0 0 var(--ox-focus-ring-offset) #fff, 0 0 0 calc(var(--ox-focus-ring-offset) + var(--ox-focus-ring-width)) var(--ox-focus-ring-color)` |

Apply with `:focus-visible`, never `:focus` (avoid click-induced rings on mouse
users).

---

## Motion

Sparse and quick. Linear keeps motion under 200 ms with eased curves.

### Duration

| Token | Value | Use |
|-------|-------|-----|
| `--ox-duration-instant` | `0ms` | Reduced-motion fallback |
| `--ox-duration-fast` | `120ms` | Hover, focus tint |
| `--ox-duration-base` | `150ms` | Default — color/border/bg/opacity transitions |
| `--ox-duration-slow` | `200ms` | Popover open, sheet slide |
| `--ox-duration-emph` | `320ms` | Modal enter, route transition |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `--ox-ease-default` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Default (matches Linear's opacity ease) |
| `--ox-ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit |
| `--ox-ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter |
| `--ox-ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Two-way |

### Default transitions

Apply on interactive controls:

```css
transition:
  color           var(--ox-duration-base) var(--ox-ease-default),
  background-color var(--ox-duration-base) var(--ox-ease-default),
  border-color    var(--ox-duration-base) var(--ox-ease-default),
  box-shadow      var(--ox-duration-base) var(--ox-ease-default),
  opacity         var(--ox-duration-fast) var(--ox-ease-default);
```

**Respect** `prefers-reduced-motion: reduce` — set every duration to `0ms`.

---

## Z-index scale

Avoid ad-hoc `z-index` values. Use the scale.

| Token | Value | Use |
|-------|-------|-----|
| `--ox-z-base` | `0` | Page flow |
| `--ox-z-sticky` | `100` | Sticky table headers, side nav |
| `--ox-z-dropdown` | `200` | Dropdown menus |
| `--ox-z-overlay` | `300` | Backdrop scrim |
| `--ox-z-modal` | `400` | Modal / sheet |
| `--ox-z-popover` | `500` | Popovers above modal (rare) |
| `--ox-z-tooltip` | `600` | Tooltips above everything else |
| `--ox-z-toast` | `700` | Snackbars |
| `--ox-z-debug` | `9999` | Dev-only HUDs |

---

## Implementation status

| Phase | Status | Notes |
|-------|--------|-------|
| Tokens captured (this file) | ✅ done | Phase 1 |
| Type / icons specs | ⏳ next | Phase 2 (`typography.md`, `icons.md`) |
| Component specs | ⏳ | Phase 3 (`components/*.md`) |
| Page templates | ⏳ | Phase 4 (`templates/*.md`) |
| Vuetify theme wiring | ⏳ | Phase 5 (`src/plugins/vuetify.js` + SASS) |
| Enforcement rules | ⏳ | Phase 6 (`CLAUDE.md` of openalex-gui) |
| Pilot on Work detail page | ⏳ | Phase 7 |

When Vuetify wiring lands, every token above becomes a CSS custom property on
`:root` in `src/styles/tokens.css`. Vuetify's theme config consumes the color
tokens; SASS overrides consume the rest.
