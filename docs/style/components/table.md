# Table

Component spec for tabular data in openalex-gui. Consumes tokens from
[`tokens.md`](../tokens.md), text rules from
[`typography.md`](../typography.md), icon rules from
[`icons.md`](../icons.md).

**Vuetify component:** `v-table` (NOT `v-data-table` — see below).
**Status against Vuetify:** use with heavy overrides — Vuetify's default
table is Material density; we want a Linear-flavored compact list with
hairline rows and no row-stripes.

> The Phase 1 audit found **19 `v-table` instances** and zero
> `v-data-table` instances. We keep `v-table` as the only sanctioned
> table primitive and pair it with our own thin abstractions for
> sort / select / pagination when needed. **Don't pull in
> `v-data-table` for a new feature** — its size, lazy-loading defaults,
> and styling surface are larger than we want to maintain.

---

## Anatomy

```
+--------------------------------------------------------------+
| Header row                                                   |   <- 36px, sticky
+--------------------------------------------------------------+
| Body row                                                     |   <- 36px (dense) / 44px (cozy)
+--------------------------------------------------------------+
| Body row (hover bg)                                          |
+--------------------------------------------------------------+
| ...                                                          |
+--------------------------------------------------------------+
| Footer (pagination, totals, bulk actions)                    |   <- optional, 48px
+--------------------------------------------------------------+
```

- **Hairline `1px solid --ox-border-subtle`** on every row's *bottom*
  edge. No vertical rules. No outer border around the table itself.
- **Header has a stronger bottom border** (`--ox-border-default`) and
  sits on `--ox-bg-base` (no fill, no shading).
- **No zebra striping.** Linear doesn't; data-density reads cleaner
  without it.

---

## Densities

Two densities only. **Pick one per page** — don't mix.

| Density | Row height | Header height | Cell x-padding | Font | When |
|---------|------------|---------------|----------------|------|------|
| **Dense** *(default)* | `--ox-height-md` (32px) | 36px | `--ox-space-3` (12px) | `--ox-type-label` (13/500 body, 13/500 header) | Lists, scanning, ≥10 rows fit on screen |
| **Cozy** | 44px | 48px | `--ox-space-4` (16px) | `--ox-type-body` (14/400) | Detail-oriented data, ≤8 rows, mixed media |

- **Header text** is `--ox-text-tertiary` `--ox-type-caption` (12/500),
  uppercase-via-`text-transform: none` (Material's default
  uppercase is **killed globally** — never re-enable here).
- **Body text** is `--ox-text-primary`. Secondary cells
  (metadata, timestamps) use `--ox-text-tertiary`.

---

## Cell content rules

