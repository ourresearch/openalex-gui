# Button

Component spec for buttons in openalex-gui. Consumes tokens from
[`tokens.md`](../tokens.md) and follows the type / icon rules in
[`typography.md`](../typography.md) and [`icons.md`](../icons.md).

**Vuetify component:** `v-btn` (`VBtn`).
**Status against Vuetify:** use with overrides (see "Vuetify mapping" below).
**Default applied by theme:** `variant: 'outlined', rounded: 'md', elevation: 0, ripple: false`.

> A button is the densest piece of brand surface in the app. Every drift —
> wrong radius, wrong gray, hand-mixed padding — reads as amateurish faster
> than any other component. If you are about to write `<style>` or
> `style="…"` on a `v-btn`, stop and read this file.

---

## Variants

We ship four variants. **Use exactly one variant per call-site; never mix
fills.** Variants are picked by Vuetify's `variant` prop plus our default
defaults (see Phase 5 wiring).

| Variant | When to use | Vuetify prop |
|---------|-------------|--------------|
| **Primary** | The single most important action in a region (form submit, "Create", "Save", "Apply"). At most one per dialog or form. | `variant="flat" color="primary"` |
| **Outlined** | All other actionable buttons (default). Goes on toolbars, card actions, secondary form actions. | `variant="outlined"` *(theme default)* |
| **Ghost** | Toolbar / row-end actions where chrome should disappear until hover (icon-only menus, inline row controls, dismiss). | `variant="text"` |
| **Danger** | Destructive confirmation **inside a dialog only** (e.g. "Delete saved search"). Never use on a top-level page chrome. | `variant="flat" color="danger"` |

**Hard rules:**

- **Never more than one Primary in a single visual region.** If two competing
  actions exist, demote one to Outlined.
- **Danger is dialog-only.** Use Outlined with a danger label color
  (`text-danger-fg`) for in-page destructive triggers; the *confirmation*
  step inside the dialog is the Danger button.
- **Do not invent a fifth variant** (no "soft", "tinted", "subtle filled",
  "ghost outlined", "primary outlined"). Use Outlined and color the label
  via a token if you need emphasis.
- **No Material Design ripple.** The theme disables it globally; do not
  re-enable per-instance.

---

## Sizes

| Size | Height | X-padding | Font size | Radius | Min icon-only width | Vuetify prop |
|------|--------|-----------|-----------|--------|---------------------|--------------|
| `xs` | `--ox-height-xs` (24px) | 8px | `--ox-type-caption` (12px) | `--ox-radius-xs` (4px) | 24px | `size="x-small"` |
| `sm` | `--ox-height-sm` (28px) | 10px | `--ox-type-caption` (12px / 500) | `--ox-radius-sm` (6px) | 28px | `size="small"` |
| `md` *(default)* | `--ox-height-md` (32px) | 12px | `--ox-type-label` (13px / 500) | `--ox-radius-md` (8px)\* | 32px | *(default)* |
| `lg` | `--ox-height-lg` (40px) | 16px | `--ox-type-label` (13px / 500) | `--ox-radius-md` (8px) | 40px | `size="large"` |

\* The legacy `App.vue` override uses `6px` for the md radius. Phase 5 will
  re-promote to the spec's 8px (`--ox-radius-md`) as part of the App.vue
  cleanup. Until then, both are acceptable in code review.

**Picking a size:**

- `md` for everything by default. If you are unsure, use `md`.
- `lg` only for page-level hero actions (e.g. search submit on the home
  hero, dialog confirm where the dialog itself is unusually large).
- `sm` for toolbars where space is constrained and ~5+ buttons live in a row.
- `xs` for inline-with-text buttons (chip-like). Almost always icon-only.

---

## States — full matrix

Every variant supports all six states. The state styling is set by Vuetify's
class system; our SASS layer paints the right tokens.

