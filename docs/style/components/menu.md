# Menu (Dropdown)

Component spec for popover menus in openalex-gui — overflow menus, "More
actions" dropdowns, context menus, the workspace switcher, autocomplete
suggestion panels (when used standalone, not inside an input). Consumes
tokens from [`tokens.md`](../tokens.md); text rules from
[`typography.md`](../typography.md); icon rules from
[`icons.md`](../icons.md). Shares popover-surface DNA with
[`select.md`](select.md) and [`dialog.md`](dialog.md).

**Vuetify component:** `v-menu` (+ `v-list` / `v-list-item` for the
items).
**Status against Vuetify:** use with overrides — Vuetify's defaults
position correctly but produce a Material-elevated card; we replace
with a Linear-style hairline-bordered popover with subtle shadow.

> **Live Linear reference (EXPLORE.md Cmd-K palette extraction,
> 2026-05-30):** popover modal is `~485px wide`, `12px corner radius`,
> `1px hairline` border `lch(82.44 0 282)` (≈ `#cccdcf`), shadow
> `0 3px 6px -2px rgba(0,0,0,0.02), 0 1px 1px 0 rgba(0,0,0,0.04)`. List
> item row is `46px tall`, `15px / 400`, padding `0 12px`. Selected row
> gets a subtle bg. **Adopt this popover recipe for all menu surfaces.**
> (Command palette itself is a future job — out of scope here.)

---

## Menu vs the alternatives

| Use case | Surface | File |
|----------|---------|------|
| Pick from a fixed set (`Status: Open`) inside a form | Select | [`select.md`](select.md) |
| Pick from many options with type-to-filter inside a form | Autocomplete | [`select.md`](select.md) |
| **Overflow actions on a button / row** | **Menu** (this) | here |
| Right-click context actions | Context menu | here (same surface) |
| Workspace switcher / account menu | Menu | here |
| Confirmation prompt | Dialog | [`dialog.md`](dialog.md) |
| Global Cmd-K command palette | Custom (future job) | not yet |

If the user is going to *type* to find something, it's an Autocomplete,
not a Menu. If you need a Save/Cancel pair after the choice, it's a
Dialog.

---

## Anatomy

```
+------------------------------+
| Section label                |   <- 11px / 500 / text-tertiary
|                              |
|  Open in new tab        ⌘O   |   <- 32px row, kbd-hint trailing
|  Copy link              ⌘C   |
|  ──────────────────────────  |   <- divider
|  Delete                      |   <- danger color
+------------------------------+
```

| Slot | Spec |
|------|------|
| Width | min `--ox-menu-min-width` (200px); auto-grows to fit longest item; max 360px |
| Padding | `--ox-space-1` (4px) Y; items handle their own X-padding |
| Background | `--ox-bg-base` |
| Border | `1px solid --ox-border-default` |
| Radius | `--ox-radius-md` (8px) |
| Shadow | `--ox-elev-2` (popover with hairline ring) |
| Item height | `--ox-height-md` (32px) — tighter than Linear's Cmd-K (46px) because menus are utility, not search |
| Item padding | `0 --ox-space-3` (12px) |
| Item font | `--ox-type-label` (13/500) |
| Item color (default) | `--ox-text-primary` |
| Item color (danger) | `--ox-danger-fg` |
| Item color (disabled) | `--ox-text-disabled` |
| Hover bg | `--ox-bg-muted` |
| Selected bg (multi-select / current) | `--ox-bg-emphasis` |
| Active (mousedown) bg | `--ox-bg-emphasis` |
| Leading icon | Lucide 16px, gap `--ox-space-2` (8px) |
| Trailing slot | `<kbd>` chip OR right-side caption OR submenu chevron 12px |
| Divider | `1px solid --ox-border-subtle`, full-width, vertical margin `--ox-space-1` (4px) |
| Section label | `--ox-type-caption` (12/500) `--ox-text-tertiary`, padding `--ox-space-2 --ox-space-3 --ox-space-1` (8/12/4) |

