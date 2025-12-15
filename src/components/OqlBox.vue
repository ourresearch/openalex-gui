<template>
  <div>
    <Textarea
      v-model="queryString"
      autofocus
      rows="3"
      placeholder="Enter your OQL here"
      @keydown.ctrl.enter="setQueryString"
      @keydown.meta.enter="setQueryString"
      @keydown.tab="tab"
    />
    <div class="flex justify-end pr-4">
      <Button
        size="icon"
        class="rounded-full -mt-5"
        @click="setQueryString"
      >
        <ArrowDown v-if="props.arrowDirection === 'down'" class="h-4 w-4" />
        <ArrowUp v-else-if="props.arrowDirection === 'up'" class="h-4 w-4" />
        <ArrowRight v-else class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

defineOptions({ name: 'OqlBox' });

const props = defineProps({
  canonicalQueryString: String,
  arrowDirection: {
    type: String,
    default: 'down'
  }
});

const store = useStore();
const createSearch = (query) => store.dispatch('search/createSearch', query);

const queryString = ref('');
const autocompleteSuggestions = ref([]);

// Computed
const cleanQueryString = computed(() => {
  const normalizeNewlines = (str) => str.replace(/\r\n|\r|\n/g, '\n');
  const removeRedundantSpaces = (str) => str.replace(/[^\S\n]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
  return removeRedundantSpaces(normalizeNewlines(queryString.value));
});

// Methods
async function setQueryString() {
  await createSearch(cleanQueryString.value);
}

function tab() {
  if (autocompleteSuggestions.value.length > 0) {
    replaceLastWord(autocompleteSuggestions.value[0]);
    return false;
  }
}

function replaceLastWord(newWord) {
  const words = queryString.value.split(' ');
  words.pop();
  words.push(newWord);
  queryString.value = words.join(' ') + ' ';
  nextTick(() => {
    const textArea = document.getElementsByTagName('textarea')[0];
    if (textArea) {
      textArea.focus();
      textArea.selectionStart = textArea.value.length;
    }
  });
}

// Watchers
watch(
  () => props.canonicalQueryString,
  (val) => {
    queryString.value = val;
  },
  { immediate: true }
);
</script>