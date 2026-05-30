# Card

A rectangular surface that groups related content. The most-used custom
container in openalex-gui (198 instances in the Phase 1 audit). Cards carry
**no shadow by default** — visual separation comes from a hairline border
on white, the way Linear does it.

**Vuetify component:** `v-card`.
**Status against Vuetify:** use with overrides — Material defaults give a
chunky shadow and dense paddings that don't fit.

> A card is just a bordered box. If you reach for `<v-card>` to get a
> shadow, you're using the wrong primitive — that's a popover (`--ox-elev-2`)
> or a floating callout (`--ox-elev-3`), not a card.

---

## Shape

| Property | Token | Value |
|----------|-------|-------|
| Background | `--ox-bg-base` | `#fff` |
| Border | 1px solid `--ox-border-default` | `#e2e2e2` |
| Radius | `--ox-radius-md` | 8px |
| Padding (default) | `--ox-space-4` | 16px |
| Padding (compact) | `--ox-space-2` | 8px |
| Padding (loose) | `--ox-space-5` | 20px |
| Gap between stacked cards | `--ox-space-4` | 16px |
| Shadow | `--ox-elev-0` | none |

**Density choice:**

- **Default 16px** for most content cards.
- **Compact 8px** only for tightly stacked metric cards or grid items
  where ≥4 cards per row are visible at `lg`.
- **Loose 20px** for the canonical Work detail card (Phase 7 pilot) and
  any "hero" content card.

---

## Anatomy

```
┌────────────────────────────────────────────────────────┐
│ Title                                          Actions │  ← header row
│ Subtitle (optional)                                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Body content                                           │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Footer actions                              [Primary]  │  ← optional
└────────────────────────────────────────────────────────┘
```

| Slot | Vuetify | Type | Padding | Notes |
|------|---------|------|---------|-------|
| Title | `<v-card-title>` | `--ox-type-h3` (15/500) | inherit card padding; **no** Material extra 16px top | One line, truncate if needed. |
| Subtitle | `<v-card-subtitle>` | `--ox-type-caption` (12/500), `--ox-text-tertiary` | inherit | Optional. |
| Body | `<v-card-text>` | `--ox-type-body` (14/400) | inherit | Default content slot also fine. |
| Actions | `<v-card-actions>` | — | inherit; gap `--ox-space-2` between buttons | Right-align by default. Use a `<v-spacer/>` to push to the right. |
| Divider | `<v-divider>` | — | full-bleed: `margin-left: calc(-1 * var(--padding)); margin-right: calc(-1 * var(--padding));` | Use sparingly; cards usually don't need internal dividers. |

**Rules:**

- **No double padding.** If you put a `<v-card-text>` inside a `<v-card>`,
  Material adds another 16px. Override globally so `v-card-text` has zero
  padding when nested in a themed card; the card owns the padding.
- **Title is `<h3>`-styled** (15px / 500). Do not use `<v-card-title>` for
  page titles — use `<h1>` with `--ox-type-display`.
- **Actions row never gets a divider** unless the body has scroll. If body
  scrolls, add a 1px hairline divider above the actions row so the user
  can tell content is cut off.

---

## Variants

Cards differ by **interaction**, not by visual style. We do not ship a
"colored card" or a "tinted card" — color belongs to the content inside,
not to the card itself.

| Variant | When to use | Differences from default |
|---------|-------------|--------------------------|
| **Static** *(default)* | Display-only grouping (metric panel, info card). | — |
| **Hoverable** | The card is a clickable preview that opens detail elsewhere. | `cursor: pointer`; hover bg `--ox-bg-muted`; hover border `--ox-border-strong`; transition `--ox-duration-base`. |
| **Selectable** | One of several picks in a grid (e.g. "Pick an entity type" splash). | Adds Selected state (see below). |
| **Loading** | Content not yet ready. | Renders a skeleton inside; card chrome unchanged. |

There is **no** "elevated" / "flat" / "outlined" toggle. Cards are always
outlined with hairline.

---

## States