---

## Positioning

| Trigger | Default placement |
|---------|-------------------|
| Toolbar / right-aligned button | `bottom end` (right edge of menu aligns with right edge of trigger) |
| Inline button | `bottom start` |
| Sidebar nav item | `end` (to the right) |
| Context (right-click) | at cursor |

- **Auto-flip on collision** — Vuetify's overlay engine handles this;
  leave default.
- **Offset from trigger** — `--ox-space-1_5` (6px); aligns with the
  popover gap used by tooltip.
- **Min/max viewport gutter** — `--ox-space-4` (16px) on each side; the
  menu never touches the viewport edge.

---

## States

| State | Treatment |
|-------|-----------|
| Default item | `--ox-text-primary` on `--ox-bg-base` |
| Hover / keyboard-highlighted | bg `--ox-bg-muted` |
| Active (mousedown) | bg `--ox-bg-emphasis` |
| Selected (multi-select check) | leading check icon `--ox-accent`; bg stays default unless current |
| Disabled | text `--ox-text-disabled`, no hover, cursor `not-allowed` |
| Danger | text `--ox-danger-fg`; hover bg `--ox-danger-bg` (light red) |
| Loading | item shows inline spinner trailing; cursor `progress` |
| Focus (entire popover) | popover gets `--ox-focus-ring` outline — only when keyboard-opened |
| Open animation | opacity 0 → 1 + translateY(-2px) → 0; `--ox-duration-base` (150ms) `--ox-ease-base` |
| Close animation | reverse; same duration |

### Keyboard rules

- **Up / Down** moves the highlighted item.
- **Enter / Space** activates the highlighted item and closes the menu.
- **Esc** closes without selecting.
- **First letter** jumps to the next item starting with that letter
  (type-ahead) — Vuetify's `<v-list>` supports this when items are
  keyed by text.
- **Tab** moves to the next focusable element on the page (closes the
  menu).

---

## Trigger button

A menu's trigger is one of:

1. **Icon-only Ghost button** (most common: overflow `…`). Required:
   `aria-haspopup="menu"`, `aria-expanded` (Vuetify wires this).
2. **Outlined button with trailing chevron** (`<ChevronDown />` 12px,
   `--ox-space-1_5` gap, color `--ox-text-tertiary`).
3. **Sidebar nav item** (e.g. workspace switcher). Trigger looks like a
   regular nav item; the chevron is trailing.

Don't dress a `<v-select>` as a menu trigger — the surfaces differ.

---

## Submenus

- **One level of nesting only.** Two-deep menus are a UX signal that
  the action structure is wrong; flatten.
- Submenu trigger: trailing `<ChevronRight />` 12px, `--ox-text-tertiary`.
- Submenu opens on hover (300ms delay) and on right-arrow / Enter.
- Right-aligns flush against the parent item; auto-flips left on
  collision.

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Open / close | `v-model="open"` or `<template #activator>` | Prefer the activator slot; auto-wires aria. |
| Position | `location="bottom end"` | See positioning table. |
| Offset | `:offset="6"` | Pixels. |
| Close on content click | `:close-on-content-click="true"` *(default)* | Set `false` for multi-select menus. |
| Items | `<v-list><v-list-item @click="...">` | Use real `<v-list-item>`, not raw `<div>`. |
| Divider | `<v-divider />` | |
| Section label | `<v-list-subheader>` | Styled via SASS. |
| Multi-select | `<v-list select-strategy="leaf-multiple" v-model:selected="...">` | |
| Submenu | Nested `<v-menu>` inside an item with `:open-on-hover` | |

### Defaults to add in Phase 5

```js
VMenu: {
  location: 'bottom end',
  offset: 6,
  transition: 'fade-transition',
  closeOnContentClick: true,
  contentClass: 'ox-menu',
},
VList: {
  density: 'compact',
  ripple: false,
},
VListItem: {
  ripple: false,
  minHeight: 32,
  rounded: 'sm',
},
```

