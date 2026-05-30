# Select / Combobox / Autocomplete

Three closely-related controls. The trigger renders **like an input** (see
[`input.md`](./input.md)); the menu renders **like a popover** (`--ox-elev-2`,
hairline ring). The only thing that varies is what the user can do — pick,
pick-or-type, or pick-or-type-multi.

| Control | When to use | Vuetify component |
|---------|-------------|-------------------|
| **Select** | User picks **one** value from a known list. No free text. | `v-select` |
| **Autocomplete** | Same — pick one — but the list is long and needs to filter as the user types. **Cannot create new values.** | `v-autocomplete` |
| **Combobox** | Pick one or more — and **can also create new values** by typing and pressing Enter. Tag entry, free-form filter, custom labels. | `v-combobox` |

> If you find yourself thinking "Autocomplete that also lets you add new
> things", you want **Combobox**. Many drift commits in the Phase 1 audit
> hand-roll a combobox on top of `v-autocomplete` because the agent didn't
> know `v-combobox` existed. It does. Use it.

---

## Trigger shape — defers to Input

The closed-state trigger inherits **every** input rule from
[`input.md`](./input.md): same height (32px md), same border tokens, same
radius (8px), same focus ring, same label placement, same helper/error
messaging. Differences:

- **Trailing caret** `<ChevronDown />` (Lucide, 16px at md), rotated 180°
  while menu is open. Animated with `--ox-duration-base`.
- **Selected chip(s)** (multi-select / Combobox only) — see "Chips" below.
- **Clear button** when value is present AND not disabled/read-only AND
  `clearable` is set.

---

## Sizes

Same scale as Input: `sm` (28px), `md` (32px, default), `lg` (40px). The
menu popover height is the same regardless of trigger size; only its width
follows the trigger.

---

## Menu popover

| Property | Token | Value |
|----------|-------|-------|
| Background | `--ox-bg-base` | `#fff` |
| Border / shadow | `--ox-elev-2` | hairline ring + subtle shadow |
| Radius | `--ox-radius-md` | 8px |
| Max-height | — | 320px (then scroll) |
| Min-width | — | matches trigger width |
| Row height | `--ox-height-md` | 32px per item |
| Row x-padding | `--ox-space-3` | 12px |
| Row font | `--ox-type-label` | 13px / 400 — same as input value |
| Section label | `--ox-type-caption` | 12px / 500, `--ox-text-tertiary`, uppercase: **no** |
| Z-index | `--ox-z-dropdown` | 200 |
| Offset from trigger | `--ox-space-1` | 4px |
| Open animation | `--ox-duration-slow` (200ms) + `--ox-ease-out` | opacity 0→1, translateY +4px→0 |

### Item rows — states

| State | Bg | Foreground | Notes |
|-------|----|------------|-------|
| Default | `transparent` | `--ox-text-primary` | |
| Hover | `--ox-bg-muted` | `--ox-text-primary` | |
| Highlighted (keyboard) | `--ox-bg-muted` | `--ox-text-primary` | Same as hover; tracked via `aria-activedescendant`. |
| Selected | `--ox-bg-muted` | `--ox-text-primary` | + leading `<Check />` icon (16px, `--ox-text-secondary`). |
| Disabled | `transparent` | `--ox-text-disabled` | Cursor `not-allowed`. |
| Empty / no-results | `transparent` | `--ox-text-tertiary` | "No matches" message, no row hover. |

- Selected uses bg (not check icon) for **single-select**. Selected uses
  bg + leading check for **multi-select / Combobox**.
- Leading slot supports an avatar / icon / category dot (12px). Use the
  same 8px gap as `icons.md` recommends.
- Trailing slot is **kbd-hint only** (single small mono char, e.g. "↵").
  Do not pack additional metadata in the trailing slot — overflow is
  ugly and unscannable.

---

## Chips (multi-select / Combobox)

Vuetify renders selected items inline as chips by default. Override to use
our chip style (see future `chip.md`; until then, use the rules below):

