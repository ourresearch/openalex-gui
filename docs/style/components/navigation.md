# Navigation — Top bar + Sidebar

Component spec for the app shell chrome in openalex-gui: the top bar
(global header) and the sidebar (primary navigation). Consumes tokens
from [`tokens.md`](../tokens.md); text rules from
[`typography.md`](../typography.md); icon rules from
[`icons.md`](../icons.md).

**Vuetify components:** `v-app-bar` (top bar), `v-navigation-drawer`
(sidebar), `v-list` + `v-list-item` (nav items inside the drawer).
**Status against Vuetify:** use with heavy overrides — Vuetify's
defaults are Material (raised app bar, 56px height, blue accent, icon
buttons with ripple). We flatten everything to Linear's chrome
aesthetic.

> **Live Linear reference (2026-05-30, claude-in-chrome on
> `linear.app/ourresearch/team/DEV/all`):** sidebar is **244px wide**;
> nav items **28px tall** with **8px radius** (when filled / hovered);
> main content sits in a **rounded inner panel** with `0.5px
> --ox-border-default` border + `12px` radius. Page background is
> `lch(98.94 0.5 282)` (≈ `#fcfcfd`), which is `--ox-bg-base`.

---

## Shell layout (canonical)

```
+-------------------------------------------------------------+
| Top bar — 44px                                              |   <- z-index: 10 (above sidebar)
+----------+--------------------------------------------------+
|          |  page content (max-width 1200, centered)         |
|  Side    |  ┌────────────────────────────────────────────┐ |
|  bar     |  │ rounded inner panel (12px radius)          │ |
|  240px   |  │ 0.5px --ox-border-default hairline         │ |
|          |  │                                            │ |
|          |  │   ...page content...                       │ |
|          |  │                                            │ |
|          |  └────────────────────────────────────────────┘ |
+----------+--------------------------------------------------+
```

- **Top bar height:** `--ox-height-app-bar` (44px).
- **Sidebar width:** `--ox-width-sidebar` (240px). Linear measured 244;
  we round to the 4px grid.
- **Sidebar is left, full-height** under the top bar — top bar sits
  *above* the sidebar in z-order so the workspace branding aligns with
  the user's mental model of "this is one app."
