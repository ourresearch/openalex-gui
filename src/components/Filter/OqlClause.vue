<template>
  <span class="oql-clause">
    <!-- Boolean clause: it's [value] -->
    <template v-if="clause.type === 'boolean'">
      <span class="oql-syntax mr">it's</span><span class="oql-value">{{ clause.displayValue }}</span>
    </template>

    <!-- Range clause: key is/≥/≤ value -->
    <template v-else-if="clause.type === 'range'">
      <span class="oql-key mr">{{ clause.displayName }}</span><span :class="['mr', clause.operator === 'is' ? 'oql-keyword' : 'oql-operator']">{{ clause.operator }}</span><span class="oql-value">{{ clause.displayValue }}</span>
    </template>

    <!-- Search clause: key includes "value" -->
    <template v-else-if="clause.type === 'search'">
      <span class="oql-key mr">{{ clause.displayName }}</span><span class="oql-operator mr">includes</span><span class="oql-quote">"</span><span class="oql-value">{{ clause.value }}</span><span class="oql-quote">"</span>
    </template>

    <!-- Select clause: key is/is not value(s) -->
    <template v-else-if="clause.type === 'selectEntity'">
      <span class="oql-key mr">{{ clause.displayName }}</span><span class="oql-keyword mr">{{ clause.operator }}</span><template v-for="(val, idx) in clause.values" :key="idx"><span v-if="idx > 0" class="oql-syntax ml mr">{{ clause.connector }}</span><span v-if="idx > 0 && val.isNegated" class="oql-operator mr">not</span><span v-if="val.displayValue" class="oql-value">{{ val.displayValue }}</span><a v-if="val.shortId"
            href="javascript:void(0)" 
            class="oql-entity-link ml"
            @click="openEntity(val.shortId, val.entityType)"
          >[{{ val.shortId }}]</a></template>
    </template>

    <!-- Fallback -->
    <template v-else>
      <span class="oql-key mr">{{ clause.displayName || clause.key }}</span><span class="oql-operator mr">=</span><span class="oql-value">{{ clause.value }}</span>
    </template>
  </span>
</template>

<script setup>
import { useStore } from 'vuex';

const props = defineProps({
  clause: {
    type: Object,
    required: true,
  },
});

const store = useStore();

function openEntity(shortId, entityType) {
  const fullId = `https://openalex.org/${shortId}`;
  store.commit('setZoomId', fullId);
}
</script>

<style lang="scss" scoped>
.oql-clause {
  // Container styling if needed
}

.mr {
  margin-right: 0.35em;
}

.ml {
  margin-left: 0.35em;
}

.oql-key {
  // Regular weight
}

.oql-operator {
  font-weight: 600;
}

.oql-keyword {
  // Normal weight, black color (for 'is', 'is not')
}

.oql-value {
  font-weight: 600;
}

.oql-syntax {
  color: #888;
}

.oql-quote {
  color: #888;
}

.oql-entity-link {
  color: #888;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
}
</style>