| Property | Token | Value |
|----------|-------|-------|
| Height | `--ox-height-xs` | 24px |
| Bg | `--ox-bg-muted` | `#f5f5f5` |
| Border | none | — |
| Radius | `--ox-radius-xs` | 4px |
| Font | `--ox-type-caption` | 12px / 500 |
| Color | `--ox-text-primary` | |
| X-padding | `--ox-space-2` | 8px |
| Gap to ✕ | `--ox-space-1` | 4px |
| ✕ icon | Lucide `<X />` 12px, `--ox-text-tertiary` → `--ox-text-primary` on hover | |
| Chip-to-chip gap | `--ox-space-1` | 4px |

**Overflow:** when chips would wrap to a third line, collapse to a
"+N more" pseudo-chip (no background) and open the full list in a popover
on click. Don't expand the trigger vertically without bound.

---

## States — trigger

Same as Input states (see `input.md`), with one addition: **Open**.

| State | Trigger border | Caret rotation |
|-------|----------------|----------------|
| Open | `--ox-accent` (1px) + focus ring | 180° |

Closing on outside-click / Esc / select: revert to default or focus state
based on whether the trigger still has focus.

---

## Filter behavior (Autocomplete / Combobox)

- **Default filter:** case-insensitive substring match against item label.
  Override via `:filter-keys` / `:custom-filter` for richer matching
  (e.g. match across `label` AND `alias`).
- **Highlight matches:** wrap matching substrings in `<mark>` inside the
  item row. `<mark>` is styled by typography overrides to use
  `background: #fff3a3; color: inherit`. (Phase 2 typography spec.)
- **Empty results:** show "No matches for *{query}*" using
  `--ox-text-tertiary`. Do not show "No data available" — that's the
  Vuetify Material default and it lies (data exists; the *filter* found
  none).
- **Async loading:** show a single 16px spinner in the menu, centered, with
  the message "Searching…" below at `--ox-type-caption`. Don't render
  skeleton rows — async result counts are unknown.

---

## Multi-select rules

- Selected items render as chips in the trigger; the menu still shows the
  full list with checks for selected.
- **Pressing Enter on a highlighted unselected item** selects it AND keeps
  the menu open (so you can keep picking).
- **Pressing Enter on a chip** (or pressing Backspace when the input is
  empty) removes the chip — Combobox / Autocomplete only.
- Order of chips matches selection order. **Do not** alphabetize on the
  fly — the user picked the order.

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Single select | `v-select` | |
| Filterable single | `v-autocomplete` | |
| Filterable + creatable | `v-combobox` | |
| Multi | `multiple` prop | All three support it. |
| Items source | `:items="[…]"` | Array of strings or `{ title, value, … }`. |
| Item template | `#item` / `#selection` slots | Use for custom rendering (icon + title + subtitle). |
| Clearable | `clearable` | Same caveat as Input — vet the default ✕. |
| Disabled item | `:item-props="..."` returning `{ disabled: true }` | |
| Density | `density="compact"` *(theme default)* | |
| Open delay | `:menu-props="{ openDelay: 0 }"` | Keep at 0; menu must feel instant. |
| Menu width | `:menu-props="{ maxHeight: 320 }"` | Override default 400. |
| Async | `:loading` + `@update:search-input` debounce | |

### Defaults to add in Phase 5

```js
VSelect: {
  variant: 'outlined',
  density: 'compact',
  hideDetails: 'auto',
  menuProps: { maxHeight: 320, offset: 4 },
},
VAutocomplete: {
  variant: 'outlined',
  density: 'compact',
  hideDetails: 'auto',
  menuProps: { maxHeight: 320, offset: 4 },
},
VCombobox: {
  variant: 'outlined',
  density: 'compact',
  hideDetails: 'auto',
  menuProps: { maxHeight: 320, offset: 4 },
},
```

### Required SASS overrides

Most of the trigger overrides come for free from the Input SASS layer
(same `v-field` selector). Menu-specific overrides:

```scss
.v-overlay__content .v-list {
  background: var(--ox-bg-base);
  border-radius: var(--ox-radius-md);
  box-shadow: var(--ox-elev-2);
  padding: var(--ox-space-1) 0;          /* 4px top/bottom */
  font-family: var(--ox-font-sans);
  min-width: var(--v-overlay-anchor-width, 100%);
}

.v-list-item {
  min-height: var(--ox-height-md);
  padding: 0 var(--ox-space-3);
  font-size: var(--ox-type-label-size);
  color: var(--ox-text-primary);
}

.v-list-item--active,
.v-list-item:hover {
  background: var(--ox-bg-muted);
}

.v-list-item--disabled {
  color: var(--ox-text-disabled);
  cursor: not-allowed;
}

// Selection chip styling (multi-select).
.v-select__selection .v-chip,
.v-autocomplete__selection .v-chip,
.v-combobox__selection .v-chip {
  height: var(--ox-height-xs);
  background: var(--ox-bg-muted);
  border: none;
  border-radius: var(--ox-radius-xs);
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  color: var(--ox-text-primary);
  padding: 0 var(--ox-space-2);
}
```

