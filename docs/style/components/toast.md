# Toast (Snackbar)

Component spec for transient status messages in openalex-gui. Consumes
tokens from [`tokens.md`](../tokens.md); icon rules from
[`icons.md`](../icons.md).

**Vuetify component:** `v-snackbar`.
**Status against Vuetify:** use with overrides — Vuetify's defaults are
near-acceptable, but the position, motion, surface, and timeout
conventions need to be pinned so toasts don't drift into a sea of
custom recipes.

> A toast confirms a *background* outcome ("Saved.", "Copied link.",
> "Failed to fetch"). It is **never** the primary affordance for a
> destructive or irreversible action — that's a Dialog. If the user
> needs to *do something* with the message, it isn't a toast.

---

## When to use what

| Surface | Use |
|---------|-----|
| **Toast** (this) | Transient confirmation of a completed background action; auto-dismisses; optional single Undo / Retry action |
| **Alert / Banner** ([`alert.md`](alert.md)) | Persistent status tied to the page or a section; user must dismiss or fix the cause |
| **Dialog** ([`dialog.md`](dialog.md)) | The user must decide before continuing |

If you're about to ship a toast that lives longer than 10 seconds with
multiple actions, **it's an Alert.** Stop and refactor.

---

## Anatomy

```
+-----------------------------------------+
| ✓  Saved.                Undo      ✕    |
+-----------------------------------------+
```

- Single horizontal row: leading status icon, message, optional action
  button, optional close (✕).
- **Single message per toast.** No multi-paragraph copy. ≤80 characters
  recommended; hard cap at 140.
- **Optional single action** ("Undo", "Retry", "Open"). Two-action
  toasts are forbidden — it's a Dialog.

---

## Severities

| Severity | Icon (Lucide 16px) | Use | Auto-dismiss |
|----------|--------------------|-----|--------------|
| `success` *(default)* | `<Check />` | "Saved.", "Copied link.", "Imported 12 rows." | 4s |
| `info` | `<Info />` | Background fact the user did not initiate. Rare; prefer no toast. | 4s |
| `warning` | `<AlertTriangle />` | "Rate limit nearly reached." | 6s |
| `error` | `<XCircle />` | "Save failed." (always pair with a Retry action.) | **never** (sticky until dismissed) |

- The icon color is the only severity tint on the surface — **the
  background stays dark inverse** (see Surface, below). No green-tinted
  success toast, no red-tinted error toast.
- Error toasts are **sticky** (`:timeout="-1"`) and always carry a
  Retry action or a link to the failure detail.

---

## Surface

**Inverse / dark surface** — the toast is the one place in light mode
where we paint dark. This is intentional: the inverse contrast is what
makes it readable when overlaid on top of an arbitrary page.

| Token | Value |
|-------|-------|
| Background | `--ox-text-primary` (≈ `#181919`) |
| Text | `--ox-bg-base` (≈ `#ffffff`) |
| Icon (success) | `#34d399` (chroma 0 paired with green hue — fine; this is the only place we tint) |
| Icon (info) | `#60a5fa` |
| Icon (warning) | `#fbbf24` |
| Icon (error) | `#f87171` |
| Action button | `variant="text"` on inverse bg → see SASS override |
| Radius | `--ox-radius-md` (8px) |
| Padding | `--ox-space-3` (12px) on Y, `--ox-space-4` (16px) on X |
| Min width | 280px |
| Max width | 480px |
| Elevation | `--ox-elev-3` (floating callout) |
| Font | `--ox-type-label` (13/500) |

The dark surface is **not** a "dark mode" — it's a single component
choice. Don't promote this palette into other components.

---

## Position

- **Bottom center**, `--ox-space-6` (24px) above the viewport bottom.
- On mobile (<600px), bottom-edge with `--ox-space-4` (16px) gutters
  and `width: calc(100vw - 32px)`.
- **Never** top, top-right, or corner-floating. The bottom-center
  position is a hard rule — agents reach for top-right out of habit
  and it always reads as a Material clone.
- **Stacking**: at most **one toast at a time**. If a second toast
  fires, replace the first; queue is forbidden (multiple toasts is the
  classic Bad Toast Anti-Pattern).

---

## Motion

| Phase | Tokens |
|-------|--------|
| Enter | translateY(8px) → 0, opacity 0 → 1; `--ox-duration-base` (150ms) `--ox-ease-base` |
| Exit | reverse; `--ox-duration-base` (150ms) `--ox-ease-base` |
| Hover | pause timeout; resume on leave |

- **Pointer hover and keyboard focus both pause the auto-dismiss
  timer**. This is the only acceptable interaction. Drag-to-dismiss is
  not in scope.

---

## Dismiss

- **Auto-dismiss** per severity table above (timer pauses on hover/focus).
- **Close affordance**: optional `✕` button at far right — required for
  `warning` and `error`; allowed for `success`/`info` if the action
  isn't `Undo`. (`Undo` already gives the user agency — no need for ✕.)
- **Escape** dismisses the focused toast.
- **Action click** dismisses the toast as a side-effect (no separate
  close click required).

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Show/hide | `v-model="show"` | Boolean. |
| Auto-dismiss timeout | `:timeout="4000"` / `-1` for sticky | ms; `-1` = no auto-dismiss. |
| Position | `location="bottom"` | Bottom-center is the Vuetify default for `location="bottom"` when no `start`/`end`. |
| Severity tint | n/a — we ignore Vuetify's `color="success"` etc. | We always paint inverse; severity drives only the icon color. |
| Action | `<template #actions>` | Render a single `<v-btn variant="text">`. |
| Close button | append `<v-btn icon variant="text">` inside actions | See recipes. |
| Multi-line | n/a | Forbidden; single-line surface only. |