| Content | Alignment | Notes |
|---------|-----------|-------|
| Text labels | left | Default. |
| Numbers, IDs, percentages | **right** | Use `font-variant-numeric: tabular-nums` (set globally via typography.md — inherited). |
| Status badges, chips | left | Use [`badge-chip.md`](badge-chip.md) Tag variant. |
| Action buttons | right | Ghost variant; collapse to overflow menu at ≥3 actions. |
| Avatars / icons | left, before label | Gap `--ox-space-2` (8px). |
| Timestamps | left or right | Always **relative** in cell ("2h ago"), absolute in tooltip. |
| Truncation | single-line ellipsis | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` — the row itself never wraps. Multi-line cells = cozy density only, and you give up sortability. |

---

## States

| State | Treatment |
|-------|-----------|
| **Row default** | bg `--ox-bg-base`, body text `--ox-text-primary`. |
| **Row hover** | bg `--ox-bg-muted` (entire row), no border change. Use `:hover` on `<tr>` not `<td>`. |
| **Row selected** (when row-select is on) | bg `--ox-bg-emphasis`, left edge keeps the hairline; **no** left accent stripe. Persists through hover. |
| **Row focus-visible** | `box-shadow: var(--ox-focus-ring) inset 2px 0 0 var(--ox-accent)` on the leftmost cell — only when keyboard-focused. |
| **Header sort indicator** | Tiny chevron 12px next to the column label, color `--ox-text-secondary`; flips by `aria-sort="ascending|descending"`. |
| **Empty state** | Single full-width row with centered helper text in `--ox-text-tertiary`, vertical padding `--ox-space-12` (48px). See `empty-states` (TBD). |
| **Loading** | Skeleton rows — see [`loading.md`](loading.md). **Don't** show a spinner in the table. |
| **Disabled row** (rare) | opacity 0.5, no hover bg, cursor `not-allowed`. |

---

## Sort

- Sortable columns get a `<button>` wrapping the header label so the
  entire cell is clickable (not just the chevron).
- Indicator: `↑` ascending, `↓` descending, faint `↕` for "sortable but
  not currently the sort key" — use 12px Lucide icons (`ArrowUp`,
  `ArrowDown`, `ChevronsUpDown`). See [`icons.md`](../icons.md).
- Only **one sort key at a time** (no multi-column sort). If your data
  needs multi-sort, that's a separate "filter sidebar" job.
- Sort persists in the URL (`?sort=name&order=asc`) — every sortable
  table must reflect to URL for shareable views.

---

## Row select (multi-select)

- Leftmost column = checkbox (16×16; see
  [`checkbox-radio-switch.md`](checkbox-radio-switch.md)).
- Header cell has a checkbox with `indeterminate` when *some* but not
  all rows are selected.
- Selected count + bulk-action toolbar appears as a **sticky strip**
  *above* the table when ≥1 row is selected. Pattern:
  `N selected · Action · Action · ✕ Clear`. Strip height `--ox-height-lg`
  (40px), bg `--ox-bg-emphasis`.
- Don't push selection-only actions into a per-row overflow menu — they
  belong in the strip.

---

## Pagination

- Footer-right, single line: `Showing 1–25 of 248  ◀ ▶`.
- Page size selector is a Select (10/25/50/100). See
  [`select.md`](select.md).
- **Don't** put a page-size selector on the left and pagination on the
  right; collapse both to the right, separated by a divider.
- For ≤25 rows, drop pagination entirely.
- Use Vuetify's `<v-pagination>` only inside the footer slot — don't
  let it size itself larger than the footer (default is fine; just
  don't add `density="comfortable"`).

---

## Sticky behavior

- Header is `position: sticky; top: 0; z-index: 1; background: --ox-bg-base;`.
  Inside a dialog or scroll container, sticky still works.
- First column is **not sticky by default**. Only stick when row labels
  matter at 20+ scroll-x (rare; freezeable per `<th data-sticky>`).
- Bulk-action strip is `position: sticky; top: 0; z-index: 2;` (above
  header). When both are visible, strip > header.

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Hairline rows | n/a | Apply via SASS, not props. |
| Dense density | `density="compact"` | Vuetify's "compact" ≈ our "dense" (32px row). Add to defaults. |
| Hover row | (default) | Vuetify's `hover` prop is on by default in v-table; keep it. |
| Sticky header | `fixed-header` boolean prop | Use with a `height` prop on `<v-table>` for a scrollable region. |
| Sortable columns | n/a in `<v-table>` | Hand-roll: `<th><button @click="sort('col')">Label <SortIcon/></button></th>`. Don't reach for `<v-data-table>` for this. |
| Row select | n/a in `<v-table>` | Hand-roll using `<v-checkbox>`. Cleaner than `<v-data-table>`'s `select-strategy`. |
| Empty state | named slot or conditional row | Single `<tr><td colspan="N">`. |
| Loading | conditional skeleton rows | See `loading.md`. |

### Defaults to add in Phase 5

```js
VTable: {
  density: 'compact',
  hover: true,
  // no fixed-header default; opt-in per use
},
```

### Required SASS overrides

```scss
.v-table {
  background: var(--ox-bg-base);
  color: var(--ox-text-primary);
  font-family: var(--ox-font-sans);
  font-size: var(--ox-type-label-size);
  border-collapse: separate;        // hairlines render cleaner on Safari
  border-spacing: 0;
}

.v-table__wrapper > table > thead > tr > th {
  font: var(--ox-weight-medium) var(--ox-type-caption-size)/1.3 var(--ox-font-sans);
  color: var(--ox-text-tertiary);
  text-transform: none;
  letter-spacing: 0;
  height: 36px;
  padding: 0 var(--ox-space-3);
  border-bottom: 1px solid var(--ox-border-default);
  background: var(--ox-bg-base);
}

.v-table__wrapper > table > tbody > tr > td {
  height: var(--ox-height-md);
  padding: 0 var(--ox-space-3);
  border-bottom: 1px solid var(--ox-border-subtle);
  vertical-align: middle;
}

.v-table--density-compact > .v-table__wrapper > table > tbody > tr > td { height: var(--ox-height-md); }

.v-table > .v-table__wrapper > table > tbody > tr:hover > td {
  background: var(--ox-bg-muted);
}

.v-table > .v-table__wrapper > table > tbody > tr.is-selected > td {
  background: var(--ox-bg-emphasis);
}

// Right-align numeric cells via class hook.
.ox-num { text-align: right; font-variant-numeric: tabular-nums; }

// Header sort button.
.v-table th > button[aria-sort] {
  background: none; border: 0; padding: 0; cursor: pointer;
  color: inherit; font: inherit; display: inline-flex; align-items: center;
  gap: var(--ox-space-1_5);
}
.v-table th > button[aria-sort]:hover { color: var(--ox-text-secondary); }
.v-table th[aria-sort="ascending"]  button { color: var(--ox-text-primary); }
.v-table th[aria-sort="descending"] button { color: var(--ox-text-primary); }

