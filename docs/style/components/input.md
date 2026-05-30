# Input

Text-entry control — single-line. Wraps Vuetify's `v-text-field` (`VTextField`).
For multi-line, use `v-textarea` (same rules, just `min-height` differs).

**Vuetify component:** `v-text-field`.
**Status against Vuetify:** use with overrides — Vuetify's Material variants
("outlined", "underlined", "solo", "filled", "plain") all carry Material
chrome (label-float animation, asterisk styling, dense-cramped paddings) that
don't match our spec. We use `variant="outlined"` and strip the Material
ornamentation in SASS.

> 99% of single-line text entry in this app is just *a box with text in it*.
> No floating labels, no underline animations, no Material density jitter.
> If you reach for `<input>` because Vuetify "fights you", read this file
> instead — the override layer is doing what you wanted.

---

## Shape — single source of truth

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ox-height-md` | 32px |
| Border | 1px solid `--ox-border-default` | `#e2e2e2` |
| Border (hover) | 1px solid `--ox-border-strong` | `#d4d4d4` |
| Border (focus) | 1px solid `--ox-accent` + focus ring | `#000` |
| Background | `--ox-bg-base` | `#fff` |
| Radius | `--ox-radius-md` | 8px |
| X-padding | `--ox-space-3` | 12px |
| Y-padding | `--ox-space-1_5` | 6px |
| Font | `--ox-type-label` | 13px / 500 — **label**; the *value* is regular weight (see below) |
| Font color (value) | `--ox-text-primary` | `#171717` |
| Font weight (value) | `--ox-weight-regular` | 400 |
| Placeholder | `--ox-text-muted` | `#8a8a8a` |
| Shadow | `--ox-elev-0` | none |

**The label above the input** uses `--ox-type-label` (13px / 500) in
`--ox-text-primary`. The *value text inside the input* is 13px / 400 in
`--ox-text-primary`. Don't paint the input's body text at 500 — that's a
common Vuetify Material drift.

---

## Sizes

Default to **md**. Provide `sm` for dense toolbars and `lg` for hero search
fields. There is no `xs` input — it would clip the text vertically.

| Size | Height | Y-pad | X-pad | Font | Vuetify prop |
|------|--------|-------|-------|------|--------------|
| `sm` | 28px | 4px | 10px | 12px / 400 | `density="compact"` + size override |
| `md` *(default)* | 32px | 6px | 12px | 13px / 400 | `density="compact"` *(theme default)* |
| `lg` | 40px | 10px | 14px | 14px / 400 | `density="comfortable"` |

---

## Anatomy

```
┌────────────────────────────────────────────────────────┐
│ Label                                                  │  ← --ox-type-label (13/500)
├────────────────────────────────────────────────────────┤
│ ⌕  Search by author name           ✕                   │  ← input (32px tall)
└────────────────────────────────────────────────────────┘
  Helper text                                            ← --ox-type-caption (12/500), --ox-text-tertiary
  Required (when applicable)                              ← same scale, --ox-text-tertiary
  Error message                                           ← same scale, --ox-danger-fg
```

- Label sits above the input with `--ox-space-1` (4px) gap. **Do not use
  Material's floating label.** (Vuetify outlined-variant tries to float — we
  override the SASS to keep the label static.)
- Helper / required / error text uses `--ox-type-caption` (12/500) at
  `--ox-space-1` (4px) below the input.
- Only **one** of helper / required / error renders at a time. Error takes
  precedence; required only renders when not in error.

---

## States

| State | Border | Bg | Foreground | Notes |
|-------|--------|----|------------|-------|
| Default | `--ox-border-default` | `--ox-bg-base` | `--ox-text-primary` | |
| Hover (input area) | `--ox-border-strong` | `--ox-bg-base` | `--ox-text-primary` | No bg swap; border only. |
| Focus | `--ox-accent` (1px) + `--ox-focus-ring` | `--ox-bg-base` | `--ox-text-primary` | Use `:focus-visible` on the underlying `<input>`, not the wrapper. |
| Filled (has value) | `--ox-border-default` | `--ox-bg-base` | `--ox-text-primary` | No special chrome — that's the whole point. |
| Read-only | `--ox-border-subtle` | `--ox-bg-muted` | `--ox-text-secondary` | Cursor `default`; selectable. |
| Disabled | `--ox-border-subtle` | `--ox-bg-muted` | `--ox-text-disabled` | Cursor `not-allowed`. |
| Error | `--ox-danger-border` + 1px `--ox-danger-fg` on focus | `--ox-danger-bg` (very subtle tint) | `--ox-text-primary` | Error message below uses `--ox-danger-fg`. |