### Defaults to add in Phase 5

```js
VSnackbar: {
  location: 'bottom',
  timeout: 4000,
  variant: 'flat',
  // we override the surface entirely via SASS; color="" is left default
},
```

### Required SASS overrides

```scss
.v-snackbar .v-snackbar__wrapper {
  background: var(--ox-text-primary);   // inverse
  color: var(--ox-bg-base);
  border-radius: var(--ox-radius-md);
  box-shadow: var(--ox-elev-3);
  min-width: 280px;
  max-width: 480px;
  padding: 0;                            // we re-pad inside .ox-toast-row
}

.v-snackbar__content {
  padding: var(--ox-space-3) var(--ox-space-4);
  font: var(--ox-weight-medium) var(--ox-type-label-size)/1.4 var(--ox-font-sans);
  display: flex;
  align-items: center;
  gap: var(--ox-space-2);
}

.v-snackbar__actions { padding-inline-end: var(--ox-space-2); }

.v-snackbar__actions .v-btn {
  color: var(--ox-bg-base);              // inverse text
  font-weight: var(--ox-weight-medium);
}
.v-snackbar__actions .v-btn:hover {
  background: rgba(255,255,255,0.08);
}

// Severity icon colors (set via wrapper class on the snackbar).
.ox-toast--success .ox-toast-icon { color: #34d399; }
.ox-toast--info    .ox-toast-icon { color: #60a5fa; }
.ox-toast--warning .ox-toast-icon { color: #fbbf24; }
.ox-toast--error   .ox-toast-icon { color: #f87171; }
```

### What we don't touch

- Vuetify's portal mounting + z-index management (`v-overlay-container`).
- ARIA: Vuetify sets `role="status"` for non-error and `role="alert"`
  for error severities when configured; we add `aria-live="polite"`
  via class hook for success/info, `assertive` for warning/error.

---

## API (helper, not raw)

Direct `<v-snackbar>` usage works, but is verbose and easy to drift on.
Phase 5 ships a `useToast()` composable:

```ts
import { useToast } from '@/composables/useToast'

const toast = useToast()
toast.success('Saved.')
toast.error('Save failed.', { action: { label: 'Retry', onClick: save } })
toast.warning('Approaching rate limit.', { timeout: 8000 })
```

The composable renders **one** singleton `<v-snackbar>` mounted at the
app root. All call-sites go through it. This eliminates the "every
component renders its own snackbar" pattern the Phase 1 audit flagged.

---

## Anti-patterns (auto-reject)

- ❌ Top-right toast positioning.
- ❌ Multiple toasts on screen at once. One only.
- ❌ Tinted background per severity (green / red / yellow surface).
  Inverse only.
- ❌ A toast with two actions. That's a Dialog.
- ❌ A toast as the *only* indication a destructive action happened.
  Pair with an Undo, or use a Dialog upfront.
- ❌ A toast longer than 140 chars. Truncate, or use an Alert.
- ❌ Manual `setTimeout(() => show = false, 4000)` — use the `timeout`
  prop / `useToast()` composable.
- ❌ Hand-rolled `<div class="toast">…</div>` — every existing instance
  (Phase 1 audit found 3) refactors to `useToast()`.
- ❌ `!important` on any snackbar rule.

---

## Accessibility

- `aria-live="polite"` for `success`/`info`, `assertive` for
  `warning`/`error` (the composable wires this).
- Toasts are **focusable**: Tab moves into the toast, Esc dismisses, Tab
  out returns focus to the previously-focused element. Vuetify handles
  this when `:timeout="-1"` (sticky). For auto-dismiss success toasts
  we *don't* steal focus.
- The action button is a real `<v-btn>` — keyboard-activatable.
- Icon has `aria-hidden="true"`; the visible text + severity is what
  screen readers announce.

---

## Quick recipes

### Success after save (composable)

```ts
await saveSearch()
toast.success('Saved search "Climate change works".')
```

### Error with Retry

```ts
try {
  await exportCsv()
  toast.success('Export ready. Check downloads.')
} catch (e) {
  toast.error('Export failed.', {
    action: { label: 'Retry', onClick: exportCsv },
  })
}
```

### Undo after destructive

```ts
const previous = deleteRow(id)
toast.success('Row deleted.', {
  action: { label: 'Undo', onClick: () => restoreRow(previous) },
})
```

### Raw `<v-snackbar>` (only for edge cases; prefer composable)

```vue
<v-snackbar v-model="show" :timeout="-1" class="ox-toast--error" location="bottom">
  <div class="ox-toast-row">
    <v-icon class="ox-toast-icon"><XCircle /></v-icon>
    <span>Save failed.</span>
  </div>
  <template #actions>
    <v-btn variant="text" @click="retry">Retry</v-btn>
    <v-btn icon variant="text" aria-label="Dismiss" @click="show = false">
      <v-icon><X /></v-icon>
    </v-btn>
  </template>
</v-snackbar>
```

---

## Open questions

- A queue model with stacking (offset multiple toasts) — explicitly
  rejected for this job; would only enable spam. Revisit if/when a
  long-running job needs progress + result toasts in close succession
  (use an Alert instead).
- Tap-to-dismiss on mobile — pending Phase 7 pilot feedback.
