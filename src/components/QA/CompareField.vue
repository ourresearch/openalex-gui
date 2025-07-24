<template>
  <div class="compare-card">
    <div :class="['pa-6 d-flex align-center text-white', match ? 'bg-green-darken-1' : 'bg-red-darken-1']" style="font-size: 20px">
      <code class="mr-2">{{ field }}:</code>

      <span>
        <span class="font-weight-bold">{{ displayValue(prodValue) }}</span>
        <v-tooltip text="Prod" location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="x-small" :color="match ? 'green-lighten-3' : 'red-lighten-4'" class="count-icon" icon="mdi-factory"></v-icon>
          </template>
        </v-tooltip>
        
        <span class="mx-3">vs.</span>

        <span class="font-weight-bold">{{ displayValue(waldenValue) }}</span>
        <v-tooltip text="Walden" location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" size="x-small" :color="match ? 'green-lighten-3' : 'red-lighten-4'" class="count-icon" icon="mdi-pine-tree-variant-outline"></v-icon>
          </template>
        </v-tooltip>
      </span>
      <v-chip v-if="comparisonType" size="default" variant="tonal" class="ml-2">{{ comparisonType }}</v-chip>
    
      <v-spacer></v-spacer>
      
      <div class="text-body-2 text-white ml-8 cursor-pointer" @click="onShowComparison">
        Full Comparison 
        <v-icon size="x-small" variant="plain" icon="mdi-chevron-right"></v-icon>
      </div>
    </div>
    
    <div v-if="isObject(prodValue) || isObject(waldenValue)" class="d-flex pb-4">
      <div class="flex-grow-1">
        <div class="compare-card-title py-2 px-4">
          <a :href="prodUrl" target="_blank">Prod</a>
          <v-icon size="x-small" variant="plain" class="ml-1" icon="mdi-open-in-new"></v-icon>
        </div>
        <div class="compare-card-value px-4">

          <vue-json-pretty v-if="isObject(prodValue)" :data="prodValue"></vue-json-pretty>
          <span v-else class="array-value">
            <code>{{ prodDisplayValue }}</code>
          </span>
        </div>
      </div>
      
      <div class="flex-grow-1 pl-8">
        <div class="compare-card-title ml-n8 py-2 pl-8 pr-4">
          <a :href="waldenUrl" target="_blank">Walden</a> 
          <v-icon size="x-small" variant="plain" class="ml-1" icon="mdi-open-in-new"></v-icon>
        </div>
        <div class="compare-card-value px-4">
          <vue-json-pretty v-if="isObject(waldenValue)" :data="waldenValue"></vue-json-pretty>
          <span v-else class="array-value">
            <code>{{ waldenDisplayValue }}</code>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

const {id, field, type, match, prodValue, waldenValue} = defineProps({
 id: String,
 field: String,
 type: String,
 match: Boolean,
 prodValue: null,
 waldenValue: null,
});

const emit = defineEmits(['show-comparison']);

const prodUrl = computed(() => `https://api.openalex.org/works/${id}`);
const waldenUrl = computed(() => `https://api.openalex.org/v2/works/${id}`);

const displayValue = (value) => {
  if (value === undefined) {
    return "undefined";
  }
  if (value === null) {
    return "null";
  }

  return getShortValue(value);
}

const prodDisplayValue = computed(() => {
  return displayValue(prodValue);
});

const waldenDisplayValue = computed(() => {
  return displayValue(waldenValue);
});

const comparisonType = computed(() => {
  const typeParts = type.split("|");
  return typeParts.length === 2 ? typeParts[1] : null;
});

const onShowComparison = () => {
  emit('show-comparison', id);
};

function isObject(obj) {
  if (Array.isArray(obj)) {
    return true;
  } else if (typeof obj === 'object' && obj !== null) {
    return true;
  } else {
    return false;
  }
}

const getShortValue = (value) => {
  if (Array.isArray(value)) {
    return `${value.length}`;
  } else if (typeof value === 'object' && value !== null) {
    return `${Object.keys(value).length} keys`;
  } else {
    return value;
  }
}
</script>

<style scoped>
.compare-card {
  background-color: white;
}
.compare-card .count-icon {
  margin-left: 2px;
  margin-top: -4px
}
.compare-card a {
  color: inherit;
  text-decoration: none;
}
.compare-card-title {
  font-weight: bold;
  font-size: 12px;
  padding-bottom: 8px;
  margin-bottom: 8px;
  background-color: #f5f5f5;
}
.compare-card-value {
  max-height: 60vh;
  max-width: 30vw;
  overflow: auto;
}
.array-value {
  white-space: pre;
  font-size: 12px;
  line-height: 1;
}
</style>
