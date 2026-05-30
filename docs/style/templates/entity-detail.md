# Entity detail — page template

The canonical "single thing" page in openalex.org: a Work, an Author, a
Source, an Institution, a Topic, a Concept, a Publisher, a Funder, an
Award, or a Location. One file (`EntityPage.vue`) renders all of them
today, branching on `entityType`. This template specs the shared shape;
per-type variations are footnotes, not separate pages.

**This is also the [Phase 7](../../README.md) pilot.** Whatever this
spec says, the Work-detail refactor will live or die by. If the spec
disagrees with reality during that refactor, fix the spec first, then
the code.

**Routes:**
`/works/:id`, `/authors/:id`, `/sources/:id`, `/institutions/:id`,
`/topics/:id`, `/concepts/:id`, `/publishers/:id`, `/funders/:id`,
`/awards/:id`, `/locations/:id`.

**File:** `src/views/EntityPage.vue` (+ children:
`Entity/EntityHeader.vue`, `Entity/EntityNew.vue`,
`Entity/EntityMetrics.vue`, `Entity/EntityDatumRow.vue`).

**Consumes:** [`tokens.md`](../tokens.md),
[`typography.md`](../typography.md), [`icons.md`](../icons.md),
[`components/card.md`](../components/card.md),
[`components/tabs.md`](../components/tabs.md),
[`components/badge-chip.md`](../components/badge-chip.md),
[`components/alert.md`](../components/alert.md),
[`components/loading.md`](../components/loading.md),
[`components/navigation.md`](../components/navigation.md).

---

## Page shape (canonical: Work detail at `lg` and above)

```
+----------------------------------------------------------------------+
|  Top bar (44px) — see components/navigation.md                       |
+--+-------------------------------------------------------------------+
|  | <-- 1200px content max-width, centered, --ox-space-6 (24px) gutters
|  |  ┌─ Header meta row (24px tall) ─────────────────────────────┐    |
|  |  │  [←]  Tag · Tag · Tag                  ⚙  API  ☆  ⋯       │    |
|  |  └────────────────────────────────────────────────────────────┘    |
|S |                                                                    |
|i |  ┌─ Title block ─────────────────────────────────────────────┐    |
|d |  │  H1 — display, weight 500, 24/30                          │    |
|e |  │  (after-title slot: tiny inline editor for owner)         │    |
|b |  │  (after-header slot: type-specific subhead)               │    |
|a |  └────────────────────────────────────────────────────────────┘    |
|r |                                                                    |
|  |  ┌─ Linkout row (works/locations only) ──────────────────────┐    |
|2 |  │  [DOI] [PDF] [Landing] [Read in repo]                     │    |
|4 |  └────────────────────────────────────────────────────────────┘    |
|0 |                                                                    |
|p |  ┌───────────── primary col, 7/12 ─────┐  ┌── side col, 5/12 ──┐   |
|x |  │  Tabs (Underline variant)            │  │ Metrics card       │   |
|  |  │  ┌ Details ┐ ┌ Locations ┐           │  │  - Cited by        │   |
|  |  │                                      │  │  - FWCI            │   |
|  |  │  Card (variant=outlined, hairline)   │  │  - h-index         │   |
|  |  │  --ox-space-6 internal padding       │  │  - Works count     │   |
|  |  │  EntityDatumRow × N                  │  │                    │   |
|  |  │                                      │  │ Group-by × 3       │   |
|  |  │                                      │  │  (publication_year,│   |
|  |  │                                      │  │   primary_topic,   │   |
|  |  │                                      │  │   type)            │   |
|  |  └──────────────────────────────────────┘  └────────────────────┘   |
+--+--------------------------------------------------------------------+
```

- **One canonical layout, type-specific slots.** All 10 entity types
  share top bar → header meta → title → optional linkouts → primary col
  + side col. The primary col's *contents* differ (Works gets tabs;
  Authors/Sources/Institutions/etc. get a flat detail card stacked
  above a works list); the *layout* does not.
- **Sidebar is decoration, not content.** All content the user came for
  must be reachable in the primary column. The side rail is metrics +
  group-bys + "view as search" affordances. If `showEntityPageStats`
  is off (admin toggle), the primary col goes full-width 12/12 and the
  side rail disappears — the page still works.

---

## Section hierarchy

