# Dashboard — saved-searches / "my stuff" template

The user's "my stuff" pages under `/settings/...`: Saved searches,
Alerts, Collections, Exports, Recent searches, Plan, API key, Profile.
All share the same shape — a page title, an optional primary action,
a list of the user's own things (sometimes a table, sometimes a card
grid), a per-row menu, and a single canonical empty state. The
template canonicalizes the shape so every "my stuff" page renders
identically; pages diverge only in the content of the rows.

> **Canonical example:** the Saved-searches page (`MeSearches.vue`).
> The pilot for Phase 7 stays at the Work-detail page, but Saved
> searches is the cleanest exercise of this template.

**Routes:** `/settings/searches`, `/settings/alerts`,
`/settings/collections`, `/settings/exports`, `/settings/plan`,
`/settings/api-key`, `/settings/profile`. Mounted inside
`SettingsBase.vue` (the settings shell — see [Shell](#shell)).

**Files:**
- `src/views/Settings/SettingsBase.vue` — settings shell (sidebar + outlet)
- `src/views/Me/MeSearches.vue` — canonical: saved searches
- `src/views/Me/MeAlerts.vue` — alerts
- `src/views/Me/MeCollections.vue` — collections (card grid, not table)
- `src/views/Me/MeExports.vue` — exports
- `src/views/Me/MePlan.vue` — plan + usage
- `src/views/Me/MeApiKey.vue` — API key
- `src/views/Me/MeProfile.vue` — profile

**Consumes:** [`tokens.md`](../tokens.md),
[`typography.md`](../typography.md), [`icons.md`](../icons.md),
[`components/card.md`](../components/card.md),
[`components/input.md`](../components/input.md),
[`components/table.md`](../components/table.md),
[`components/menu.md`](../components/menu.md),
[`components/dialog.md`](../components/dialog.md),
[`components/loading.md`](../components/loading.md),
[`components/navigation.md`](../components/navigation.md).

---

## Page shape (canonical: Saved searches at `lg`)

```
+----------------------------------------------------------------------+
| Top bar (44px)                                                       |
+--+-------------------------------------------------------------------+
|  |  Settings shell — left rail (220px), content area to the right    |
|  +-------------------------------------------------------------------+
|  | Settings rail              |  Content area (max 720, left-aligned)|
|  | ┌────────────────────┐    | ┌──────────────────────────────────┐ |
|  | │ Account            │    | │ ┌─ Page-title row (32px) ──────┐ │ |
|  | │  Profile           │    | │ │ H1 — Saved searches  ⊝ Help  │ │ |
|  | │  Plan              │    | │ │            (optional primary)│ │ |
|  | │  API key           │    | │ └──────────────────────────────┘ │ |
|  | │                    │    | │ ┌─ Controls row (32px) ────────┐ │ |
|  | │ Library            │    | │ │ [🔍 Search saved searches]   │ │ |
|  | │  Saved searches ●  │    | │ └──────────────────────────────┘ │ |
|  | │  Alerts            │    | │ ┌─ List card ──────────────────┐ │ |
|  | │  Collections       │    | │ │ ☆ Big Pharma 2023      Apr 4 ⋮│ │ |
|  | │  Exports           │    | │ │ ☆ FWCI > 3              May 1 ⋮│ │ |
|  | │                    │    | │ │ ☆ Open access + cited   May12 ⋮│ │ |
|  | │ Recent             │    | │ │ ☆ DOI ghost works       May18 ⋮│ │ |
|  | │  Recent searches   │    | │ └──────────────────────────────┘ │ |
|  | └────────────────────┘    | └──────────────────────────────────┘ |
+--+--------------------------+--------------------------------------+
```

- **Settings rail (left)** is the Sidebar component from
  [`components/navigation.md`](../components/navigation.md) **inside**
  the settings shell — distinct from the global app sidebar. Width
  **220px** (Linear: 232px live; we round to the 4px grid). 28px nav
  items, 8px radius, 13px Inter, section labels at 13px text-tertiary.
- **Content area** is `max-width: 720px`, left-aligned (not centered),
  with `--ox-space-6` (24px) inset from the rail. Linear's settings
  pane is ~480px wide; we run wider because saved-searches/exports
  tables need more horizontal room than a profile form.
- **No outer card around the content area.** Title, controls, and
  list card render straight on `--ox-bg-base`.

---

## Section hierarchy

| Rank | Section | Component | Tokens |
|------|---------|-----------|--------|
| H1 | Page title ("Saved searches", "Alerts") | `<h1>` styled `--ox-type-display` (24/500/30) | `--ox-text-primary` |
| H3 | Sub-section heading (e.g. MePlan's "Subscription" / "Usage") | `<h3>` styled `--ox-type-h3` (15/500/23) | `--ox-text-primary` |
| Label | Settings-rail section labels ("Account", "Library", "Recent") | `--ox-type-label` (13/500) | `--ox-text-tertiary` |
| Label | Form labels (MePlan, MeProfile) | `--ox-type-label` (13/500) | `--ox-text-primary` |
| Body | Row title text | `--ox-type-body` (14/400) | `--ox-text-primary` |
| Caption | Row meta (last-updated, count) | `--ox-type-caption` (12/500) | `--ox-text-tertiary` |
| Caption | Form helper text | `--ox-type-caption` (12/500) | `--ox-text-tertiary` |

> **No `<h2>`.** Page is one section deep; H1 → H3 is fine.

---

## Spacing rhythm

| Slot | Token | Value |
|------|-------|-------|
| Top bar → settings shell | 0 | — |
| Shell rail right edge → content area left edge | `--ox-space-6` | 24 |
| Content area top edge → page-title row | `--ox-space-6` | 24 |
| Page-title row → controls row | `--ox-space-4` | 16 |
| Controls row → list card | `--ox-space-4` | 16 |
| List card → page bottom | `--ox-space-12` | 48 |
| List row → list row | 0 (rows own dividers) | — |
| Sub-section → next sub-section (MePlan, MeProfile) | `--ox-space-8` | 32 |
| Form label → input | `--ox-space-1` | 4 |
| Input → helper text | `--ox-space-1` | 4 |

---

## Shell (left rail)

```
┌──────────────────────────┐
│  ← Back to app           │   ← 13px Ghost text button, top
│                          │
│  ACCOUNT                 │   ← section label, 13/500/text-tertiary
│   Profile                │
│   Plan                   │
│   API key                │
│                          │
│  LIBRARY                 │
│   Saved searches    ●    │   ← selected: 8px radius bg --ox-bg-selected
│   Alerts                 │
│   Collections            │
│   Exports                │
│                          │
│  RECENT                  │
│   Recent searches        │
└──────────────────────────┘
```

| Slot | Spec |
|------|------|
| Width | 220px |
| Background | `--ox-bg-base` |
| Right border | `1px solid --ox-border-subtle` |
| Top padding | `--ox-space-6` (24) |
| Bottom padding | `--ox-space-6` (24) |
| Inline padding | `--ox-space-3` (12) |
| Item height | 28px |
| Item radius | `--ox-radius-sm` (6px) |
| Item font | 13/500 Inter |
| Item color (default) | `--ox-text-primary` |
| Item color (hover) | `--ox-text-primary` on `--ox-bg-hover` |
| Item color (selected) | `--ox-text-primary` on `--ox-bg-selected` |
| Section-label height | 28px |
| Section-label inline padding | `--ox-space-3` (12) |
| Section-label gap to first item | 0 |
| Section gap | `--ox-space-4` (16) |
| `← Back to app` | Ghost text button at the very top, 28px, 13px |

- **One section deep** — no nested groups (e.g. no "Profile > Email"
  sub-items). Linear's settings rail has a single level; ours does too.
- **No icons in rail items.** Labels are text-only. Section labels are
  uppercased visually via CSS `text-transform: uppercase`, not in
  source — keeps the source legible.
- **No badges** on rail items (no "● Saved searches (3)" count).
  Counts belong inside the page, not in nav.

---

## Page-title row

```
H1 — Saved searches                                  [+ New collection]
```

- **H1 left, optional primary action right.** Spacer between.
- Title is a real `<h1>` styled `--ox-type-display`. Do not use
  `<v-card-title>`.
- **Primary action present** on Collections (`+ New collection`) and
  Profile (rare). Absent on Saved searches, Alerts, Recent searches
  (those are produced as side-effects of using the SERP, not created
  here). Absent on Plan / API key / Exports (no create flow on those
  pages).
- Primary action is the Button "primary, flat" variant from
  [`components/button.md`](../components/button.md), 32px tall.
  Prepend icon `Plus` 16px.
- **Help link** is a Ghost icon-only "?" button next to the title (not
  on every page — only when there's contextual docs). Opens a
  Tooltip on hover, sends to docs on click.

---

## Controls row (optional)

Only Saved searches and Recent searches render a controls row today.

```
[🔍 Search saved searches]
```

- Single search input (filters the list below). 32px tall,
  `max-width: 320px`. Uses [`components/input.md`](../components/input.md)
  with the prefix-icon recipe.
- **Escape clears the input.** Already wired in MeSearches.vue:15.
- **No "create" or "delete" buttons in this row.** The page-title row
  owns the primary action; row-level menus own per-row actions.
- When the list is empty (no items at all, not just no filtered
  items), **the controls row hides**. Filtering an empty list is
  pointless and visually noisy.

---

## List card

The body of the page. Two variants: **Table** (most pages) and **Card
grid** (Collections only).

### Table variant (Saved searches, Alerts, Exports, Recent searches)

| Slot | Spec |
|------|------|
| Container | `<v-card flat>` (no border, no shadow — the table's row dividers do the work) |
| Internal padding | `px-2 pb-4` (8/0/16/8). The 8px inline padding lets the table headers sit flush-ish with the page content while preserving a touch of breathing room. |
| Table | `<v-table>` — see [`components/table.md`](../components/table.md). Dense variant (32px rows). |
| Top border | None — the table renders without a top hairline. (`table { border-top: none !important; }` exists in both MeSearches and MeAlerts today; this becomes a global default in Phase 5 once we own the table style.) |
| Row hover | `--ox-bg-hover` |
| Row click | Opens the saved search (`openSavedSearch(id)`) — entire row is clickable. |

**Columns (canonical):**

| Position | Column | Width | Content |
|----------|--------|-------|---------|
| 1 | Icon + name | flexible | `Star` 16px icon prefix (`--ox-text-tertiary`) + name. Truncate at container edge. |
| 2 | Last updated | 120px | Formatted: time-of-day if today, "MMM d" otherwise. `--ox-type-caption`, `--ox-text-tertiary`. |
| 3 | Per-row menu | 40px | Ghost icon-only kebab opens a Menu. Right-aligned. Hidden until row hover at desktop; always visible at touch. |

**Per-row menu** (component `Menu`):

- Open · Rename · (toggle alert on/off) · Share · Delete
- Use Lucide icons for each: `ExternalLink` · `Pencil` · `Bell` /
  `BellOff` · `Share2` · `Trash2` — see
  [`icons.md`](../icons.md) concept→icon table.
- Destructive actions (Delete) at the bottom, separated by a divider,
  rendered in `--ox-text-error` color.

**Column-2 "Last updated" formatting** (already in `MeSearches.vue:151-165`):

```js
isToday(updated)
  ? updated.toLocaleTimeString(undefined, {timeStyle: 'short'})  // "3:42 PM"
  : updated.toLocaleDateString(undefined, {month: 'short', day: 'numeric'}); // "May 12"
```

Year is omitted; if a row is >1 year old the year still doesn't render
(this is a known trade-off — adding `year: 'numeric'` always-on would
clutter recent dates). Phase 5 can add a year suffix when the year
differs from the current year.

### Card-grid variant (Collections)

- 3-up grid at `md+`, 2-up at `sm`, 1-up at `xs`.
- Each card is `<v-card variant="outlined" rounded>` (default 8px
  radius, hairline border, no shadow) per [`card.md`](../components/card.md).
- Card padding: `--ox-space-4` (16px), default Card variant.
- Card body: collection name (`<h3>` styled), entity count
  (`--ox-type-caption`), description (truncated 2 lines).
- Card actions: Edit / Delete in the kebab Menu (top-right).
- Grid gap: `--ox-space-3` (12px) both axes.

---

## Per-section variants

| Page | Title | Primary action | Controls row | List variant | Per-row notes |
|------|-------|---------------|--------------|--------------|---------------|
| **Saved searches** (`/settings/searches`) | "Saved searches" | None | Search input | Table (3 cols) | Star icon prefix, kebab menu |
| **Alerts** (`/settings/alerts`) | "Alerts" | None | None | Table (3 cols) | Bell icon prefix, **inline** "Remove alert" Ghost icon-button (no kebab — only one action) |
| **Collections** (`/settings/collections`) | "Collections" | `[+ New collection]` | None | **Card grid** | Cards, not rows. Each card has Edit/Delete in kebab. |
| **Exports** (`/settings/exports`) | "Exports" | None | None | Table (4 cols: name, format, status, created) | Status pill in col-3 (`pending` / `ready` / `failed`); Download Ghost button in col-4 when ready |
| **Recent searches** | "Recent searches" | None | Search input | Table (3 cols) | Clock icon prefix; kebab has "Save", not "Remove" |
| **Plan** (`/settings/plan`) | "Plan" | None | None | **No list** — form-shaped page. Use sub-section H3s for "Subscription" / "Usage" / "Invoices". | — |
| **API key** (`/settings/api-key`) | "API key" | None | None | **No list** — single block: key value (mono, copy button), "Rotate key" Ghost button. | — |
| **Profile** (`/settings/profile`) | "Profile" | None | None | **No list** — form-shaped page. | — |

> **Pages without a list** (Plan, API key, Profile) still consume
> the [Shell](#shell), [Page-title row](#page-title-row), and
> [Spacing rhythm](#spacing-rhythm). They drop the controls row and
> list card and render their content directly under the title. The
> 720px content max-width applies.

---

## Breakpoints

| Breakpoint | Threshold | Layout |
|------------|-----------|--------|
| `xs` | <600px | Rail collapses to a hamburger drawer (Vuetify temporary drawer). Content area takes full width. Card grid collapses to 1-up. |
| `sm` | 600–960 | Rail collapses to drawer. Content full-width. Card grid 2-up. |
| `md` | 960–1280 | Rail visible (220px), content area 720 max-width left-aligned. Card grid 3-up. |
| `lg` | 1280–1920 | Same as `md`. |
| `xl` | ≥1920 | Same as `md`; extra space is whitespace. |

- **At `md+` the rail is sticky.** It stays in place as the content
  scrolls. Linear does this; ours doesn't today (the rail scrolls with
  the content); add `position: sticky; top: 44px` to the rail in
  Phase 5.

---

## States

### Loading

- **Initial route load** (no data fetched yet):
  - Collections page renders a centered `Spinner` 28px on
    `--ox-bg-base` (current behavior). Acceptable.
  - Saved searches / Alerts / Exports render Skeleton rows in the
    list card: 4 row stubs, each 44px tall, with shimmer on
    `--ox-shimmer`. Currently these pages don't show a skeleton (they
    rely on the user store loading on app boot) — add the skeleton in
    Phase 5 so direct-link loads don't render the empty state by mistake.
- **Per-row destructive action in progress** (Delete): the affected
  row gets `opacity: 0.5` and a 16px Spinner replaces the kebab in
  col-3. Other rows remain interactive.
- **Form save in progress** (Profile, Plan): the Save button enters
  Vuetify's `loading` state (Spinner replaces the label).

### Empty

> **Single canonical empty state.** Every "my stuff" page uses the
> same shape; only the copy varies.

```
┌────────────────────────────────────────────────────┐
│                                                    │
│       You have no {things}.                        │
│       (One line of guidance how to create one.)    │
│                                                    │
│       [Primary action, when applicable]            │
│                                                    │
└────────────────────────────────────────────────────┘
```

- Centered in the list card area (`d-flex justify-center align-center`).
- Vertical padding: `--ox-space-12` (48) top and bottom.
- Headline: `--ox-type-body` (14/400), `--ox-text-tertiary`.
- Guidance line: `--ox-type-caption` (12/500), `--ox-text-quaternary`.
- Action: Button "primary, flat" (when present), 32px tall, top
  margin `--ox-space-4`.
- **No illustration.** Text-only. (Out of scope per Job #249 readme:
  "No 1:1 cloning of Linear's icons or illustrations.")

**Canonical copy:**

| Page | Headline | Guidance |
|------|----------|----------|
| Saved searches | "You have no saved searches." | "Save a search from any results page using the three-dot menu." |
| Alerts | "You have no alerts." | "Create one from any works search using the three-dot menu." |
| Collections | "You have no collections." | "A collection groups works, authors, or sources you want to track." + `[+ New collection]` button |
| Exports | "You have no exports." | "Export results from any search using the toolbar." |
| Recent searches | "You have no recent searches." | "Searches you run will show up here." |
| API key | (No empty state — always shows the key) | — |

> **Don't render the empty state as an Alert.** Alerts signal
> actionable conditions ("token expiring", "payment failed"). "No
> data yet" is not actionable in itself — it's the page's neutral
> baseline.

### Error

- **Page fetch failed** (collections API 500, etc.): snackbar
  toast ([`components/toast.md`](../components/toast.md), severity
  `error`, sticky with Retry button). List card renders its empty
  state copy ("You have no collections.") underneath — preserving
  the layout, never an angry red full-page error.
- **Per-row action failed** (Delete returned 500): snackbar toast,
  row state reverts to non-loading, kebab returns. The row stays.
- **Form save failed** (Profile, Plan): the form Field shows an
  inline error message under the affected input (use
  [`components/input.md`](../components/input.md) error state). The
  Save button stays enabled so the user can retry.

---

## Vuetify mapping

| Page slot | Vuetify | Notes |
|-----------|---------|-------|
| Settings shell | `SettingsBase` (custom) wrapping `<router-view />` | Owns the rail. |
| Rail | `<v-navigation-drawer permanent>` with `<v-list density="compact">` | At `xs`/`sm` switches to `temporary`. |
| Content wrapper | `<div class="ox-settings-content">` | 720px max-width inside the route. |
| H1 | Native `<h1>` styled via `.text-h5` legacy → migrate to `--ox-type-display` token class in Phase 5 | Today MeSearches uses `class="text-h5 font-weight-bold"` — this becomes `class="ox-display"` once we ship the type-token utility classes. |
| Page-title row | `<div class="d-flex align-center mb-4">` | No `<v-toolbar>`. |
| Primary action | `<v-btn variant="flat" color="primary" prepend-icon="mdi-plus">` | Once `lucide-vue-next` lands in Phase 5, swap to `<lucide-plus :size="16" />` in the prepend slot. |
| Controls row | `<div class="d-flex align-center ga-3 mb-4">` | `ga-3` = 12px gap. |
| Search input | `<v-text-field variant="outlined" density="compact">` | Per `input.md`. |
| List card | `<v-card flat class="px-2 pb-4">` | No border. |
| Table | `<v-table>` | Dense (32px rows). |
| Card grid (Collections) | `<v-row>` + `<v-col cols="12" sm="6" md="4">` | g-3 (12px) gutters. |
| Per-row menu | `<v-menu location="bottom">` + `<v-list density="compact">` | Per `menu.md`. |
| Per-row icon-only action (Alerts "Remove") | `<v-btn icon variant="plain">` | Ghost icon-only. |
| Confirm dialog | `<v-dialog max-width="400">` | Per `dialog.md`. Used for delete + rename. |

### Defaults to add (Phase 5)

```js
VNavigationDrawer: {
  // Settings rail wants a flush, borderless drawer. Override at the
  // page level — not globally; the SERP/Entity drawers want the
  // default Material chrome.
  // (Document only; do not ship as a global default.)
},
```

No global defaults specific to this template. Behavior comes from
component-spec defaults already documented.

---

## Overrides (SASS)

```scss
.ox-dashboard {
  // Page-title row: H1 + optional primary action + spacer.
  .ox-dashboard__title-row {
    display: flex;
    align-items: center;
    margin-bottom: var(--ox-space-4);
    h1 {
      font: var(--ox-type-display);
      color: var(--ox-text-primary);
      margin: 0;
    }
  }

  // Controls row.
  .ox-dashboard__controls {
    display: flex;
    align-items: center;
    gap: var(--ox-space-3);
    margin-bottom: var(--ox-space-4);
    .ox-dashboard__search {
      max-width: 320px;
    }
  }

  // List card body.
  .ox-dashboard__list {
    background: var(--ox-bg-base);
    border-radius: var(--ox-radius-md);
    padding: var(--ox-space-2) 0 var(--ox-space-4);
  }

  // Row hover.
  .ox-dashboard__row {
    cursor: pointer;
    &:hover { background: var(--ox-bg-hover); }
  }

  // Empty state — text-only, centered.
  .ox-dashboard__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--ox-space-12) var(--ox-space-4);
    text-align: center;
    .ox-dashboard__empty-headline {
      font: var(--ox-type-body);
      color: var(--ox-text-tertiary);
      margin: 0;
    }
    .ox-dashboard__empty-guidance {
      font: var(--ox-type-caption);
      color: var(--ox-text-quaternary);
      margin-top: var(--ox-space-2);
    }
    .ox-dashboard__empty-action {
      margin-top: var(--ox-space-4);
    }
  }
}

// Settings rail (lives in SettingsBase, scope it there).
.ox-settings-rail {
  width: 220px;
  background: var(--ox-bg-base);
  border-right: 1px solid var(--ox-border-subtle);
  padding: var(--ox-space-6) var(--ox-space-3);

  .ox-settings-rail__section + .ox-settings-rail__section {
    margin-top: var(--ox-space-4);
  }
  .ox-settings-rail__section-label {
    font: var(--ox-type-label);
    color: var(--ox-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    height: 28px;
    display: flex;
    align-items: center;
    padding-inline: var(--ox-space-3);
  }
  .ox-settings-rail__item {
    height: 28px;
    border-radius: var(--ox-radius-sm);
    padding-inline: var(--ox-space-3);
    font: var(--ox-type-label);
    color: var(--ox-text-primary);
    display: flex;
    align-items: center;
    &:hover { background: var(--ox-bg-hover); }
    &.is-active { background: var(--ox-bg-selected); }
  }
}
```

**Zero `!important`** in these scopes. The existing
`border-top: none !important` in MeSearches/MeAlerts goes away in
Phase 5 — it'll be the global `<v-table>` default in our SASS layer.

---

## Anti-patterns

- **Don't put primary actions in a floating-action-button (FAB).**
  Linear doesn't, we don't. Primary lives in the title row.
- **Don't render the search-controls row when the list is empty
  overall.** Filtering nothing is pointless; the page should look
  clean.
- **Don't make rows non-clickable** (or "click-the-name-text-only"
  style). Entire row is the click target. The kebab is the exception
  via `@click.stop`.
- **Don't double-up nav structures.** Don't add an in-page "tab" strip
  *and* keep the rail item — pick one. (MePlan today has both an
  in-page heading hierarchy and a rail item; keep the heading
  hierarchy, drop any in-page tabs.)
- **Don't show counts in the rail** ("Saved searches (12)").
  Counts in nav rot the moment the user adds/removes one without
  triggering a state push.
- **Don't gate the empty state behind a spinner.** Render the empty
  copy as soon as the API responds with `[]`. The spinner is for
  *loading*, not for "loaded and empty."
- **Don't show row-level Delete inline.** Delete lives in the kebab
  Menu, separated by a divider, in error color. Inline Delete is too
  easy to misclick.
- **Don't right-align the page title.** Or center it. Left-align.

---

## Recipes

### Render a dashboard list page (Saved searches)

```vue
<div class="ox-dashboard">
  <div class="ox-dashboard__title-row">
    <h1>Saved searches</h1>
    <v-spacer />
    <!-- No primary action on this page. -->
  </div>

  <div v-if="items.length" class="ox-dashboard__controls">
    <v-text-field
      v-model="filter"
      class="ox-dashboard__search"
      variant="outlined"
      density="compact"
      placeholder="Search saved searches"
      hide-details
      @keydown.escape="filter = ''"
    >
      <template #prepend-inner>
        <v-icon size="18">mdi-magnify</v-icon>
      </template>
    </v-text-field>
  </div>

  <v-card flat class="ox-dashboard__list">
    <v-table v-if="filtered.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Last updated</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in filtered" :key="row.id"
            class="ox-dashboard__row"
            @click="open(row.id)">
          <td>
            <v-icon color="grey" start size="16">mdi-star-outline</v-icon>
            {{ row.name }}
          </td>
          <td class="text-medium-emphasis text-caption">
            {{ formatDate(row.updated) }}
          </td>
          <td class="text-right">
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn icon variant="plain" v-bind="props" @click.stop>
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <saved-search-menu :id="row.id" />
            </v-menu>
          </td>
        </tr>
      </tbody>
    </v-table>

    <empty-state
      v-else-if="items.length === 0"
      headline="You have no saved searches."
      guidance="Save a search from any results page using the three-dot menu."
    />

    <empty-state
      v-else
      headline="No matches."
      guidance="Try a different search term."
    />
  </v-card>
</div>
```

### Render a card-grid dashboard (Collections)

```vue
<div class="ox-dashboard">
  <div class="ox-dashboard__title-row">
    <h1>Collections</h1>
    <v-spacer />
    <v-btn variant="flat" color="primary" prepend-icon="mdi-plus"
           @click="showCreate = true">
      New collection
    </v-btn>
  </div>

  <skeleton-grid v-if="loading && !collections.length" />

  <v-row v-else-if="collections.length" class="ga-3">
    <v-col v-for="c in collections" :key="c.id"
           cols="12" sm="6" md="4">
      <collection-card :collection="c"
        @edit="onEdit(c)" @delete="onAskDelete(c)" />
    </v-col>
  </v-row>

  <empty-state v-else
    headline="You have no collections."
    guidance="A collection groups works, authors, or sources you want to track."
  >
    <template #action>
      <v-btn variant="flat" color="primary" prepend-icon="mdi-plus"
             @click="showCreate = true">New collection</v-btn>
    </template>
  </empty-state>
</div>
```

### Render the canonical empty state

```vue
<div class="ox-dashboard__empty">
  <p class="ox-dashboard__empty-headline">You have no saved searches.</p>
  <p class="ox-dashboard__empty-guidance">
    Save a search from any results page using the three-dot menu.
  </p>
</div>
```

A small wrapper component (`<empty-state>`) is worth building in
Phase 5 so every page renders the same shape without copy-paste.

---

## Open questions for Phase 7

1. **Sticky rail.** Spec says yes; current code says no. Confirm during
   Phase 5; the patch is one line of CSS.
2. **Saved-searches "Last updated" year suffix.** Add when the row's
   year differs from current year? Probably yes — defer to Phase 5.
3. **Collections card vs row.** Collections is currently a card grid;
   the rest are tables. Should we collapse Collections to a table too,
   for consistency? Argues yes: cleaner, more rows visible. Argues no:
   collections often carry a description that doesn't fit a row.
   Default: keep the card grid. Revisit if the description gets
   shorter.
4. **Exports status pill.** Should `failed` status open a retry
   dialog inline or just show the status? Probably show + Retry in
   kebab. Defer to Phase 5 + the Exports owner.
5. **Should the empty-state primary action be the same color as the
   page-title-row primary action?** Yes — they're the same Button.
   Don't downgrade the empty-state CTA to a Ghost / outlined variant
   just because it's in the empty area.
