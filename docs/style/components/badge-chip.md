# Badge · Chip · Tag · Kbd

Component spec for the small inline indicators in openalex-gui:
**Badge** (count / dot), **Chip** (interactive token), **Tag** (static
label), and **Kbd** (keyboard hint). Consumes tokens from
[`tokens.md`](../tokens.md), type rules from
[`typography.md`](../typography.md), icon rules from
[`icons.md`](../icons.md).

**Vuetify components:** `v-chip` (for Chip + Tag), `v-badge` (for
Badge / dot). Kbd is a hand-rolled `<kbd>` styled by SASS — no Vuetify
equivalent.

> Four small surfaces, four different jobs. Don't reach for `v-chip`
> when you need a status indicator next to a row — use a Tag. Don't
> use `v-badge` to label something — it's a corner-attached count.

---

## Decision matrix

| You want to | Use | Vuetify |
|-------------|-----|---------|
| Show a non-clickable status / category next to a row | **Tag** | `<v-chip variant="tonal" size="small">` |
| Show an interactive token (filter pill, selected option, "+ Add") | **Chip** | `<v-chip variant="outlined" closable?>` |
| Show a count / dot attached to a corner (notification bell, avatar) | **Badge** | `<v-badge :content="..."> ... </v-badge>` |
| Show a keyboard shortcut hint inline ("⌘K", "C", "G then I") | **Kbd** | `<kbd class="ox-kbd">…</kbd>` |

---

## Tag (status / category label)

**Static, non-clickable.** Shows what something *is*.

| Slot | Spec |
|------|------|
| Height | `--ox-height-xs` (24px) |
| Padding | `0 --ox-space-2` (8px) |
| Font | `--ox-type-caption` (12/500) |
| Radius | `--ox-radius-pill` (9999px) — pill |
| Optional leading dot | 6×6 circle, gap `--ox-space-1_5` (6px) |
| Optional leading icon | Lucide 12px, gap `--ox-space-1_5` (6px) |
| Color (default) | bg `--ox-bg-emphasis`, text `--ox-text-secondary` |

### Tag tonalities

For semantic tagging (status, priority, OA-status, OpenAlex entity type),
use **tonal** backgrounds — soft tint + same-hue text.

| Tonality | Bg | Text | Dot |
|----------|----|----|-----|
| Neutral *(default)* | `--ox-bg-emphasis` | `--ox-text-secondary` | `--ox-text-tertiary` |
| Info | `--ox-info-bg` | `--ox-info-fg` | `--ox-info-fg` |
| Success | `--ox-success-bg` | `--ox-success-fg` | `--ox-success-fg` |
| Warning | `--ox-warning-bg` | `--ox-warning-fg` | `--ox-warning-fg` |
| Danger | `--ox-danger-bg` | `--ox-danger-fg` | `--ox-danger-fg` |
| Accent | `--ox-bg-emphasis` | `--ox-accent` | `--ox-accent` |

**Hard rules:**

- **Tags are never clickable.** If you need a clickable filter, that's
  a Chip.
- **Don't mix tonalities in a single row.** If a row has two tags, pick
  one tonality.
- **No outlines on tags.** Filled (tonal) only. Outlined = Chip.
- Tag tonalities are **the entire color story**; do not introduce a 7th
  tonality. If you need brand-tagged entity types (the existing
  red/blue/green/orange/purple/teal avatar palette), keep that as
  **entity-color** tokens with their own naming, separate from the
  semantic tag palette.

---

## Chip (interactive token)

**Clickable / dismissable.** Used for: filter pills in a search bar,
selected options in a multi-select, free-form tags the user typed.

| Slot | Spec |
|------|------|
| Height | `--ox-height-sm` (28px) |
| Padding | `0 --ox-space-2_5` (10px) |
| Font | `--ox-type-caption` (12/500) |
| Radius | `--ox-radius-pill` (9999px) |
| Border | `1px solid --ox-border-default` |
| Background | `--ox-bg-base` |
| Close button | trailing `<X />` Lucide 12px, `--ox-space-1` (4px) gap; hit area 16×16 |

### Chip states

| State | Treatment |
|-------|-----------|
| Default | as above |
| Hover | bg `--ox-bg-muted` |
| Active (mousedown) | bg `--ox-bg-emphasis` |
| Selected | bg `--ox-accent`, color `--ox-accent-on`, no border |
| Focus-visible | `--ox-focus-ring` |
| Disabled | text-disabled, no hover, cursor `not-allowed` |
| Closable | trailing `<X />` icon button (Ghost); hover bg `rgba(0,0,0,0.06)` on the X only |

### Chip rules

- **Closable chips:** the close button is a real button — `aria-label`
  required, e.g. `Remove filter "Type: Article"`.
- **Selected** state is only used when the chip is part of a toggle
  group (multi-select). Avoid for static lists.
- **Don't put more than one icon-affordance** in a chip. Leading icon
  OR avatar OR close — not all three.

---

## Badge (count / dot)

**Attached to a corner of another element** (icon button, avatar,
nav item). Carries a number or a presence-dot.

