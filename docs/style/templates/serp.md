# SERP — search results page template

The list/table view for any entity type after a search:
`/{works,authors,sources,institutions,topics,concepts,publishers,funders,
awards,locations}` with a query string. Highest-traffic page in the app
after Home. Carries the most chrome by far — search box, filter chips,
result count, sort, density toggle, master selection, collection
actions, pagination, group-by rail.

**Routes:** `/works`, `/authors`, `/sources`, `/institutions`, `/topics`,
`/concepts`, `/publishers`, `/funders`, `/awards`, `/locations`,
with optional `?search=`, `?filter=`, `?sort=`, `?page=`, `?per_page=`,
`?view=`, `?tab=`, `?id=` (saved-search).

**Files:**
- `src/views/Serp.vue` — route shell (fetch + error handling)
- `src/components/ExpertSerp.vue` — page chrome
- `src/components/SearchBox.vue` — query input
- `src/components/SerpResultsListItem.vue` — list-row
- `src/components/Results/ResultsTable.vue` — table view
- `src/components/SerpRightToolbar.vue` — view-mode + density toggle row
- `src/components/Filter/FilterList.vue` + `NoviceFilterChips.vue` — filter UI
- `src/components/GroupByViews.vue` — right rail facets
- `src/components/SlidingPagination.vue` — bottom pagination
- `src/components/SelectionBanner.vue` — select-all banner
- `src/components/CollectionActionMenu.vue` — collection bulk actions

**Consumes:** [`tokens.md`](../tokens.md),
[`typography.md`](../typography.md), [`icons.md`](../icons.md),
[`components/card.md`](../components/card.md),
[`components/input.md`](../components/input.md),
[`components/select.md`](../components/select.md),
[`components/checkbox-radio-switch.md`](../components/checkbox-radio-switch.md),
[`components/table.md`](../components/table.md),
[`components/menu.md`](../components/menu.md),
[`components/badge-chip.md`](../components/badge-chip.md),
[`components/alert.md`](../components/alert.md),
[`components/loading.md`](../components/loading.md),
[`components/navigation.md`](../components/navigation.md).

---

## Page shape (canonical: list view at `lg`)

```
+----------------------------------------------------------------------+
| Top bar (44px)                                                       |
+--+-------------------------------------------------------------------+
|  | <-- container fluid; --ox-space-6 (24px) outer gutters
|  |                                                                    |
|  |  ┌──── view-mode toolbar (right-aligned, 32px tall) ──────────┐    |
|S |  │                            [List | Table | API]  ⊟ density │    |
|i |  └────────────────────────────────────────────────────────────┘    |
|d |                                                                    |
|e |  ┌──── primary col (6/12 list mode; 9/12 table mode) ─────────┐    |
|b |  │  ┌─ Search box (full-width inside col) ────────────────┐   │    |
|a |  │  │  [🔍] Search 200M works…                            │   │    |
|r |  │  └─────────────────────────────────────────────────────┘   │    |
|  |  │                                                            │    |
|2 |  │  Filter chips (basic) OR filter list (advanced)            │    |
|4 |  │   [+ Add filter]  [type=article]×  [oa=closed]×            │    |
|0 |  │                                                            │    |
|p |  │  ┌─ Results-header row (24px) ──────────────────────────┐  │    |
|x |  │  │ ☐  about 12,300,000 works     ⊕ Collection  ↓ Sort   │  │    |
|  |  │  └──────────────────────────────────────────────────────┘  │    |
|  |  │  (select-all banner, when active)                          │    |
|  |  │  ┌─ Results card (variant=outlined) ───────────────────┐  │    |
|  |  │  │ row · row · row · row · row · row · row · row · row │  │    |
|  |  │  └──────────────────────────────────────────────────────┘  │    |
|  |  │  Pagination — sliding 1 … 12 13 14 … 488,420               │    |
|  |  └────────────────────────────────────────────────────────────┘    |
|  |  ┌──── side col (6/12 list mode; 3/12 table mode) ───────────┐    |
|  |  │  Group-by rail (4–8 facet cards stacked, hairline only)    │    |
|  |  │   By publication year   ▾                                  │    |
|  |  │   By type                ▾                                  │    |
|  |  │   By open access         ▾                                  │    |
|  |  └────────────────────────────────────────────────────────────┘    |
+--+--------------------------------------------------------------------+
```