| State | Border | Background | Notes |
|-------|--------|------------|-------|
| Default | `--ox-border-default` | `--ox-bg-base` | |
| Hover (hoverable / selectable only) | `--ox-border-strong` | `--ox-bg-muted` | Transition `--ox-duration-base`. |
| Active / pressed (hoverable) | `--ox-border-strong` | `--ox-bg-emphasis` | Optional; click is so fast you rarely see it. |
| Selected (selectable) | 1px solid `--ox-accent` | `--ox-bg-base` | Use `box-shadow: 0 0 0 1px var(--ox-accent)` to add the second pixel of weight without a layout shift. |
| Focus-visible (hoverable / selectable) | adds `--ox-focus-ring` | inherit hover bg | Apply on `<a>` / `<button>` wrapper, not on the card itself if it's not a real button. |
| Disabled (selectable) | `--ox-border-subtle` | `--ox-bg-muted` | Cursor `not-allowed`; content opacity 0.6. |

**Static cards have no hover state.** Don't paint one in. It signals
interactivity that isn't there.

---

## Hoverable card — interaction rules

If a card is clickable end-to-end:

- **Wrap the card in a `<router-link>` or `<a>`**, not the other way around.
  `<v-card link to="…">` works too — Vuetify renders a real `<a>` underneath.
- **Don't nest interactive elements inside.** A clickable card with an
  inline `<v-btn>` inside it creates ambiguous click targets and a nested
  `<button>` inside `<a>` (invalid HTML). If you need a secondary action,
  use Ghost icon-only with `@click.stop`.
- **`cursor: pointer` covers the whole card**, not just the title.

---

## Card grid

Vuetify's `<v-row>` / `<v-col>` works for card grids; **prefer CSS Grid**
for fixed-cell metric layouts where columns shouldn't reflow on minor
viewport changes.

```css
.ox-card-grid {
  display: grid;
  gap: var(--ox-space-4);
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}
```

Per-breakpoint stack rules:

| Breakpoint | Columns |
|------------|---------|
| `xs` | 1 |
| `sm` | 2 |
| `md` | 2–3 |
| `lg` | 3–4 |
| `xl` | 4 |

These are conventions; the `auto-fill minmax` pattern usually gets you
there without manual rules.

---

## Vuetify mapping

| Spec concept | VCard prop | Notes |
|--------------|------------|-------|
| Outlined hairline | `variant="outlined"` *(forced by theme)* | Disables the Material shadow. |
| No shadow | `elevation="0"` *(theme default)* | |
| Clickable | `link to="…"` or `:href="…"` | Renders `<a>`. |
| Loading | `loading` boolean | Shows a thin top progress bar (Material). Use this for "saving card data" cases; for "fetching to render", use skeleton inside (see `loading.md` — TBD). |
| Padding | (manual via class) | Use `class="ox-card-pad-default"` etc. or pass `class="pa-4"` (Vuetify utility). |

### Defaults to add in Phase 5

```js
VCard: {
  variant: 'outlined',
  elevation: 0,
  ripple: false,
  rounded: 'md',
},
VCardTitle: {
  // no Vuetify props; SASS handles
},
VCardText: {
  // collapse Material default padding; the card owns it
},
```

### Required SASS overrides

```scss
.v-card.v-card--variant-outlined {
  border: 1px solid var(--ox-border-default);
  background: var(--ox-bg-base);
  border-radius: var(--ox-radius-md);
  box-shadow: var(--ox-elev-0);  // = none
}

// Title / subtitle typography.
.v-card-title {
  font-family: var(--ox-font-sans);
  font-size: var(--ox-type-h3-size);
  font-weight: var(--ox-weight-medium);
  line-height: var(--ox-type-h3-line);
  letter-spacing: -0.005em;
  color: var(--ox-text-primary);
  padding: 0;            // card owns padding; title contributes only typography
}

.v-card-subtitle {
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  color: var(--ox-text-tertiary);
  padding: 0;
  margin-top: var(--ox-space-1);
}

// Body slot — Material adds 16px top/bottom; we kill it so the card's own
// padding wins.
.v-card-text {
  padding: 0;
  font-size: var(--ox-type-body-size);
  line-height: var(--ox-type-body-line);
  color: var(--ox-text-primary);
}

// Actions row — gap-based instead of Material margins.
.v-card-actions {
  padding: 0;
  margin-top: var(--ox-space-3);   // 12px gap above actions
  display: flex;
  align-items: center;
  gap: var(--ox-space-2);          // 8px between buttons
}

// Hoverable.
.v-card[role="button"],
.v-card.v-card--link {
  cursor: pointer;
  transition:
    background-color var(--ox-duration-base) var(--ox-ease-default),
    border-color     var(--ox-duration-base) var(--ox-ease-default),
    box-shadow       var(--ox-duration-base) var(--ox-ease-default);
}
.v-card[role="button"]:hover,
.v-card.v-card--link:hover {
  background: var(--ox-bg-muted);
  border-color: var(--ox-border-strong);
}

// Focus ring on the underlying anchor.
.v-card.v-card--link:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring);
}
```

