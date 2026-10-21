<template>
  <!-- Three suggested queries under the homepage search box (oxjob #1744). Picked once per page
       load from LANDING_SUGGESTIONS, so a refresh shows new ones. Clicking only emits `pick`:
       the host fills the box and submits. -->
  <div class="nl-landing-suggestions" role="group" aria-label="Suggested searches">
    <span class="nl-sugg-label">Try:</span>
    <button
      v-for="s in picks"
      :key="s.text"
      type="button"
      class="nl-sugg-pill"
      :disabled="disabled"
      :title="KIND_TITLE[s.kind]"
      @click="emit('pick', s.text)"
    >
      <v-icon size="14" class="nl-sugg-icon">{{ KIND_ICON[s.kind] }}</v-icon>
      <span class="nl-sugg-text">{{ s.text }}</span>
    </button>
  </div>
</template>

<script setup>
import { pickSuggestions } from '@/components/NlSearch/nlLandingSuggestions';

defineOptions({ name: 'NlLandingSuggestions' });

defineProps({
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['pick']);

const KIND_ICON = {
  question: 'mdi-creation-outline',
  keyword: 'mdi-magnify',
  review: 'mdi-clipboard-text-search-outline',
};
const KIND_TITLE = {
  question: 'Ask a question',
  keyword: 'Search by keywords',
  review: 'Systematic review search',
};

// Not reactive on purpose: picked once per page load, so a refresh rotates them.
const picks = pickSuggestions();
</script>

<style scoped>
.nl-landing-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.3;
}
.nl-sugg-label {
  color: rgba(0, 0, 0, 0.5);
  margin-right: 2px;
}
.nl-sugg-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 5px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  background: #fff;
  color: rgba(0, 0, 0, 0.72);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}
.nl-sugg-pill:hover:not(:disabled),
.nl-sugg-pill:focus-visible {
  border-color: rgba(0, 0, 0, 0.3);
  color: rgba(0, 0, 0, 0.9);
  background: rgba(0, 0, 0, 0.02);
  outline: none;
}
.nl-sugg-pill:disabled {
  cursor: default;
  opacity: 0.5;
}
.nl-sugg-icon {
  flex: none;
  color: rgba(0, 0, 0, 0.4);
}
.nl-sugg-text {
  min-width: 0;
}
</style>