- **Fluid container**, not max-1200. SERP wants to use horizontal space
  on wide displays — the rail benefits, the table benefits, the list
  rows are width-capped internally by `--ox-prose-max` so they don't
  go ugly-wide.
- **Two-column grid uses `<v-row>` with `cols=6/6` in list view and
  `cols=9/3` in table view.** Table needs more width; group-by rail
  needs less. The list view keeps the rail wider so facets have room
  to breathe.
- **Search box is the only thing centered above the fold.** Filters
  hang off the bottom of the search box; everything else stacks below.
- **No card on the page background.** The page renders straight on
  `--ox-bg-base`; only the results region is in a card. (Group-by
  cards in the rail are flat — see below.)

---

## Section hierarchy

| Rank | Section | Component | Tokens |
|------|---------|-----------|--------|
| (no H1) | — | The page does not render its own H1. `useHead({title})` sets the browser-tab title only. | — |
| H2 | "Filter" group header (advanced mode only) | `<h2>` styled `--ox-type-h2` | 16/500, `--ox-text-primary`. Sits inside the FilterList chrome. |
| H3 | Group-by card heading ("By publication year") | `<h3>` styled `--ox-type-h3` | 15/500/23 |
| H3 | Results-card section title (currently absent — see "Anti-patterns") | — | — |
| Label | Result-meta labels (cited by, open access, etc.) | `--ox-type-label` | 13/500, `--ox-text-tertiary` |
| Body | Result title | `--ox-type-body` (force `font-weight: 500`) | 14/500, `--ox-text-primary`, max-width clamped to `--ox-prose-max` |
| Body | Result authors / journal | `--ox-type-body` | 14/400, `--ox-text-secondary` |
| Caption | Result-meta values, topic tags | `--ox-type-caption` | 12/500, `--ox-text-tertiary` |