| Slot | Spec |
|------|------|
| Type "dot" | 6×6 px circle, no number |
| Type "count" | min-width 16px, height 16px, padding `0 --ox-space-1` (4px), font `--ox-type-caption` 11px (down-scaled), radius `--ox-radius-pill` |
| Background (default) | `--ox-danger-fg` (red, for notification counts) |
| Background (info dot) | `--ox-accent` |
| Text | `--ox-accent-on` (white) |
| Position | top-right corner of the parent; offset `-4px` X / `-4px` Y |
| Max count display | "99+" past 99 |

### Badge rules

- **Badges are never interactive.** The *parent* (the bell, the nav
  item) takes the click.
- **One badge per element.** Don't stack.
- **Use `dot` for "has unread" presence** and `count` only when the
  number is actionable. "12 new" matters; "12 items in this list"
  doesn't and should appear inline as caption text.
- **Don't decorate a Tag with a badge.** A tag is its own label.

---

## Kbd (keyboard hint)

**Inline keyboard-shortcut chip.** Lives next to actions, in command
palettes, in tooltips.

| Slot | Spec |
|------|------|
| Height | `--ox-height-xs` (24px) — but typically inline-flex with surrounding text |
| Min width | 18px (matches Linear's measured value) |
| Padding | `--ox-space-0_5` (2px) all sides |
| Font | `--ox-font-mono`, 11px / 500 |
| Radius | `--ox-radius-xs` (4px) |
| Border | `0.5px solid --ox-border-default` |
| Background | `--ox-bg-base` |
| Color | `--ox-text-secondary` |

**Live Linear reference:** the "C" hint chip on the empty-state Create-issue button is `18 × 17px`, `11px/500`, `4px` radius, `0.5px` border — we adopt the same dimensions.

### Kbd combinations

- **Single key:** `<kbd>C</kbd>`
- **Modifier + key:** `<kbd>⌘</kbd>+<kbd>K</kbd>` (separator is a literal `+` text node, not a chip)
- **Sequence:** `<kbd>G</kbd> then <kbd>I</kbd>`
- **Mac vs Win/Linux:** detect OS and swap `⌘ ⇧ ⌥` ↔ `Ctrl Shift Alt`. Helper composable in Phase 5.

---

## Vuetify mapping

| Spec | Vuetify | Notes |
|------|---------|-------|
| Tag | `<v-chip variant="tonal" size="small">` | `closable=false`. Color via `color` prop or `.ox-tag--info` wrapper. |
| Chip (filter / token) | `<v-chip variant="outlined" size="small" closable>` | Selected state via `:selected` + `<v-chip-group>` ancestor or by adding `.ox-chip--selected`. |
| Badge | `<v-badge :content="n" :dot="!n">` | Use `dot` boolean for presence. |
| Kbd | n/a | Hand-rolled `<kbd class="ox-kbd">`. |

### Defaults to add in Phase 5

```js
VChip: {
  size: 'small',
  ripple: false,
  density: 'comfortable',
},
VBadge: {
  color: 'danger',
  inline: false,
  offsetX: 4,
  offsetY: 4,
  textColor: 'on-primary',
},
```

### Required SASS overrides

```scss
// Chip (interactive token).
.v-chip {
  font-family: var(--ox-font-sans);
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  letter-spacing: 0;
  text-transform: none;
  height: var(--ox-height-sm);
  padding-inline: var(--ox-space-2_5);
  border-radius: var(--ox-radius-pill);
}
.v-chip--variant-outlined {
  background: var(--ox-bg-base);
  border: 1px solid var(--ox-border-default);
  color: var(--ox-text-primary);
}
.v-chip--variant-outlined:hover { background: var(--ox-bg-muted); }
.v-chip.ox-chip--selected {
  background: var(--ox-accent);
  color: var(--ox-accent-on);
  border-color: var(--ox-accent);
}

// Tag (tonal, static, small).
.v-chip--variant-tonal {
  height: var(--ox-height-xs);
  padding-inline: var(--ox-space-2);
  background: var(--ox-bg-emphasis);
  color: var(--ox-text-secondary);
  border: 0;
}
.v-chip--variant-tonal.ox-tag--info    { background: var(--ox-info-bg);    color: var(--ox-info-fg); }
.v-chip--variant-tonal.ox-tag--success { background: var(--ox-success-bg); color: var(--ox-success-fg); }
.v-chip--variant-tonal.ox-tag--warning { background: var(--ox-warning-bg); color: var(--ox-warning-fg); }
.v-chip--variant-tonal.ox-tag--danger  { background: var(--ox-danger-bg);  color: var(--ox-danger-fg); }
.v-chip--variant-tonal.ox-tag--accent  { background: var(--ox-bg-emphasis); color: var(--ox-accent); }

// Leading dot.
.ox-tag-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  margin-inline-end: var(--ox-space-1_5);
}

// Closable chip — make the X a proper hit-target.
.v-chip__close {
  width: 16px; height: 16px;
  margin-inline-start: var(--ox-space-1);
  color: var(--ox-text-tertiary);
}
.v-chip__close:hover { color: var(--ox-text-primary); background: rgba(0,0,0,0.06); border-radius: 50%; }

// Focus.
.v-chip:focus-visible { outline: none; box-shadow: var(--ox-focus-ring); }

// Badge (count + dot).
.v-badge__badge {
  min-width: 16px; height: 16px;
  padding: 0 var(--ox-space-1);
  border-radius: var(--ox-radius-pill);
  font: var(--ox-weight-medium) 11px/1 var(--ox-font-sans);
  background: var(--ox-danger-fg);
  color: var(--ox-accent-on);
}
.v-badge--dot .v-badge__badge {
  width: 6px; min-width: 6px; height: 6px; padding: 0;
}

// Kbd (hand-rolled).
.ox-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 17px; padding: 0 var(--ox-space-1);
  font: 500 11px/1 var(--ox-font-mono);
  color: var(--ox-text-secondary);
  background: var(--ox-bg-base);
  border: 0.5px solid var(--ox-border-default);
  border-radius: var(--ox-radius-xs);
  font-variant-numeric: tabular-nums;
}
```

### What we don't touch

- Vuetify's `<v-chip-group>` selection plumbing — we use it for filter
  bars; do not roll your own.
- Vuetify's badge positioning math (it computes corner offsets per
  parent size).

