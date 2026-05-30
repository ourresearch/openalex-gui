# Checkbox · Radio · Switch

Component spec for the three "toggle" controls in openalex-gui. Consumes
tokens from [`tokens.md`](../tokens.md), typography from
[`typography.md`](../typography.md), and icon rules from
[`icons.md`](../icons.md).

**Vuetify components:** `v-checkbox`, `v-radio` (inside `v-radio-group`),
`v-switch`.
**Status against Vuetify:** use with overrides — Vuetify's defaults are
Material-flavored (large hit boxes, ripple, floating labels) and must be
flattened.

> Linear uses an `<input type="checkbox">` as the underlying element for
> what visually reads as a *switch* — see the live measurement below
> (30×20 pill, 72px radius, indigo `on`). We split them cleanly:
> **switch for settings-style booleans**, **checkbox for multi-select +
> form Booleans**, **radio for one-of-N**. Never reach for two of these
> in the same form when one would do.

---

## Decision matrix — which control?

| Use case | Control | Why |
|----------|---------|-----|
| Single Boolean preference applied immediately ("Enable email digest") | **Switch** | Reads as a setting, not a form field. Auto-persists. |
| One of N mutually-exclusive options in a form | **Radio (group)** | Discrete choice, no submit required for clarity. |
| Zero-or-more options in a form ("Send to: [x] Email [ ] Slack") | **Checkbox** | Independent Booleans, all visible at once. |
| Multi-select inside a list / table row | **Checkbox** | Pairs with select-all in the header. |
| "I agree to terms" / single confirmation | **Checkbox** | Convention; users expect a checkbox to gate a submit. |
| Single Boolean inside a save-on-submit form | **Checkbox** | A submit step exists — switch implies immediate apply. |

**Don't:** put a Switch inside a form that has a Save button (the user
won't know if it applies on toggle or on Save). **Don't:** put more than
one Switch on the same line — stack vertically with a label per row.

---

## Sizes

All three controls have **one canonical size**. Density variants
(`comfortable`, `compact`) are Vuetify-supplied but **not used** —
mixing sizes inside a form is the single biggest source of alignment
drift in the Phase 1 audit.

| Control | Indicator box | Label gap | Row height (full) | Font |
|---------|---------------|-----------|-------------------|------|
| Checkbox | 16 × 16 px, `--ox-radius-xs` (4px) | `--ox-space-2` (8px) | `--ox-height-md` (32px) clickable | `--ox-type-label` (13/500) |
| Radio | 16 × 16 px, 50% radius | `--ox-space-2` (8px) | `--ox-height-md` (32px) clickable | `--ox-type-label` (13/500) |
| Switch | 28 × 16 px track, 12 × 12 px thumb, `--ox-radius-pill` (9999px) | `--ox-space-2` (8px) | `--ox-height-md` (32px) clickable | `--ox-type-label` (13/500) |

Linear's switch is `30×20` (live extract). We tighten to `28×16` to align
with our 4px scale and our 16px checkbox/radio box — the three controls
end up the same visual *height* when stacked, which is the point.

---

## States — full matrix

| State | Checkbox | Radio | Switch |
|-------|----------|-------|--------|
| **Default (off)** | bg `--ox-bg-base`, border `--ox-border-default` | bg `--ox-bg-base`, border `--ox-border-default` | track `--ox-border-default`, thumb `--ox-bg-base` |
| **Hover (off)** | border `--ox-border-strong` | border `--ox-border-strong` | track `--ox-border-strong` |
| **Default (on)** | bg `--ox-accent`, check glyph `--ox-accent-on` | inner dot `--ox-accent`, 8px, border `--ox-accent` | track `--ox-accent`, thumb `--ox-accent-on` shifted right by 12px |
| **Hover (on)** | bg `--ox-accent-hover` | inner dot `--ox-accent-hover` | track `--ox-accent-hover` |
| **Focus-visible** | adds `--ox-focus-ring` around the indicator only | same | same |
| **Disabled (off)** | bg `--ox-bg-muted`, border `--ox-border-subtle`, label `--ox-text-disabled` | same | track `--ox-bg-muted`, thumb `--ox-bg-base` |
| **Disabled (on)** | bg `--ox-text-disabled`, check `--ox-bg-base` | inner dot `--ox-text-disabled` | track `--ox-text-disabled` |
| **Indeterminate** (checkbox only) | bg `--ox-accent`, dash glyph (–) `--ox-accent-on` | n/a | n/a |
| **Error** | border `--ox-danger-fg` | border `--ox-danger-fg` | track `--ox-danger-fg` (off) / fill stays accent (on) |

### State rules

- **Focus visibility comes from `:focus-visible`.** Don't paint a ring on
  click — the surrounding label often handles activation, so a mouse
  click should never show the ring.
- **The hit target is the *row*, not the indicator.** A 32px row with a
  16px indicator means there's a 16px optical gutter — that's fine.
  Label text is part of the click target via Vuetify's wrapping label.