- **Rounded inner panel** (Linear's signature): the main content sits
  on `--ox-bg-base`, wrapped in a `12px` radius / `0.5px` hairline
  panel with `--ox-space-6` (24px) top and side padding from the
  shell edges. **Adopt this for the Phase 7 pilot.**

> If a page is full-bleed (search results, table-only view), drop the
> inner panel and run content edge-to-edge. The shell still keeps top
> bar + sidebar.

---

## Top bar

```
+-------------------------------------------------------------+
| [☰]  OpenAlex   /  Works   Search...     [Account] [Bell]   |
+-------------------------------------------------------------+
```

| Slot | Spec |
|------|------|
| Height | 44px (`--ox-height-app-bar`) |
| Background | `--ox-bg-base` |
| Bottom border | `1px solid --ox-border-subtle` |
| Padding | `0 --ox-space-4` (16px) |
| Gap between groups | `--ox-space-4` (16px) |
| Brand (logo + wordmark) | left-most, height 24px, click → home |
| Breadcrumb | inline after brand, `--ox-text-tertiary`, slash separator (`/`) at `--ox-space-2` gap |
| Global search | center-flex, max-width 480px; opens command palette on focus |
| Right-cluster | Account avatar (28px), notification button (Ghost icon-only), optionally a Primary action |
| Sticky | `position: sticky; top: 0; z-index: var(--ox-z-app-bar)` |

- **No shadow** under the top bar. The hairline border is the only
  divider.
- **No tabs in the top bar.** Tabs belong below it, inside the page
  content. See [`tabs.md`](tabs.md).
- **Only one Primary in the top-bar right cluster.** Most pages have
  none.

### Mobile (<600px)

- Brand collapses to logo only.
- Breadcrumb hidden; current-page name renders as `<h1>` inside the
  page content instead.
- Search collapses to an icon-only Ghost button that opens the command
  palette as a full-screen modal.

---

## Sidebar

```
+----------------+
| Workspace pill |  <- 28px, optional, top
|                |
|  Inbox        ●|  <- 28px, 8px radius, hairline-thin selected bg
|  My issues     |
|  Reviews       |
|                |
|  WORKSPACE     |  <- 13px label, text-tertiary
|  Issues        |
|  Projects      |
|  Members       |
|                |
|  YOUR TEAMS    |
|  ▾ DEV         |
|     All issues |
|     Active     |
|     Backlog    |
+----------------+
```

| Slot | Spec |
|------|------|
| Width | 240px (`--ox-width-sidebar`) |
| Background | `--ox-bg-muted` (≈ `#f5f5f5`) — gently differentiates from content bg |
| Right border | `1px solid --ox-border-subtle` |
| Padding | `--ox-space-2` (8px) sides, `--ox-space-3` (12px) top |
| Nav-item height | `--ox-height-sm` (28px) — **confirmed against Linear** |
| Nav-item padding | `0 --ox-space-2` (8px) |
| Nav-item radius | `--ox-radius-md` (8px) |
| Nav-item font | `--ox-type-label` (13/500) |
| Nav-item color | `--ox-text-secondary` |
| Nav-item icon | Lucide 16px, leading, gap `--ox-space-2` (8px) |
| Hover | bg `--ox-bg-emphasis`, color `--ox-text-primary` |
| Selected | bg `--ox-bg-emphasis`, color `--ox-text-primary`, weight `--ox-weight-semibold` |
| Section label | `--ox-type-caption` (12/500) `--ox-text-tertiary`, `text-transform: uppercase; letter-spacing: 0.04em`, padding `--ox-space-2` (8px) top + `--ox-space-1` (4px) sides, **non-clickable** |
| Section gap | `--ox-space-4` (16px) between groups |
| Expand/collapse chevron (sub-items) | Lucide `ChevronRight` → `ChevronDown` 12px, left of label |
| Sub-item indent | `--ox-space-4` (16px) total left-padding |

### Sidebar — states

| State | Treatment |
|-------|-----------|
| Default | text-secondary, transparent bg |
| Hover | text-primary, bg `--ox-bg-emphasis` |
| Selected | text-primary, weight semibold, bg `--ox-bg-emphasis` |
| Focus-visible | adds `--ox-focus-ring` |
| Disabled | text-disabled, no hover bg |

- **No left accent stripe** on the selected item — the bg swap is the
  indicator. Linear doesn't use one; we explicitly reject it.
- **No badges by default.** Count badges on nav items are allowed for
  "Inbox" only (count of unread); render as inline trailing
  `--ox-text-tertiary` caption number. Never a colored dot.

### Sidebar — collapsed state (optional, future)

For dense layouts (Phase 7 pilot result will decide if needed):
- Width collapses to 56px (icon-only).
- Tooltips appear on hover (see [`tooltip.md`](tooltip.md)).
- Section labels hide.
- Toggle button lives at the bottom-left of the sidebar.

Not shipped in this Phase 3 spec — note for Phase 5 if pilot requires.

---

## Workspace selector (sidebar header)

A 28px-tall pill at the top of the sidebar showing the current workspace
(name + 16px avatar). Click opens a Menu (see [`menu.md`](menu.md))
listing accessible workspaces + a "Create workspace…" item.

```
+-----------------------+
|  [OR] OurResearch  ▾  |
+-----------------------+
```

For OpenAlex, this is **also where the workspace switcher lives** if/when
multi-tenant is added — keep the slot even if there's only one entry.

---

## Vuetify mapping

| Spec concept | Vuetify | Notes |
|--------------|---------|-------|
| Top bar | `<v-app-bar>` | `flat` prop required (or via theme); `density="compact"` for 44px. |
| Sidebar | `<v-navigation-drawer>` | `permanent` on ≥md breakpoint, `temporary` on <md (slides over content). |
| Nav item | `<v-list-item>` inside `<v-list>` | Use `<v-list-subheader>` for section labels. |
| Active link | `<v-list-item :to="..." :active="...">` | Vuetify auto-resolves active on `<router-link>` integration. |
| Expand/collapse | `<v-list-group>` | Wraps sub-items. |
| Icon | leading slot via `<template #prepend>` | Lucide directly. |
| Count badge | trailing slot via `<template #append>` | Plain `<span>`. |

### Defaults to add in Phase 5

```js
VAppBar: {
  flat: true,
  density: 'compact',
  height: 44,
  color: 'surface',     // resolves to --ox-bg-base via theme
  border: false,
},
VNavigationDrawer: {
  permanent: true,
  rail: false,
  width: 240,
  elevation: 0,
  color: 'surface-variant',  // resolves to --ox-bg-muted
},
VList: {
  density: 'compact',
  nav: true,
  color: 'primary',
},
VListItem: {
  ripple: false,
  rounded: 'md',
  minHeight: 28,
},
```

### Required SASS overrides

```scss
.v-app-bar {
  background: var(--ox-bg-base);
  border-bottom: 1px solid var(--ox-border-subtle);
  box-shadow: none;
  height: var(--ox-height-app-bar);
}
.v-app-bar .v-toolbar__content {
  padding-inline: var(--ox-space-4);
  gap: var(--ox-space-4);
}

.v-navigation-drawer {
  background: var(--ox-bg-muted);
  border-right: 1px solid var(--ox-border-subtle);
  padding: var(--ox-space-3) var(--ox-space-2);
}

.v-navigation-drawer .v-list,
.v-navigation-drawer .v-list-item {
  background: transparent;
  font-family: var(--ox-font-sans);
}

.v-navigation-drawer .v-list-item {
  min-height: var(--ox-height-sm);
  padding-inline: var(--ox-space-2);
  border-radius: var(--ox-radius-md);
  color: var(--ox-text-secondary);
  font-size: var(--ox-type-label-size);
  font-weight: var(--ox-weight-medium);
  margin-block: 1px;     // tight stack
}
.v-navigation-drawer .v-list-item:hover {
  background: var(--ox-bg-emphasis);
  color: var(--ox-text-primary);
}
.v-navigation-drawer .v-list-item--active {
  background: var(--ox-bg-emphasis);
  color: var(--ox-text-primary);
  font-weight: var(--ox-weight-semibold);
}
.v-navigation-drawer .v-list-item__prepend > .v-icon {
  font-size: 16px;
  margin-inline-end: var(--ox-space-2);
}

.v-navigation-drawer .v-list-subheader {
  font-size: var(--ox-type-caption-size);
  font-weight: var(--ox-weight-medium);
  color: var(--ox-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--ox-space-2) var(--ox-space-1);
  min-height: auto;
}

.v-navigation-drawer .v-list-item__append > .v-icon { font-size: 12px; }

// Focus ring.
.v-navigation-drawer .v-list-item:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring);
}
```

### What we don't touch

- Vuetify's responsive breakpoint handling (`permanent` ↔ `temporary`
  toggle on `mdAndUp`).
