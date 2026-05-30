# Loading — Skeleton + Spinner

Component spec for loading affordances in openalex-gui. Two primitives:
**Skeleton** for known-shape content (rows, cards, lists), and
**Spinner** for unknown / point-action waits (button-internal, single
inline status). Consumes tokens from [`tokens.md`](../tokens.md).

**Vuetify components:** `v-skeleton-loader`, `v-progress-circular`,
`v-progress-linear`.
**Status against Vuetify:** skeleton needs heavy overrides (we change
the shimmer recipe + density entirely); spinner is acceptable with
defaults.

> **Default to Skeleton.** Spinners are a flag that you don't know
> what's coming. Skeletons tell the user "rows are coming; this is
> where they'll be," which is a stronger UX signal. Reach for a spinner
> only when (a) the action is point-in-time (saving a form) or (b) the
> output shape is fundamentally unknown.

---

## Decision matrix

| Situation | Use | Why |
|-----------|-----|-----|
| List / table / card grid is rendering | **Skeleton** | Holds layout; users can read the page chrome. |
| Form save / single in-flight mutation | **Spinner inside the button** (`:loading` prop) | Localized; doesn't replace surrounding UI. |
| Initial app boot / route shell | **Centered spinner** with `--ox-text-tertiary` | One time per session; fine. |
| Long-running batch progress | **Linear progress bar** with `:value` | Has a percentage; user wants a number. |
| Indeterminate progress (>3s) | **Linear progress bar indeterminate** | Tells the user "the system is working." |
| Inline status next to a row ("re-syncing") | **Inline spinner** + caption text | Caption explains; spinner spins. |

---

## Skeleton

A skeleton renders a **shape-mimicking placeholder** for content that
will arrive. The right skeleton uses the *exact* layout of the final
content — same rows, same widths, same hierarchy — so the page doesn't
jump.

### Anatomy

| Slot | Spec |
|------|------|
| Background | `--ox-bg-muted` |
| Highlight (shimmer) | gradient between `--ox-bg-muted` and `--ox-bg-emphasis` |
| Animation | `1500ms` linear infinite, translating gradient L→R |
| Element radius | matches the element it's replacing (text → `--ox-radius-xs` 4px, avatar → 50%, card → `--ox-radius-md` 8px) |
| Element height | matches the element it's replacing |

### Sizes

Three canonical text-line widths to make skeletons read as paragraphs:

| Class | Width | Use |
|-------|-------|-----|
| `.ox-skel-line--full` | 100% | First lines |
| `.ox-skel-line--3q` | 75% | Middle lines |
| `.ox-skel-line--half` | 50% | Last line of a paragraph |

Element heights match the type token they replace (`--ox-type-body-size`,
`--ox-type-label-size`, etc.).

### When to wrap with the Vuetify skeleton vs hand-rolled

- **`<v-skeleton-loader type="...">`** — for the standard recipes
  (`article`, `list-item`, `card`). Use when one of Vuetify's named
  types matches; we override the visuals via SASS.
- **`<div class="ox-skel-... ox-skel-shimmer">`** — for custom shapes
  (e.g. an entity detail header). The shimmer animation is the
  shared class.

Don't reach for either when the loading state lasts less than ~200ms —
the skeleton flash is worse than no skeleton. Use `:loading` prop on
the parent component if you can; otherwise debounce the skeleton
display.

---

## Spinner

A spinning ring. Used:

1. **Inside a button** while the button's action is in flight (handled
   by `<v-btn :loading>`; see [`button.md`](button.md)).
2. **Standalone, centered** during initial route boot (one per route,
   short-lived).
3. **Inline next to a label** for transient row-level work
   (re-syncing, retrying).

### Sizes

| Size | Diameter | Stroke | Where |
|------|----------|--------|-------|
| `xs` | 14px | 2px | Inline next to caption text |
| `sm` | 16px | 2px | Inside `xs`/`sm` buttons |
| `md` *(default)* | 24px | 2.5px | Standalone, inside `md` buttons |
| `lg` | 32px | 3px | Route boot, full-screen centered |