// Kill Material's outer border + drop shadow on fixed-header mode.
.v-table--fixed-header > .v-table__wrapper > table > thead { box-shadow: none; }
.v-table { box-shadow: none; }
```

### What we don't touch

- Vuetify's `<v-table>` scrolling / overflow plumbing.
- ARIA attributes that Vuetify sets on the table element.

---

## Anti-patterns (auto-reject)

- ❌ Pulling in `<v-data-table>` for a new feature. Use `<v-table>` +
  hand-rolled sort / select. (If you genuinely need server-side
  pagination + filter + multi-sort, open a parent job — not a one-off.)
- ❌ Zebra striping (`nth-child(even)` background). Hairlines only.
- ❌ Vertical rules between cells (`border-left`/`right`). Never.
- ❌ Outer border around `<v-table>`. The table sits in a card or the
  bare page — no double-frame.
- ❌ `<th>` with `text-transform: uppercase`. Killed globally; do not
  re-enable.
- ❌ Mixing dense + cozy in the same table.
- ❌ Multi-line `<td>` content in a dense table. Bump to cozy or move
  the overflow to a tooltip / drawer.
- ❌ Row-click navigates **and** has clickable cells inside. Pick one:
  either the row is one big link, or per-cell actions — never both.
- ❌ `!important` on any table rule. Specificity over the
  `.v-table__wrapper > table` selector chain is enough.

---

## Accessibility

- Use real `<thead>` / `<tbody>` / `<th>` / `<td>` — `<v-table>` does
  this for you; do not roll a `<div role="grid">` for what's actually
  tabular data.
- `<th scope="col">` on header cells; `<th scope="row">` on the leading
  identifier column if it's text-y.
- Sort buttons set `aria-sort` on the parent `<th>` to "ascending",
  "descending", or "none".
- The bulk-action strip is a `<div role="region" aria-label="Bulk
  actions">` and traps focus only when explicitly opened (not on row
  select alone).
- Selected rows: row `<tr aria-selected="true">`.

---

## Quick recipes

### Dense list with hairline rows

```vue
<v-table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Owner</th>
      <th class="ox-num">Updated</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="row in rows" :key="row.id">
      <td>{{ row.name }}</td>
      <td>{{ row.owner }}</td>
      <td class="ox-num">{{ row.updatedRel }}</td>
    </tr>
  </tbody>
</v-table>
```

### Sortable header

```vue
<th :aria-sort="sortKey==='name' ? sortDir : 'none'">
  <button @click="toggleSort('name')">
    Name
    <v-icon v-if="sortKey==='name' && sortDir==='ascending'"><ArrowUp /></v-icon>
    <v-icon v-else-if="sortKey==='name' && sortDir==='descending'"><ArrowDown /></v-icon>
    <v-icon v-else class="ox-icon-muted"><ChevronsUpDown /></v-icon>
  </button>
</th>
```

### Row select with bulk-action strip

```vue
<div v-if="selectedIds.length" class="ox-bulk-strip">
  <span>{{ selectedIds.length }} selected</span>
  <v-btn size="small" variant="text" @click="bulkEdit">Edit…</v-btn>
  <v-btn size="small" variant="text" color="danger" @click="bulkDelete">Delete</v-btn>
  <v-btn icon variant="text" size="small" aria-label="Clear selection" @click="clear">
    <v-icon><X /></v-icon>
  </v-btn>
</div>
<v-table>
  <thead><tr>
    <th><v-checkbox :model-value="allSelected" :indeterminate="someSelected && !allSelected" @update:model-value="toggleAll" aria-label="Select all" /></th>
    <th>Name</th>
  </tr></thead>
  <tbody>
    <tr v-for="row in rows" :key="row.id" :class="{'is-selected': selectedIds.includes(row.id)}">
      <td><v-checkbox :model-value="selectedIds.includes(row.id)" @update:model-value="toggleRow(row.id, $event)" /></td>
      <td>{{ row.name }}</td>
    </tr>
  </tbody>
</v-table>
```

### Empty state

```vue
<v-table>
  <thead>...</thead>
  <tbody>
    <tr v-if="!rows.length">
      <td :colspan="cols" class="ox-empty-cell">
        No matching records. <a href="#" @click.prevent="clearFilters">Clear filters</a>?
      </td>
    </tr>
    <tr v-else v-for="row in rows">...</tr>
  </tbody>
</v-table>
```

---

## Open questions

- **Server-side, infinite-scrolling, multi-sort, virtualized table**:
  out of scope for this spec. If/when a feature needs all four, open a
  dedicated "Linear-style data table" job (and reconsider whether to
  ship a custom component instead of `<v-table>`).
- **Column resize / reorder**: not specced. Lean: never. If a user
  needs different columns, that's a saved view, not a column drag.
