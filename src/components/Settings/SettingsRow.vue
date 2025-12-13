<template>
  <div class="settings-row" :class="{ 'settings-row--full-width': fullWidth }">
    <div class="settings-row-content">
      <div class="settings-row-label">
        {{ label }}
      </div>
      <div v-if="description" class="settings-row-description" v-html="description">
      </div>
    </div>
    <div class="settings-row-control">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  description: String,
  fullWidth: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
  gap: 24px;
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row-content {
  flex: 1;
  min-width: 0;
}

.settings-row-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}

.settings-row-description {
  font-size: 13px;
  font-weight: 400;
  color: #6B6B6B;
  line-height: 1.4;
  margin-top: 2px;
}

.settings-row-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.settings-row--full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  
  .settings-row-control {
    margin-top: 6px;
    width: 100%;
  }
}

@media (max-width: 600px) {
  .settings-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .settings-row-control {
    margin-top: 12px;
    width: 100%;
  }
}
</style>
