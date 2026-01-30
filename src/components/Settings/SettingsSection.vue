<template>
  <div class="settings-section">
    <h3 v-if="title" class="settings-section-header">
      {{ title }}
    </h3>
    <div class="settings-card">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String
})
</script>

<style scoped>
.settings-section {
  margin-top: 40px;
}

.settings-section:first-child {
  margin-top: 0;
}

.settings-section-header {
  font-size: 16px;
  font-weight: 500;
  color: #1A1A1A;
  margin-bottom: 12px;
}

.settings-card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  overflow: visible;
}
</style>
