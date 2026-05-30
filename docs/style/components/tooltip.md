# Tooltip

Component spec for tooltips in openalex-gui. Consumes tokens from
[`tokens.md`](../tokens.md), text rules from
[`typography.md`](../typography.md).

**Vuetify component:** `v-tooltip`.
**Status against Vuetify:** use with overrides — Vuetify's defaults are
acceptable in shape but need a Linear-style inverse surface and a
shorter delay than the Material default.

> A tooltip clarifies *what* a control is. If users need to read more
> than ~6 words to understand a button, the button label is wrong — fix
> the label, don't lean harder on the tooltip. Tooltips are required on
> **every icon-only button** (see [`icons.md`](../icons.md) and
> [`button.md`](button.md)).

---

## When tooltips MUST exist

1. **Every icon-only button.** No exceptions. The tooltip carries the
   accessible name shown to mouse / hover users; `aria-label` carries
   the same name for screen readers.
2. **Truncated text** (single-line ellipsis). The full text is the
   tooltip body.
3. **Abbreviations** that the audience may not know on first sight —
   "RAS", "OA", "DOI" the first time it appears on a new page.
4. **Keyboard shortcuts** for actions that have one — the shortcut is
   rendered as a `<kbd>` chip inside the tooltip body.
5. **Status-icon meaning** (a tiny status dot or icon without a label).

## When tooltips MUST NOT exist

- ❌ As the **only** way to discover required information. A tooltip is
  a hint, not documentation.
- ❌ On a **text button** whose label is already the action verb.
  "Save" doesn't need a "Click to save" tooltip.
- ❌ On a `<v-text-field>` to explain what the field is — that's what
  the label and `hint` props are for.
- ❌ Containing interactive content (links, buttons, forms). Use a
  `<v-menu>` (Popover) for that.
- ❌ Containing multi-paragraph copy. If you need that, it's a Popover
  or a Drawer.
- ❌ Pinned open. A tooltip is hover-driven by definition.

---

## Anatomy

```
+-------------------------+
| Tooltip body text       |
+-------------------------+
            ▲             <- 4px caret pointing to the trigger
       [ Trigger ]
```

| Slot | Spec |
|------|------|
| Background | `--ox-text-primary` (≈ `#181919`) — **inverse / dark surface** (same palette as Toast) |
| Text | `--ox-bg-base` (`#ffffff`) |
| Font | `--ox-type-caption` (12/500), line-height 1.4 |
| Padding | `--ox-space-1_5` (6px) Y / `--ox-space-2` (8px) X |
| Radius | `--ox-radius-sm` (6px) |
| Border | none |
| Shadow | `--ox-elev-2` (subtle floating elevation) |
| Max width | 240px |
| Caret | 4px triangle in `--ox-text-primary`, optional |

- **No caret by default.** Vuetify v3 doesn't render one; we keep it
  off. Caret is allowed for the rare "explicitly tied to a tiny target"
  case (e.g. a status dot) but not the default.
- **Single-line for ≤32 chars.** Don't force wrap; let Vuetify
  auto-wrap at the 240px max-width.

---

## Position

| `location` prop | When |
|-----------------|------|
| `bottom` *(default)* | Most controls — keeps the tooltip away from the cursor and the click target. |
| `top` | When the control lives near the bottom of a scroll container (would otherwise clip). |
| `start` / `end` | Icon-only buttons in a vertical stack (sidebar nav at rail-width). |
| `right` / `left` | Avoid. Vuetify v3 uses `start` / `end` (RTL-aware) — match. |

- **Offset from trigger:** `--ox-space-1_5` (6px) gap on all positions.
- **Auto-flip on collision** — Vuetify handles this with `<v-overlay>`'s
  collision strategy; leave defaults.

---

## Timing

