# Tabs

Component spec for tabbed navigation in openalex-gui. Consumes tokens
from [`tokens.md`](../tokens.md), text rules from
[`typography.md`](../typography.md), icon rules from
[`icons.md`](../icons.md).

**Vuetify component:** `v-tabs` (+ `v-tab`, `v-window` for the panel
content).
**Status against Vuetify:** use with overrides — Vuetify's default
`v-tabs` is the Material `MdcTabs` recipe (uppercase, ripple, animated
slider indicator). We replace that with two cleaner variants.

> **Live Linear reference (2026-05-30, claude-in-chrome on
> `linear.app/ourresearch/team/DEV/all`):** the "All / Active / Backlog"
> strip is **28px tall pill buttons**, 12px / 500, `padding: 0 10px`,
> radius `9999px`, no border, color `lch(39 1 282)` (≈ text-tertiary)
> when unselected, bg `lch(98.94 0.5 282)` (≈ surface) when selected.
> Linear does **not** use an underline indicator for section-switch
> tabs — they use the same segmented-pill pattern. We adopt this
> wholesale as the `pill` variant.

---

## Variants

Two variants. **Pick one per page; never mix.**

| Variant | When to use | Where in Linear |
|---------|-------------|-----------------|
| **Pill** *(default)* | Section switch within a single page — same entity, different facet. e.g. Works detail "Overview / Locations / Citations". | "All / Active / Backlog" tab strip on a team page. |
| **Underline** | Page-level navigation across distinct sub-routes — different URL each tab. e.g. Settings "Profile / API keys / Billing". | Not used by Linear (they prefer sidebar nav for this); we keep it for high-traffic settings pages where sidebar would be heavy. |

If you can't decide: **start with Pill.** It's the safer default and
matches Linear's visual rhythm.

---

## Pill variant — anatomy

```
+---+---------+---------+---------+
|   |  All    |  Active | Backlog |
+---+---------+---------+---------+
```

| Slot | Spec |
|------|------|
| Strip background | transparent (sits on page bg) |
| Strip padding | `--ox-space-1` (4px) around the whole row; no outer border |
| Tab height | `--ox-height-sm` (28px) |
| Tab padding | `0 --ox-space-2_5` (10px) |
| Tab gap | `--ox-space-1` (4px) between pills |
| Font | `--ox-type-caption` (12/500) |
| Radius | `--ox-radius-pill` (9999px) |
| Selected bg | `--ox-bg-base` (`#fff`) on a `--ox-bg-muted` strip OR `--ox-bg-emphasis` on a base-bg strip |
| Selected color | `--ox-text-primary` |
| Unselected color | `--ox-text-tertiary` |
| Hover (unselected) | bg `--ox-bg-muted`, color `--ox-text-secondary` |
| Indicator | **none** — the bg swap is the indicator |
| Icons | Optional Lucide 14px leading; gap `--ox-space-1_5` (6px) to label |
| Count badge | Optional trailing 12px caption number in `--ox-text-tertiary` — never a colored chip; just inline text. e.g. `Backlog  3` |

The strip lives **above** the panel content with `--ox-space-3` (12px)
of bottom margin.

---

## Underline variant — anatomy

```
+-----------+-----------+--------+
|  Profile  | API keys  | Billing |
|  ━━━━━━━━━ |           |         |
+-----------+-----------+--------+
                 (1px hairline divider beneath the whole strip)
```

| Slot | Spec |
|------|------|
| Strip background | transparent |
| Strip bottom border | `1px solid --ox-border-default` (the hairline the active tab sits on) |
| Tab height | `--ox-height-lg` (40px) |
| Tab padding | `0 --ox-space-3` (12px) |
| Tab gap | `--ox-space-3` (12px) between tabs |
| Font | `--ox-type-label` (13/500) |
| Color (unselected) | `--ox-text-tertiary` |
| Color (selected) | `--ox-text-primary` |
| Indicator | `2px` solid `--ox-accent` bar that overlaps the strip hairline at the bottom of the active tab — width matches the tab's content width, **not** the entire tab cell |
| Hover (unselected) | color `--ox-text-secondary`; no bg fill |
| Icons | Optional Lucide 16px leading; gap `--ox-space-2` (8px) to label |

Sits **flush** above the panel content; no margin below the strip — the
panel butts directly against the hairline.

