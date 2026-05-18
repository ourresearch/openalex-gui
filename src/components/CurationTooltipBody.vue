<template>
  <!-- Rendered inside a teleported v-tooltip overlay, so scoped CSS can't
       reach it — styles are inline on purpose. -->
  <div :style="wrapStyle">
    <div :style="primaryStyle">{{ primary || '—' }}</div>
    <div v-if="secondary" :style="secondaryStyle">{{ secondary }}</div>
  </div>
</template>

<script setup>
defineProps({
  primary: { type: String, default: '' },
  secondary: { type: String, default: '' },
});

const wrapStyle = { maxWidth: '420px' };
const primaryStyle = {
  fontSize: '13px',
  lineHeight: '1.35',
  wordBreak: 'break-word',
};
const secondaryStyle = {
  marginTop: '3px',
  fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
  fontSize: '12px',
  color: 'rgba(255, 255, 255, 0.65)',
  wordBreak: 'break-all',
};
</script>
