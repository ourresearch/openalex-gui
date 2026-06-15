<!--
  OqlTextChip — the inline-editable scalar/search value brick in the OQL builder.

  This is the "text chip". It has two visual modes (oxjob #467 Phase 1):
    DISPLAY  — a committed value renders as a borderless, teal value chip that
               snugs to its text (matches the entity value chip). Double-click to
               edit.
    EDIT     — a bordered `<input>` box. Shown while actively editing (double-click)
               or for a still-empty value (a freshly added value box). Commits back
               to the DISPLAY chip on Enter / blur.
  The negation `not` is a bold sub-part the same font-size as the value, butted up
  against the brick. (Open: Jason wants it moved INSIDE the chip fill — `[ not foo ]`
  — deferred; tracked in the job PLAN.)

  PURELY PRESENTATIONAL. It owns no QUERY state: it reads everything from the
  `tok` (a `vbrick` token produced by OqlQueryBuilder's `displayLines`) and emits
  semantic intents. The parent maps those intents onto the v2 edit ops
  (`edit.setValue` / `edit.toggleNeg` / `edit.removeNode` / `edit.addValue`) and
  re-renders. The only LOCAL state is `editing` (display-vs-edit UI mode) — that's
  presentation, not query state. Keep it free of v2/edit/drafts so it can grow
  independently (oxjob: paste-to-chips, `near` keyword, subclause split).

  Contract:
    prop  tok            the vbrick token. Reads: id, negated, _numeric, _sole,
                         and display/value/text (via `valueText`).
    emit  value-input    (InputEvent) — user typed; parent calls edit.setValue.
    emit  value-keydown  (KeyboardEvent) — raw keydown; parent handles Enter / Backspace-unnegate.
    emit  value-blur     () — input blurred; parent commits/folds.
    emit  toggle-neg     () — user clicked the `not` affordance to toggle negation
                             (on OR off); parent calls edit.toggleNeg. Rendered bold
                             when tok.negated, and as a hover-revealed ghost (to
                             negate) when not — mirrors the entity chip's click-to-toggle.
    emit  remove         () — user clicked × to remove this value.

  NOTE on focus: the parent focuses a brick by querying `[data-vid="<id>"]` in the
  DOM, so the `<input>` MUST keep its `:data-vid="tok.id"` attribute. A committed
  value sits in DISPLAY mode (no input); the parent only ever needs to focus a
  freshly-added value, which is empty → renders the input → focusable.
  NOTE on colours: --val-bg / --val-fg / --brick-fs are CSS custom properties that
  cascade in from the builder (oqlPalette.js); they resolve here without re-declaring.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <!-- LEGO `not`: own sub-part, butted against the brick. Bold when negated;
         a faint hover-revealed ghost (to negate) when not. -->
    <span class="notpfx clickable" :class="{ ghost: !tok.negated }"
      :title="tok.negated ? 'Remove negation' : 'Negate this value'"
      @click="$emit('toggle-neg')">not</span>

    <!-- DISPLAY: borderless teal chip that snugs to its text. Double-click to edit. -->
    <span v-if="!showInput" class="val-chip" :class="{ numeric: tok._numeric }"
      :title="'Double-click to edit'" @dblclick="startEdit">
      {{ valueText }}<v-icon v-if="!tok._sole" size="13" class="val-remove"
        @click.stop="$emit('remove')">mdi-close</v-icon>
    </span>

    <!-- EDIT: bordered input. Shown while editing or for a still-empty value. -->
    <span v-else class="val-wrap" :class="{ numeric: tok._numeric }">
      <input ref="inputEl" class="val-input" :type="tok._numeric ? 'number' : 'text'"
        :value="valueText" :data-vid="tok.id"
        :placeholder="tok._numeric ? 'number' : 'text'" spellcheck="false"
        @input="$emit('value-input', $event)"
        @keydown="onKeydown"
        @blur="onBlur" />
      <v-icon v-if="!tok._sole" size="13" class="val-remove" @click="$emit('remove')">mdi-close</v-icon>
    </span>
  </span>
</template>

<script setup>
import { computed, ref, nextTick, watch } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
});

const emit = defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "remove"]);

// Display text for the input: prefer an explicit display label, then the raw
// value, then any passthrough text. (Mirrors the old builder-local `valueText`.)
const valueText = computed(() => {
  const t = props.tok;
  return t.display != null ? t.display : (t.value != null ? t.value : t.text || "");
});

// Local UI mode (NOT query state): show the bordered input while actively editing,
// or whenever the value is still empty (a freshly added value box needs the input
// so the parent's focusValueSoon can land in it).
const editing = ref(false);
const inputEl = ref(null);
const showInput = computed(() => editing.value || !String(valueText.value).length);

const startEdit = () => {
  editing.value = true;
  nextTick(() => { inputEl.value?.focus(); inputEl.value?.select?.(); });
};
const onKeydown = (e) => {
  // Enter / Escape commit back to the display chip (parent still handles Enter for
  // draft "add next value" + Backspace-at-col-0 un-negate via the emitted event).
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) editing.value = false;
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
  emit("value-keydown", e);
};
const onBlur = () => { editing.value = false; emit("value-blur"); };

// If the token at this position is replaced by a different value (index-keyed
// v-for), drop any stale editing mode.
watch(() => props.tok.id, () => { editing.value = false; });
</script>

<style scoped>
.val-leaf { display: inline-flex; align-items: center; gap: 2px; }

/* LEGO `not`: bold, same font-size as the value, sits just outside the brick fill. */
.notpfx { font-weight: 700; font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, #14625c); }
.notpfx.clickable { cursor: pointer; }
/* ghost = not-yet-negated affordance: hidden until the leaf is hovered, then a
   faint clickable `not` that turns the value negative. The active (already-negated)
   `not` is always shown bold. */
.notpfx.ghost { display: none; opacity: 0.45; }
.val-leaf:hover .notpfx.ghost { display: inline; }
.notpfx.ghost:hover { opacity: 0.8; }

/* DISPLAY chip — mirrors the entity .value-chip (teal, borderless, snug). */
.val-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--val-bg, #d6f2ec);
  color: var(--val-fg, #14625c);
  border-radius: 6px;
  padding: 1px 8px;
  font-size: var(--brick-fs, 0.8125rem);
  line-height: 1.6;
  white-space: nowrap;
  cursor: pointer;
}
.val-chip:hover { filter: brightness(0.97); }

/* EDIT box — bordered input. */
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  padding: 2px 6px;
}
.val-input {
  border: none; outline: none; background: transparent;
  font-size: var(--brick-fs, 0.8125rem); color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.4; margin-left: 2px; }
.val-remove:hover { opacity: 1; }
</style>
