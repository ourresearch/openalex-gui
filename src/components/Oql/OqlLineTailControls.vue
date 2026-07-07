<!--
  OqlLineTailControls — the trailing control at the end of a query line: the ghost `or`
  button (add an OR term, #523 round 3). The end-of-line dropdown that used to sit next to
  it (AND clause / AND filter / Delete line, #523 round 4) was removed in #523 round 10 —
  Kyle found it confusing; its structural actions moved to the left-gutter kebab menu.

  OqlQueryBuilder mounts this in TWO spots — inside the tail brick's `.bl-tok--tail` when the
  line's last visible chip is a brick (so chip + `or` never wrap apart, #523 round 6), or
  after the token loop as the fallback for a text-block tail. ONE component so the two
  mounts can't drift (they were hand-synced template copies before the 2026-07-05 cleanup).

  Reveal is pure CSS: the control fades in when the ancestor `.bline` row is hovered (the
  ancestor part of a scoped selector is left unscoped by the compiler, so `.bline:hover …`
  reaches up into the parent's DOM). No per-line hover state needed in the builder.

  Contract:
    prop  line          the display line. Reads: _plus (canAndOr).
    prop  hasOpenDraft  drafts are a singleton (#561) — hides the `or` ghost.
    emit  plus
-->
<template>
  <span class="line-tail">
    <span v-if="line._plus && line._plus.canAndOr" class="line-plus-wrap">
      <button type="button" class="line-plus" :class="{ 'line-plus--off': hasOpenDraft }"
        @click.stop="$emit('plus')" @mousedown.stop>
        or
        <v-tooltip activator="parent" location="bottom" :open-delay="150">add or term</v-tooltip>
      </button>
    </span>
  </span>
</template>

<script setup>
defineProps({
  line: { type: Object, required: true },
  hasOpenDraft: { type: Boolean, default: false },
});
defineEmits(["plus"]);
</script>

<style scoped>
/* The whole tail travels as one no-wrap unit (#523 round 6). */
.line-tail { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: var(--gx, 2px); }
.line-plus-wrap { display: inline-flex; align-items: center; }
/* Per-line `or` insert (#523 round 3): the same size/shape/mono font + pale-periwinkle fill
   as a real value connector chip, so revealing it reads as "drop another `or` term here".
   A ghost: invisible at rest → faint TEXT on row hover → solid background on its own hover. */
.line-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  min-width: var(--chip-w, 26px);
  padding: 0 6px;
  margin-left: 2px;
  border: none;
  border-radius: 4px;
  color: var(--vconn-fg, #1f6feb);
  background: transparent;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  text-transform: lowercase;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s ease, background 0.1s ease;
}
.bline:hover .line-plus { opacity: 0.55; }
.line-plus:hover { opacity: 1; background: var(--vconn-bg, #dbe7ff); color: var(--vconn-fg, #1f6feb); }
/* Inert while a draft chip is open — drafts are a singleton (#561). */
.line-plus.line-plus--off { opacity: 0; pointer-events: none; }
</style>