> **Why no page H1?** A SERP's title *is* the query + filters, which the
> search box and filter chips already display. Adding an H1 ("Works
> search results") would be redundant chrome. Compare Linear's search
> page — same call.

---

## Spacing rhythm

| Slot | Token | Value |
|------|-------|-------|
| Top bar → view-mode toolbar | `--ox-space-4` (14px in existing code) | 14 |
| View-mode toolbar → search box | `--ox-space-2` | 8 |
| Search box → filter chips/list | `--ox-space-4` | 16 |
| Filter region → results-header row | `--ox-space-8` (currently `margin-top: 84px` — see below) | 32 (**reduce** from 84) |
| Results-header row → results card | `--ox-space-2` | 8 |
| Result row → next result row | 0 (rows own their own dividers) | — |
| Results card → pagination | `--ox-space-4` | 16 |
| Pagination → page bottom | `--ox-space-12` | 48 |
| Primary col → side col gutter | `--ox-space-6` | 24 (`g-6`) |
| Group-by card → next group-by card | `--ox-space-3` | 12 |

> **The current `margin-top: 84px` on the results-header row
> (`ExpertSerp.vue:36, 162`) is a magic number, not a token.** It exists
> because the floating filter-list popover overlaps the header without
> it. Phase 5 must replace this with a real layout solution: either
> (a) reserve a fixed 32px gap and let the filter popover float on top
> of the header (the popover is z-elevated), or (b) move the filter
> region into a sticky strip and let the header row sit immediately
> below at 32px. Default to (a). Do not ship the 84px in the new layer.

---

## View-mode toolbar (`SerpRightToolbar`)

```
                                            [List | Table | API]  ⊟ density
```

- Right-aligned strip above the search box. 32px tall.
- Three buttons in a segmented control: **List** (default), **Table**,
  **API** (renders the API request beneath the search box for power
  users). Selected button uses the Pill-tab "selected" treatment from
  [`components/tabs.md`](../components/tabs.md): black bg, white text.
- **Density toggle** (compact / cozy) sits to the right of the segmented
  control, separated by a 12px hairline. Currently a single-button
  toggle; spec it as a Ghost icon-only `<v-btn>` that opens a Menu of
  the two options.
- **No "share" / "export" buttons in this row.** Export is gated by
  selection size and lives in the CollectionActionMenu. Share is a
  saved-search action — lives in the "Save" affordance, when the user
  has results saved.
- Toolbar **stays on screen at small viewports** (does not collapse
  into a menu). Density toggle hides at `xs`; segmented control stays.

---

## Search box

- Owns the full primary-col width (= 6/12 list, 9/12 table).
- Uses [`components/input.md`](../components/input.md) with **the size
  override**: 40px tall (instead of the 32px default), 15px text
  (instead of 13px) — search is the hero, so it gets a step up.
- **Search icon left-prefix** (`Search`, 18px, `--ox-text-tertiary`).
  Clear-affordance right-suffix (`X`, Ghost icon-only) when the input
  has text.
- Placeholder: `Search {entity-displayName}…` (`Search works…`,
  `Search authors…`).
- **Submit on Enter.** Do not auto-search on keystroke for the SERP
  (autocomplete on the home page is different).
- **Loading state** (search in flight): the search-icon prefix swaps
  to a 16px Spinner from [`components/loading.md`](../components/loading.md).
  The input border stays static (no shimmer).

---

## Filter region

Two modes, both consume the same URL `?filter=` param. User picks via a
small Ghost icon-only "filter style" menu trailing both UIs.

### Basic (chips) — `NoviceFilterChips`

```
[+ Add filter]   [type: article ×]   [open_access: true ×]   [year: 2020–2025 ×]
```

- A `+ Add filter` Ghost button on the left opens a Menu (component
  `Menu`) listing each available facet. Selecting one opens a sub-menu
  for the value pick.
- Each applied filter is a Chip (interactive, outlined) from
  [`components/badge-chip.md`](../components/badge-chip.md) — 24px
  tall, 6px radius, `--ox-text-secondary`. Click the `×` suffix to
  remove. Click the chip body to edit (re-opens the value picker).
- Wraps at the container edge with `--ox-space-1` (4px) row-gap and
  `--ox-space-2` (8px) col-gap.
- **Max chip width** = 320px. Long values (institution names) truncate
  with ellipsis; full value in a Tooltip.
- **Filter-style-menu** (Ghost icon-only, `SlidersHorizontal` 18px)
  sits at the row's right edge.

### Advanced (full list) — `FilterList`

- Renders a full `<v-card flat>` filter-builder. Each filter row is
  one [`components/input.md`](../components/input.md) for the value
  with the property in a Select prefix.
- Uses 32px control height (default). Trailing `+` Ghost button to add.
- `Filter-style-menu` appears in this card's toolbar slot, right-aligned.
- The filter list **can throw `searchError` and the page recovers** —
  see [Errors](#errors-encountered) and `Serp.vue:101-110`. Any future
  helper that consumes `route.query.filter` must never throw from a
  render-time computed; the whole SERP went blank in oxjob #228 over
  this. Wrap such calls in a `try/catch` that sets `searchError`.

### "No filters available" state

Some entity types (`topics`, `concepts`) have no public-facing facets.
Render a single 40px-tall row with `--ox-text-quaternary` 14px text:
"No filters available." Match the height of the filter region in the
other state so the page below doesn't jump on facet-config reload.

---

## Results-header row (above the card)

```
☐  about 12,300,000 works                       ⊕ Collection  ↓ Sort
```

| Slot | Component | Notes |
|------|-----------|-------|
| Master selection | Compact `<v-checkbox-btn>` | 18px hit, no label. Indeterminate state when some-but-not-all rows are selected. Hidden in table view (table has its own master checkbox in its header). |
| Result count | `<span>` text | `--ox-type-body` (14/400), `--ox-text-tertiary`. Pattern: `"{about }{precise-or-rounded} {entity-displayName}"`. Rounded via `filters.toPrecision`; prefix `about` only when rounded. |
| Spacer | `<v-spacer />` | |
| Collection-action menu | Ghost icon-only `<v-btn>` opens a Menu | Disabled when no rows are selected. Once selected, label switches to "Add to…" with count badge. |
| Sort | Ghost icon-only `<v-btn>` opens a Menu | Sort options come from `entityConfigs[entityType].sortOptions`. Current sort shown as a chip-style label inside the trigger ("Sort: Relevance ▾"). |

- Row height **32px**. All right-cluster items align to its baseline.
- **One pattern, both views** — the same row renders above both the
  list and the table view, minus the master checkbox in table view.
- **Selection persists across pages** within a search. The master
  checkbox toggles only the current page (per Vuetify checkbox-btn
  semantics); "Select all N results" is opt-in via the banner.

---

## Selection banner (above results, below header row)

Renders only when the user has selected one or more rows.

```
┌────────────────────────────────────────────────────────────────────┐
│ 25 results selected.   [Select all 12.3M]   [Clear]                │
└────────────────────────────────────────────────────────────────────┘
```

- Alert (info, tonal, dense) variant from
  [`components/alert.md`](../components/alert.md).
- Two affordances inline: "Select all N" (Ghost button) and "Clear"
  (Ghost button). Both 28px tall.
- Switches modes: `selectAllMode === true` puts the page in
  enumeration-blocked mode — the CollectionActionMenu shows a
  "Select-all results are too many to enumerate; bulk-add will
  rerun the search on the server" hint.
- Banner copy swaps when `selectAllMode === true`: "All 12.3M results
  selected. [Clear]".

---

## Results card (the list)

- `<v-card variant="outlined">`, full width inside the primary column.
- **Zero internal padding** — rows own their padding edge-to-edge so
  hover/selection highlights extend full bleed.
- Each row is `SerpResultsListItem`:
  - Master checkbox (16px) at left, 14px gap.
  - Title (`--ox-type-body` weight 500, `--ox-text-primary`).
  - Meta row (`--ox-type-caption`, `--ox-text-tertiary`): journal /
    cited-by-count / date / language code.
  - Topic-tag row (`--ox-type-caption`, comma-separated tags up to 3).
  - Optional right-aside: PDF action, citation count, or pending-state badge.
- Row vertical padding: **`--ox-space-3` (12px)** top/bottom — current
  rows use 16px and feel too airy; pull down one step.
- Row divider: **`1px solid --ox-border-subtle`** between rows. **No**
  zebra striping. Last row drops the divider.
- Title click → entity detail page. **Open-in-new-tab on cmd/ctrl
  click** must work — title is a real `<a>`, not a JS-handler `<div>`.
- Row hover: `--ox-bg-hover` background. Row selected: `--ox-bg-selected`.

### Table view

`<ResultsTable>` is documented in
[`components/table.md`](../components/table.md) — read that for row
dimensions and sort/select behavior. SERP-specific notes:

- **"Filter by this…" column-header menu** opens a headless `AddFilter`
  on the property's value-picking step. The trigger is the column
  header's Ghost icon-only kebab.
- **Sticky header** is required. Tables can run thousands of rows; users
  need to know which column they're scrolling.
- **First column is always the title** for `works`, the display name
  for entity types. Other columns are user-customizable via
  `[+ Add column]` chip at the right of the header row.

---

## Pagination

- `<SlidingPagination>` at the bottom of the results card, **inside**
  the card (so it shares the card's hairline border).
- Vertical padding: `--ox-space-8` bottom, `--ox-space-4` top.
- Hidden when total count ≤ per-page. Always-shown when count > per-page.
- Page-size selector lives in the right-toolbar area (not here) — this
  row is page numbers only.
- Use Ghost icon-only `<v-btn>` for prev/next arrows; the page numbers
  are Ghost text buttons; current page is a Pill-tab "selected" chip
  (black bg, white text, 24px tall).

---

## Side column — group-by rail (`GroupByViews`)

```
┌────────────────────┐
│ By publication year│   ← h3 — 15/500
│  2025         8.2K │
│  2024         11.4K│
│  2023         10.9K│
│  2022         9.7K │
│  2021         8.3K │
│  + 84 more         │   ← Ghost "Show all" trigger
└────────────────────┘
```

- Stack of cards, one per facet. **No outer card** wrapping the rail.
- Each facet card is `<v-card flat>`, no hairline. Visual separation
  comes from the 12px gap and the card padding (`px-2 pt-3 pb-2`).
- Each facet's header is an `<h3>` — `--ox-type-h3` (15/500/23).
- Bucket rows: label left, count right. **28px row height**, dense.
  Hover row: `--ox-bg-hover`. Click row → applies that facet as a
  filter and re-runs the search.
- **Top 5 buckets shown by default**; "Show all" → expands inline
  to all buckets with virtual-scroll.
- **Skeleton** placeholder for each card during fetch: 5 row stubs.
- **"No data"** state inside a card: single row, italic
  `--ox-text-quaternary`, "No values."

### Semantic search exception

When `?search.semantic` is set, the group-by rail is replaced by:

```
            ⓘ  Semantic search doesn't support faceting.
```

- Vertical-centered placeholder in the side column. 14px
  `--ox-text-tertiary`. 18px Info icon prefix.
- The primary column still renders normally — only the rail changes.

---

## Per-entity-type matrix

| Entity | Default sort | Default columns (table) | Per-page choices |
|--------|--------------|--------------------------|------------------|
| works | `cited_by_count:desc` | title · authors · year · cited_by_count | 25, 50, 100, 200 |
| authors | `works_count:desc` | display_name · works_count · cited_by_count · h_index | 25, 50, 100, 200 |
| sources | `works_count:desc` | display_name · type · works_count · cited_by_count | 25, 50, 100, 200 |
| institutions | `works_count:desc` | display_name · country · works_count · cited_by_count | 25, 50, 100, 200 |
| topics | `works_count:desc` | display_name · subfield · works_count | 25, 50, 100 |
| concepts | `works_count:desc` | display_name · level · works_count | 25, 50, 100 |
| publishers | `works_count:desc` | display_name · country · sources_count | 25, 50, 100 |
| funders | `grants_count:desc` | display_name · country · grants_count | 25, 50, 100 |
| awards | `publication_year:desc` | display_name · funder · year | 25, 50, 100 |
| locations | `cited_by_count:desc` | landing_page · source · type | 25, 50 |

Use this matrix during Phase 5 to populate `entityConfigs[*].defaultSort`
and `defaultColumns`. Today these live in `entityConfigs.js`; the
template just reflects them — do not duplicate the values into the
spec text.

---

## Breakpoints

| Breakpoint | Threshold | Layout |
|------------|-----------|--------|
| `xs` | <600px | Single column, stacked. Sidebar hidden. View-mode toolbar density toggle hidden. Filter chips wrap freely. Group-by rail stacks below results. |
| `sm` | 600–960 | Same as `xs`, but search box centers up to 800px wide. |
| `md` | 960–1280 | Two-column grid 6/6 (list) or 9/3 (table). Sidebar visible. Pagination collapses sliding window from "1 … 12 13 14 … N" to "← 12 13 14 →". |
| `lg` | 1280–1920 | Full layout. Sliding pagination at full width. |
| `xl` | ≥1920 | Same as `lg`, container stays fluid. |

- **No `xxl`** treatment — content runs fluid.
- **`mdAndUp` is the desktop/mobile cutover** in `ExpertSerp.vue:4` — at
  `sm` and below, the page falls back to a stacked layout with the
  search box centered. Keep that cutover; do not move it.

---

## States

### Loading

- **Initial load** (route enter, no `resultsObject` yet): Skeleton.
  - Results-header row skeleton: 18px tall stub for the count text,
    no master checkbox skeleton (it renders as disabled instead).
  - Results card: 10 row skeletons inside the outlined card. Each is
    a 64px-tall row with shimmer on the title bar (60% width) and
    meta bar (40% width).
  - Side rail: 3 group-by card skeletons, each with header stub + 5
    row stubs.
- **Page-change load** (user clicks page 3): skeleton over the results
  card only. Header row keeps the previous count text (don't blank it).
- **Filter-change load** (user adds a filter): skeleton over **both**
  the results card and the side rail (group-by buckets recompute).
- **Sort-change load**: skeleton over results card only.
- **Per-page-change load**: skeleton over results card only.

### Empty

| Where | Copy | Component |
|-------|------|-----------|
| `meta.count === 0` | "Try adjusting your search or filters." | Inline empty-state inside the results card. `--ox-text-tertiary`, 14/400, centered, `--ox-space-8` vertical padding. **Not** an Alert — Alerts are for actionable conditions; this is a "no results" state. |
| Facet card with no buckets | "No values." | Single italic row, `--ox-text-quaternary`. |
| Saved-search id in URL but not in user's saved searches | (Silent: strip the `?id=` from the URL and proceed normally.) | — |

### Error

| Where | Copy | Component |
|-------|------|-----------|
| `searchError` (API non-2xx) | The API's `error.response.data.message` if present; otherwise the JS error message; otherwise "Search failed." | Inline error row inside the results card: red icon + text, 14/400 `--ox-error`, `--ox-space-4` padding. **Not** an Alert (no actions to take besides changing the filters). The selection banner / pagination must hide while `searchError` is set. |
| Group-by API failed | "Couldn't load." Ghost "Retry" button right-aligned. | Inline error row inside the facet card. |
| Filter parsing threw (e.g. unknown filter key) | API surfaces the error via the same `searchError` channel — see `Serp.vue:101-124`. Spec relies on the existing try/catch chain. | Inline error row. |

> **Don't render the page without `searchError` handling.** The
> oxjob #228 QA-051 regression had `searchError === null` *and*
> `resultsObject === null` simultaneously, producing a completely
> empty page with no UI feedback. The template requires that every
> state path renders **either** results OR `searchError` OR a
> skeleton — never all three nullish.

---

## Vuetify mapping

| Page slot | Vuetify | Notes |
|-----------|---------|-------|
| Outer container | `<v-container fluid class="pt-0">` | Fluid because the table view wants the full width. `pt-0` because the top bar already supplies the vertical break. |
| Two-column grid | `<v-row>` + `<v-col cols="12" :md="6 or 9">` / `<v-col cols="12" :md="6 or 3">` | g-6 (24px) gutters. |
| Right toolbar | `SerpRightToolbar` (custom) | Pill-tab segmented control inside. |
| Search box | `<v-text-field>` styled per input.md large variant | Variant `outlined`, density `default`, custom 40px height. |
| Filter chips | `NoviceFilterChips` (custom) | Renders `<v-chip>`s with `closable` + custom click handler. |
| Filter list | `FilterList` (custom) | Inside a `<v-card flat>`. |
| Results-header row | `<div class="d-flex align-center">` | No `<v-toolbar>`. |
| Results card | `<v-card variant="outlined" class="bg-white">` | The `bg-white` becomes redundant in the new layer — drop in Phase 5. |
| Result rows | Plain `<div>` per row inside the card | No `<v-list>` — Vuetify list defaults clash with our row chrome. |
| Pagination | `<SlidingPagination>` (custom) | Renders Ghost buttons and a Pill-tab selected indicator. |
| Group-by rail | `<GroupByViews>` (custom) → stack of `<v-card flat>` | One flat card per facet. |
| Filter-mode snackbar | `<v-snackbar location="bottom">` | Per `components/toast.md`. |

### Defaults to add (Phase 5)

```js
VContainer: {
  // SERP wants fluid; force callers to opt out for narrow pages.
  // (Don't ship this default until every other page is checked — too many
  // pages rely on the constrained default. Track as a follow-up.)
},
```

No global defaults for this page beyond what the component specs
already define. The page's complexity is composition, not control
overrides.

---

## Overrides (SASS)

```scss
.ox-serp {
  // Results-header row: trim Vuetify's default checkbox-btn min-width
  // so the master checkbox sits flush with the per-row checkboxes.
  .results-header-checkbox {
    flex: 0 0 auto;
    width: auto;
    min-width: 0;
  }

  // Search box: larger variant.
  .ox-serp__searchbox {
    .v-field {
      --v-field-input-padding-top: 8px;
      --v-field-input-padding-bottom: 8px;
      font-size: 15px;
      min-height: 40px;
    }
  }

  // Result rows: no Material list-item indent.
  .result-item {
    padding: var(--ox-space-3) var(--ox-space-4);
    border-bottom: 1px solid var(--ox-border-subtle);
    &:last-child { border-bottom: 0; }
    &:hover { background: var(--ox-bg-hover); }
    &.is-selected { background: var(--ox-bg-selected); }
  }

  // Group-by rail cards — flat, no border.
  .group-by-card {
    padding: var(--ox-space-3) var(--ox-space-2);
  }
  .group-by-row {
    height: 28px;
    padding-inline: var(--ox-space-2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    &:hover { background: var(--ox-bg-hover); cursor: pointer; }
  }
}
```

**Zero `!important`.** The current page has 13 inline-style files
contributing to the layout (per EXPLORE Phase 1 audit); Phase 5 must
collapse those into this scope.

---

## Anti-patterns

- **Don't put the search box in the top bar.** The top bar's `Search…`
  affordance is for the command palette (Cmd-K), not the SERP. They
  do different things — top-bar search jumps the user *to* a result
  by ID/title; SERP search runs a real OAI search.
- **Don't render an H1 above the search box.** "Works search results"
  is chrome the user already sees in the chip strip and the count text.
- **Don't insert an extra `<v-card>` around the group-by rail.** Each
  facet is its own flat card. A wrapper card flattens visual hierarchy.
- **Don't show "Save search" until the user has hit at least one
  filter.** Saving an empty query is meaningless and clutters the
  saved-search dashboard.
- **Don't use `<v-data-table>` for the table view.** We use `<v-table>`
  + custom selection/sort. See [`components/table.md`](../components/table.md).
- **Don't auto-collapse the filter region at small viewports.** Filters
  matter for narrow-screen users (mobile). Keep them visible; let them
  wrap.
- **Don't gate the master selection on user signup.** Selection is a
  client-side action. Save (which posts to the API) gates on signup.
- **Don't show pagination above the results card.** Bottom only. Adding
  top pagination feels Stack-Overflow-y; we don't have the row density
  to need it.
- **Don't render result rows as `<v-list-item>`s.** The Material list-
  item brings indents and ripples that fight the row layout. Plain
  `<div>` with our `.result-item` SASS shape.

---

## Recipes

### Render the desktop SERP shell

```vue
<v-container fluid class="ox-serp pt-0">
  <serp-right-toolbar :results-object="resultsObject" class="mt-3 mb-2" />

  <v-row>
    <v-col :cols="isTableView ? 9 : 6">
      <search-box class="ox-serp__searchbox mb-4" />

      <filter-region-or-no-filters />

      <serp-api-editor v-if="isApiView" class="mb-6" />

      <div class="d-flex align-center pl-1 pb-2 ox-serp__header-row">
        <v-checkbox-btn v-if="!isTableView" class="results-header-checkbox mr-1"
          density="compact"
          :model-value="masterChecked" :indeterminate="masterIndeterminate"
          @update:model-value="onMasterClick" />
        <span class="text-body-2 text-medium-emphasis">{{ resultsCountLabel }}</span>
        <v-spacer />
        <collection-action-menu :entity-type="entityType"
          :selected-ids="effectiveSelectedIds"
          :enumeration-blocked="enumerationBlocked"
          @applied="onCollectionsApplied" />
        <novice-sort-button class="ml-1" />
      </div>

      <selection-banner class="mb-2" />

      <v-card variant="outlined">
        <results-table v-if="isTableView" :results-object="resultsObject"
          :entity-type="entityType" @filter-column="onColumnFilter" />
        <template v-else>
          <serp-results-list-item v-for="r in resultsObject?.results || []"
            :key="r.id" :result="r" selectable />
        </template>
        <inline-error v-if="searchError" :message="searchError" />
        <empty-state v-else-if="resultsObject?.meta?.count === 0"
          message="Try adjusting your search or filters." />
        <sliding-pagination v-if="showPagination" v-model="page"
          :count="resultsObject?.meta?.count || 0"
          :per-page="url.getPerPage()" />
      </v-card>
    </v-col>

    <v-col :cols="isTableView ? 3 : 6">
      <semantic-search-note v-if="isSemanticSearch" />
      <group-by-views v-else :results-object="resultsObject"
        hide-toolbar hide-results-count />
    </v-col>
  </v-row>
</v-container>
```

### Wrap a filter parser to never throw at render

```js
// In a watcher OR in a try/catch, never in a render-time computed.
const filters = (() => {
  try {
    return filtersFromUrlStr(entityType.value, route.query.filter);
  } catch (e) {
    console.warn('[serp] bad filter URL, ignoring:', e.message);
    return [];
  }
})();
```

### Surface API errors inline

```vue
<div v-if="searchError" class="text-error text-body-2 d-flex align-start
            px-4 py-6" role="alert">
  <v-icon size="18" class="mr-2 mt-1" color="error">mdi-alert-circle-outline</v-icon>
  <div>{{ searchError }}</div>
</div>
```

`searchError` is set by `Serp.vue:101-110` from the API's
`response.data.message`. Never blank the page; always render this row
when the API responded with a non-2xx.

---

## Open questions for Phase 7

1. **Drop the `margin-top: 84px` magic number.** Replace with a real
   layout solution that doesn't depend on the filter popover
   z-stacking. (See Spacing-rhythm note above.)
2. **Should the right toolbar move into the top bar at `xl+`?** It
   currently lives in the page. Moving it to the top bar would free
   vertical space but tie the SERP's chrome to the app shell — fine
   for SERP, weird for entity-detail. Keep where it is.
3. **Density toggle: 2 levels or 3?** Currently 2 (compact / cozy).
   Linear has 3 (compact / cozy / comfortable). Three feels excessive
   for our row content. Stay at 2.
4. **Pagination position: inside the results card or outside?** Current
   spec puts it inside (shares the card border); the old Funders2026
   page puts it outside. Inside reads cleaner. Confirm during Phase 7.
