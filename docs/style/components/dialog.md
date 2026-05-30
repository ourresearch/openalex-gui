# Dialog (modal)

A centered overlay that demands a decision before the user returns to the
page. 81 instances in the Phase 1 audit — second only to icons + buttons.
Dialogs are the most common place hand-rolled chrome shows up because the
Material defaults are large, opinionated, and the wrong shape.

**Vuetify component:** `v-dialog` (overlay) wrapping a `v-card` (content).
**Status against Vuetify:** use with overrides — the overlay and the
inner card both need shape tokens.

> Dialogs are interruptions. Use them sparingly. Most "open a small thing
> over the page" use cases are popovers, menus, or sheets — **not**
> dialogs. If the user doesn't have to decide something before continuing,
> it isn't a dialog.

---

## When to use

| Use | Component |
|-----|-----------|
| Confirm a destructive action ("Delete saved search?") | **Dialog** |
| Confirm a non-destructive action that can't be undone easily ("Apply curation to 1,243 works?") | **Dialog** |
| Short focused task that captures input ("Rename collection", "Invite teammate") | **Dialog** |
| Show contextual info without blocking ("What's a topic?") | **Popover** or **Tooltip** |
| Pick from a menu | **Menu** |
| Browse a side panel of details | **Sheet** (TBD spec) |
| Onboarding tour | **Popover sequence**, not dialog |

---

## Shape

