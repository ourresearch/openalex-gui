<template>
  <div class="code-block" :class="{ 'code-block--diag': diag }">
    <div v-for="(line, i) in lines" :key="i" class="code-block__row">
      <span class="code-block__ln" aria-hidden="true">{{ i + 1 }}</span>
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
});

const lines = computed(() => String(props.code).split("\n"));
</script>

<style scoped>
.code-block {
  font-family: "Roboto Mono", monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  background: rgba(0, 0, 0, 0.035);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 0;
  border-radius: 6px;
  overflow-x: auto;
}
.code-block__row {
  display: flex;
  align-items: flex-start;
}
/* Gutter: right-aligned, unselectable so copying the block skips the numbers. */
.code-block__ln {
  flex: 0 0 auto;
  width: 2.4em;
  padding: 0 12px 0 14px;
  text-align: right;
  color: rgba(0, 0, 0, 0.3);
  user-select: none;
  -webkit-user-select: none;
}
.code-block__text {
  flex: 1 1 auto;
  padding-right: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}
.code-block--diag {
  color: #8a5a00;
  background: rgba(178, 106, 0, 0.06);
  border-color: rgba(178, 106, 0, 0.16);
}
.code-block--diag .code-block__ln {
  color: rgba(138, 90, 0, 0.45);
}
</style>
