<template>
  <div>
    <v-card class="rounded-o">
      <v-skeleton-loader v-if="isLoading" type="list-item-three-line@8" />
      
      <div v-else style="width: 100%;">
        <div class="header pa-4 pb-1 bg-grey-lighten-3" style="width: 100%;">
          <div class="d-flex" style="width: 100%;">
            <div style="flex: 1;" class="mr-4">
              <div class="card-title text-h6 mb-0">
                {{ prodResults.title }}
              </div>
              <div class="text-grey-darken-2 mt-1" style="font-size: 12px;">{{ id }}</div>
            </div>
            <v-btn-toggle
              v-model="mode"
              color="blue"
              variant="outlined"
              density="compact"
              mandatory
              class="mr-2 mode-toggle"
              style="flex-shrink: 0;"
            >
              <v-btn value="diff">Diff</v-btn>
              <v-btn value="json">JSON</v-btn>
            </v-btn-toggle>
          </div>
          <table class="header-table" width="100%">
            <thead>
              <tr class="text-h6 mb-2 text-grey-darken-3" style="border-bottom: 1px solid #f5f5f5;">
                <th>
                  <a :href="`https://api.openalex.org/works/${id}`" target="_blank">
                    Prod
                    <v-icon size="x-small" icon="mdi-open-in-new"></v-icon>
                  </a>
                </th>
                <th>
                  <a :href="`https://api.openalex.org/v2/works/${id}`" target="_blank">
                    Walden
                    <v-icon size="x-small" icon="mdi-open-in-new"></v-icon>
                  </a>
                </th>
              </tr>
            </thead>
          </table>       
        </div>

        <!-- Diff -->
        <div v-if="mode === 'diff'" class="diff-table-container">
          <table class="diff-table pa-4" style="table-layout: fixed; max-width: 100%;">
            <tbody>
              <tr v-for="field in Object.keys(schema.works)" :key="field">
                <td
                  v-for="(data, index) in [prodResults, waldenResults]"
                  :key="index"
                  :class="index === 1 ? getDiffCellClass(field) : ''"
                  style="word-wrap: break-word; overflow-wrap: break-word;"
                >
                  <div v-if="data" class="d-flex">
                    <v-icon 
                      size="small"
                      class="mr-1 expand-icon"
                      :style="{visibility: isObject(getFieldValue(data, field)) ? 'visible' : 'hidden'}"
                      @click="toggleExpanded(field)" 
                      :icon="expandedFields.has(field) ? 'mdi-menu-down' : 'mdi-menu-right'"
                    ></v-icon>
                    <span>
                      <code class="font-weight-bold mr-2">{{ field }}:</code>
                      <template v-if="isObject(getFieldValue(data, field)) && !expandedFields.has(field)">
                        <code style="white-space: pre-wrap">{{ getShortValue(getFieldValue(data, field)) }}</code>
                      </template>
                      <code v-else style="white-space: pre-wrap">{{ displayValue(getFieldValue(data, field)) }}</code>
                    </span>
                  </div>
                  <div v-else>404</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- JSON -->
        <div v-else-if="mode === 'json'" class="d-flex">
          <div class="json-container">  
            <vue-json-pretty :data="prodResults"></vue-json-pretty>
          </div>
          <div class="json-container">  
            <vue-json-pretty :data="waldenResults"></vue-json-pretty>
          </div>
        </div>
      </div>
    </v-card>
  </div>

</template>

<script setup>

import { ref, reactive, computed, watch, onMounted } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

import { schema } from '@/qa/apiComparison';

defineOptions({ name: 'CompareWork'});

const { id, prodResults, waldenResults, matches, compareView } = defineProps({
  id: String,
  prodResults: null,
  waldenResults: null,
  matches: Object,
  compareView: { type: String, default: 'diff' }
});

const emit = defineEmits(['update:compareView']);

const mode = ref(compareView);
const expandedFields = reactive(new Set());

const isLoading = computed(() => !prodResults);

const toggleExpanded = (field) => {
  if (expandedFields.has(field)) {
    expandedFields.delete(field)
  } else {
    expandedFields.add(field)
  }
};

const getFieldValue = (obj, field) => {
  if (!obj) { return undefined; }
  const keys = field.split(".");
  let value = obj;
  for (let i = 0; i < keys.length; i++) {
    value = value !== null && typeof value === "object" ? value[keys[i]] : undefined;
    if (value === undefined) {
      return undefined;
    }
  }
  return value;
};

const getShortValue = (value) => {
  if (Array.isArray(value)) {
    return `${value.length} items`;
  } else if (typeof value === 'object' && value !== null) {
    return `${Object.keys(value).length} keys`;
  } else {
    return displayValue(value);
  }
}

function isObject(obj) {
  if (Array.isArray(obj)) {
    return true;
  } else if (typeof obj === 'object' && obj !== null) {
    return true;
  } else {
    return false;
  }
}

function getDiffCellClass(field) {
  const prodValue = getFieldValue(prodResults, field);
  const waldenValue = getFieldValue(waldenResults, field);

  if ((prodValue === null || prodValue === undefined) && (waldenValue !== null && waldenValue !== undefined)) {
    return 'bg-green-lighten-4';
  }

  if (!matches[field]) {
    return 'bg-red-lighten-4';
  }

  return '';
}

const displayValue = (value) => {
  if (value === undefined) {
    return "missing";
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value, null, 2)
  }
  return value;
};

watch(mode, (newMode) => {
  emit('update:compareView', newMode);
});

</script>


<style scoped>
.card-title {

}
.header a { 
  color: inherit;
  text-decoration: none;
}
.mode-toggle {
  width: 135px;
}
.header-table a {
  font-size: 14px;
}
.header-table th {
  text-align: left;
  width: 50%
}
.diff-table-container {
  overflow-y: scroll;
  overscroll-behavior: contain;
  max-height: 70vh;
}
.json-container {
  overflow-y: scroll;
  overscroll-behavior: contain;
  max-height: 70vh;
  padding: 8px 16px;
  width: 50%;
}
.diff-table {
  width: 100%;
  table-layout: fixed;
  max-width: 100%;
}
.diff-table th {
  border-bottom: 1px solid #ccc;
  padding-bottom: 8px;
  text-align: left;
}
.diff-table tr {
  width: 100%;
}
.diff-table td {
  width: 50%;
  vertical-align: top;
  margin: 0 40px 0 0;
  padding: 4px;
  padding-right: 40px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
}
.diff-table tbody tr:first-child td {
  padding-top: 4px;
}
.expand-icon {
  cursor: pointer;
}
code {
  white-space: pre-wrap; /* Preserves whitespace and allows wrapping */
}
</style>