---

## States — both variants

| State | Pill | Underline |
|-------|------|-----------|
| **Default (unselected)** | text-tertiary, transparent bg | text-tertiary, no indicator |
| **Hover** | bg `--ox-bg-muted`, text-secondary | text-secondary; **no** indicator on hover |
| **Selected** | bg `--ox-bg-emphasis`, text-primary | text-primary + 2px accent indicator |
| **Focus-visible** | `--ox-focus-ring` around the pill | `--ox-focus-ring` around the tab content (skips the indicator) |
| **Disabled** | text-disabled, no hover bg, cursor `not-allowed` | same |
| **Loading panel** | panel shows skeleton — strip stays interactive | same |

### State rules

- **No ripple.** Globally disabled.
- **No slider animation** between tabs. Vuetify's animated slider
  indicator is removed; selection swap is instant + opacity transition
  on the panel only (handled by `<v-window>`, not by the strip).
- **Click is the only switch trigger.** Don't hijack arrow keys to
  change tabs unless `<v-tabs>` already provides the behavior with
  `<v-window>` (it does); never roll your own.

---

## When to combine with `<v-window>`

Always. Pair `<v-tabs>` with `<v-window>` for the panel; never render
the panel content based on a hand-rolled `v-if="tab === 'foo'"` chain.

- The window slide / fade transitions are handled by Vuetify — leave
  them on for Pill (subtle), disable for Underline (`:disable-transition`)
  if the route is doing the swap.

---

## Vuetify mapping

| Spec concept | Vuetify prop | Notes |
|--------------|--------------|-------|
| Pill variant | `<v-tabs density="comfortable" :show-arrows="false" hide-slider>` + each `<v-tab>` with our pill class | Vuetify v3 keeps `hide-slider` for explicit no-indicator. |
| Underline variant | `<v-tabs>` (default) | We override the slider color to `--ox-accent`. |
| Selected v-model | `v-model="active"` on `<v-tabs>` | Pair with `v-model` on `<v-window>` of same shape. |
| Disabled tab | `:disabled="true"` on `<v-tab>` | Standard. |
| Icon | leading slot inside `<v-tab>` | Lucide element directly. |
| Count badge | trailing text inside `<v-tab>` | Plain `<span>` not `<v-badge>` (which is a corner marker, wrong shape). |
| Vertical tabs | n/a — we explicitly do not use vertical tabs | Use a Sidebar nav instead (see [`navigation.md`](navigation.md)). |
| Toolbar tabs | n/a — out of scope | If a need arises, spec separately. |

### Defaults to add in Phase 5

```js
VTabs: {
  density: 'comfortable',
  showArrows: false,
  hideSlider: false,       // we use sliders only on underline variant
  color: 'primary',
  align: 'start',
},
VTab: {
  ripple: false,
},
```

### Required SASS overrides

```scss
// Common: kill uppercase, ripple overlay, Material padding.
.v-tabs {
  font-family: var(--ox-font-sans);
  min-height: auto;
  border-bottom: none;
}
.v-tab {
  text-transform: none;
  letter-spacing: 0;
  min-width: 0;
  border-radius: 0;
  background: transparent;
  color: var(--ox-text-tertiary);
}
.v-tab .v-btn__overlay { display: none; }
.v-tab__slider { background: var(--ox-accent); }   // underline variant indicator

// Pill variant — opt in via wrapper class .ox-tabs--pill on <v-tabs>.
.ox-tabs--pill {
  gap: var(--ox-space-1);
  padding: var(--ox-space-1);
  background: transparent;
}
.ox-tabs--pill .v-tab {
  height: var(--ox-height-sm);
  padding: 0 var(--ox-space-2_5);
  font: var(--ox-weight-medium) var(--ox-type-caption-size)/1 var(--ox-font-sans);
  border-radius: var(--ox-radius-pill);
}
.ox-tabs--pill .v-tab:hover:not(.v-tab--selected) {
  background: var(--ox-bg-muted);
  color: var(--ox-text-secondary);
}
.ox-tabs--pill .v-tab--selected {
  background: var(--ox-bg-emphasis);
  color: var(--ox-text-primary);
}
.ox-tabs--pill .v-tab__slider { display: none; }   // pill has no underline

// Underline variant — default for plain <v-tabs>.
.ox-tabs--underline {
  border-bottom: 1px solid var(--ox-border-default);
  padding-inline: 0;
}
.ox-tabs--underline .v-tab {
  height: var(--ox-height-lg);
  padding: 0 var(--ox-space-3);
  font: var(--ox-weight-medium) var(--ox-type-label-size)/1 var(--ox-font-sans);
}
.ox-tabs--underline .v-tab:hover:not(.v-tab--selected) { color: var(--ox-text-secondary); }
.ox-tabs--underline .v-tab--selected { color: var(--ox-text-primary); }
.ox-tabs--underline .v-tab__slider { height: 2px; }

// Focus.
.v-tab:focus-visible {
  outline: none;
  box-shadow: var(--ox-focus-ring);
  border-radius: var(--ox-radius-sm);
}
```