**Transitions:** `border-color` and `box-shadow` only, `--ox-duration-base`
with `--ox-ease-default`. No bg transitions (causes flicker on hover when
the bg is already white).

---

## Affix slots (prefix / suffix icons)

Vuetify supports `prepend-inner` and `append-inner` slots. Use these for
icons that live *inside* the border. Use `prepend` / `append` only when the
adornment is structurally separate (e.g. a clickable currency button).

| Slot | Use | Spacing |
|------|-----|---------|
| `prepend-inner` | Leading icon (search, currency, lock). | 8px gap from left edge, 8px gap from value text. |
| `append-inner` | Trailing icon (clear ✕, dropdown ▾, password 👁, info ⓘ). | 8px gap from right edge, 8px gap from value text. |
| `prepend` / `append` | Structurally separate sibling control (rare). | 12px gap from the input border. |

- Icons are Lucide, 16px at sm/md, 20px at lg. See `icons.md`.
- Color: `--ox-text-muted` by default; bump to `--ox-text-secondary` on
  focus/hover of the input.
- Clear button (`append-inner`) only renders when there's a value AND the
  input isn't disabled/read-only. Use `<v-icon><X /></v-icon>` inside a
  Ghost icon-only button.

---

## Variants by use case

| Use case | What to render |
|----------|----------------|
| **Text** | `<v-text-field type="text" label="…">` |
| **Number** | `<v-text-field type="number" label="…">`. Add `.ox-numeric-tabular` class to keep digits aligned. |
| **Search** | `<v-text-field type="search" prepend-inner-icon>` — leading magnifier, trailing clear ✕ when has value. Often `size="lg"` on hero pages. |
| **Password** | `<v-text-field :type="show ? 'text' : 'password'">` with trailing eye toggle. |
| **Multiline** | `<v-textarea rows="4">` — same rules, `min-height: calc(rows * 20px + 12px)`. Auto-grow OK via `auto-grow` prop. |

**Don't use:**