| Property | Token | Value |
|----------|-------|-------|
| Backdrop | `--ox-overlay-scrim` | `rgba(0,0,0,0.32)` |
| Backdrop blur | none | (intentional — blur is performance-expensive and Linear doesn't) |
| Card background | `--ox-bg-base` | `#fff` |
| Card border | 1px solid `--ox-border-default` | hairline ring; doubles as `--ox-elev-2` ring |
| Card radius | `--ox-radius-lg` | 12px |
| Card shadow | `--ox-elev-overlay` | `0 12px 32px -8px rgba(0,0,0,0.18), 0 4px 12px -4px rgba(0,0,0,0.08)` |
| Card padding | `--ox-space-5` | 20px on small dialogs; `--ox-space-6` (24px) on default |
| Vertical offset | — | 10% from top of viewport (Linear convention) |
| Z-index | `--ox-z-modal` | 400 |

---

## Sizes

Pick the smallest that fits without scrolling. **No fullscreen by default**
— fullscreen is a sheet, not a dialog.

| Size | Width | Use |
|------|-------|-----|
| `sm` | 360px | Single confirmation. ≤2 sentences of body. |
| `md` *(default)* | 480px | Short form (1–4 fields). |
| `lg` | 640px | Longer form, or content with a side-by-side. |
| `xl` | 800px | Rare. Only when content genuinely needs the width (e.g. content review with image). |

- All sizes have **`max-width: calc(100vw - 32px)`** to keep a 16px gutter
  on small viewports.
- Vertical: dialogs **never** exceed `calc(100vh - 96px)` — beyond that,
  body scrolls (header + footer stay pinned).

---

## Anatomy

```
┌────────────────────────────────────────────────────────┐
│ Title                                              ✕   │  ← header
├────────────────────────────────────────────────────────┤
│                                                        │
│ Body — form fields, message, or content.               │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                  Cancel    [Primary]   │  ← footer
└────────────────────────────────────────────────────────┘
```

| Slot | Type | Padding | Notes |
|------|------|---------|-------|
| Header (`<v-card-title>`) | `--ox-type-h3` (15/500) | card padding | Single line, truncate if needed; close ✕ on the right. |
| Body (`<v-card-text>`) | `--ox-type-body` (14/400) | inherits card padding | Two paragraphs max. Form fields rendered with 16px vertical gap. |
| Footer (`<v-card-actions>`) | — | inherits card padding | Buttons right-aligned; Cancel + Primary (or Cancel + Danger). |

**Spacing:**

- Title to body: `--ox-space-3` (12px).
- Body bottom to footer: `--ox-space-5` (20px) on default size.
- Footer button gap: `--ox-space-2` (8px).
- **No `<v-divider>` between sections** unless the body has internal scroll.

---

## Header rules

- **Title is `<v-card-title>`** at `--ox-type-h3` (15/500). Sentence case.
  No period.
- **Close ✕** is a Ghost icon-only button (`size="small"`) right-aligned.
  Lucide `<X />` at 16px. `aria-label="Close dialog"`. Tooltip "Close" with
  kbd hint "Esc".
- **No subtitle** in the header. If you need context, put it as a single
  short sentence at the top of the body in `--ox-text-tertiary`.

---

## Footer rules

- **Right-aligned by default.** Use `<v-spacer />` if you have a
  left-aligned tertiary action (rare; e.g. "Learn more").
- **Two-button pattern**: Cancel (Ghost) + Primary (filled black) OR
  Cancel (Ghost) + Danger (filled red).
- **Cancel is always present** even for non-destructive dialogs. Users
  expect Esc to dismiss; Cancel makes that explicit.
- **Order:** secondary on the left, primary on the right. Linear order
  (we are not on Windows; the Mac convention wins).
- **Loading state on the Primary button** during async submit. Disable
  Cancel too (or grey it). Do not show a spinner over the whole dialog.
- **Don't put a tertiary action inline with Cancel + Primary** unless it
  reads as a separate action group (e.g. "Save as draft" pushed left).

---

## Behavior

| Trigger | Effect |
|---------|--------|
| Click backdrop | Close (treated as Cancel). Disable via `:persistent` for unsubmittable forms. |
| Esc | Close (Cancel). |
| Enter | Submit Primary (when focus is inside a single-line field). **Not** when focus is in a textarea. **Not** when there's no Primary button. |
| Open | Focus first focusable element (typically first input). On confirmation-only dialogs, focus the Cancel button (not the destructive action). |
| Close | Restore focus to the trigger element. |

**Persistent dialogs** (no backdrop / Esc dismiss) are reserved for
in-progress unsaved forms where dismissal would lose work. They are NOT
the default. Don't mark every dialog persistent "to be safe".

**Stacking:** at most **one** open dialog at a time. If you find yourself
stacking dialogs, you have a UX problem — refactor to a multi-step
single dialog or a sequence.

---

## Animation

- **Enter:** opacity 0 → 1 over `--ox-duration-emph` (320ms),
  scale 0.98 → 1 over the same. Backdrop opacity 0 → 1 over
  `--ox-duration-base` (150ms).
- **Exit:** reverse, `--ox-duration-slow` (200ms).
- Easing `--ox-ease-out` on enter, `--ox-ease-in` on exit.
- **Respect** `prefers-reduced-motion: reduce` — set durations to 0.

---

## Accessibility

Vuetify sets `role="dialog"`, `aria-modal="true"`, traps focus, and
restores focus on close. Don't override.

What you owe:

- **`aria-labelledby`** pointing at the title element. Vuetify wires this
  if you use `<v-card-title>` inside `<v-dialog>` — if you don't, set it
  manually.
- **`aria-describedby`** pointing at the body when the body has a
  message the screen reader should announce (most confirmations).
- **Title element is `<h2>`** semantically (Vuetify renders
  `<v-card-title>` as a `<div>` by default — wrap in `<h2>` or pass `tag`).
- **Close ✕ has `aria-label`** (already covered above).

---

## Vuetify mapping

| Spec concept | VDialog / VCard prop |
|--------------|----------------------|
| Width sm/md/lg/xl | `width="360"` / `"480"` / `"640"` / `"800"` |
| Persistent (no dismiss on outside-click / Esc) | `persistent` |
| Backdrop scrim | (default) |
| Open / close | `v-model:modelValue` boolean |
| Z-index | (theme default sets to `--ox-z-modal`) |
| Transition | `transition="dialog-transition"` *(theme default)* |

### Defaults to add in Phase 5

```js
VDialog: {
  width: 480,                  // = md
  scrim: 'rgba(0,0,0,0.32)',   // = --ox-overlay-scrim
  transition: 'ox-dialog',     // custom Vue <Transition> name with our timing
  // persistent: false (intentional default)
},
```

### Required SASS overrides

```scss
.v-overlay.v-dialog .v-overlay__scrim {
  background: var(--ox-overlay-scrim);
}

.v-dialog .v-card {
  border-radius: var(--ox-radius-lg);
  border: 1px solid var(--ox-border-default);
  background: var(--ox-bg-base);
  box-shadow: var(--ox-elev-overlay);
  padding: var(--ox-space-6);   // 24px
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
}

.v-dialog .v-card .v-card-title {
  font-size: var(--ox-type-h3-size);
  font-weight: var(--ox-weight-medium);
  line-height: var(--ox-type-h3-line);
  letter-spacing: -0.005em;
  color: var(--ox-text-primary);
  padding: 0;
  margin-bottom: var(--ox-space-3);
  // close button absolutely positioned top-right inside the header row
  position: relative;
}

.v-dialog .v-card .v-card-text {
  padding: 0;
  font-size: var(--ox-type-body-size);
  line-height: var(--ox-type-body-line);
  color: var(--ox-text-primary);
  overflow-y: auto;   // scrolls if body exceeds dialog height
  flex: 1 1 auto;
}

.v-dialog .v-card .v-card-actions {
  padding: 0;
  margin-top: var(--ox-space-5);  // 20px
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--ox-space-2);
  flex: 0 0 auto;
}

// Scroll-hairline: when body is scrollable, show a 1px hairline above the
// footer to communicate that content continues.
.v-dialog .v-card .v-card-text.is-scrollable + .v-card-actions {
  border-top: 1px solid var(--ox-border-subtle);
  padding-top: var(--ox-space-3);
  margin-top: var(--ox-space-3);
}
```

### Custom transition

Register once in `main.js`:

```js
import { TransitionGroup } from 'vue'
// Defines `name="ox-dialog"` with our duration/easing.
```

```css
.ox-dialog-enter-active { transition: opacity var(--ox-duration-emph) var(--ox-ease-out), transform var(--ox-duration-emph) var(--ox-ease-out); }
.ox-dialog-leave-active { transition: opacity var(--ox-duration-slow) var(--ox-ease-in),  transform var(--ox-duration-slow) var(--ox-ease-in); }
.ox-dialog-enter-from, .ox-dialog-leave-to { opacity: 0; transform: scale(0.98); }
```

---

## Anti-patterns (auto-reject)

- ❌ Fullscreen dialog. Use `<v-sheet>` / sheet pattern.
- ❌ Dialog inside dialog. Refactor.
- ❌ Hand-rolled modal (`<div class="modal-backdrop">…</div>`). Use
  `<v-dialog>`.
- ❌ Custom shadow (`box-shadow: 0 10px 40px rgba(0,0,0,0.5)`). Token only.
- ❌ Backdrop blur. Performance-expensive; Linear doesn't.
- ❌ `:persistent` as a default. Persistent is only for unsubmittable
  forms.
- ❌ Primary on the left, Cancel on the right. Wrong order.
- ❌ Two Primary buttons in the footer.
- ❌ No Cancel button. Even success-only dialogs need a dismiss.
- ❌ "OK" as a button label. Use the action verb ("Save", "Delete",
  "Apply").
- ❌ Title in title case ("Delete This Saved Search"). Sentence case.
- ❌ Spinner over the whole dialog during submit. Spinner lives on the
  Primary button (`loading` prop).
- ❌ Dialog opens without focus moving inside. Always trap focus.

---

## Quick recipes

### Destructive confirmation (most common)

```vue
<v-dialog v-model="showDelete" width="360">
  <v-card>
    <v-card-title>Delete saved search?</v-card-title>
    <v-card-text>
      This can't be undone. Any team members watching the search will lose
      access immediately.
    </v-card-text>
    <v-card-actions>
      <v-btn variant="text" @click="showDelete = false">Cancel</v-btn>
      <v-btn variant="flat" color="danger" :loading="isDeleting" @click="confirmDelete">
        Delete
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Short form

```vue
<v-dialog v-model="showRename" width="480">
  <v-card>
    <v-card-title>Rename collection</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="newName"
        label="New name"
        autofocus
        @keydown.enter="save"
      />
    </v-card-text>
    <v-card-actions>
      <v-btn variant="text" @click="showRename = false">Cancel</v-btn>
      <v-btn variant="flat" color="primary" :loading="isSaving" :disabled="!newName" @click="save">
        Save
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Larger content (lg) with scroll

```vue
<v-dialog v-model="showReview" width="640" scrollable>
  <v-card>
    <v-card-title>
      Review curation
      <v-btn icon variant="text" size="small"
             aria-label="Close dialog" class="position-absolute top-0 end-0 mt-3 mr-3"
             @click="showReview = false">
        <v-icon><X /></v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text class="is-scrollable">
      <CurationReviewBody :curation="curation" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="showReview = false">Cancel</v-btn>
      <v-btn variant="flat" color="primary" :loading="isApplying" @click="apply">
        Apply
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Persistent (unsaved-form guard)

```vue
<v-dialog v-model="showEdit" width="480" persistent>
  <!-- Form content. Esc/backdrop won't dismiss; only Cancel/Save. -->
</v-dialog>
```

---

## Open questions

- **"Are you sure?" double-confirm** for irreversible bulk actions — pattern
  to lock during Phase 4 templates work.
- **Multi-step dialog** (wizard) — keep deferred until we have a real use
  case. Most apparent wizards are better as a route + a page.
- **Toast on dismiss** ("Saved" toast after closing edit dialog) — covered
  by the Toast spec (TBD).