- Drawer scrim on mobile temporary mode (Vuetify's default scrim is
  fine; tune opacity via SASS if the audit flags it).
- Router integration for `<v-list-item :to>`.

---

## Anti-patterns (auto-reject)

- ❌ Material `elevation` on the top bar. Hairline border only.
- ❌ Top bar > 44px (Vuetify default is 64px; we explicitly tighten).
- ❌ Hand-rolled `<header>` instead of `<v-app-bar>`.
- ❌ Hand-rolled `<nav>` instead of `<v-navigation-drawer>` + `<v-list>`.
- ❌ Left accent stripe on selected nav item.
- ❌ Mixing nav-item heights (one 32px, one 28px) in the same sidebar.
  All `--ox-height-sm` (28px).
- ❌ Sidebar section labels as `<h2>` / `<h3>` with default heading
  typography. They are `--ox-type-caption` uppercase labels.
- ❌ Two sidebars on one page (e.g. left primary nav + right filter
  rail at the same width / styling). The right rail is a different
  shape — spec separately if needed.
- ❌ Floating "burger menu" that ignores the breakpoint pattern. Use
  Vuetify's `:temporary` on <md.
- ❌ Notification bell as a `<v-badge>` corner-dot on the brand. Use
  the Right-cluster slot.
- ❌ `!important` on any nav-item rule.