- **Transition** on `background-color, border-color, transform` uses
  `--ox-duration-base` (150ms). Switch's thumb-shift uses the same
  duration — Linear's measured value is `0.15s ease-out`; we keep the
  duration and use our token easing (`--ox-ease-base`) for visual
  consistency with buttons.
- **Indeterminate is a checkbox-only state** for "some children selected"
  in a tree or table. Don't fake it with a half-opacity check.
- **No ripple** — globally disabled, do not re-enable.
- **Required is a label affordance, not an indicator decoration.** Add
  ` *` (asterisk) to the label text, not a red ring on the indicator.

---

## Label placement

- **Always to the right** of the indicator. Never above, never below,
  never to the left.
- **Multi-line labels wrap normally** (label keeps `display: inline`); the
  indicator stays vertically aligned to the *first line* via
  `align-items: flex-start; padding-top: 4px` on the indicator wrapper.
- **A description / helper line** sits below the label at
  `--ox-type-caption` (12/500), color `--ox-text-tertiary`,
  `margin-top: 2px`. Use Vuetify's `hint` prop or render a sibling
  `<small>` — both fine.
- **An icon prefix on the label** (e.g. a status dot before "Resolved")
  is allowed and follows [`icons.md`](../icons.md) alignment rules.

---

## Groups

### Checkbox group (multi-select)

- Stack vertically with `--ox-space-1` (4px) gap between rows for dense
  lists, `--ox-space-2` (8px) for settings-style lists.
- "Select all" goes **above** the group with a divider in between, or
  inside a table header — never inline with the first item.
- Indeterminate "select all" reflects "some children selected".

### Radio group

- Use `<v-radio-group>` as the wrapper — gives you keyboard arrow nav
  and shared `v-model` for free. Never wrap raw `<v-radio>` in a
  hand-rolled `<div>`.
- Same vertical stacking + gap rules as checkboxes.
- **Inline / horizontal radios** (rare): only for ≤3 short labels in a
  toolbar; gap is `--ox-space-4` (16px).

### Switch group

- Switches are settings, so they live in a settings-style list, one per
  row, label-left / switch-right (NOT label-right like checkbox/radio).
- Row pattern: title + helper text on the left, switch flush-right.
  This is the same row pattern Linear uses on its Preferences page.

---

## Vuetify mapping

| Spec concept | Vuetify prop / slot | Notes |
|--------------|---------------------|-------|
| Boolean v-model | `v-model="bool"` | Standard. |
| Multi-select v-model | `v-model="array"` + `:value="..."` per checkbox | Standard. |
| Group v-model | `v-model="picked"` on `<v-radio-group>` | Don't put v-model on individual `<v-radio>`. |
| Indeterminate | `:indeterminate="..."` on `<v-checkbox>` | Boolean. |
| Hide label | `:hide-details="true"` (kills helper area) + visually-hidden label slot | Indicator stays accessible. |
| Inline label | `:label="..."` prop OR `<template #label>` for rich content | Slot for icons / bold spans. |
| Hint / helper | `:hint="..."` + `:persistent-hint="true"` | Renders the caption row. |
| Error | `:error="bool"` + `:error-messages="..."` | Validation. |
| Disabled | `:disabled="bool"` | Standard. |

### Defaults to add in Phase 5

Append to `createVuetify({ defaults: { … } })`:

```js
VCheckbox: {
  color: 'primary',
  density: 'comfortable',
  hideDetails: 'auto',
  ripple: false,
},
VRadio: {
  color: 'primary',
  density: 'comfortable',
  ripple: false,
},
VRadioGroup: {
  hideDetails: 'auto',
  density: 'comfortable',
},
VSwitch: {
  color: 'primary',
  density: 'comfortable',
  hideDetails: 'auto',
  inset: true,            // pill track, not Material's stadium
  ripple: false,
},
```

### Required SASS overrides

`src/styles/_vuetify-overrides.scss`:

