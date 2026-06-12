<template>
  <!-- Left-aligned pill tabs that pick the search mode (oxjob #440 round 2).
       Replaces the old SerpModeMenu dropdown. Two tabs: Basic / Advanced (the
       standalone OQL mode was folded into Advanced, oxjob #441). Basic is disabled
       (with a tooltip) when the current query can't be shown as basic chips. -->
  <div class="serp-mode-tabs-wrap d-flex align-center">
    <div class="serp-mode-tabs" role="tablist">
    <template v-for="opt in options" :key="opt.value">
      <v-tooltip
        v-if="opt.value === 'basic' && basicDisabled"
        location="bottom"
        text="This query is too complex to show as basic filters."
      >
        <template #activator="{ props: tipProps }">
          <span v-bind="tipProps">
            <v-btn
              class="pill"
              size="small"
              variant="text"
              rounded="pill"
              disabled
            >{{ opt.label }}</v-btn>
          </span>
        </template>
      </v-tooltip>
      <!-- Selected = quiet gray, unselected = clear (#440 r8 — the old primary-
           black pill read as a heavyweight action button, not a tab). -->
      <v-btn
        v-else
        class="pill"
        :class="{ 'pill--active': opt.value === modelValue }"
        size="small"
        variant="text"
        rounded="pill"
        role="tab"
        :aria-selected="opt.value === modelValue"
        @click="select(opt.value)"
      >{{ opt.label }}</v-btn>
    </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SerpModeTabs' });

const props = defineProps({
  // 'basic' | 'advanced'
  modelValue: { type: String, default: 'basic' },
  // True when the current query can't be represented as basic chips → Basic is
  // greyed out with a tooltip.
  basicDisabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const options = [
  { value: 'basic', label: 'Basic' },
  { value: 'advanced', label: 'Advanced' },
];

function select(value) {
  if (value === props.modelValue) return;
  emit('update:modelValue', value);
}
</script>

<style scoped>
.serp-mode-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 999px;
  padding: 2px;
}
.pill {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  min-width: 0;
  height: 26px;
}
.pill--active {
  font-weight: 600;
  background: rgba(0, 0, 0, 0.09);
  color: rgba(0, 0, 0, 0.87);
}
</style>