| Rank | Section | Component | Tokens |
|------|---------|-----------|--------|
| H1 | Title block | `<h1>` styled `--ox-type-display` | 24/500/30, `--ox-text-primary` |
| H2 | Tab labels | `components/tabs.md` Underline | 14/500, `--ox-text-secondary` |
| H3 | Metrics card heading ("Metrics") | `<h3>` styled `--ox-type-h3` | 15/500/23, `--ox-text-primary` |
| H3 | Group-by card heading ("By year", "By topic") | `<h3>` styled `--ox-type-h3` | 15/500/23 |
| Label | Row labels in metrics / group-by | `--ox-type-label` | 13/500, `--ox-text-tertiary` |
| Body | Row values | `--ox-type-body` | 14/400/24, `--ox-text-primary` |
| Caption | Group-by counts / "of N" | `--ox-type-caption` | 12/500, `--ox-text-tertiary` |

> **No `<h2>` in this page.** Tabs replace section headings inside the
> primary column. If a future page needs two stacked sections in the
> primary column (Source-detail does), `<h2>` is allowed — `--ox-type-h2`
> (16/500). The Work page does not.

---

## Spacing rhythm

| Slot | Token | Value |
|------|-------|-------|
| Top bar → page content | `--ox-space-6` | 24 |
| Page content → header meta row | 0 | — |
| Header meta row → title | `--ox-space-2` | 8 |
| Title → after-header subhead | `--ox-space-1` | 4 |
| Title block → linkout row | `--ox-space-3` | 12 |
| Linkout row → primary/side grid | `--ox-space-6` | 24 |
| Tabs → tab panel content | `--ox-space-6` | 24 |
| Primary col → side col gutter | `--ox-space-6` | 24 (`<v-row>` default at `g-6`) |
| Side card → next side card | `--ox-space-4` | 16 |
| EntityDatumRow → next row | `--ox-space-3` | 12 |
| Page content bottom → footer | `--ox-space-12` | 48 |

**Card internal padding** for this page: `--ox-space-6` (24px) on all
sides — Card spec's "loose" variant. This page is hero content; cards
get the loose variant.

**No nested cards.** The tabbed primary card holds the tab panel
directly; do not put a `<v-card>` inside a `<v-card>`. Locations-tab
result cards are the exception (4-up grid of small cards inside the
tab panel) — those are `--ox-space-4` (16px) padding, default variant.

---

## Header meta row (Row 0)

```
[←] Tag · Tag · Tag                            ⚙ Edit  API  ☆  ⋯
```

Compact 24px row above the title. Holds:

| Slot | Position | Content | Tokens |
|------|----------|---------|--------|
| Back button | Far left | Ghost icon-only, `ArrowLeft`, 24px | Only shown when the user came from a SERP. Single 14px gap to the next slot. |
| Entity-type indicator OR roles list | After back | "Author" / "Work" / etc. with type icon prefix; or, for cross-type entities (Author who is also Institution), the `link-entity-roles-list` chip strip. | `--ox-type-caption` (12/500), `--ox-text-tertiary`. Icon 16px. |
| Spacer | center | `<v-spacer/>` | — |
| Claim-profile button (Authors only) | Right cluster | Ghost button with "Claim" label or muted "Claimed" pill. | 28px tall, `--ox-type-caption`. |
| Collections chip strip | Right cluster | One small chip per collection the entity is in (compact mode). | 24px tall chips, `components/badge-chip.md`. |
| "View in API" | Right cluster | Ghost icon-only `<v-btn>` linking to JSON, with tooltip. | 32px tap target; icon 18px. |
| Collection-menu kebab | Right cluster | Ghost icon-only, opens `Menu` for "Add to collection…", "Remove from collection…". | 32px tap target; icon 20px. |
| `#header-actions` slot | Far right | Caller-provided actions. | Right-aligned, `--ox-space-1` gap between items. |

- Row height **24px**; right-cluster buttons may extend to 32px tap
  target without growing the visual row (their hit area overhangs).
- **Single hairline only at top bar**, no second border under the meta
  row. The title's vertical whitespace separates it.
