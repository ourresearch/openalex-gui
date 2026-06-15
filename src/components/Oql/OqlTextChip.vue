<!--
  OqlTextChip — the inline-editable scalar/search value brick in the OQL builder.

  This is the "text chip": a small bordered input box for a free-text or numeric
  value, with optional `not` chrome rendered OUTSIDE the border (negation) and an
  inline remove (×) when the brick is not the sole value of its clause.

  PURELY PRESENTATIONAL. It owns no query state: it reads everything from the
  `tok` (a `vbrick` token produced by OqlQueryBuilder's `displayLines`) and emits
  semantic intents. The parent maps those intents onto the v2 edit ops
  (`edit.setValue` / `edit.toggleNeg` / `edit.removeNode` / `edit.addValue`) and
  re-renders. Keep it that way — this component must stay free of v2/edit/drafts so
  it can grow independently (oxjob: paste-to-chips, `near` keyword, subclause split).

  Contract:
    prop  tok            the vbrick token. Reads: id, negated, _numeric, _sole,
                         and display/value/text (via `valueText`).
    emit  value-input    (InputEvent) — user typed; parent calls edit.setValue.
    emit  value-keydown  (KeyboardEvent) — raw keydown; parent handles Enter / Backspace-unnegate.
    emit  value-blur     () — input blurred; parent commits/folds.
    emit  toggle-neg     () — user clicked the `not` prefix to toggle negation
                             (on OR off); parent calls edit.toggleNeg. The prefix
                             renders bold when tok.negated, and as a hover-revealed
                             ghost (to negate) when not — mirrors the entity chip's
                             click-to-toggle.
    emit  remove         () — user clicked × to remove this value.

  NOTE on focus: the parent focuses a brick by querying `[data-vid="<id>"]` in the
  DOM, so the `<input>` MUST keep its `:data-vid="tok.id"` attribute.
  NOTE on colours: --val-bg / --val-fg / --brick-fs are CSS custom properties that
  cascade in from the builder (oqlPalette.js); they resolve here without re-declaring.
-->
<template>
  <span class="val-leaf" :class="{ negated: tok.negated }">
    <span class="notpfx clickable" :class="{ ghost: !tok.negated }"
      :title="tok.negated ? 'Remove negation' : 'Negate this value'"
      @click="$emit('toggle-neg')">not</span>
    <span class="val-wrap" :class="{ numeric: tok._numeric }">
      <input class="val-input" :type="tok._numeric ? 'number' : 'text'"
        :value="valueText" :data-vid="tok.id"
        :placeholder="tok._numeric ? 'number' : 'text'" spellcheck="false"
        @input="$emit('value-input', $event)"
        @keydown="$emit('value-keydown', $event)"
        @blur="$emit('value-blur')" />
      <v-icon v-if="!tok._sole" size="13" class="val-remove" @click="$emit('remove')">mdi-close</v-icon>
    </span>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tok: { type: Object, required: true },
});

defineEmits(["value-input", "value-keydown", "value-blur", "toggle-neg", "remove"]);

// Display text for the input: prefer an explicit display label, then the raw
// value, then any passthrough text. (Mirrors the old builder-local `valueText`.)
const valueText = computed(() => {
  const t = props.tok;
  return t.display != null ? t.display : (t.value != null ? t.value : t.text || "");
});
</script>

<style scoped>
.notpfx { font-weight: 700; color: var(--val-fg, #14625c); }
.notpfx.clickable { cursor: pointer; }
/* ghost = not-yet-negated affordance: hidden until the chip is hovered, then a
   faint clickable `not` that turns the value negative. The active (already-negated)
   `not` is always shown bold. */
.notpfx.ghost { display: none; opacity: 0.45; }
.val-leaf:hover .notpfx.ghost { display: inline; }
.notpfx.ghost:hover { opacity: 0.8; }
.val-leaf { display: inline-flex; align-items: center; gap: 4px; }
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
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
</style>
