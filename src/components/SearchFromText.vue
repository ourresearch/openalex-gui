<template>
  <v-textarea
    v-model="q"
    :disabled="isNatLangLoading || disabled"
    autofocus
    auto-grow
    variant="filled"
    rounded
    hide-details
    rows="2"
    :placeholder="placeholder"
    @keydown.enter.exact.prevent="applyQ"
    :class="{oql: selectedInputType === 'oql'}"
  >
    <template v-slot:append>
      <v-btn
        size="large" icon style="margin-top: -11px; margin-right: -13px;"
        @click="applyQ"
        :disabled="isNatLangLoading"
        :loading="isNatLangLoading"
      >
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </template>
    <template v-if="naturalLanguage" v-slot:prepend-inner>
      <v-menu class="rounded-lg" max-width="300" location="bottom">
        <template v-slot:activator="{ props }">
          <v-btn
            size="large"
            v-bind="props"
            style="margin: -11px 0 0 -19px; min-width: 1px; border-radius: 10px;"
            class="pl-1 pr-0"
            variant="text"
          >
            <v-icon>{{ inputTypes.find(it => it.id === selectedInputType).icon }}</v-icon>
            <v-icon>mdi-menu-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="inputType in inputTypes"
            :key="inputType.id"
            :active="selectedInputType === inputType.id"
            @click="selectedInputType = inputType.id"
          >
            <v-icon>{{ inputType.icon }}</v-icon>
            
            <v-list-item-title>{{ inputType.displayName }}</v-list-item-title>
            <v-list-item-subtitle class="white-space-normal">
              {{ inputType.description }}
            </v-list-item-subtitle>

          </v-list-item>

        </v-list>
      </v-menu>
    </template>
  </v-textarea>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

defineOptions({
  name: 'SearchFromText',
});

defineProps({
  disabled: Boolean,
  selected: String,
  naturalLanguage: Boolean,
});

const store = useStore();

// Local state
const q = ref('');
const isNatLangLoading = ref(false);
const selectedInputType = ref('oql');

const inputTypes = [
  {
    id: 'natural-language',
    displayName: 'Natural language',
    icon: 'mdi-message-text',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    id: 'oql',
    displayName: 'OQL',
    icon: 'mdi-code-parentheses-box',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
];

// Vuex getters
const queryOql = computed(() => store.getters['search/queryOql']);

// Computed placeholder
const placeholder = computed(() =>
  selectedInputType.value === 'natural-language'
    ? 'Enter natural language query'
    : 'Enter OQL query'
);

// Vuex actions
const createSearchFromOql = (oql) => store.dispatch('search/createSearchFromOql', oql);
const createSearchFromQuery = (query) => store.dispatch('search/createSearchFromQuery', query);

// Methods
function applyQ() {
  return selectedInputType.value === 'natural-language' ? applyNatLang() : applyOql();
}

async function applyNatLang() {
  isNatLangLoading.value = true;
  console.log('applyNatLang', q.value);
  const myUrl = `https://api.openalex.org/text/oql?natural_language=${q.value}`;
  try {
    const resp = await axios.get(myUrl);
    createSearchFromQuery(resp.data);
  } catch (err) {
    console.error('Error fetching natural language query:', err);
  }
  isNatLangLoading.value = false;
}

function applyOql() {
  isNatLangLoading.value = true;
  createSearchFromOql(q.value);
  isNatLangLoading.value = false;
}

// Watchers
watch(
  () => queryOql.value,
  (newVal) => {
    if (selectedInputType.value === 'oql') {
      q.value = newVal;
    }
  },
  { immediate: true }
);

watch(
  () => selectedInputType.value,
  () => {
    q.value = selectedInputType.value === 'natural-language' ? '' : queryOql.value;
  }
);
</script>


<style lang="scss">
textarea {
  //padding-top: 5px !important;
  margin-bottom: 15px;
}

.v-text-field--rounded {
  border-radius: 15px !important;
}

.oql {
  textarea {
    font-family: "Consolas", monospace !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
  }
}
</style>