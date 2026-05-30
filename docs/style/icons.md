# Icons

Icon rules for openalex-gui. One icon library, one stroke style, one set of
sizes, and a small set of alignment rules so icons sit on the type baseline
without per-component fudging.

> If you find yourself writing `<svg>` markup inline in a `.vue` file, stop.
> If Lucide doesn't have the icon, file a follow-up — do not hand-author SVGs.

---

## Library: Lucide

We standardise on **[Lucide](https://lucide.dev)** via the official
`lucide-vue-next` Vue 3 binding (ISC licence, ~1200 icons, single 24×24
viewBox, consistent 2 px stroke).

### Why Lucide (and not the alternatives)

| Library | Why not |
|---------|---------|
| Material Design Icons (`@mdi/font`) — Vuetify default | Filled, dense, "Material" look that fights the Linear-derived chrome we're moving toward. Currently ships as an icon-font (extra ~150 KB CSS + woff2 even when most icons are unused). |
| Linear's own icon set | Closed source. Cloning would be legally and optically wrong. Locked out per oxjobs #249 README decision (2026-05-23). |
| Heroicons | Two-style (outline/solid) split forces a decision at every use site; smaller library; no built-in Vue 3 binding as polished as `lucide-vue-next`. |
| Feather (Lucide's ancestor) | No longer actively maintained. Lucide is the fork that stayed alive. |
| Phosphor / Tabler | Both fine; Lucide is the closest analog to Linear's visual language and what Linear-style design systems converge on in the wild. |

### Install (executed in Phase 5)

```bash
cd openalex-gui
npm install lucide-vue-next
```

No CSS, no font file. Lucide ships as tree-shakeable Vue components — only the
icons you import end up in the bundle.

The existing `@mdi/font` dependency is **removed** in the same Phase 5 change
that wires Vuetify defaults to Lucide; until then, both coexist (legacy
components keep using `<v-icon>` with MDI names).

---

## Size scale

Three sizes. No exceptions.

| Token | Size | Use |
|-------|------|-----|
| `--ox-icon-sm` | **16 px** | Inline with `--ox-type-label` (13 px) and `--ox-type-caption` (12 px). Button leading/trailing icons. Inline icons inside body text. Form-field affixes. |
| `--ox-icon-md` | **20 px** | Default standalone icon. Sidebar nav, top-bar actions, table-row actions, dropdown menu items. Inline with `--ox-type-body` (14 px) and `--ox-type-h3` (15 px). |
| `--ox-icon-lg` | **24 px** | Empty-state hero icon. Page-header decoration. Tutorial / onboarding callouts. |

These map to the `size` prop on Lucide components:

```html
<Search :size="16" />          <!-- sm -->
<Search :size="20" />          <!-- md (default) -->
<Search :size="24" />          <!-- lg -->
```

> Sizes outside {16, 20, 24} are forbidden in chrome. A 14 px icon between a
> 13 px label and a 12 px caption looks "tighter" but in practice introduces
> alignment drift the moment a designer touches the row. Use the scale.

Inside data visualisations (donut segments, sparkline endpoints, chart
legends) icons may be smaller; those live in their own visual layer and are
not constrained by this scale.

### Pixel-grid snapping

All three sizes are even integers. **Always** apply icon sizes as integer
pixels — never `1rem` (could compute to 15.something at certain zoom levels
and blur the strokes). Lucide's 2 px strokes render crisp at integer sizes;
half-pixel sizes blur the strokes regardless of `shape-rendering`.

---

## Stroke + color

Lucide is a single-stroke library. Defaults to inherit:

| Property | Default | How to override |
|----------|---------|------------------|
| `stroke` | `currentColor` | Set `color:` on the parent element |
| `stroke-width` | `2` | Pass `:stroke-width="1.5"` for the rare large hero icon |
| `fill` | `none` | Do not change — Lucide is outlined by design |

```html
<!-- inherits the color of the surrounding text -->
<span style="color: var(--ox-text-tertiary)">
  <Calendar :size="16" /> 2026
</span>
```

### Rules

- **Icon colour follows text colour.** Never set `stroke="#xxx"` directly on an
  icon — color the parent with a `--ox-text-*` token.
- **Default stroke is 2.** Only step down to 1.5 for `--ox-icon-lg` (24 px)
  hero icons in empty states; anything smaller stays at 2.
- **No fills.** If a design calls for a filled icon (e.g. a starred-state
  bookmark), use the explicit filled variant Lucide ships (e.g. `BookmarkCheck`),
  not `fill="currentColor"` hackery.
- **No icon receives a hover-color of its own.** Hover state is set on the
  containing button / link / row; the icon inherits.

---

## Icon-text alignment

Icons and text on the same baseline is what makes typography feel like a
designed system rather than an accident. Three rules cover 99% of cases.

### Rule 1: Flex container, `align-items: center`

```html
<button class="ox-btn">
  <Search :size="16" />
  <span>Search</span>
</button>
```

```css
.ox-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--ox-space-1_5);   /* 6 px between icon and label */
}
```

- `inline-flex` (not plain `flex`) so the button still flows inline with text.
- `align-items: center` — never `baseline` for Lucide; the SVG's optical centre
  sits slightly above the visual centre, and `baseline` mis-aligns by ~1 px.

### Rule 2: Gap by icon size

The gap between icon and label scales with the icon size, not arbitrarily.

| Icon size | Gap (token) |
|-----------|-------------|
| 16 px | `--ox-space-1_5` (6 px) |
| 20 px | `--ox-space-2` (8 px) |
| 24 px | `--ox-space-2_5` (10 px) |

### Rule 3: Optical adjustments

Two small nudges are allowed, applied via utility classes — never inline:

- `.ox-icon-shift-up-1` → `margin-top: -1px;` for the small set of Lucide
  icons whose visual centre sits 1 px below the geometric centre
  (`ChevronDown`, `MoreHorizontal`, `MoreVertical`, `Filter`). Apply only when
  the row visibly looks off; do not preemptively decorate.
- `.ox-icon-nudge-right-1` → `margin-left: -1px;` for icons that are the very
  first element in a tight pill (the 0.5 px of stroke on the left edge eats
  into the perceived padding).

These two classes live in `src/styles/icons.css` (Phase 5). Component code
should not reach for any other negative-margin trick.

---

## Common patterns

### Icon-only button

24×24 hit area minimum (a11y). Use `--ox-icon-md` (20 px) with 2 px padding
on each side, or wrap in a 32×32 control (the default `--ox-height-md` button).

```html
<button class="ox-icon-btn" aria-label="Close dialog">
  <X :size="20" />
</button>
```

Always set `aria-label` — icon-only controls have no accessible name otherwise.

### Leading icon in a button

```html
<v-btn variant="outlined" prepend-icon="">  <!-- empty: we'll slot Lucide -->
  <template #prepend><Search :size="16" /></template>
  Search
</v-btn>
```

(Phase 5 will add a `<OxBtn>` wrapper that hides this ceremony.)

### Icon in a sidebar nav item

20 px icon, 28 px row, 8 px gap, label uses `--ox-type-label`.

```html
<router-link class="ox-nav-item" to="/works">
  <FileText :size="20" />
  <span>Works</span>
</router-link>
```

### Icon inside a form-field affix

Always 16 px, colour `--ox-text-muted`, in the field's prefix/suffix slot.
**Never** absolute-positioned inside the field.

### Icon in a status pill

12 px icon, `--ox-type-caption` text, gap `--ox-space-1` (4 px). Pill height
`--ox-height-xs` (24 px). One icon max; no trailing decorative icons.

### Loading state on an icon button

Swap the icon for `<Loader2 :size="20" />` plus a `class="ox-spin"` utility
(360° rotate, `--ox-duration-emph` × 4, linear, infinite). Do **not** layer a
`v-progress-circular` over the icon.

---

## Naming conventions

- Import icons as Lucide ships them (PascalCase, exact name from
  [lucide.dev](https://lucide.dev/icons/)). `import { Search } from "lucide-vue-next"`.
- Do not alias icons in a way that hides what they are (`import { Search as Magnifier }` — no).
- Where multiple icons could plausibly express the same concept, prefer the
  one that already exists elsewhere in the codebase. The Phase 6 "I want X →
  use Y" lookup table will canonicalise common ones (search, filter, sort,
  download, share, more, …).

---

## Exclusions (do NOT do)

- ❌ **Linear's bespoke icons or illustrations.** None of Linear's product
  icons (rocket-logo, settings illustrations, empty-state art, custom workflow
  glyphs) may be reproduced in our codebase, even traced. This is both a legal
  and an optics call. Locked 2026-05-23.
- ❌ **Material Design Icons in new code.** `@mdi/...` is legacy-only; use
  Lucide in everything new. The `<v-icon>` element survives only until Phase 5
  swaps Vuetify defaults to Lucide.
- ❌ **Multiple icon libraries.** No Heroicons, no Phosphor, no Tabler, no
  Font Awesome, no `@iconify`, no SVGs from random Figma exports. One library.
- ❌ **Inline `<svg>` markup in components** for things that exist in Lucide.
  If Lucide doesn't have it, file a follow-up and use the closest Lucide
  approximation in the meantime.
- ❌ **Custom illustrations.** Empty states use a single Lucide icon at
  `--ox-icon-lg`, plain (`--ox-text-muted`). No mascots, no decorative
  spot illustrations, no isometric line-art. (Out of scope for this guide;
  belongs to the deferred "Illustration system" job.)
- ❌ **Animated icons** (Lottie, animated SVG). Loading uses Lucide `Loader2`
  + CSS rotate; everything else is static.
- ❌ **Brand logos as icons.** OpenAlex's tricolour mark is a logo, not an
  icon — it lives in the top bar and login screen at fixed sizes, not in
  buttons or rows. Do not request it via Lucide-style imports.

---

## Lookup: what icon for what concept

Living list — extend as common needs appear. Phase 6 will graduate this into
the openalex-gui CLAUDE.md "I want X → use Y" table.

| Concept | Lucide icon | Size |
|---------|-------------|------|
| Search | `Search` | 16 / 20 |
| Filter | `Filter` (or `SlidersHorizontal` for advanced) | 16 / 20 |
| Sort ascending | `ArrowUp` | 16 |
| Sort descending | `ArrowDown` | 16 |
| Sort (unset, both directions) | `ChevronsUpDown` | 16 |
| External link | `ArrowUpRight` | 14–16 inline (exception to the size scale, this one **only**, because it sits inside text) |
| Copy to clipboard | `Copy` | 16 |
| Download | `Download` | 16 |
| Share | `Share2` | 16 |
| Edit | `Pencil` | 16 |
| Delete | `Trash2` | 16 |
| Add | `Plus` | 16 / 20 |
| Close | `X` | 20 |
| More (overflow menu) | `MoreHorizontal` | 20 |
| Open access (entity badge) | `LockOpen` | 14 inline / 16 in pills |
| Closed access | `Lock` | same |
| Retracted (warning state) | `AlertTriangle` | 16 |
| Verified author | `BadgeCheck` | 16 |
| Loading | `Loader2` (with `ox-spin`) | match the icon it replaces |
| Settings | `Settings` | 20 |
| Help | `HelpCircle` | 16 / 20 |
| Info | `Info` | 16 / 20 |
| Success | `CheckCircle2` | 16 / 20 |
| Warning | `AlertTriangle` | 16 / 20 |
| Error / danger | `XCircle` | 16 / 20 |

---

## Anti-patterns checklist (PR review)

- [ ] Icon size that isn't 16, 20, or 24
- [ ] `stroke="#..."` or `fill="..."` set directly on a `<lucide-*>` component
- [ ] Inline `<svg>` markup duplicating a Lucide icon
- [ ] An icon-only button without `aria-label`
- [ ] An MDI icon name (`mdi-…`) inside `<v-icon>` in a new component (Phase 5+)
- [ ] An `align-items: baseline` flex container holding an icon and text
- [ ] A negative margin on an icon that isn't `.ox-icon-shift-up-1` or
      `.ox-icon-nudge-right-1`
- [ ] A second icon library (Heroicons, Phosphor, Font Awesome, Iconify) added
      to `package.json`