---

## Accessibility

- Top bar wraps in `<header role="banner">` (Vuetify sets this).
- Sidebar wraps in `<nav role="navigation" aria-label="Primary">`
  (set explicitly via prop or wrapper).
- Each nav item is an `<a>` (router-link); current page sets
  `aria-current="page"` (Vuetify v3 sets this when `:active` is true on
  a routed list item).
- Section labels are real `<v-list-subheader>` which renders as a `<div
  role="presentation">` — the labels are skipped by screen readers; if
  you need them announced, add `role="heading" aria-level="2"` and
  visually-hidden text.
- Mobile temporary drawer traps focus while open; Esc closes (Vuetify
  default).

---

## Quick recipes

### App shell

```vue
<v-app>
  <v-app-bar>
    <RouterLink :to="{ name: 'home' }" class="ox-brand">
      <Logo /> OpenAlex
    </RouterLink>
    <v-spacer />
    <GlobalSearch />
    <v-spacer />
    <UserMenu />
  </v-app-bar>

  <v-navigation-drawer aria-label="Primary">
    <v-list nav>
      <v-list-item :to="{ name: 'inbox' }" prepend-icon=""><template #prepend><Inbox /></template>Inbox</v-list-item>
      <v-list-item :to="{ name: 'my' }"><template #prepend><FolderHeart /></template>My issues</v-list-item>

      <v-list-subheader>Workspace</v-list-subheader>
      <v-list-item :to="{ name: 'works' }"><template #prepend><Files /></template>Works</v-list-item>
      <v-list-item :to="{ name: 'authors' }"><template #prepend><Users /></template>Authors</v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-main>
    <div class="ox-shell-panel">
      <router-view />
    </div>
  </v-main>
</v-app>
```

```scss
.ox-shell-panel {
  background: var(--ox-bg-base);
  border: 0.5px solid var(--ox-border-default);
  border-radius: var(--ox-radius-lg);   // 12px
  margin: var(--ox-space-6);
  padding: var(--ox-space-6);
  min-height: calc(100vh - var(--ox-height-app-bar) - 2 * var(--ox-space-6));
}
```

### Nav with sub-items

```vue
<v-list-group prepend-icon="">
  <template #activator="{ props }">
    <v-list-item v-bind="props">
      <template #prepend><Layers /></template>
      DEV
    </v-list-item>
  </template>
  <v-list-item :to="{ name: 'dev.all' }">All issues</v-list-item>
  <v-list-item :to="{ name: 'dev.active' }">Active</v-list-item>
  <v-list-item :to="{ name: 'dev.backlog' }">Backlog</v-list-item>
</v-list-group>
```

### Inbox with unread count

```vue
<v-list-item :to="{ name: 'inbox' }">
  <template #prepend><Inbox /></template>
  Inbox
  <template #append v-if="unreadCount">
    <span class="ox-nav-count">{{ unreadCount }}</span>
  </template>
</v-list-item>
```

```scss
.ox-nav-count {
  font: var(--ox-weight-medium) var(--ox-type-caption-size)/1 var(--ox-font-sans);
  color: var(--ox-text-tertiary);
  font-variant-numeric: tabular-nums;
}
```

---

## Open questions

- **Right rail / filter sidebar** for SERPs and dashboards — currently
  rendered ad-hoc per page. Phase 4 (page templates) will spec this as
  a sibling to the primary sidebar.
- **Collapsed sidebar (rail mode)** — see "Sidebar — collapsed state"
  note above. Will revisit based on Phase 7 pilot.
- **Mobile sidebar gesture** (swipe to open) — leave Vuetify default;
  do not customize.