| Phase | Tokens |
|-------|--------|
| Open delay | 300ms (Linear-ish; faster than Vuetify's 500ms default) |
| Close delay | 0ms — closes immediately on mouseleave |
| Fade in | opacity 0 → 1, `--ox-duration-fast` (120ms) `--ox-ease-base` |
| Fade out | opacity 1 → 0, `--ox-duration-fast` (120ms) `--ox-ease-base` |

- **Skip the delay when chaining tooltips** — Vuetify's
  `:open-on-focus` and overlay-stickiness handle this automatically;
  do not set `open-delay="0"` per-call.
- **Keyboard focus opens the tooltip immediately** (no 300ms delay).
  Vuetify v3 supports this with `open-on-focus="true"` (default).

---

## States

| State | Treatment |
|-------|-----------|
| Default | inverse surface as above |
| With kbd hint | text + `<kbd class="ox-kbd ox-kbd--inverse">` (lighter border so it reads on dark) |
| With truncation source | `text: <full-content>`; if it equals the visible text, suppress |
| Error variant | n/a — tooltips don't carry severity. If you need an error explanation, use field-level `error-messages` on the Input. |

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Show on hover | (default) | `<v-tooltip>` is hover-driven out of the box. |
| Location | `location="bottom"` etc. | See table above. |
| Delay | `:open-delay="300"` `:close-delay="0"` | Override globally via defaults. |
| Text content | `text="..."` prop OR default slot for rich content | Prefer the prop; use slot only for `<kbd>` chips. |
| Activator | `<template #activator="{ props }">` | Bind to the trigger. Don't use the deprecated `activator` shorthand. |
| Persistent | n/a | Forbidden. |
| Disabled | `:disabled="..."` | Use when the tooltip text varies and is sometimes empty. |

### Defaults to add in Phase 5

```js
VTooltip: {
  location: 'bottom',
  openDelay: 300,
  closeDelay: 0,
  transition: 'fade-transition',
  contentClass: 'ox-tooltip',
},
```

### Required SASS overrides

```scss
.v-tooltip > .v-overlay__content,
.ox-tooltip {
  background: var(--ox-text-primary);   // inverse
  color: var(--ox-bg-base);
  font-family: var(--ox-font-sans);
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  line-height: 1.4;
  padding: var(--ox-space-1_5) var(--ox-space-2);
  border-radius: var(--ox-radius-sm);
  box-shadow: var(--ox-elev-2);
  max-width: 240px;
  letter-spacing: 0;
  text-transform: none;
  pointer-events: none;       // strictly hint; never interactive
}

// Inverse Kbd inside a tooltip — lighter border so it reads on dark.
.ox-tooltip .ox-kbd--inverse {
  background: rgba(255,255,255,0.08);
  border: 0.5px solid rgba(255,255,255,0.24);
  color: var(--ox-bg-base);
}
```

### What we don't touch

- Vuetify's overlay portal mounting.
- Collision avoidance / auto-flip math.
- `aria-describedby` wiring on the activator (Vuetify v3 handles this).

---

## Anti-patterns (auto-reject)

- ❌ Tooltip on a labeled button. ("Save" already says save.)
- ❌ Tooltip containing a link or another button.
- ❌ Tooltip pinned open (`:model-value="true"`). It's a hover hint.
- ❌ Tooltip with body > 100 characters. Move to a Popover / Drawer.
- ❌ Tooltip as the **only** explanation of an icon — `aria-label` must
  also be set on the trigger.
- ❌ Custom CSS on a `<v-tooltip>` to make a "rich card popover". Use
  `<v-menu>` for that.
- ❌ Light-mode tooltip surface (matching the page bg). Inverse only.
- ❌ Tooltip on a disabled button. (Vuetify's overlay won't fire on a
  natively-disabled button; if you really need the explanation, wrap
  the disabled state with the tooltip activator and apply
  `pointer-events: none` to the inner button — but reconsider whether
  the disabled state itself is the right pattern.)
- ❌ `!important` on any tooltip rule.

---

## Accessibility

- Tooltip text is read **in addition** to the trigger's accessible
  name. The trigger needs its own `aria-label` (or visible text); the
  tooltip is `aria-describedby`-linked by Vuetify.
- Pressing **Escape** closes the tooltip when triggered by focus.
- Tooltips are **never** the source of unique information. Anything
  that the user *must* know is also in the visible UI.
- A keyboard-focused trigger opens its tooltip without delay so
  shortcut + label discovery is fast for keyboard users.

---

## Quick recipes

### Icon-only button with tooltip

```vue
<v-tooltip text="Open in new tab">
  <template #activator="{ props }">
    <v-btn v-bind="props" icon variant="text" aria-label="Open in new tab">
      <v-icon><ExternalLink /></v-icon>
    </v-btn>
  </template>
</v-tooltip>
```

### Truncated cell

```vue
<v-tooltip :text="row.fullTitle" :disabled="row.fullTitle === row.displayTitle">
  <template #activator="{ props }">
    <span v-bind="props" class="ox-truncate">{{ row.displayTitle }}</span>
  </template>
</v-tooltip>
```

### Tooltip with kbd hint (rich slot)

```vue
<v-tooltip location="bottom">
  <template #activator="{ props }">
    <v-btn v-bind="props" icon variant="text" aria-label="Search">
      <v-icon><Search /></v-icon>
    </v-btn>
  </template>
  <template #default>
    <span>Search&nbsp;</span>
    <kbd class="ox-kbd ox-kbd--inverse">⌘</kbd>
    <kbd class="ox-kbd ox-kbd--inverse">K</kbd>
  </template>
</v-tooltip>
```

### Sidebar nav (start/end placement at rail width)

```vue
<v-tooltip text="Inbox" location="end" :open-delay="0">
  <template #activator="{ props }">
    <v-list-item v-bind="props" :to="{ name: 'inbox' }" aria-label="Inbox">
      <template #prepend><Inbox /></template>
    </v-list-item>
  </template>
</v-tooltip>
```

---

## Open questions

- **Touch device behavior** — there's no hover on touch. Vuetify's
  `:open-on-click` shows the tooltip on tap-and-hold. We accept the
  default; Phase 7 pilot may surface UX gaps (e.g. cell-truncation
  tooltips never reachable on mobile). Defer.
- **Rich tooltips with mini-previews** (e.g. user-card on author
  hover) — explicitly not a tooltip; that's a hover-card / popover.
  Spec separately if/when needed.