| State | Primary | Outlined | Ghost | Danger |
|-------|---------|----------|-------|--------|
| **Default** | bg `--ox-accent`, fg `--ox-accent-on`, no border | bg `--ox-bg-base`, fg `--ox-text-primary`, border `--ox-border-default` | bg `transparent`, fg `--ox-text-secondary`, no border | bg `--ox-danger-fg` (`#cf222e`), fg `--ox-accent-on` (white), no border |
| **Hover** | bg `--ox-accent-hover` (`#1a1a1a`) | bg `--ox-bg-muted`, border `--ox-border-strong` | bg `--ox-bg-muted`, fg `--ox-text-primary` | bg `#b31d28` (10% darker than danger-fg) |
| **Active / pressed** | bg `--ox-accent-active` (`#333`) | bg `--ox-bg-emphasis` | bg `--ox-bg-emphasis` | bg `#a01c25` (15% darker) |
| **Focus-visible** | adds `--ox-focus-ring` | adds `--ox-focus-ring` | adds `--ox-focus-ring` | adds `--ox-focus-ring` |
| **Disabled** | bg `--ox-bg-emphasis`, fg `--ox-text-disabled`, no border, **no hover** | bg `--ox-bg-base`, fg `--ox-text-disabled`, border `--ox-border-subtle` | fg `--ox-text-disabled`, **no hover bg** | bg `--ox-bg-emphasis`, fg `--ox-text-disabled` |
| **Loading** | content opacity 0; centered spinner color `--ox-accent-on`; **cursor: progress; pointer-events: none** | spinner color `--ox-accent` (black); border + bg unchanged | spinner color `--ox-text-secondary` | spinner color `--ox-accent-on` |

### State rules (apply to every variant)

- **Focus visibility comes from `:focus-visible`, not `:focus`.** The Vuetify
  default would paint a ring on click; we only want it on keyboard focus.
  See Phase 5 SASS override.
- **Hover transitions** use `--ox-duration-base` (150ms) on
  `color, background-color, border-color, box-shadow`. No opacity dimming on
  hover — only fill swap.
- **Disabled is `aria-disabled="true"`** (Vuetify sets `disabled` attr
  automatically when you pass the prop; the SASS override also adds the aria
  attr for screen-reader parity).
- **Loading shows the spinner only.** Do not also add "Loading…" text — the
  spinner is the indicator. The default label stays in DOM (for layout) but
  is visually hidden via opacity 0.
- **Cursor:** `pointer` default → `progress` while loading → `not-allowed`
  while disabled.

---

## Icon-only variant

Square button with no label. Single Lucide icon centered.

- Width === height === size token (e.g. 32px at `md`).
- Icon size: see [`icons.md`](../icons.md) → 16px at `sm`/`md`, 20px at `lg`.
- **Always set `aria-label`** (e.g. `aria-label="Close dialog"`). Required —
  reviewers reject icon-only buttons without it.
- **Tooltip is mandatory** when the icon's meaning isn't unambiguous from
  context (most cases). Wrap in `v-tooltip` with `location="bottom"`.
- Use Ghost variant by default for icon-only. Reach for Outlined only when
  the button is the *only* control in a region (otherwise the chrome feels
  loud).

```vue
<v-tooltip text="Open in new tab" location="bottom">
  <template #activator="{ props }">
    <v-btn
      v-bind="props"
      icon
      variant="text"
      aria-label="Open in new tab"
    >
      <v-icon><ExternalLink /></v-icon>
    </v-btn>
  </template>
</v-tooltip>
```

---

## Icon + label

| Position | Use | Spacing rule |
|----------|-----|--------------|
| **Leading** | The icon clarifies the action ("✚ Create", "↓ Download"). | Gap = `--ox-space-1_5` (6px) at sm, `--ox-space-2` (8px) at md/lg. |
| **Trailing** | The action opens or leads somewhere (dropdown caret, "Next →", "Open ↗"). | Same gap rules. |