### What we don't touch

- Vuetify's keyboard handling (Left/Right arrows to move between
  tabs; Home/End to jump).
- `<v-window>` slide transitions on pill variant.
- The link integration on `<v-tab to="...">`.

---

## Anti-patterns (auto-reject)

- ❌ Vertical tabs. Use a sidebar nav. Period.
- ❌ Both Pill *and* Underline tabs in the same view.
- ❌ A Vuetify default `<v-tabs>` left at the default uppercase Material
  treatment. Wrap with `.ox-tabs--underline` or `.ox-tabs--pill` — pick
  one.
- ❌ Hand-rolled `<div class="tabs"><a v-for="...">…</a></div>` driven
  by route. Use `<v-tabs>` + `<v-tab :to="...">`.
- ❌ A `<v-badge>` corner-dot as a count indicator on a tab. Use inline
  text (see Pill spec).
- ❌ More than 5 tabs in a strip. If you need 6+, the tabs are not the
  right primitive — use a sidebar nav or a filter dropdown.
- ❌ Tab labels longer than 18 characters. Compose differently.
- ❌ Icon-only tabs (no label). Tabs are textual; if you need
  icon-only, use a `<v-btn-toggle>` (out of scope here).
- ❌ `!important` on any tab rule.

---

## Accessibility

- `<v-tabs>` sets `role="tablist"` on the strip and `role="tab"` on
  each tab; `<v-window-item>` panels are `role="tabpanel"` — keep these
  intact.
- Tab labels are read as-is; if a count is meaningful for the screen
  reader, include it in the visible text (the spec already does:
  `Backlog 3`) rather than `aria-label`.
- Selected tab has `aria-selected="true"`; the corresponding panel is
  the *only* visible one (Vuetify enforces this through `<v-window>`).

---

## Quick recipes

### Pill tabs in-page (entity detail)

```vue
<v-tabs v-model="tab" class="ox-tabs--pill" hide-slider>
  <v-tab value="overview">Overview</v-tab>
  <v-tab value="locations">Locations</v-tab>
  <v-tab value="citations">Citations <span class="ox-tab-count">{{ citationCount }}</span></v-tab>
</v-tabs>

<v-window v-model="tab">
  <v-window-item value="overview"><WorkOverview :work="work" /></v-window-item>
  <v-window-item value="locations"><WorkLocations :work="work" /></v-window-item>
  <v-window-item value="citations"><WorkCitations :work="work" /></v-window-item>
</v-window>
```

### Underline tabs as sub-route navigation

```vue
<v-tabs class="ox-tabs--underline">
  <v-tab :to="{ name: 'settings.profile' }">Profile</v-tab>
  <v-tab :to="{ name: 'settings.apikeys' }">API keys</v-tab>
  <v-tab :to="{ name: 'settings.billing' }">Billing</v-tab>
</v-tabs>
<router-view />
```

### Tab with leading icon

```vue
<v-tab value="files">
  <v-icon size="14"><FileText /></v-icon>
  Files
</v-tab>
```

---

## Open questions

- **Toolbar tabs / segmented filter** (e.g. the Linear board's grouping
  toggle) — overlap with `<v-btn-toggle>`. Defer; if Phase 7 surfaces a
  need, spec separately.
- **Tab overflow** with horizontal scrolling — Vuetify's `show-arrows`
  is forbidden by our config; the better answer is "fit your labels in
  the strip." If a future Phase 4 template hits an overflow, escalate.
