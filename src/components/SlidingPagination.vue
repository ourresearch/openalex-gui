<template>
  <nav
    v-if="lastReachablePage > 1"
    class="sliding-pagination d-flex align-center justify-center ga-1"
    role="navigation"
    aria-label="Pagination Navigation"
  >
    <v-btn
      icon="mdi-chevron-left"
      variant="text"
      size="small"
      rounded="circle"
      :disabled="modelValue <= 1"
      aria-label="Previous page"
      @click="goTo(modelValue - 1)"
    />

    <v-btn
      v-for="p in windowPages"
      :key="p"
      :variant="p === modelValue ? 'flat' : 'text'"
      :color="p === modelValue ? 'primary' : undefined"
      size="small"
      rounded="circle"
      min-width="36"
      :aria-label="`Go to page ${p}`"
      :aria-current="p === modelValue ? 'page' : undefined"
      @click="goTo(p)"
    >
      {{ p }}
    </v-btn>

    <v-btn
      icon="mdi-chevron-right"
      variant="text"
      size="small"
      rounded="circle"
      :disabled="modelValue >= lastReachablePage"
      aria-label="Next page"
      @click="goTo(modelValue + 1)"
    />
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useDisplay } from 'vuetify';

const props = defineProps({
  modelValue: { type: Number, required: true },
  count: { type: Number, default: 0 },
  perPage: { type: Number, default: 10 },
  windowSize: { type: Number, default: null },
  apiOffsetCap: { type: Number, default: 10000 },
});

const emit = defineEmits(['update:modelValue']);

const { smAndDown } = useDisplay();

const effectiveWindowSize = computed(() => {
  if (props.windowSize) return props.windowSize;
  return smAndDown.value ? 5 : 10;
});

const lastReachablePage = computed(() => {
  const perPage = Number(props.perPage) > 0 ? Number(props.perPage) : 10;
  const count = Number(props.count) > 0 ? Number(props.count) : 0;
  const maxPage = Math.max(1, Math.floor(props.apiOffsetCap / perPage));
  const countPage = Math.ceil(count / perPage);
  if (!Number.isFinite(countPage) || countPage < 1) return 1;
  return Math.min(countPage, maxPage);
});

const windowPages = computed(() => {
  try {
    const last = lastReachablePage.value;
    const size = Math.min(effectiveWindowSize.value, last);
    if (size < 1) return [];
    const current = Number.isFinite(props.modelValue) ? props.modelValue : 1;
    const half = Math.floor(size / 2);
    let start = current - half;
    const maxStart = last - size + 1;
    if (start < 1) start = 1;
    if (start > maxStart) start = maxStart;
    return Array.from({ length: size }, (_, i) => start + i);
  } catch (_e) {
    return [];
  }
});

function goTo(page) {
  if (page < 1 || page > lastReachablePage.value) return;
  if (page === props.modelValue) return;
  emit('update:modelValue', page);
}
</script>
