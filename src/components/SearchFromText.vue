<template>
  <div class="relative">
    <div v-if="naturalLanguage" class="absolute left-2 top-2 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" class="h-8 px-2">
            <component :is="getIcon(inputTypes.find(it => it.id === selectedInputType).icon)" class="h-4 w-4" />
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-[300px]">
          <DropdownMenuItem
            v-for="inputType in inputTypes"
            :key="inputType.id"
            @click="selectedInputType = inputType.id"
          >
            <component :is="getIcon(inputType.icon)" class="h-4 w-4 mr-2" />
            <div>
              <div class="font-medium">{{ inputType.displayName }}</div>
              <div class="text-xs text-muted-foreground">{{ inputType.description }}</div>
            </div>
            <Check v-if="selectedInputType === inputType.id" class="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Textarea
      v-model="q"
      :disabled="isNatLangLoading || disabled"
      autofocus
      rows="2"
      :placeholder="placeholder"
      @keydown.enter.exact.prevent="applyQ"
      :class="['pr-12', naturalLanguage ? 'pl-16' : '', selectedInputType === 'oql' ? 'font-mono text-sm' : '']"
    />
    <Button
      variant="ghost"
      size="icon"
      class="absolute right-2 top-2"
      @click="applyQ"
      :disabled="isNatLangLoading"
    >
      <Loader2 v-if="isNatLangLoading" class="h-5 w-5 animate-spin" />
      <Search v-else class="h-5 w-5" />
    </Button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';

import { Search, Loader2, ChevronDown, Check, MessageSquareText, Code } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

// Map mdi icons to lucide icons
const iconMap = {
  'mdi-message-text': MessageSquareText,
  'mdi-code-parentheses-box': Code,
};

function getIcon(mdiIcon) {
  return iconMap[mdiIcon] || Code;
}

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