<template>
  <v-card class="compare-card rounded-o">
    <v-card-title :class="['px-6 py-3', match ? 'bg-green-lighten-4' : 'bg-red-lighten-4']" style="font-size: 20px; border-top-left-radius: 15px; border-top-right-radius: 15px;">
      <code>{{ field }}</code> <span v-if="isCountedField" class="font-weight-regular">(count)</span>
      <v-chip v-if="comparisonType" size="default" variant="tonal" class="ml-2">{{ comparisonType }}</v-chip>

    </v-card-title>

    <v-card-text class="pb-2 pt-6">
      <div class="d-flex align-center justify-center">
        <div class="compare-value-block">
          <div class="compare-value">{{ displayValue(prodValue) }}</div>
          <div class="compare-value-label">
            <v-icon size="small" color="grey" class="count-icon" icon="mdi-factory"></v-icon> Prod
          </div>
        </div>

        <span class="mx-6 text-grey-darken-1">vs.</span>

        <div class="compare-value-block">
          <div class="compare-value">{{ displayValue(waldenValue) }}</div>
          <div class="compare-value-label">
            <v-icon size="small" color="grey" class="count-icon" icon="mdi-pine-tree-variant-outline"></v-icon> Walden
          </div>
        </div>
      </div>

        
    </v-card-text>
    
    <v-card-actions>
      <v-spacer></v-spacer>
      <div @click="onShowComparison" class="text-grey-dareken-2 cursor-pointer" style="font-size: 14px;">
        Compare
        <v-icon size="small" class="ml-n1" variant="plain" icon="mdi-chevron-right"></v-icon>
      </div>
    </v-card-actions>
 
    <!--
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
    -->
  </v-card>
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
    return "missing";
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

const isCountedField = computed(() => {
  return type.split("|").length === 2 && type.split("|")[0] === "array";
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
.compare-value-block {
  text-align: center;
}
.compare-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
  font-size: 28px;
}
.compare-value-label {
  text-transform: uppercase;
  color: #757575;
  font-size: 12px;
}
.array-value {
  white-space: pre;
  font-size: 12px;
  line-height: 1;
}
</style>
