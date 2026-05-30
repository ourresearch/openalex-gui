# Alert (Banner)

Component spec for persistent status surfaces in openalex-gui. Consumes
tokens from [`tokens.md`](../tokens.md); icon rules from
[`icons.md`](../icons.md). Compare with [`toast.md`](toast.md) for
transient confirmations and [`dialog.md`](dialog.md) for blocking
prompts.

**Vuetify component:** `v-alert`.
**Status against Vuetify:** use with overrides — Vuetify's default
alert is Material-tinted (saturated background, big icons); we want a
GitHub-style tinted-left-border banner.

> An Alert is a persistent message tied to a page, section, or form.
> The user must fix the cause or dismiss it. If the message
> auto-disappears in seconds, it's a Toast. If the user must decide
> before continuing, it's a Dialog.

---

## When to use what

| Surface | Use |
|---------|-----|
| **Alert / Banner** (this) | Persistent status — quota warnings, deprecation notices, form-level validation summary, "this resource is read-only" |
| **Toast** ([`toast.md`](toast.md)) | Transient confirmation of background action |
| **Dialog** ([`dialog.md`](dialog.md)) | User must respond before continuing |
| **Inline field error** | Tied to a single form field — handled by Input / Select specs |

---

## Severities

| Severity | Icon (Lucide) | Border / icon color | Background | Use |
|----------|---------------|---------------------|------------|-----|
| `info` *(default)* | `<Info />` | `--ox-info-fg` (`#0969da`) | `--ox-info-bg` (`#ddf4ff`) | Neutral context — "Read-only view", "API key required for this feature" |
| `success` | `<CheckCircle2 />` | `--ox-success-fg` (`#1a7f37`) | `--ox-success-bg` (`#dafbe1`) | Multi-step completed — "Import finished. 12 errors." Rare; success usually toasts. |
| `warning` | `<AlertTriangle />` | `--ox-warning-fg` (`#9a6700`) | `--ox-warning-bg` (`#fff8c5`) | Quota near limit, deprecation, behavior change |
| `error` | `<XCircle />` | `--ox-danger-fg` (`#cf222e`) | `--ox-danger-bg` (`#ffebe9`) | Failure / blocker — "Could not load. Some filters are unavailable." |