- `v-otp-input` (we don't do code entry).
- `solo` / `filled` / `underlined` variants. All hand-rolled UIs.

---

## Vuetify mapping

| Spec concept | VTextField prop / class | Notes |
|--------------|--------------------------|-------|
| Outlined hairline box | `variant="outlined"` | Plus SASS override to flatten Material label-float. |
| Compact 32px height | (theme default) | `density: 'compact'` set globally on VTextField. |
| Label above | `label="…"` | SASS strips Material float animation. |
| Helper text | `:hint="…"` `persistent-hint` | |
| Error | `:error="bool"` `:error-messages="['…']"` | |
| Required | `:rules="[required]"` + visual `*` | Use a token (`--ox-danger-fg` for the asterisk). |
| Required attr (a11y) | `required` | Pass through. |
| Disabled | `disabled` | |
| Read-only | `readonly` | |
| Leading icon | `prepend-inner-icon` *(MDI legacy)* or slot | Prefer slot + Lucide for new code. |
| Clear button | `clearable` | Use only if you're OK with the default Material clear. Otherwise render your own append-inner. |

### Defaults to add in Phase 5

```js
VTextField: {
  variant: 'outlined',
  density: 'compact',
  hideDetails: 'auto',   // collapse helper-text row when empty
  color: 'primary',      // focus border = --ox-accent
}
VTextarea: {
  variant: 'outlined',
  density: 'compact',
  hideDetails: 'auto',
}
```

### Required SASS overrides

```scss
.v-text-field.v-text-field--outlined .v-field {
  --v-field-border-width: 1px;
  --v-field-border-color: var(--ox-border-default);
  background-color: var(--ox-bg-base);
  border-radius: var(--ox-radius-md);
  font-family: var(--ox-font-sans);
  font-size: var(--ox-type-label-size);   /* 13px */
  font-weight: var(--ox-weight-regular);  /* value is 400 */
  color: var(--ox-text-primary);
  min-height: var(--ox-height-md);
}

.v-text-field.v-text-field--outlined .v-field:hover {
  --v-field-border-color: var(--ox-border-strong);
}

.v-text-field.v-text-field--outlined .v-field--focused {
  --v-field-border-color: var(--ox-accent);
  box-shadow: var(--ox-focus-ring);
}

// Disable Material label float.
.v-text-field .v-label.v-field-label {
  position: static;
  transform: none !important;          // surgical — only on the label transform
  font-size: var(--ox-type-label-size);
  font-weight: var(--ox-weight-medium); // 500 for label
  color: var(--ox-text-primary);
  margin-bottom: var(--ox-space-1);
}

// Helper / error message row.
.v-text-field .v-messages {
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  color: var(--ox-text-tertiary);
  margin-top: var(--ox-space-1);
  min-height: 0;
}
.v-text-field.v-input--error .v-messages { color: var(--ox-danger-fg); }
```

**Surgical `!important` exception:** the one `transform: none !important`
above is the only `!important` we accept on inputs — Vuetify hardcodes the
label transform in an inline style during the float animation, and only
`!important` reliably wins. **Do not introduce additional `!important`
declarations on inputs.**

---

## Validation messaging

- **Error message is one short sentence.** No periods. Sentence case.
  Subject implicit ("Required" not "This field is required").
- **Trigger on blur** for typed fields. Submit-time validation only as a
  backstop. Live-as-you-type validation is allowed for unique-name checks
  and pattern matchers (email, URL).
- **Multiple errors:** show the *first* in the message row; expose the
  full list in a `v-tooltip` on a tiny ⚠ append-inner icon.
- **Server errors** map to the same error state (red border, red message).
  Don't render a separate "alert" element.

---

## Accessibility

- **Always pass `label`.** A placeholder is not a label.
- **Use the native `type` attribute** (`type="email"`, `type="tel"`,
  `type="number"`) — surfaces the right virtual keyboard on mobile.
- **`autocomplete` attribute** is on you — Vuetify forwards it to the
  underlying `<input>`. Common values: `email`, `current-password`,
  `new-password`, `name`, `username`.
- **Error association:** Vuetify wires `aria-invalid` and
  `aria-describedby` automatically when `error` / `error-messages` are set.
  Don't roll your own.
- **Focus styling** is via `:focus-visible` on the underlying `<input>`
  (not the wrapper) — the focus ring lands on the field, not the wrapper.

---

## Anti-patterns (auto-reject)

- ❌ Raw `<input>`. Use `<v-text-field>`.
- ❌ Placeholder as label (`placeholder="Email"` with no `label` prop).
  Fails a11y; ambiguous once filled.
- ❌ Floating-label animation. Theme strips it; do not re-enable per-call-site.
- ❌ `dense` (Vuetify v2 carry-over) — use `density` instead.
- ❌ Hardcoded `style="width: 220px"`. Use Vuetify grid or container max-width.
- ❌ Hex colors on borders (`#ddd`, `#ccc`). Token only.
- ❌ Custom shadow under the input. Inputs are flat.
- ❌ Background color other than `--ox-bg-base` / `--ox-bg-muted`.
- ❌ Multiple `!important` declarations (beyond the documented label transform).
- ❌ Building a search-with-icon by stacking `<v-text-field>` over an
  absolutely positioned `<v-icon>`. Use `prepend-inner` slot.

---

## Quick recipes

### Form text input (md, with label + helper)

```vue
<v-text-field
  v-model="name"
  label="Display name"
  hint="Shown on your public profile"
  persistent-hint
  autocomplete="name"
/>
```

### Search field (lg, leading icon, clearable)

```vue
<v-text-field
  v-model="query"
  size="large"
  type="search"
  label="Search works"
  placeholder="title, author, DOI…"
  clearable
>
  <template #prepend-inner>
    <v-icon><Search /></v-icon>
  </template>
</v-text-field>
```

### Password with eye toggle

```vue
<v-text-field
  v-model="password"
  :type="showPassword ? 'text' : 'password'"
  label="Password"
  autocomplete="current-password"
>
  <template #append-inner>
    <v-btn icon variant="text" size="small"
           :aria-label="showPassword ? 'Hide password' : 'Show password'"
           @click="showPassword = !showPassword">
      <v-icon><component :is="showPassword ? EyeOff : Eye" /></v-icon>
    </v-btn>
  </template>
</v-text-field>
```

### Error state

```vue
<v-text-field
  v-model="email"
  label="Email"
  type="email"
  autocomplete="email"
  :error="!isValidEmail"
  :error-messages="!isValidEmail ? ['Not a valid email'] : []"
  @blur="validateEmail"
/>
```

### Multiline

```vue
<v-textarea
  v-model="bio"
  label="Short bio"
  rows="4"
  auto-grow
  counter="280"
  hint="Markdown supported"
  persistent-hint
/>
```

---

## Open questions

- **Inline-edit inputs** (click a row to edit in place) — separate spec or
  recipe in this one? Lean: separate when we have ≥3 sites.
- **Numeric stepper** (up/down arrows) — Vuetify hides them on
  `type="number"`; if we need explicit stepper, that's a custom component
  not on the Phase 3 list. Defer.
- **Autocomplete vs Combobox vs Select** — covered in `select.md`.