### Required SASS overrides

```scss
.ox-menu,
.v-menu > .v-overlay__content {
  background: var(--ox-bg-base);
  border: 1px solid var(--ox-border-default);
  border-radius: var(--ox-radius-md);
  box-shadow: var(--ox-elev-2);
  padding: var(--ox-space-1) 0;
  min-width: 200px;
  max-width: 360px;
  overflow: hidden;
}

.ox-menu .v-list,
.v-menu .v-list {
  background: transparent;
  padding: 0;
  font-family: var(--ox-font-sans);
}

.ox-menu .v-list-item,
.v-menu .v-list-item {
  min-height: var(--ox-height-md);
  padding-inline: var(--ox-space-3);
  font: var(--ox-weight-medium) var(--ox-type-label-size)/1.4 var(--ox-font-sans);
  color: var(--ox-text-primary);
  border-radius: 0;
  margin-block: 0;
}
.ox-menu .v-list-item:hover,
.v-menu .v-list-item:hover { background: var(--ox-bg-muted); }
.ox-menu .v-list-item--active,
.v-menu .v-list-item--active { background: var(--ox-bg-emphasis); }

.ox-menu .v-list-item--disabled {
  color: var(--ox-text-disabled);
  cursor: not-allowed;
}

// Danger variant — opt in with .ox-menu-item--danger.
.ox-menu .v-list-item.ox-menu-item--danger,
.v-menu .v-list-item.ox-menu-item--danger { color: var(--ox-danger-fg); }
.ox-menu .v-list-item.ox-menu-item--danger:hover,
.v-menu .v-list-item.ox-menu-item--danger:hover { background: var(--ox-danger-bg); }

// Leading icon.
.ox-menu .v-list-item__prepend > .v-icon {
  font-size: 16px;
  margin-inline-end: var(--ox-space-2);
  color: var(--ox-text-tertiary);
}
// Trailing slot (kbd / caption / chevron).
.ox-menu .v-list-item__append { gap: var(--ox-space-2); color: var(--ox-text-tertiary); }
.ox-menu .v-list-item__append .v-icon { font-size: 12px; }

// Section label.
.ox-menu .v-list-subheader {
  font: var(--ox-weight-medium) var(--ox-type-caption-size)/1 var(--ox-font-sans);
  color: var(--ox-text-tertiary);
  padding: var(--ox-space-2) var(--ox-space-3) var(--ox-space-1);
  min-height: auto;
  text-transform: none;
}

// Divider.
.ox-menu .v-divider { margin: var(--ox-space-1) 0; border-color: var(--ox-border-subtle); }

// Focus.
.ox-menu .v-list-item:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring) inset;
}
```

### What we don't touch

- Vuetify's overlay portal mounting.
- Collision avoidance / auto-flip math.
- `aria-haspopup` / `aria-expanded` wiring on the activator.
- Outside-click-to-close behavior.

---

## Anti-patterns (auto-reject)

- ❌ Two levels of submenus.
- ❌ Menu with > 8 items at the top level. Group with dividers + labels
  or restructure.
- ❌ Menu item with multi-line copy. One short verb-phrase per item.
- ❌ Menu used in place of a Select. Use `<v-select>` inside forms.
- ❌ Menu used in place of a Dialog. If the user is making a decision
  with consequences, that's a Dialog.
- ❌ Custom `<div>` with click handlers instead of `<v-list-item>`.
- ❌ Material drop-shadow `elevation-8`. Use `--ox-elev-2`.
- ❌ Menu with no `aria-label` on a section that has only icon items.
- ❌ Inline filter input at the top of a menu. If you need filterable,
  it's an Autocomplete (use the Select spec).
- ❌ Bottom-attached "More" link inside a menu — items are not paginated.
- ❌ Menus that overlap their trigger (`offset="0"`).
- ❌ `!important` on any menu rule.

---