---

## Anti-patterns (auto-reject)

- ❌ `<v-card elevation="4">` or any non-zero elevation. Cards are flat.
- ❌ Filled-color cards (`<v-card color="primary">` with white text). If
  you want a black surface, use `--ox-bg-inverse` as a one-off — but
  almost always you want a *banner*, not a card.
- ❌ Putting a `<v-card>` inside a `<v-card>` "for nested grouping". One
  card per group. Use `<v-divider>` or a section header inside instead.
- ❌ Hand-rolled hover shadow (`box-shadow: 0 4px 12px rgba(0,0,0,0.1)` on
  hover). Hover lifts via bg + border, not shadow.
- ❌ Custom rounded corners (`border-radius: 16px` or `0`) per-card. Use
  the radius token. Modals get `--ox-radius-lg`; cards get `--ox-radius-md`.
- ❌ Setting `min-width` to fake a grid cell width. Use the grid CSS.
- ❌ `<v-card>` wrapping a single `<v-list>` (the list already has its
  own surface). Render the list directly.
- ❌ Nested clickable button inside a clickable card without
  `@click.stop`. Invalid markup + ambiguous click target.

---

## Quick recipes

### Default content card

```vue
<v-card>
  <v-card-title>Open Access trend</v-card-title>
  <v-card-subtitle>Last 12 months</v-card-subtitle>
  <v-card-text>
    <OaTrendChart :series="oaSeries" />
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn variant="text" :href="docsUrl" target="_blank">Learn more</v-btn>
  </v-card-actions>
</v-card>
```

### Hoverable preview that links to a detail page

```vue
<v-card link :to="`/works/${work.id}`">
  <v-card-title class="text-truncate">{{ work.title }}</v-card-title>
  <v-card-subtitle>{{ work.publication_year }} · {{ work.authors[0]?.display_name }}</v-card-subtitle>
  <v-card-text class="text-truncate-2-line">
    {{ work.abstract }}
  </v-card-text>
</v-card>
```

### Selectable card in a grid

```vue
<v-card
  v-for="entity in entityTypes"
  :key="entity.id"
  :class="['ox-card-select', { 'ox-card-selected': selected === entity.id }]"
  role="button"
  :aria-pressed="selected === entity.id"
  tabindex="0"
  @click="selected = entity.id"
  @keydown.enter.prevent="selected = entity.id"
  @keydown.space.prevent="selected = entity.id"
>
  <v-card-title>{{ entity.label }}</v-card-title>
  <v-card-text>{{ entity.description }}</v-card-text>
</v-card>
```

```scss
.ox-card-select.ox-card-selected {
  border-color: var(--ox-accent);
  box-shadow: 0 0 0 1px var(--ox-accent);
}
```

### Compact metric card

```vue
<v-card class="pa-2">   <!-- 8px padding via Vuetify utility -->
  <div class="ox-text-tertiary ox-type-caption">Total works</div>
  <div class="ox-text-primary ox-type-display ox-numeric-tabular">
    {{ totalWorks.toLocaleString() }}
  </div>
</v-card>
```

---

## Open questions

- **`<v-sheet>` vs `<v-card>`** — for chrome (sidebar, top bar) we want a
  surface without the card semantics. Document `<v-sheet>` rules during
  the Top Bar / Sidebar spec (templates phase).
- **Loading skeleton inside cards** — defer to the Loading spec.
- **Empty state** illustration inside a card — defer to a dedicated
  Empty State pattern doc (probably part of templates).