### Colors

| Surface | Spinner color |
|---------|---------------|
| Light bg (default) | `--ox-text-secondary` (deliberately not the accent — the accent is for actions, the spinner is just movement) |
| Dark / inverse bg (inside a toast or primary-filled button) | `--ox-bg-base` |
| Primary-button bg | `--ox-accent-on` |

### Motion

- Vuetify's default `v-progress-circular` animation is **kept as-is**.
- Indeterminate mode only. No determinate ring spinners — for
  determinate progress, use the linear bar.

---

## Linear progress bar

| Slot | Spec |
|------|------|
| Height | 2px (default), 4px for emphasis |
| Bar color | `--ox-accent` |
| Track color | `--ox-bg-emphasis` |
| Indeterminate animation | Vuetify default; do not customize |
| Radius | `--ox-radius-pill` on the bar |

Use:

- **Determinate** when an absolute number is meaningful ("68% imported"
  with a row count below).
- **Indeterminate** when an operation is taking > 3s and you have no
  percentage.

Don't use linear progress as a *replacement* for a skeleton on list
content — it's a top-of-page strip, not a layout holder.

---

## Density rules

- **One loading indicator per region.** Skeleton OR spinner OR
  progress bar; never two.
- **No "loading…" text** alongside a spinner. The spinner *is* the
  affordance.
- **No shimmer when the user is offline.** Detect offline state and
  show a static placeholder + retry — a shimmer animation implies
  imminent arrival.
- **Reserve animations for the topmost loading element.** Nested
  skeletons all shimmer in sync (the SASS class drives a single
  animation, not per-element).

---

## Vuetify mapping

| Spec | Vuetify | Notes |
|------|---------|-------|
| Skeleton (named recipe) | `<v-skeleton-loader type="article" />` | We restyle via SASS. |
| Skeleton (custom) | hand-rolled `<div class="ox-skel-…">` | Shared shimmer class. |
| Button spinner | `<v-btn :loading>` | Handled by `button.md`. |
| Standalone spinner | `<v-progress-circular indeterminate />` | Size + color via props. |
| Linear progress | `<v-progress-linear indeterminate />` or `<v-progress-linear :model-value="..." />` | |

### Defaults to add in Phase 5

```js
VSkeletonLoader: {
  // we provide bgColor / loadingText via SASS
  boilerplate: false,
  elevation: 0,
},
VProgressCircular: {
  size: 24,
  width: 2.5,
  indeterminate: true,
  color: 'text-secondary',
},
VProgressLinear: {
  color: 'primary',
  bgColor: 'bg-emphasis',
  height: 2,
  rounded: true,
  indeterminate: false,
},
```

### Required SASS overrides

```scss
// Shared shimmer animation class (used by both v-skeleton-loader bones
// and hand-rolled ox-skel-* shapes).
@keyframes ox-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.ox-skel-shimmer,
.v-skeleton-loader .v-skeleton-loader__bone {
  background: linear-gradient(
    90deg,
    var(--ox-bg-muted) 0%,
    var(--ox-bg-emphasis) 50%,
    var(--ox-bg-muted) 100%
  );
  background-size: 200% 100%;
  animation: ox-shimmer 1500ms linear infinite;
}

// Skeleton line widths.
.ox-skel-line {
  height: var(--ox-type-body-size);
  border-radius: var(--ox-radius-xs);
}
.ox-skel-line + .ox-skel-line { margin-top: var(--ox-space-2); }
.ox-skel-line--full { width: 100%; }
.ox-skel-line--3q   { width: 75%; }
.ox-skel-line--half { width: 50%; }

// Skeleton avatar / card shapes.
.ox-skel-avatar { width: 32px; height: 32px; border-radius: 50%; }
.ox-skel-card   { width: 100%; height: 120px; border-radius: var(--ox-radius-md); }

// Override Vuetify v-skeleton-loader to use our shimmer + token colors.
.v-skeleton-loader {
  background: transparent;
  padding: 0;
}

// Spinner color when on dark/inverse surface.
.ox-toast .v-progress-circular { color: var(--ox-bg-base); }

// Reduced-motion preference — disable shimmer.
@media (prefers-reduced-motion: reduce) {
  .ox-skel-shimmer,
  .v-skeleton-loader .v-skeleton-loader__bone {
    animation: none;
    background: var(--ox-bg-muted);
  }
}
```

