<template>
  <!-- Rendered inside a teleported v-tooltip overlay, so scoped CSS can't
       reach it — styles are inline on purpose. -->
  <div :style="wrapStyle">
    <div :style="primaryRowStyle">
      <v-icon v-if="icon" :icon="icon" size="x-small" :style="iconStyle" />
      <span :style="primaryStyle">{{ primary || '—' }}</span>
    </div>
    <div v-if="secondary" :style="secondaryStyle">{{ secondary }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '' },
  primary: { type: String, default: '' },
  secondary: { type: String, default: '' },
});

const wrapStyle = { maxWidth: '320px' };
const primaryRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};
const iconStyle = { flexShrink: 0 };
const primaryStyle = {
  fontSize: '13px',
  lineHeight: '1.35',
  wordBreak: 'break-word',
};
const secondaryStyle = {
  marginTop: '3px',
  fontFamily: "'SF Mono', Monaco, 'Courier New', monospace",
  fontSize: '12px',
  color: 'rgba(0, 0, 0, 0.5)',
  wordBreak: 'break-all',
};
</script>