```scss
// Common: kill the Material 40px circular hit-state and replace with
// our 16px indicator + 32px row pattern.
.v-selection-control {
  min-height: var(--ox-height-md);
  --v-selection-control-size: 20px;  /* slot box, not the indicator */
}
.v-selection-control__wrapper {
  width: 20px;
  height: 20px;
}
.v-selection-control__input { width: 16px; height: 16px; }
.v-selection-control__input::before { display: none; }   /* kill Material overlay */
.v-selection-control__input > .v-icon { font-size: 16px; opacity: 1; }

// Checkbox box.
.v-checkbox .v-selection-control__input {
  border: 1px solid var(--ox-border-default);
  border-radius: var(--ox-radius-xs);
  background: var(--ox-bg-base);
}
.v-checkbox--checked .v-selection-control__input,
.v-checkbox .v-selection-control--dirty .v-selection-control__input {
  background: var(--ox-accent);
  border-color: var(--ox-accent);
}

// Radio dot.
.v-radio .v-selection-control__input {
  border: 1px solid var(--ox-border-default);
  border-radius: 50%;
  background: var(--ox-bg-base);
}
.v-radio--checked .v-selection-control__input { border-color: var(--ox-accent); }
.v-radio--checked .v-selection-control__input::after {
  content: ''; display: block; width: 8px; height: 8px;
  border-radius: 50%; background: var(--ox-accent);
  margin: auto;
}

// Switch track + thumb.
.v-switch .v-switch__track {
  width: 28px; height: 16px; border-radius: var(--ox-radius-pill);
  background: var(--ox-border-default);
  transition: background-color var(--ox-duration-base) var(--ox-ease-base);
}
.v-switch .v-switch__thumb {
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--ox-bg-base);
  box-shadow: var(--ox-elev-1);
  transform: translateX(2px);
  transition: transform var(--ox-duration-base) var(--ox-ease-base);
}
.v-switch--inset.v-switch--checked .v-switch__track { background: var(--ox-accent); }
.v-switch--inset.v-switch--checked .v-switch__thumb  { transform: translateX(14px); }

// Label + helper.
.v-selection-control .v-label {
  font: var(--ox-weight-medium) var(--ox-type-label-size)/1.4 var(--ox-font-sans);
  color: var(--ox-text-primary);
  opacity: 1;
  padding-inline-start: var(--ox-space-2);
}
.v-input--disabled .v-label { color: var(--ox-text-disabled); }

// Focus ring around the indicator only.
.v-selection-control:focus-visible .v-selection-control__input,
.v-selection-control .v-selection-control__input:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring);
  border-radius: inherit;
}
```

### What we don't touch

- Vuetify's keyboard handling on `<v-radio-group>` (arrow keys, Home/End).
- The `<input>` element itself — it stays in the DOM for forms /
  screen-reader semantics.
- `<v-checkbox-btn>` (button-like checkbox variant). Out of scope; if
  you need a toggle-button, use `<v-btn-toggle>` and spec separately.

---

## Anti-patterns (auto-reject)

- ❌ A Switch inside a save-on-submit form. (Settings live outside forms;
  forms use Checkboxes.)
- ❌ A Radio group with only one option. Use a Checkbox.
- ❌ A Checkbox with `density="compact"` or `size="small"`. We have one
  canonical size.
- ❌ Two adjacent Switches on the same row.
- ❌ A custom `<div role="checkbox">` instead of `<v-checkbox>` (real
  pattern in `CurateWorkItem.vue`; replace as you touch).
- ❌ Tristate via two checkboxes or radio-in-disguise. Use
  `:indeterminate`.
- ❌ `!important` on any selection control rule.
- ❌ Red text on the label for required fields. Use ` *` on the label
  string itself.
- ❌ `<v-checkbox>` wrapped in `<v-tooltip>` to explain what it does —
  the *label* explains what it does.

---

## Accessibility

- Every control needs an associated label (Vuetify's `label` prop wires
  `<label for>` automatically; for icon-only switches, use
  `aria-label`).
- Disabled state sets `aria-disabled="true"`; error state sets
  `aria-invalid="true"` and ties to `aria-describedby` via the helper id.
- Indeterminate checkboxes need `aria-checked="mixed"` — Vuetify sets
  this when `:indeterminate` is true; do not unset.
- Switch announces "on" / "off"; the `role="switch"` is set by Vuetify
  on the inner element when `inset` is true.

---

## Quick recipes

### Settings switch with helper

```vue
<v-switch
  v-model="emailDigest"
  label="Daily email digest"
  hint="One summary per day at 7am local"
  persistent-hint
/>
```

### Checkbox group inside a form

```vue
<div role="group" aria-labelledby="notif-channels">
  <div id="notif-channels" class="ox-form-label">Notify me on</div>
  <v-checkbox v-model="channels" label="Email"  value="email" />
  <v-checkbox v-model="channels" label="Slack"  value="slack" />
  <v-checkbox v-model="channels" label="Web push" value="push" />
</div>
```

### Radio group

```vue
<v-radio-group v-model="visibility" label="Visibility">
  <v-radio value="private" label="Only me" />
  <v-radio value="team"    label="My team"   />
  <v-radio value="public"  label="Anyone with the link" />
</v-radio-group>
```

### Indeterminate "select all" in a table header

```vue
<v-checkbox
  :model-value="allSelected"
  :indeterminate="someSelected && !allSelected"
  aria-label="Select all rows"
  @update:model-value="toggleAll"
/>
```

### Required + error

```vue
<v-checkbox
  v-model="agreed"
  label="I agree to the terms *"
  :error="submitted && !agreed"
  :error-messages="submitted && !agreed ? 'Required' : ''"
/>
```

---

## Open questions

- Toggle-button group (`<v-btn-toggle>`) as a fourth member of this
  family? Lean: spec separately under a "Toggle / segmented" entry —
  it's visually a button, not a selection control.
- Native `<input type="checkbox">` inside the editor (markdown task
  lists) — these bypass Vuetify entirely; lower-priority but should
  inherit our color + radius via a global selector.