- These are the **GitHub semantic palette** (re-tuned in tokens.md;
  Linear's light-mode semantics were too sparse to use directly).
- The surface is a **tinted background + 1px tinted border** —
  GitHub-style, *not* a left accent stripe. Linear doesn't use accent
  stripes either; we explicitly reject them.
- Always show the icon — it carries the semantic redundantly with the
  color for accessibility.

---

## Anatomy

```
+--------------------------------------------------------------+
| ⚠  Title (optional)                                     ✕    |
|    Body copy line 1.                                         |
|    Body copy line 2 with [inline link].                      |
|    [Primary action]   [Secondary action]                     |
+--------------------------------------------------------------+
```

| Slot | Notes |
|------|-------|
| **Icon** | Lucide 16px (sm/md) or 20px (lg). Color = severity foreground. Required. |
| **Title** | Optional. `--ox-type-label` (13/500) **bold form**: weight `--ox-weight-semibold`. Same color as body text. |
| **Body** | `--ox-type-body` (14/400) `--ox-text-primary`. Can include inline links + bold spans. Multi-line allowed. |
| **Actions** | 0–2 buttons in the bottom-row slot. Use `<v-btn variant="text">` sized `sm`. **Never** Primary inside a colored alert — the alert already provides emphasis. |
| **Close (✕)** | Optional top-right dismiss button (Ghost icon-only). Required for `warning`/`error` if dismissable; omit for non-dismissable status. |

---

## Sizes

Two sizes; one density.

| Size | Padding | Icon | When |
|------|---------|------|------|
| **sm** | `--ox-space-2` (8px) Y / `--ox-space-3` (12px) X | 16px | Inline / form-level summary at the top of a card |
| **md** *(default)* | `--ox-space-3` (12px) Y / `--ox-space-4` (16px) X | 16px | Page-level banners — top of a route, top of a section |
| **lg** *(rare)* | `--ox-space-4` (16px) Y / `--ox-space-5` (20px) X | 20px | Empty-state-class banners ("This dataset is paused — request access") |

---

## States

| State | Treatment |
|-------|-----------|
| **Default** | bg = severity bg, border = severity fg @ 1px, text = `--ox-text-primary` |
| **Hover on actions / close** | inherit button hover from [`button.md`](button.md) ghost variant |
| **Focus on actions / close** | `--ox-focus-ring` |
| **Dismissed** | unmount via `v-if`; do not animate height collapse (jumps page layout) |
| **Loading** *(while a fix is running)* | put a spinner *next to* the action button, do not replace the alert |

- Hover/focus do **not** change the alert surface itself — only the
  affordances inside it.

---

## Position

- **Top of the page or section** it concerns, flush to the chrome
  above. Don't float, don't fix, don't stick.
- **One alert at a time per region.** If two would apply, escalate to
  the higher severity (`error` > `warning` > `info`) and merge the
  message. Multiple alerts stacking is the strongest signal of a
  product that lost its UX nerve.
- Inside a `<v-card>`: alert lives **above** the card body, below the
  card title. Padding matches `--ox-card-padding` (16px sides).
- On mobile (<600px): full-width, no rounding on the outer edges.

---

## Radius / shadow

- `--ox-radius-md` (8px) for standalone alerts.
- `--ox-radius-none` (0) for full-bleed page-top banners (e.g. "OpenAlex
  is in maintenance mode" — site-wide).
- **No shadow.** Alerts sit on the page; they don't float.

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Severity | `type="info|success|warning|error"` | Drives Vuetify's `color`; we override the bg/border via SASS. |
| Title | `:title="..."` or `<template #title>` | Slot for icon-augmented titles. |
| Icon | inherits from `type` | We swap MDI for Lucide via global icon set; meanwhile the legacy MDI rendering is acceptable. |
| Dismissable | `closable` boolean | Renders the ✕. |
| Variant | `variant="tonal"` *(theme default)* | Tonal is the Vuetify variant that uses bg + border; matches our spec. |
| Density | n/a | We override padding via size class. |
| Custom action | default slot or `<template #append>` | Render `<v-btn>` siblings. |

### Defaults to add in Phase 5

```js
VAlert: {
  variant: 'tonal',
  density: 'comfortable',
  border: 'start',                // hint that left border could be used; SASS draws around the full perimeter actually
  closable: false,
},
```

### Required SASS overrides

```scss
.v-alert {
  border-radius: var(--ox-radius-md);
  font: var(--ox-weight-regular) var(--ox-type-body-size)/1.5 var(--ox-font-sans);
  color: var(--ox-text-primary);
  padding: var(--ox-space-3) var(--ox-space-4);
  box-shadow: none;
}

// Backgrounds + borders per severity (overrides Vuetify's tonal recipe).
.v-alert--variant-tonal.v-alert--type-info    { background: var(--ox-info-bg);    border: 1px solid var(--ox-info-fg); }
.v-alert--variant-tonal.v-alert--type-success { background: var(--ox-success-bg); border: 1px solid var(--ox-success-fg); }
.v-alert--variant-tonal.v-alert--type-warning { background: var(--ox-warning-bg); border: 1px solid var(--ox-warning-fg); }
.v-alert--variant-tonal.v-alert--type-error   { background: var(--ox-danger-bg);  border: 1px solid var(--ox-danger-fg); }

// Icon colors match the border.
.v-alert--type-info    .v-alert__prepend > .v-icon { color: var(--ox-info-fg); }
.v-alert--type-success .v-alert__prepend > .v-icon { color: var(--ox-success-fg); }
.v-alert--type-warning .v-alert__prepend > .v-icon { color: var(--ox-warning-fg); }
.v-alert--type-error   .v-alert__prepend > .v-icon { color: var(--ox-danger-fg); }

.v-alert__prepend > .v-icon { font-size: 16px; }   // Lucide stroke set elsewhere

// Title weight; Vuetify uses 500 by default — we want semibold for the title row.
.v-alert-title { font-weight: var(--ox-weight-semibold); font-size: var(--ox-type-label-size); }

// Kill the Material accent stripe on the inline border.
.v-alert--border .v-alert__border { display: none; }

// Close button (Ghost icon-only).
.v-alert__close .v-btn {
  --v-btn-color: var(--ox-text-secondary);
  background: transparent;
}
.v-alert__close .v-btn:hover { background: rgba(0,0,0,0.04); }

// Action row: bottom-padded; use --ox-space-2 gap.
.v-alert-actions, .ox-alert-actions {
  margin-top: var(--ox-space-2);
  display: flex;
  gap: var(--ox-space-2);
}
```

### What we don't touch

- Vuetify's transition wrapper (the slide-down on insert) — we set
  `v-if` and let Vuetify's default fade play. Don't add custom motion.
- `role="alert"` mapping (set by Vuetify on `error` severity).

---

## Anti-patterns (auto-reject)

- ❌ Stacking 3 alerts on the same page. Merge into one of the highest
  severity.
- ❌ A floating / fixed-positioned alert. Alerts are placed in the
  document flow.
- ❌ Saturated background (Vuetify's `variant="flat"` `color="error"`)
  — produces a Material red box. Use tonal.
- ❌ Alert as a stand-in for a toast (auto-dismissing alert).
- ❌ Alert as a stand-in for a dialog (alert with a Cancel + Confirm
  action — that's a prompt, not a status).
- ❌ A success alert for an action the user just completed. Use a toast.
- ❌ An alert that contains a form. Wrap the form in a card; put the
  alert inside the card at the top.
- ❌ `<div class="alert alert-warning">` Bootstrap-style hand-roll.
- ❌ `<v-alert>` with `border` prop set to a side that isn't `start`
  *and* a tonal variant — Material's left accent stripe; we kill it via
  SASS but the convention should be: don't set the `border` prop.

---

## Accessibility

- `role="alert"` for `error` (Vuetify sets this automatically when
  `type="error"`); `role="status"` for others.
- Title + body are read together — keep the body short enough to be
  consumed in one breath by a screen reader.
- The close button has `aria-label="Dismiss <severity> alert"` (Vuetify
  sets `aria-label="Close"` by default; override per Lucide icon-only
  rules in [`icons.md`](../icons.md)).
- When an alert is **dismissable**, the close button is the *last* tab
  stop in the alert — don't put it before the actions.

---

## Quick recipes

### Page-level info banner (read-only resource)

```vue
<v-alert
  type="info"
  title="Read-only view"
  closable
>
  This collection was shared with you. To edit, ask the owner to add you.
</v-alert>
```

### Warning with an action

```vue
<v-alert type="warning" title="Approaching API credit limit">
  You've used 92% of this month's credits. Upgrades take effect immediately.
  <template #append>
    <v-btn variant="text" size="small" :to="{ name: 'billing' }">Upgrade…</v-btn>
  </template>
</v-alert>
```

### Form-level error summary

```vue
<v-alert v-if="errors.length" type="error" title="Couldn't save">
  <ul>
    <li v-for="e in errors" :key="e.field">{{ e.field }}: {{ e.message }}</li>
  </ul>
</v-alert>
```

### Full-bleed maintenance banner (site-wide)

```vue
<v-alert
  type="warning"
  class="ox-alert--full-bleed"
  :closable="false"
>
  OpenAlex is in maintenance mode. Some search results may be stale.
</v-alert>
```

```scss
.ox-alert--full-bleed {
  border-radius: 0;
  border-inline: 0;
}
```

---

## Open questions

- Multi-alert stacking strategy for the rare cases where two
  *different* severities genuinely apply (e.g. deprecation warning + a
  read-only info). Tentatively: still pick one (the higher), and
  surface the other inside the resolution. Revisit only if Phase 7
  pilot turns up an unsolvable case.
- "Subtle" alert variant (border-only, no fill) — discussed in Phase 1
  but not adopted. If a need arises, add as a `variant="outlined"`
  override; defer until then.