## Accessibility

- `<v-menu>` sets `role="menu"` on the panel and `role="menuitem"` on
  each `<v-list-item>` (Vuetify v3 wires this when the menu is a
  child of an activator).
- Activator gets `aria-haspopup="menu"`, `aria-expanded="true|false"`,
  and `aria-controls` pointing to the panel — Vuetify wires all of
  this; do not override.
- Keyboard map matches the WAI-ARIA Menu pattern (Up/Down/Enter/Esc/
  type-ahead).
- **Focus is moved into the menu on open** and **returned to the
  activator on close**. Vuetify handles this.
- Multi-select menus use `aria-multiselectable="true"` on the list.
- Section labels are `<v-list-subheader>` which renders with
  `role="presentation"` — for screen-reader-announced groupings, set
  `aria-labelledby` on the menu pointing to a section heading.

---

## Quick recipes

### Overflow menu on a row

```vue
<v-menu>
  <template #activator="{ props }">
    <v-tooltip text="More actions">
      <template #activator="{ props: tt }">
        <v-btn v-bind="{ ...props, ...tt }" icon variant="text" aria-label="More actions">
          <v-icon><MoreHorizontal /></v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </template>

  <v-list>
    <v-list-item @click="openInNewTab">
      <template #prepend><ExternalLink /></template>
      Open in new tab
      <template #append><kbd class="ox-kbd">⌘O</kbd></template>
    </v-list-item>
    <v-list-item @click="copyLink">
      <template #prepend><Link2 /></template>
      Copy link
    </v-list-item>
    <v-divider />
    <v-list-item class="ox-menu-item--danger" @click="confirmDelete">
      <template #prepend><Trash2 /></template>
      Delete…
    </v-list-item>
  </v-list>
</v-menu>
```

### Dropdown trigger with chevron

```vue
<v-menu>
  <template #activator="{ props }">
    <v-btn v-bind="props" variant="outlined">
      Group by: Status
      <v-icon class="ox-icon-trailing"><ChevronDown /></v-icon>
    </v-btn>
  </template>
  <v-list v-model:selected="groupBy" select-strategy="single-leaf">
    <v-list-item value="status">Status</v-list-item>
    <v-list-item value="priority">Priority</v-list-item>
    <v-list-item value="assignee">Assignee</v-list-item>
  </v-list>
</v-menu>
```

### Multi-select menu with sections

```vue
<v-menu :close-on-content-click="false">
  <template #activator="{ props }">
    <v-btn v-bind="props" variant="outlined">Show…</v-btn>
  </template>
  <v-list v-model:selected="visibleCols" select-strategy="leaf-multiple">
    <v-list-subheader>Columns</v-list-subheader>
    <v-list-item value="title">Title</v-list-item>
    <v-list-item value="owner">Owner</v-list-item>
    <v-list-item value="updated">Updated</v-list-item>
  </v-list>
</v-menu>
```

### Workspace switcher with submenu

```vue
<v-menu location="end">
  <template #activator="{ props }">
    <button v-bind="props" class="ox-workspace-pill">
      OR · OurResearch
      <v-icon><ChevronDown /></v-icon>
    </button>
  </template>
  <v-list>
    <v-list-item :active="true">OurResearch</v-list-item>
    <v-list-item>(other workspace…)</v-list-item>
    <v-divider />
    <v-list-item @click="createWorkspace">
      <template #prepend><Plus /></template>
      Create workspace…
    </v-list-item>
  </v-list>
</v-menu>
```

---

## Open questions

- **Right-click context menu** integration (`oncontextmenu`) — Vuetify
  v3 exposes `:activator-props.contextmenu`. Defer detailed recipes
  to Phase 7 pilot needs.
- **Filterable menu** — pattern overlaps with `<v-autocomplete>`
  standalone. If a real need arises, spec separately.
- **Cmd-K command palette** — explicitly out of scope for this job. The
  surface tokens here are the right starting point when that job
  begins.
