<!--
  OqlTextBlockChip — a value sub-expression rendered as ONE chip (oxjob #523 round 2).

  An in-column AND sub-group (`(nicotine & vaping)`, possibly nested arbitrarily deep) used to
  render as 5+ separate chips (`( · nicotine · & · vaping · )`). It now collapses to ONE chip
  whose LANGUAGE FEATURES — parens, the `&`/`or` connectors, `not` — render BOLD, so the user
  reads it as "the builder knows these are operators" (the same treatment negated text gets).

  This is the block builder's ESCAPE HATCH: the user can double-click to edit the whole thing
  as raw text and type ANY valid value expression (nested parens included). On commit the parent
  re-parses it — a pure-OR list (`foo or bar`) unpacks back into separate blocks; anything else
  stays a single text block. Mostly self-contained (display ⇄ edit) like OqlTextChip, but it
  commits a whole sub-expression (parent → v2Edit.setValueExpr), not a single scalar.

  Contract:
    prop  tok      the `textblock` token. Reads `_parts` [{ text, op }] (display) + `text` (edit).
    emit  commit   (rawText) — user finished editing; parent re-parses + rebuilds the value tree.
-->
<template>
  <span class="val-leaf">
    <!-- DISPLAY: one chip; operator parts (the connectors + `not`) bold. Double-click → edit.
         Parens are STRIPPED from the display (#575 round 8, Jason — no parens in the advanced
         view): `displayParts` drops the bare `(`/`)` parts, and the outer `_pOpen`/`_pClose`
         glyphs are hidden via `.val-paren { display:none }`. The block-chip smushing (bold
         `and`s inside one chip) conveys the grouping instead. Raw-edit text keeps its parens
         (built from `tok.text`, untouched). -->
    <span v-if="!editing" class="val-chip block-chip" tabindex="0"
      title="double-click to edit" @dblclick.stop="startEdit" @keydown="onKeydown"><span
      v-if="tok._pOpen" class="val-paren">{{ '('.repeat(tok._pOpen) }}</span><span
      v-for="(p, i) in displayParts" :key="i" :class="{ 'block-op': p.op }">{{ p.text }}</span><span
      v-if="tok._pClose" class="val-paren">{{ ')'.repeat(tok._pClose) }}</span></span>

    <!-- EDIT: a bordered input holding the whole raw expression. Commits on Enter / blur. -->
    <span v-else class="val-wrap">
      <input ref="inputEl" class="val-input block-input" type="text" :value="draft"
        spellcheck="false" @input="draft = $event.target.value"
        @keydown="onInputKeydown" @blur="commit" />
    </span>
  </span>
</template>

<script setup>
import { ref, nextTick, computed } from "vue";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .val-wrap / .val-input styles

const props = defineProps({ tok: { type: Object, required: true } });
const emit = defineEmits(["commit"]);

// DISPLAY parts with the bare `(`/`)` parens dropped (#575 round 8 — no parens in the advanced
// view). The bold connectors (`and`/`or`/`not`) still render, so the grouping reads from the
// smushed-together chip. The editable raw text (`tok.text`) is untouched, so a double-click edit
// still shows/round-trips the real parenthesized expression.
const displayParts = computed(() =>
  (props.tok._parts || []).filter((p) => {
    const t = (p.text || "").trim();
    return t !== "(" && t !== ")";
  }));

const editing = ref(false);
const draft = ref("");
const inputEl = ref(null);
const closingViaEnter = ref(false);

const startEdit = () => {
  draft.value = props.tok.text || "";
  editing.value = true;
  nextTick(() => { inputEl.value?.focus(); inputEl.value?.select?.(); });
};
// Enter on the display chip also opens edit (keyboard parity with the value chips).
const onKeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); startEdit(); } };

const commit = () => {
  if (!editing.value) return;
  editing.value = false;
  if (closingViaEnter.value) { closingViaEnter.value = false; }
  emit("commit", draft.value);
};
const onInputKeydown = (e) => {
  if (e.key === "Enter") { closingViaEnter.value = true; e.preventDefault(); commit(); }
  else if (e.key === "Escape") { editing.value = false; e.target.blur(); }
};
</script>

<style scoped>
.val-leaf { display: inline-flex; align-items: center; }
/* The block chip uses the value (periwinkle) palette like any value brick; the bold
   sub-parts (parens/&/or/not) mark the language features. */
.block-chip { gap: 0; }
.block-op { font-weight: 700; white-space: pre; }
/* EDIT mode (#523 round 5 fix): `.val-wrap`/`.val-input` live in OqlTextChip's SCOPED style, so
   they don't reach this component's input — leaving it the browser's default control font (larger
   + heavier than the surrounding view chips). Replicate the wrapper + input look here so a
   parenthesized block in edit mode matches a single-word chip exactly (same mono font, brick size,
   normal weight). Keep the roomy width — a whole sub-expression lives here. */
.val-wrap {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 26px;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 4px;
  padding: 0 8px;
}
.val-input {
  border: none;
  outline: none;
  background: transparent;
  font-family: "JetBrains Mono", monospace;
  font-weight: 400;
  font-size: var(--brick-fs, 0.8125rem);
  color: var(--val-fg, rgba(0, 0, 0, 0.87));
}
.block-input { min-width: 120px; max-width: 520px; }
</style>