- **No Primary button in the meta row.** Editing actions on the
  *entity itself* (like Author display-name editing) belong in the
  `after-title` slot inline with the H1. Page-wide actions ("View in
  API", collections) live here as Ghost icons.

---

## Title block (Row 1)

```
H1 — Display 24px / 500 / line-height 30px
(after-title slot: inline editor, 28px chip-button)
(after-header slot: type-specific subhead — author byline, journal name)
```

- **Title is `<h1>` rendered via `--ox-type-display`** (24/500/30).
  Long titles wrap to two lines max at `lg`; truncate with ellipsis
  after the second line.
- **HTML in the title** — `prettyTitle()` injects `<i>`, `<em>`,
  `<sub>`, `<sup>`, italic species names, math italics. Allow these
  exact tags; strip everything else server-side.
- **`after-title` slot** is for inline single-cell edits (the Author
  display-name editor) — a 28px height chip-button that opens a
  small inline `<v-text-field>`. Anything wider than one row of text
  belongs on a separate Settings page.
- **`after-header` slot** is for the type-specific second line:
  - Works → author byline (truncated to 3 names + N more, `--ox-type-body`).
  - Sources → "Journal · Springer · England".
  - Authors → "Affiliation · ORCID linkout".
  - Topics / Concepts → field → subfield breadcrumb.

  No `after-header` for Locations, Awards, or Funders.

---

## Linkout row (works + locations only)

```
[DOI 10.1234/foo]  [PDF]  [Landing page]  [Open in Repository]
```

- Renders only for `works` and `locations`. Hidden for everything else.
- Chips are the `Tag` primitive from
  [`components/badge-chip.md`](../components/badge-chip.md): 24px
  tall, 6px radius, `--ox-type-caption`, `--ox-text-secondary`.
  Each chip is a link → opens in new tab.
- Wrap chips with `--ox-space-2` (8px) gap between, no comma separators.
- Max 4 visible at `md` and below — overflow into a `+ N more` Ghost
  button that opens a Menu (`components/menu.md`).

---

## Primary column

### Works (tabbed)

Two tabs only: **Details** and **Locations**. Each is a `<v-window-item>`.

- Tabs use the **Underline** variant from
  [`components/tabs.md`](../components/tabs.md), not Pill. Underline
  reads as primary navigation inside a card; Pill reads as filter UI.
- The tabs sit *inside* the outlined card, flush at the top edge. A
  hairline `<v-divider>` separates tabs from the panel body. No extra
  border between the divider and the panel.
- **Details panel** renders `EntityNew` with `--ox-space-6` (24px)
  vertical padding, no horizontal — the rows have their own.
- **Locations panel** renders a 4-up grid at `xl`, 2-up at `sm` to
  `lg`, stacked at `xs`. Each location card is `<v-card variant="outlined">`
  with default 16px padding; "primary" and "best oa" chips bottom-right
  in `<v-card-actions>`.
- Tab state is reflected in `?tab=locations` — refreshing the page
  preserves it. Default (no query) = Details.

### Non-works (stacked, no tabs)

- **Card 1**: Details — `<v-card variant="outlined">` with `--ox-space-6`
  internal padding, renders `EntityNew`.
- `--ox-space-3` (12px) gap.
- **Card 2**: Works list for this entity (Author's works, Source's
  works, Institution's works, etc.) — `<v-card variant="outlined">`
  with a `SelectionToolbar` row at the top, `SerpResultsListItem`
  list below, "Show more works" + "View as search" Ghost buttons at
  the bottom.
- When the user owns the Author profile (`isAuthorOwner`), Card 2 grows
  the curation chrome: pending-add/pending-remove rows render alongside
  current works with inline "Cancel" buttons, the toolbar gains
  trash-can / add-menu / pending-count chip. Layout dimensions don't
  change — only the row contents do.

### Awards

Same as non-works, but `groupByKeys` drops `type` (irrelevant for
awards). Card 2 sorts works by `publication_year:desc` instead of
`cited_by_count:desc`. No other layout difference.

### Locations

No Card 2 (no works list — a location can have many works, but they're
reachable as a SERP from the linkout row).

---

## Side column (metrics + group-bys)

- **Side column is `5/12` at `md+`.** Stacks below the primary column at
  `sm` and below.
- **Renders only when `showEntityPageStats === true`** (admin toggle).
  When off, the primary column takes 12/12 and the side column is
  removed entirely — not just hidden. No empty-space side rail.

### Metrics card (top)

```
+--------------------------------------+
| Metrics                              |
|                                      |
| Cited by                       1,234 |
| FWCI                            2.31 |
| h-index                            7 |
| Works count                       42 |
+--------------------------------------+
```

- `<v-card variant="flat">` (no border — side rail is already
  visually separated from the primary card by the 24px gutter).
- Internal padding: `px=2 pt=4 pb=3` (8/16/12). Tighter than the
  primary card on purpose; metrics scan-density beats Linear
  hairline-symmetry here.
- One `EntityDatumRow` per metric, in `metricsPriorityOrder`. Rows
  are 28px tall with `--ox-space-3` (12px) horizontal padding.
- Trailing bottom border on the metrics block (`1px solid
  --ox-border-subtle`) so the eye finds the seam between metrics and
  the first group-by card below.
- Hide entirely when `metricRows.length === 0`. Do not render an
  empty card.

### Group-by cards (below metrics)

- One `GroupBy` per key in `groupByKeys` (default:
  `publication_year`, `primary_topic.id`, `type`).
- `--ox-space-3` (12px) gap between each group-by card.
- Each group-by card has its own internal title — uses `--ox-type-h3`
  — and an "View as filtered search" Ghost link at the bottom (right-
  aligned).
- All group-bys hit the API with `filter=[entity-config-filter-key]:id`
  scoped to the current entity. If the call returns zero buckets,
  render the loading skeleton's terminal "no data" state, not an
  empty card.

---

## Per-entity-type matrix

| Type | Linkouts | Primary col | Tabs | Side rail group-bys |
|------|----------|-------------|------|---------------------|
| Works | Yes (DOI/PDF/Landing/Repo) | Tabbed (Details/Locations) | Yes (Underline) | None (`<v-row>` doesn't render the side rail for works in `EntityPage.vue:94` — only the metrics card. Group-bys are omitted because grouping works by topic with a `works.id` filter returns one bucket). |
| Authors | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Sources | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Institutions | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Topics | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Concepts | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Publishers | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Funders | No | Details card + Works list | No | `publication_year`, `primary_topic.id`, `type` |
| Awards | No | Details card + Works list (sort by year) | No | `publication_year`, `primary_topic.id` |
| Locations | Yes (Landing/PDF) | Details card only | No | None |

---

## Breakpoints

| Breakpoint | Threshold | Layout |
|------------|-----------|--------|
| `xs` | <600px | Sidebar hidden behind hamburger; primary col full-width; side col stacks below primary; meta-row right-cluster collapses to kebab only; title 20/500/28 (one step down). |
| `sm` | 600–960 | Sidebar still hidden behind hamburger; primary col full-width; side col stacks below; meta-row keeps API + kebab, hides claim button label (icon only). |
| `md` | 960–1280 | Sidebar visible (240px); two-column grid 7/5; container 100% width with `--ox-space-6` gutters. |
| `lg` | 1280–1920 | Same as `md`, container caps at 1200px and centers. |
| `xl` | ≥1920 | Same as `lg`. Locations grid widens from 2-up to 4-up. |

- **No `xxl` (≥2560)** treatment — content max stays at 1200. Extra
  width is whitespace.
- **Locations tab grid** is the only place that scales past 2-up:
  `xs` stack → `sm`/`md`/`lg` 2-up → `xl`+ 4-up.

---

## States

### Loading

- **Whole-page load** (initial route, no entity data yet): render the
  Skeleton variant from [`components/loading.md`](../components/loading.md)
  — a 24px tall meta row, a 30px tall title bar, a 60% width second-line
  bar, then a 360px tall primary card placeholder + a 200px tall side-rail
  placeholder. Skeleton uses `--ox-shimmer`, respects `prefers-reduced-motion`.
- **"Show more works" load**: Spinner (16px) inline next to the
  button label. Do not block the rest of the page.
- **Tab switch (Works → Locations)** when locations data is already
  on the entity: no loading state needed — the data is in
  `entityData.locations`. Render immediately.
- **Group-by load** (each card independently): Skeleton list rows
  inside the group-by card. Other side-rail cards render normally.

### Empty

| Where | Copy | Component |
|-------|------|-----------|
| Locations tab, no locations | "No locations available for this work." | Alert (info, tonal) — see [`components/alert.md`](../components/alert.md). |
| Works list (non-works entity), no works | "No works found for this {entity-type}." | Empty-state inside the card: `--ox-text-tertiary`, 14/400, centered, `--ox-space-12` vertical padding. **Not** an Alert — Alerts are for actionable conditions. |
| Side rail, group-by with zero buckets | "No data for {group-by-label}." | Same empty-state pattern inside the group-by card. |
| Author profile, owner mode, all pending cleared | (Hide the "n pending" chip entirely; no empty UI.) | — |

### Error

- **Whole-page error** (API 404 or network): the route should re-route
  to `/404` via the router, not render this page in an error state.
  This page assumes `entityData` is real.
- **Single-section API error** (group-by failed, "show more" failed):
  Alert (error, tonal, dense) at the top of the affected card.
  Includes a "Retry" Ghost button on the right side of the alert.
  Other sections render normally.
- **Retraction** (Works only, when `entityData.is_retracted === true`):
  Alert (error, tonal, dense) at the very top of the page **above the
  header meta row** — the existing `EntityHeader.vue:8-17` shape is
  correct, do not move it. Copy: "This work has been retracted." No
  date/reason fields exist on the API today (the field is a bare
  boolean), so the message stays short.

---

## Vuetify mapping

| Page slot | Vuetify | Notes |
|-----------|---------|-------|
| Outer container | `<v-container>` (default fluid=`false`, max-width 1200) | One per page. Drop the existing `style="min-height:80vh"` wrapper — let the shell own min-height. |
| Two-column grid | `<v-row>` + `<v-col cols="12" md="7">` / `<v-col cols="12" md="5">` | `g-6` gutters (24px). |
| Tabs | `<v-tabs>` + `<v-window>` | Underline variant (default in our SASS layer). `bg-color="transparent"` so the tabs inherit card background. |
| Primary card | `<v-card variant="outlined" rounded class="bg-white">` | 8px radius via default. `bg-white` becomes redundant once `--ox-bg-base` is the card default — remove during Phase 5 sweep. |
| Side card (metrics) | `<v-card flat>` | `flat` = `--ox-elev-0` (no border, no shadow). |
| Side card (group-by) | `<v-card flat>` | Same. |
| Locations grid | `<v-row>` + `<v-col cols="12" sm="6" xl="4">` inside the tab panel | 4-up at `xl` via `xl="4"` (12/4 = 3 cols → wait, `xl="4"` = 3 cols not 4; the existing markup uses `xl="4"` for 3-up. Update to `xl="3"` for 4-up if we want 4-up; otherwise keep 3-up. **Decide during Phase 7.**) |
| Header meta row | `<div class="d-flex align-center flex-wrap">` | No `<v-toolbar>` — it brings padding we don't want. |
| Title | `<h1>` (NOT `<v-card-title>`) | Page title is a real heading, not a card title. |

### Defaults to add (Phase 5)

```js
// createVuetify({ defaults: { ... } })
VTabs: {
  // Default to the Underline variant for in-card primary navigation.
  variant: 'underline',
  density: 'comfortable',
},
VWindow: {
  // Don't animate tab transitions; flickers ON every refresh because
  // the route-query watcher fires before the data fetch completes.
  // We'll re-add motion in the deferred motion job.
  transition: false,
},
```

---

## Overrides (SASS)

```scss
// Entity-page-only — scoped via a top-level class on the page wrapper.
.ox-entity-detail {
  // Tabs flush with the card top edge; no left padding from Material.
  .v-tabs {
    padding-left: 0;
    --v-tabs-height: 44px;
  }

  // Tab panel padding belongs to the page template, not Vuetify.
  .v-window-item {
    padding: 0;
  }

  // Metrics card has tighter row rhythm than the rest of the page.
  .entity-metrics-block {
    border-bottom: 1px solid var(--ox-border-subtle);
  }

  // Header meta row gap rhythm — no Vuetify equivalent without a wrapper.
  .header-meta-row {
    gap: var(--ox-space-1); // 4px between right-cluster icon buttons
  }

  // Curation rows (Author owner mode): flex shape, no shadow.
  .oa-cur-row {
    display: flex;
    align-items: flex-start;
    .oa-cur-body { flex: 1 1 auto; min-width: 0; }
    .oa-cur-badge {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      padding: var(--ox-space-4) var(--ox-space-3) 0 var(--ox-space-1);
      white-space: nowrap;
    }
  }
}
```

**Zero `!important`** in this scope. The current `EntityPage.vue:631-637`
block has `!important` overrides on `.v-toolbar__content` — those go
away in Phase 5 because we drop `<v-toolbar>` for the meta row entirely.

---

## Anti-patterns

- **Don't add a second H1 to the page.** Title is the only `<h1>`.
- **Don't put group-by cards in the primary column.** They're side
  rail only. If a group-by needs more vertical space than the side
  rail can give, it's a separate "Stats" page, not a side card.
- **Don't use `<v-toolbar>` in this page.** It carries Material's
  64px height and ripple. Use `<div class="d-flex">` for any
  toolbar-shaped row.
- **Don't right-align the title.** No matter how short.
- **Don't insert `<v-divider>` between the title and the linkout row.**
  Vertical whitespace separates them.
- **Don't shadow the cards.** All cards on this page are either
  `outlined` (primary col) or `flat` (side col). Never `elevated`.
- **Don't paint the primary card a tint.** Tinted backgrounds are for
  Alerts only. The Work-detail card is `--ox-bg-base`.
- **Don't introduce a `<v-data-table>` for the locations grid.** Use
  `<v-row>` + `<v-col>` of `<v-card variant="outlined">`. The
  locations grid is a card grid, not a table.

---

## Recipes

### Render a tabbed work-detail page

```vue
<v-container class="ox-entity-detail">
  <entity-header :entity-data="entityData" entity-type="works" class="mb-4 mt-2" />

  <v-row>
    <v-col cols="12" :md="showStats ? 7 : 12">
      <v-card variant="outlined" rounded>
        <v-tabs v-model="activeTab" bg-color="transparent">
          <v-tab value="details">Details</v-tab>
          <v-tab value="locations">Locations</v-tab>
        </v-tabs>
        <v-divider />
        <v-window v-model="activeTab">
          <v-window-item value="details">
            <div class="pa-6">
              <entity-new :data="entityData" type="works" />
            </div>
          </v-window-item>
          <v-window-item value="locations">
            <div class="pa-6">
              <v-alert v-if="!allLocations.length" type="info" variant="tonal">
                No locations available for this work.
              </v-alert>
              <v-row v-else>
                <v-col v-for="loc in allLocations" :key="loc.landing_page_url"
                       cols="12" sm="6" xl="3" class="d-flex">
                  <location-card :data="loc" />
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
    </v-col>

    <v-col v-if="showStats" cols="12" md="5">
      <v-card flat class="px-2 pt-4 pb-3">
        <entity-metrics :data="entityData" type="works" />
      </v-card>
    </v-col>
  </v-row>
</v-container>
```

### Render a non-works (stacked) entity page

```vue
<v-container class="ox-entity-detail">
  <entity-header :entity-data="entityData" :entity-type="entityType" class="mb-4 mt-2" />

  <v-row>
    <v-col cols="12" :md="showStats ? 7 : 12">
      <v-card variant="outlined" class="bg-white">
        <div class="pa-6"><entity-new :data="entityData" :type="entityType" /></div>
      </v-card>

      <v-card variant="outlined" class="mt-3 bg-white">
        <selection-toolbar :selectable="canCurate" />
        <serp-results-list-item v-for="r in works" :key="r.id" :result="r" />
        <div class="pa-3 text-center">
          <v-btn variant="text" prepend-icon="mdi-chevron-down"
                 :loading="loadingMore" @click="showMore">Show more works</v-btn>
        </div>
      </v-card>
    </v-col>

    <v-col v-if="showStats" cols="12" md="5">
      <v-card flat class="px-2 pt-4 pb-3">
        <entity-metrics :data="entityData" :type="entityType" class="mb-3 pb-3" />
        <group-by v-for="key in groupByKeys" :key="key" :filter-key="key"
                  :filter-by="[worksFilter]" entity-type="works" :is-entity-page="true"
                  class="mb-3" />
      </v-card>
    </v-col>
  </v-row>
</v-container>
```

### Render the "owner can edit" affordance

```vue
<entity-header :entity-data="entityData" entity-type="authors">
  <template v-if="isAuthorOwner" #after-title>
    <author-display-name-editor
      :current-display-name="entityData.display_name"
      :is-owner="isAuthorOwner"
      :pending="displayNamePending"
      @update-name="onDisplayNameUpdate"
    />
  </template>
</entity-header>
```

The editor sits inline at the `--ox-type-display` baseline. Do not
wrap it in a card. Do not place it in the meta row.

---

## Open questions for Phase 7

1. **Locations grid at `xl`: 3-up or 4-up?** Current code is `xl="4"`
   (= 3-up). Move to `xl="3"` for 4-up only if location cards retain
   readable density.
2. **Sticky side rail?** Current side rail scrolls with content. Linear
   issue-detail page keeps a similar rail sticky — feels nice on long
   pages. Decide during Phase 7.
3. **Replace the page-bottom "View as search" Ghost link with a card-
   header link?** Current placement is at the bottom of the works
   card; Linear pattern would put it in the card's top-right.
4. **Should retracted works' titles also get a strikethrough?** The
   alert says it; visual reinforcement on the title might help. (Not a
   blocker for the pilot.)