---

## Accessibility

- Vuetify wires `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant` for all three controls. **Don't override.**
- Keyboard:
  - **Tab:** focus the trigger.
  - **Enter / Space / ArrowDown:** open menu (when trigger focused).
  - **ArrowUp / ArrowDown:** move highlight.
  - **Enter:** select highlighted item.
  - **Esc:** close menu without selection; re-focus trigger.
  - **Backspace (empty input, multi):** remove last chip.
- **Label is required** — same rule as Input.
- **No-results message must be present** in the menu (even at zero items)
  so the live region announces it. Empty `<v-list>` is a silent dead-end
  for screen readers.

---

## Anti-patterns (auto-reject)

- ❌ Building "selectable list" from `v-menu` + `v-list` by hand. Use
  `v-select`.
- ❌ Hard-coding the menu max-height with a `:style` binding instead of
  `menuProps`.
- ❌ Sorting selected chips alphabetically — preserve selection order.
- ❌ Wiring custom keyboard handlers that swallow Esc / ArrowUp / ArrowDown.
  Vuetify already handles them; if it doesn't, file a defect, don't paper
  over it.
- ❌ Combobox with `multiple` for chip *display* but no `multiple` data
  model. Confusing for both users and code reviewers.
- ❌ Rendering a search-and-pick that allows new entries using
  `v-autocomplete` and a custom `@keydown.enter`. Use `v-combobox`.
- ❌ Async-loaded items with no loading indicator. Always pass `:loading`.

---

## Quick recipes

### Single-select (known list)

```vue
<v-select
  v-model="status"
  label="Status"
  :items="[
    { title: 'Active', value: 'active' },
    { title: 'Paused', value: 'paused' },
    { title: 'Archived', value: 'archived' },
  ]"
/>
```

### Filterable single-select (long list)

```vue
<v-autocomplete
  v-model="institution"
  label="Institution"
  :items="institutions"
  item-title="display_name"
  item-value="id"
  :loading="isLoading"
  @update:search="onSearch"   // debounce 200ms upstream
/>
```

### Multi-select with creatable tags

```vue
<v-combobox
  v-model="tags"
  label="Tags"
  multiple
  chips
  closable-chips
  :items="suggestedTags"
  hint="Type and press Enter to add a new tag"
  persistent-hint
/>
```

### With leading icon per item

```vue
<v-select
  v-model="entity"
  label="Entity type"
  :items="entityTypes"
  item-title="label"
  item-value="value"
>
  <template #item="{ item, props }">
    <v-list-item v-bind="props">
      <template #prepend>
        <v-icon :color="item.raw.color"><component :is="item.raw.icon" /></v-icon>
      </template>
    </v-list-item>
  </template>
</v-select>
```

### Async autocomplete with no-results message

```vue
<v-autocomplete
  v-model="work"
  label="Add a work"
  :items="results"
  item-title="title"
  item-value="id"
  :loading="isLoading"
  no-filter
  @update:search="debouncedSearch"
>
  <template #no-data>
    <v-list-item>
      <v-list-item-title class="ox-text-tertiary">
        {{ query ? `No matches for "${query}"` : 'Start typing…' }}
      </v-list-item-title>
    </v-list-item>
  </template>
</v-autocomplete>
```

---

## Open questions

- **Group headers** (sectioned items) — Vuetify supports via `item-props`
  returning `{ type: 'subheader' }`. Pilot during Phase 7 (Work detail page
  has a few candidates — author affiliation pickers).
- **"Recent" / "Suggested" sections** for autocomplete — pattern to lock
  once we have ≥2 sites. Defer.
- **Virtual scrolling** for >500-item lists — Vuetify supports it via
  `<v-virtual-scroll>`. Not on the critical path; revisit when a real list
  forces it.