### What we don't touch

- Vuetify's accessibility props on progress components
  (`aria-valuenow` for determinate progress).
- The default `v-progress-circular` SVG rotation animation.

---

## Anti-patterns (auto-reject)

- ❌ A spinner where a skeleton would tell the user *what* is coming.
- ❌ A full-page spinner on a route change when only one section needs
  to refresh. Localize.
- ❌ Multiple spinners on one screen.
- ❌ A skeleton + spinner together for the same region.
- ❌ Skeleton on text input keystroke (instant operations don't need a
  spinner *or* a skeleton).
- ❌ Skeletons that don't match the final content's shape (e.g. 3-line
  skeleton, then a 7-line article appears). Match the shape.
- ❌ Endless skeletons (no timeout, no error). Pair with a 30s
  timeout + a retry alert.
- ❌ A custom shimmer animation per call-site.
- ❌ Progress bars at the bottom of the page (they belong at the top
  of the affected region).
- ❌ Determinate progress with a fake-progress timer ("simulate 80%
  done while we wait for the backend"). Either you have a real number
  or you use indeterminate.
- ❌ `!important` on any loading rule.

---

## Accessibility

- Skeletons set `aria-busy="true"` on their parent (Vuetify handles
  this on `<v-skeleton-loader>`); when content arrives, the parent's
  `aria-busy` is `false`.
- Standalone spinners set `role="status"` + visually-hidden text
  ("Loading…") — Vuetify v3 wraps progress in a `role="progressbar"`
  with `aria-valuenow`/`aria-valuemax` for determinate progress.
- **Avoid `aria-live="polite"` on the loader region** — the user is
  already aware loading is happening. Instead, announce *completion*
  via the toast that fires after.
- Reduced-motion preference disables shimmer + spinner animations
  (the SASS layer does this).

---

## Quick recipes

### Skeleton row for a table

```vue
<v-table>
  <thead>...</thead>
  <tbody>
    <tr v-if="loading" v-for="i in 5" :key="i">
      <td v-for="col in cols" :key="col">
        <div class="ox-skel-line ox-skel-line--full" />
      </td>
    </tr>
    <tr v-else v-for="row in rows" :key="row.id">...</tr>
  </tbody>
</v-table>
```

### Skeleton card list

```vue
<div v-if="loading" class="ox-card-grid">
  <div v-for="i in 6" :key="i" class="ox-skel-card ox-skel-shimmer" />
</div>
<div v-else class="ox-card-grid">
  <Card v-for="item in items" :key="item.id" :item="item" />
</div>
```

### Button with inline spinner (handled by Vuetify)

```vue
<v-btn :loading="isSaving" variant="flat" color="primary" @click="save">Save</v-btn>
```

### Standalone centered spinner (route boot)

```vue
<div v-if="isBooting" class="ox-loading-shell">
  <v-progress-circular indeterminate size="32" color="text-secondary" />
</div>
```

```scss
.ox-loading-shell {
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: var(--ox-bg-base);
}
```

### Top-of-page linear progress

```vue
<v-progress-linear v-if="isFetching" indeterminate height="2" color="primary" />
```

---

## Open questions

- **Pull-to-refresh** on mobile — out of scope. If we ship a mobile-first
  surface (Phase 7 pilot), revisit and add a recipe here.
- **"Show 25 more" partial loading** — pattern lives at the bottom of a
  list / table; renders as a button that switches to a spinner. Use
  `<v-btn :loading>`; no new spec needed.
- **Stream rendering of long search results** — likely a separate
  "infinite scroll" pattern that pairs a skeleton row at the bottom
  with an intersection observer. Defer to a future spec.
