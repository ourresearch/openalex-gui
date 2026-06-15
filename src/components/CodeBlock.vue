<template>
  <div
    class="code-block"
    :class="{ 'code-block--diag': diag, 'code-block--nolines': !lineNumbers }"
    :style="maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight, overflowY: 'auto' } : null"
  >
    <div v-for="(line, i) in lines" :key="i" class="code-block__row">
      <span v-if="lineNumbers" class="code-block__ln" aria-hidden="true">{{ i + 1 }}</span>
      <span class="code-block__text">{{ line }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

defineOptions({ name: "CodeBlock" });

const props = defineProps({
  code: { type: String, default: "" },
  // Amber "diagnostic" styling variant.
  diag: { type: Boolean, default: false },
  // Show the line-number gutter (default). Turn off for placeholders / one-liners.
  lineNumbers: { type: Boolean, default: true },
  // Optional vertical scroll cap, e.g. "320px" or 320.
  maxHeight: { type: [String, Number], default: null },
});

const lines = computed(() => String(props.code).split("\n"));
</script>

<style scoped>
/*
 * Site-wide code block. Line numbers live in a gutter separated from the code
 * by a thin vertical rule + subtle gutter tint (shadcn / Tailwind convention),
 * all inside one rounded container. Per-line flex layout keeps the rule and the
 * numbers aligned even when a long line wraps; the gutter is user-select:none so
 * copying the block grabs only the code.
 */
.code-block {
  font-family: "Roboto Mono", monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  background: rgba(0, 0, 0, 0.025);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px 0;
  overflow-x: auto;
}
.code-block__row {
  display: flex;
  align-items: stretch;
}
/* Gutter: dimmed, right-aligned, faint tint + a continuous vertical rule. */
.code-block__ln {
  flex: 0 0 auto;
  min-width: 3em;
  padding: 0 12px 0 14px;
  text-align: right;
  color: rgba(0, 0, 0, 0.32);
  background: rgba(0, 0, 0, 0.022);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  user-select: none;
  -webkit-user-select: none;
}
.code-block__text {
  flex: 1 1 auto;
  padding: 0 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
.code-block--nolines .code-block__text {
  padding-left: 14px;
}

/* Amber diagnostic variant. */
.code-block--diag {
  color: #8a5a00;
  background: rgba(178, 106, 0, 0.05);
  border-color: rgba(178, 106, 0, 0.16);
}
.code-block--diag .code-block__ln {
  color: rgba(138, 90, 0, 0.5);
  background: rgba(178, 106, 0, 0.06);
  border-right-color: rgba(178, 106, 0, 0.2);
}
</style>