- Use one icon per button — never both leading and trailing.
- Icon size pairs to button size: see `icons.md`.
- Use Vuetify's `prepend-icon` / `append-icon` props if rendering MDI
  (legacy only); for new code render Lucide as a default-slot sibling with
  the `<v-icon>` wrapper preserving stroke/color inheritance.

---

## Loading

```vue
<v-btn :loading="isSaving" @click="save">Save</v-btn>
```

- Vuetify's `loading` prop is sufficient. Do **not** render your own
  `<v-progress-circular>` inside a button.
- Disable click while loading via the prop, not via `:disabled`. (Both work,
  but `loading` keeps the correct cursor and aria.)

---

## Vuetify mapping

| Spec concept | VBtn prop | Notes |
|--------------|-----------|-------|
| Primary | `variant="flat" color="primary"` | `primary` resolves to `--ox-accent` (`#000`) via Phase 5 theme. |
| Outlined | (default) | Theme default: `variant: 'outlined', rounded: 'md', elevation: 0, ripple: false`. |
| Ghost | `variant="text"` | |
| Danger | `variant="flat" color="danger"` | `danger` color added to Vuetify theme in Phase 5. |
| Sizes | `size="x-small"\|"small"\|"large"` | omit for `md`. |
| Icon-only | `icon` boolean prop | Vuetify auto-squares + auto-strips text padding. |
| Loading | `loading` boolean prop | Don't custom-render spinner. |
| Block-level | `block` prop | Use rarely. Forms-on-mobile only. |

### Defaults to add in Phase 5

Append to `createVuetify({ defaults: { VBtn: { … } } })`:

```js
VBtn: {
  variant: 'outlined',
  rounded: 'md',
  elevation: 0,
  ripple: false,
  // size: 'default' implicit (= 'md' in our spec)
}
```

### Required SASS overrides

The Material defaults that leak through and must be killed in
`src/styles/_vuetify-overrides.scss` (Phase 5):

```scss
// Remove uppercase + letter-spacing (Material default).
.v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: var(--ox-weight-medium);
  font-family: var(--ox-font-sans);
}

// Replace the App.vue !important wall with non-important sizing
// driven by tokens. (Specificity wins because we override the
// .v-btn--size-* combination, not the base.)
.v-btn.v-btn--size-default:not(.v-btn--icon) {
  height: var(--ox-height-md);
  padding: 0 var(--ox-space-3);   /* 12px */
  font-size: var(--ox-type-label-size);
  border-radius: var(--ox-radius-md);
}
.v-btn.v-btn--size-small:not(.v-btn--icon)    { height: var(--ox-height-sm); padding: 0 var(--ox-space-2_5); font-size: var(--ox-type-caption-size); border-radius: var(--ox-radius-sm); }
.v-btn.v-btn--size-x-small:not(.v-btn--icon)  { height: var(--ox-height-xs); padding: 0 var(--ox-space-2);   font-size: var(--ox-type-caption-size); border-radius: var(--ox-radius-xs); }
.v-btn.v-btn--size-large:not(.v-btn--icon)    { height: var(--ox-height-lg); padding: 0 var(--ox-space-4);   font-size: var(--ox-type-label-size); border-radius: var(--ox-radius-md); }

// Icon-only square.
.v-btn--icon.v-btn--size-default { width: var(--ox-height-md); height: var(--ox-height-md); }
.v-btn--icon.v-btn--size-small   { width: var(--ox-height-sm); height: var(--ox-height-sm); }
.v-btn--icon.v-btn--size-x-small { width: var(--ox-height-xs); height: var(--ox-height-xs); }
.v-btn--icon.v-btn--size-large   { width: var(--ox-height-lg); height: var(--ox-height-lg); }

// Outlined hairline.
.v-btn--variant-outlined {
  border: 1px solid var(--ox-border-default);
  background-color: var(--ox-bg-base);
}
.v-btn--variant-outlined:hover:not(:disabled) {
  background-color: var(--ox-bg-muted);
  border-color: var(--ox-border-strong);
}

// Focus ring (replace Material ::before).
.v-btn:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring);
}

// Kill Material's ripple/::before active overlay so our hover/active
// tokens show cleanly.
.v-btn__overlay { display: none; }
```

