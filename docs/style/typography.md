# Typography

Typography rules for openalex-gui. Built on the type tokens defined in
[`tokens.md`](./tokens.md). This document specifies **which token to use where**,
how to load the font, line-length rules, and the small set of typographic
behaviours (numerics, casing, link styling) that should never be hand-rolled.

**Light mode only.** Inter only. JetBrains Mono for code.

> If you find yourself writing `font-size:`, `font-weight:`, or `line-height:`
> in a `<style>` block, stop. Reach for a type token. If the token you need
> does not exist, propose adding it to [`tokens.md`](./tokens.md) — do not
> invent a one-off in a component.

---

## Font families

Two families, plus a system emoji stack. See [`tokens.md` § Type](./tokens.md#type)
for the exact token values.

| Family | Token | Where used |
|--------|-------|------------|
| **Inter** (variable) | `--ox-font-sans` | All UI chrome, body text, headings, labels, prose |
| **JetBrains Mono** | `--ox-font-mono` | Code, OpenAlex IDs (`W2741809807`), hex values, raw JSON |
| System emoji stack | `--ox-font-emoji` | Inherited via `font-family` fallback chain — never set directly |

Why Inter: same family Linear ships with; SIL OFL (free, self-hostable); has a
true variable axis (weight 100–900) which lets us ship one file instead of four
weights; tabular and slashed-zero numeric features matter for our data-dense
tables; designed for screen UI at small sizes (the OpenAlex sweet spot is
13–15 px).

Why JetBrains Mono: closest free analog to Linear's paid Berkeley Mono.
Programming-ligature-friendly, generous x-height, distinguishes `0 / O` and `l / 1`.

---

## Loading Inter

**Decision (Phase 2):** self-host the Inter Variable font. Drop Google Fonts CDN.
Drop unused Dosis and Roboto.

### Why self-host

1. **Privacy / GDPR.** Google Fonts CDN sends user IPs to Google. EU users have
   complained about this in the past on openalex.org; self-hosting eliminates
   the issue with no functional cost.
2. **No FOIT / FOUT flicker from a third-party round-trip.** Same-origin fonts
   load on the first paint with `font-display: swap`.
3. **CDN outage isolation.** Google Fonts has had multi-hour outages. With
   self-hosting, font availability == app availability.
4. **One file, all weights.** Inter Variable is a single ~250 KB woff2 covering
   100–900 weights — smaller than the three static weights we'd otherwise need.

### Concrete plan (executed in Phase 5)

1. Download `Inter Variable` woff2 from [rsms.me/inter](https://rsms.me/inter/)
   (current release: 4.x; `Inter[opsz,wght].woff2` + italic
   `InterItalic[opsz,wght].woff2`).
2. Place under `public/fonts/inter/`. Two files only — variable upright + italic.
3. In `public/index.html`:
   - Remove the `<link rel="preconnect">` to `fonts.googleapis.com` and
     `fonts.gstatic.com`.
   - Remove the `<link href="https://fonts.googleapis.com/css2?family=Dosis...&family=Inter...&family=Roboto...">` line.
   - Add `<link rel="preload" as="font" type="font/woff2" crossorigin
     href="/fonts/inter/Inter[opsz,wght].woff2">` (upright only — italic is rare
     enough not to preload).
4. In `src/styles/fonts.css` (new file, imported once from `main.js`):

   ```css
   @font-face {
     font-family: "Inter";
     font-style: normal;
     font-weight: 100 900;
     font-display: swap;
     src: url("/fonts/inter/Inter[opsz,wght].woff2") format("woff2-variations");
     /* opsz axis: 14–32, auto-applied via font-optical-sizing */
   }
   @font-face {
     font-family: "Inter";
     font-style: italic;
     font-weight: 100 900;
     font-display: swap;
     src: url("/fonts/inter/InterItalic[opsz,wght].woff2") format("woff2-variations");
   }
   :root { font-optical-sizing: auto; }
   ```

5. Verify with DevTools → Network: only `Inter[opsz,wght].woff2` loads, no
   `fonts.gstatic.com` requests. Verify `getComputedStyle(document.body).fontFamily`
   starts with `"Inter"`.

### What gets dropped

| Removed | Why |
|---------|-----|
| Dosis | Loaded by `public/index.html` but no `font-family` reference anywhere in `src/`. Dead weight. |
| Roboto | Same — loaded, never referenced. Vuetify v3 does **not** default to Roboto on us (our `$body-font-family` SASS var overrides it to Inter). |
| Google Fonts CDN preconnect/link | Replaced by self-hosted Inter only. |

### What we do **not** load

- No icon-font CSS. Lucide ships as Vue components (SVG); see [`icons.md`](./icons.md).
- No `@mdi/font` icon font in the final state. (Currently installed and
  consumed by Vuetify defaults — removal is part of Phase 5 once `lucide-vue-next`
  is wired in.)

---

## Type scale — concrete usage

Tokens live in [`tokens.md` § Type scale](./tokens.md#type-scale). This is the
"where to use which" table.

| Token | Size / weight | Use it for | **Never** use it for |
|-------|---------------|------------|----------------------|
| `--ox-type-display` | 24 / 500 | Page title (`<h1>` of a route — "Profile", "Works", "Curate institution"). One per page, max. | Cards. Modal titles. List headings. |
| `--ox-type-h1` | 20 / 500 | Top-level section heading inside a page (e.g. "Metrics", "Related works" on a Work detail page). | Page titles (use `display`). Inline emphasis. |
| `--ox-type-h2` | 16 / 500 | Sub-section heading. Empty-state titles. Settings group headings. | Card titles (use `h3`). Form field labels (use `label`). |
| `--ox-type-h3` | 15 / 500 | Card title. Dialog title. Sidebar group title. | Body text. List rows. |
| `--ox-type-body` | 14 / 400 | Default reading text in UI chrome — list rows, table cells, descriptions, tooltips. | Long-form reading (use `prose`). Form labels (use `label`). |
| `--ox-type-body-emph` | 14 / 500 | Emphasised body — selected list row, "current value" in a key/value pair, summary numbers. | Decorative bold. Headings (use `h2`/`h3`). |
| `--ox-type-label` | 13 / 500 | Form field labels. Sidebar nav items. Button text (default and outlined). Dialog confirm-action label. Pill/badge text larger than caption. | Body copy. Tooltips. |
| `--ox-type-caption` | 12 / 500 | Helper text under inputs. Validation hints. Small-button text. Status pill. Keyboard hint chips. | Anything that needs to be readable as the primary content of a row. |
| `--ox-type-mono` | 13 / 400 | Inline code (`W2741809807`, `is_oa:true`, hex values). Inside `<code>` and `<pre>`. | UI labels, even if they look "code-y" — use `label`. |
| `--ox-type-prose` | 15 / 400 | Long-form reading: paper abstracts, descriptions, blog-like content, dialog body copy >2 lines. Always paired with `--ox-prose-max`. | Tables. Compact UI lists. |

### Quick rules

- **Default is `body`.** If you're not sure which token to use for ordinary
  text inside a component, it's `--ox-type-body`.
- **Headings stop at `h3` inside a card.** Card body can use `body` or
  `body-emph` for stronger rows; do not nest `h2` inside `h3`.
- **`display` is per-route, not per-component.** If a route renders multiple
  panels, exactly one element (usually the page header) gets `display`.
- **Mono never appears in chrome.** Buttons, tabs, nav, tooltips — all `label`
  or `body`. Mono is content-only.
- **Italic is reserved for prose and citations.** No italic UI labels.

### Vue / SASS application

Two valid ways to apply a type token to an element. Pick **one** per component;
don't mix.

**(a) Vuetify utility class (preferred for one-offs inside a template):**

```html
<v-card-title class="ox-type-h3">Authors</v-card-title>
```

The utility classes (`.ox-type-display`, `.ox-type-h1`, … `.ox-type-prose`)
are defined once in `src/styles/typography.css` (Phase 5) and emit the four
properties for that token (`font-family`, `font-size`, `font-weight`,
`line-height`, `letter-spacing`).

**(b) SASS / CSS reference (preferred inside a `<style>` block of a reusable component):**

```scss
.work-title {
  font: var(--ox-type-h3);          /* shorthand — when added in Phase 5 */
  color: var(--ox-text-primary);
}
```

> ⚠️ Until the Phase 5 typography stylesheet ships, hand-applying the four
> properties from the table above is acceptable — but only if every value is
> `var(--ox-type-…)`-derived, never a literal `14px`.

---

## Line lengths (measure)

Long-form text becomes unreadable past ~75 characters. Two width tokens cover
the cases we have:

| Token | Width | Use |
|-------|-------|-----|
| `--ox-prose-max` | `680px` (~70 ch at 15 px Inter) | Abstracts, descriptions, blog-like content, dialog body copy. **Center** the prose container; do not let it stretch full-width. |
| `--ox-content-max` | `1120px` | Top-level page container. Wraps everything; does **not** apply to prose nested inside. |

### Rule: prose always wears `--ox-prose-max`

```html
<div class="ox-prose">
  <p>{{ work.abstract }}</p>
</div>
```

```css
.ox-prose {
  max-width: var(--ox-prose-max);
  /* margin-inline: auto;  ← only if the surrounding column is wider */
  font: var(--ox-type-prose);
  color: var(--ox-text-secondary);
}
.ox-prose p + p { margin-top: var(--ox-space-4); }  /* 16 px between paragraphs */
```

Things that **do not** get capped at `--ox-prose-max`:

- Table cells, list rows, key/value rows — they wear the column width they
  inherit.
- Headings (`display`/`h1`/`h2`/`h3`) — they may exceed the prose width if
  necessary; the prose cap is for *body copy*, not chrome.
- Tooltips, badges, button labels — never long enough to need it.

### Anti-patterns (do not)

- ❌ `max-width: 700px` on an `<p>` (hand-rolled, not the token).
- ❌ Stretching abstracts to the full content column (1120 px wide lines).
- ❌ Setting `text-align: justify` on prose — breaks at small widths.

---

## Weight rules

Inter ships 100–900 as a single variable axis. We use exactly **two weights**
in chrome and reserve heavier weights for user-authored content.

| Where | Weight | Token |
|-------|--------|-------|
| All body text, default state | 400 | `--ox-weight-regular` |
| All UI emphasis (selected row, active tab, label, button text, headings) | 500 | `--ox-weight-medium` |
| Editor `**bold**` inline content **only** | 600 / 700 | `--ox-weight-semibold` / `--ox-weight-bold` |

> Two-weight chrome is intentional: it's the single biggest reason Linear's
> typography reads "calm" rather than "busy". Do not introduce a 600 or 700
> weight in a navbar, button, heading, or table cell.

---

## Numerics: tabular figures

By default, Inter uses proportional figures (each digit is the width its
glyph wants). In data tables, totals, and metric counters, columns of numbers
look ragged. Fix: turn on the tabular feature.

```css
.ox-numeric-tabular {
  font-variant-numeric: tabular-nums slashed-zero;
}
```

Apply to:

- All `<td>` containing a number (cited-by count, year, etc.).
- Metric cards (large counters on entity pages).
- IDs that include digits (mono already happens to be monospaced — this is
  defense-in-depth).
- Sparkline / chart axis labels.

**Do not** apply to body prose — proportional figures read better in running
text.

---

## Casing rules

| Context | Rule | Example |
|---------|------|---------|
| Buttons | Sentence case | "Save changes", not "Save Changes" or "SAVE" |
| Page titles, section headings | Sentence case | "Citing works", not "Citing Works" |
| Navigation items | Sentence case | "Saved searches" |
| Form labels | Sentence case | "Email address" |
| Status pills / badges | UPPERCASE with `letter-spacing: 0.05em`, **only at `caption` size** | `OPEN ACCESS`, `RETRACTED` |
| Acronyms inside any of the above | Keep canonical case | "DOI", "RAS", "ORCID", "OX" (never "Doi"/"Ox") |

No UPPERCASE outside the badge case. No Title Case anywhere.

---

## Links

Link styling lives at the type layer because it crosses size tokens.

```css
a {
  color: var(--ox-info-fg);              /* #1f6feb */
  text-decoration-line: underline;
  text-decoration-color: var(--ox-info-fg-faint, transparent);
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: text-decoration-color var(--ox-duration-fast) var(--ox-ease-default);
}
a:hover { text-decoration-color: currentColor; }
a:visited { color: var(--ox-info-fg); }  /* no purple */
a:focus-visible { box-shadow: var(--ox-focus-ring); border-radius: 2px; }
```

- Links inherit `font-size` and `font-weight` from their context — never bump
  them to medium just because they're links.
- Buttons styled as links (Vuetify `variant="text"`) are not links. They get
  `--ox-text-primary` and an underline only on hover.
- External-link icon (Lucide `arrow-up-right`, 14 px) appears after the link
  text **only** when the link leaves openalex.org.

---

## Reduced motion

Respect `prefers-reduced-motion: reduce`. The Phase 5 stylesheet sets every
type-related transition to `0ms` in that media query. Component code does not
need to handle this itself if it uses the tokens.

---

## Anti-patterns checklist (PR review)

Reject in review if any of these appear in a `.vue` file:

- [ ] `font-size:` with a literal value (any of `12px`, `0.875rem`, `1.25em`, …)
- [ ] `font-weight:` with a literal value
- [ ] `line-height:` with a literal value other than `1` (image reset)
- [ ] `font-family:` set anywhere in a component (only `src/styles/fonts.css`
      and Vuetify SASS may set it)
- [ ] `max-width:` on a prose container that isn't `var(--ox-prose-max)`
- [ ] Use of Dosis or Roboto (both must be gone post-Phase 5)
- [ ] `text-transform: uppercase` outside a status-pill component
- [ ] `text-decoration: none` on an `<a>` that is actually a link (kills affordance)
- [ ] Hand-rolled `<code>` styling instead of `--ox-type-mono`

If a reviewer says "use a token" and the right token doesn't exist, the fix
is to add one to [`tokens.md`](./tokens.md), not to ship the literal value
"just this once".