---

## Anti-patterns (auto-reject)

- ❌ A Tag with a click handler. That's a Chip.
- ❌ A Chip used as a status indicator. That's a Tag.
- ❌ A `<v-chip color="primary">` left at the default `variant`
  (`tonal` in our theme) — produces a black-tinted bg block that
  doesn't read as a status. Use `variant="outlined"` for interactive,
  or set a tonality class.
- ❌ A Tag with `closable`. Tags are static; if you want closable, it's
  a Chip.
- ❌ Filling a row with 4+ tags — usually means the row is doing too
  much. Move some context to the detail view.
- ❌ A `<v-badge>` containing rich text or an icon. Badges are
  single-number or dot only.
- ❌ A Badge attached to a button label (right side, inline) — that's
  a count, render as inline `--ox-text-tertiary` caption inside the
  button label.
- ❌ Inline `<span class="kbd">` — use the real `<kbd>` element with
  the `.ox-kbd` class.
- ❌ Using `<kbd>` on click. The hint is purely visual; the actual
  shortcut is bound in code elsewhere.
- ❌ Filter chips that don't reflect the URL state. Filter chips and
  the URL are the same source of truth.

---

## Accessibility

- **Tag:** `role="img" aria-label="Status: <name>"` when the tag's only
  meaning is conveyed by color/text (the screen reader needs the
  label).
- **Chip (interactive):** `role="button"` (Vuetify sets this when
  `<v-chip>` has a click handler); closable chips contain a nested
  button for the X with its own `aria-label`.
- **Chip (in a group):** `role="option"` / `role="listbox"` — managed
  by `<v-chip-group>`; do not override.
- **Badge:** `aria-label="<n> unread"` on the *parent* (the bell, the
  avatar); the badge itself is `aria-hidden`.
- **Kbd:** the `<kbd>` element is announced as "K" or the literal char
  — for sequences, wrap the whole hint in
  `<span aria-label="press C">⏎ <kbd>C</kbd></span>`.

---

## Quick recipes

### Tag — neutral & semantic

```vue
<v-chip variant="tonal" size="small">Preprint</v-chip>
<v-chip variant="tonal" size="small" class="ox-tag--success"><span class="ox-tag-dot" />Active</v-chip>
<v-chip variant="tonal" size="small" class="ox-tag--danger">Failed</v-chip>
```

### Chip — filter pill (closable, selected)

```vue
<v-chip
  variant="outlined"
  size="small"
  closable
  class="ox-chip--selected"
  @click:close="removeFilter('type', 'article')"
>
  Type: Article
</v-chip>
```

### Chip group as multi-select

```vue
<v-chip-group v-model="selectedTypes" multiple column>
  <v-chip v-for="t in allTypes" :key="t.id" :value="t.id">{{ t.label }}</v-chip>
</v-chip-group>
```

### Badge on a notification bell

```vue
<v-badge :content="unreadCount" :model-value="unreadCount > 0" location="top end">
  <v-btn icon variant="text" aria-label="Notifications">
    <v-icon><Bell /></v-icon>
  </v-btn>
</v-badge>
```

### Kbd hint inline in a button label

```vue
<v-btn variant="flat" color="primary">
  Create issue
  <kbd class="ox-kbd">C</kbd>
</v-btn>
```

---

## Open questions

- **Avatar component** — overlaps with badge (presence-dot on avatar).
  Spec separately in a future file or as part of the Phase 4 page
  templates. Avatar sizes likely: 16 / 20 / 24 / 32 / 48 px.
- **Entity-color tokens** (red/blue/green/orange/purple/teal) — Phase
  1 audit found these hand-rolled. Should land in `tokens.md` as
  `--ox-entity-*` tokens during Phase 5 cleanup.
- **"+ Add tag" inline trigger** — pattern fits Chip with `variant="outlined"` + leading `<Plus />` icon. No new component needed.