### What we don't touch

- **Vuetify's accessibility primitives** (`role`, `tabindex`, `aria-pressed`
  for toggle buttons). Don't override.
- **`<router-link>` integration** (`to` prop). Use as-is; do not roll your
  own anchor.
- **Toggle group behavior** (`v-btn-toggle`). Out of scope for this spec —
  cover in a separate "Toggle / segmented" entry if needed.

---

## Anti-patterns (auto-reject)

These show up across `App.vue`, `Funders2026.vue`, and `CurateWorkItem.vue`
in the Phase 1 audit. None of them should appear in new code, and all
should be removed from existing code during Phase 5 / 7.

- ❌ `style="background: #1976D2"` or any hex color inline on `<v-btn>`.
  Use a variant + color token.
- ❌ `style="height: 30px; padding: 0 11px"` to fudge a size between `sm`
  and `md`. Pick one. If the spec is genuinely wrong, propose a token
  here — don't fudge per-call-site.
- ❌ `text-transform: uppercase` (Material default → we kill it globally;
  do not re-enable).
- ❌ `font-family: monospace` on a button (yes, App.vue does this).
- ❌ Wrapping a `<v-btn>` in another `<v-btn>` (real bug in `App.vue` —
  reviewer caught it; do not repeat).
- ❌ `!important` on any button rule. The Phase 5 overrides are
  specificity-driven, not `!important`-driven. Remove `!important` as you
  touch this code.
- ❌ Raw `<button>`. The 15 files that still have one are tracked for
  Phase 5 cleanup; do not add another.
- ❌ Hand-rolled spinner inside a `<v-btn>`. Use `loading` prop.
- ❌ Icon-only `<v-btn>` without `aria-label`. Reviewers reject.
- ❌ Two Primary buttons in the same region.

---

## Quick recipes

### Form submit (Primary, md)

```vue
<v-btn variant="flat" color="primary" @click="submit">Save</v-btn>
```

### Toolbar action (Outlined, sm)

```vue
<v-btn size="small">Export</v-btn>
```

### Dropdown trigger (Ghost icon-only)

```vue
<v-tooltip text="More" location="bottom">
  <template #activator="{ props }">
    <v-btn v-bind="props" icon variant="text" aria-label="More actions">
      <v-icon><MoreHorizontal /></v-icon>
    </v-btn>
  </template>
</v-tooltip>
```

### Destructive confirm in a dialog (Danger)

```vue
<v-dialog>
  <v-card>
    <v-card-title>Delete saved search?</v-card-title>
    <v-card-text>This can't be undone.</v-card-text>
    <v-card-actions>
      <v-btn variant="text" @click="cancel">Cancel</v-btn>
      <v-btn variant="flat" color="danger" :loading="isDeleting" @click="confirmDelete">
        Delete
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### In-form secondary action paired with Primary

```vue
<v-btn variant="text" @click="cancel">Cancel</v-btn>
<v-btn variant="flat" color="primary" :loading="isSaving" @click="save">Save changes</v-btn>
```

---

## Open questions (to validate in Phase 3 pilot)

- Should icon-only buttons in a toolbar share a `--ox-radius-pill` variant
  for the "ribbon" style Linear uses on workspace selector? **TBD —**
  defer to Phase 7 pilot.
- Toggle-group / segmented control: separate spec or part of this one?
  Lean: separate (after first 5 are settled).
- Is there a real need for `block`? Phase 1 audit found ~2 uses;
  candidates for refactor away from `block`.
