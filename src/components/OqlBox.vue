<template>
  <div>
    <v-textarea
      v-model="queryString"
      autofocus
      variant="filled"
      clearable
      auto-grow
      rounded
      rows="3"
      placeholder="Enter your OQL here"
      @keydown.ctrl.enter="setQueryString"
      @keydown.meta.enter="setQueryString"
      @keydown.tab="tab"
      hide-details
    >
    </v-textarea>
    <div class="d-flex pr-4">
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        rounded="circle"
        size="small"
        @click="setQueryString"
        class=""
        style="margin-top:-22px;"
      >
        <v-icon>mdi-arrow-{{ props.arrowDirection }}</v-icon>
      </v-btn>

    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';

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