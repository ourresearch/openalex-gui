<template>
  <v-card class="compare-card d-flex pa-4" style="max-width: 80vw;">
    <div class="flex-grow-1">
      <div class="compare-card-title ml-n4 mt-n4 py-2 px-4"><a :href="prodUrl" target="_blank">Prod</a> <v-icon size="x-small" variant="plain" icon="mdi-open-in-new"></v-icon></div>
      <div class="compare-card-value">  
        <div v-if="Array.isArray(prodValue)">
          <b>count</b>: <span>{{ prodValue.length }}</span>
        </div>
        <div>
          <b>{{ field }}</b>:
          <span class="array-value">{{ prodValue === undefined ? "undefined" : JSON.stringify(prodValue, null, 2) }}</span>
        </div>
      </div>
    </div>
    <div class="flex-grow-1 pl-8">
      <div class="compare-card-title ml-n8 mt-n4 mr-n4 py-2 pl-8 pr-4"><a :href="waldenUrl" target="_blank">Walden</a> <v-icon size="x-small" variant="plain" icon="mdi-open-in-new"></v-icon></div>
      <div class="compare-card-value">
        <div v-if="Array.isArray(waldenValue)" :class="match ? 'text-green-lighten-2' : 'text-red-lighten-2'">
          <b>count</b>: <span>{{ waldenValue.length }}
          <v-chip v-if="comparisonType" size="x-small" variant="tonal">{{ comparisonType }}</v-chip></span>
        </div>
        <div v-if="Array.isArray(waldenValue)">
          <b>{{ field }}</b>:
          <span class="array-value">{{ waldenValue === undefined ? "undefined" : JSON.stringify(waldenValue, null, 2) }}</span>
        </div>
        <div v-else :class="match ? 'text-green-lighten-2' : 'text-red-lighten-2'">
          <b>{{ field }}</b>: 
          <span>{{ waldenValue === undefined ? "undefined" : waldenValue }} 
          <v-chip v-if="comparisonType" size="x-small" variant="tonal">{{ comparisonType }}</v-chip></span>
        </div>
      </div>
    </div>
  </v-card>
</template>


<script setup>
import { computed } from 'vue';

const {id, field, type, match, prodValue, waldenValue} = defineProps({
 id: String,
 field: String,
 type: String,
 match: Boolean,
 prodValue: Object,
 waldenValue: Object,
});

const prodUrl = computed(() => `https://api.openalex.org/works/${id}`);
const waldenUrl = computed(() => `https://api.openalex.org/v2/works/${id}`);

const comparisonType = computed(() => {
  const typeParts = type.split("|");
  return typeParts.length === 2 ? typeParts[1] : null;
});
  
</script>

<style scoped>
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
