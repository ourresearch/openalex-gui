<template>
  <!-- Three suggested queries under the homepage search box (oxjob #1744). Picked once per page
       load from LANDING_SUGGESTIONS, so a refresh shows new ones. Clicking only emits `pick`:
       the host fills the box and submits. -->
  <!-- One per line, an icon and the words, no chrome (ChatGPT's start page; Jason, Wed 21 Oct). -->
  <div class="nl-landing-suggestions" role="group" aria-label="Suggested searches">
    <button
      v-for="s in picks"
      :key="s.text"
      type="button"
      class="nl-sugg-pill"
      :disabled="disabled"
      :title="KIND_TITLE[s.kind]"
      @click="emit('pick', s.text)"
    >
      <v-icon size="20" class="nl-sugg-icon">{{ KIND_ICON[s.kind] }}</v-icon>
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
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
  line-height: 1.4;
}
.nl-sugg-pill {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: rgba(0, 0, 0, 0.75);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}
.nl-sugg-pill:hover:not(:disabled),
.nl-sugg-pill:focus-visible {
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.92);
  outline: none;
}
.nl-sugg-pill:disabled {
  cursor: default;
  opacity: 0.5;
}
.nl-sugg-icon {
  flex: none;
  color: rgba(0, 0, 0, 0.5);
}
.nl-sugg-text {
  min-width: 0;
}
</style>
