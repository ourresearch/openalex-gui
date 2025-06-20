<template>
  <span>
    <!--  empty cell -->
    <template v-if="property.value === null">
      -
    </template>

    <template v-else-if="property.config.type==='string'">
      <!-- string: external ID -->
      <a v-if="String(property.value).startsWith('http')"
        :href="property.value"
        target="_blank"
        style="white-space: nowrap"
      >
        {{ property.value }}<v-icon color="primary" class="pl-1" size="x-small">mdi-open-in-new</v-icon>
      </a>

      <!-- string: list separated by "|" -->
      <template v-else-if="property.config.isList">
        <div v-for="(value, i) in property.value.split('|')" :key="value+i">{{ value }}</div>
      </template>

      <!-- generic string (including openalex ids) -->
      <template v-else>
        {{ filters.truncate(property.value) }}
      </template>
    </template>

    <!-- number -->
    <template v-else-if="property.config.type==='number'">
      <!-- number: currency -->
      <template v-if="property.config.isCurrency">
        ${{ filters.toPrecision(property.value) }}
      </template>

      <!-- number: year -->
      <template v-else-if="property.config.isYear">
        {{ property.value }}
      </template>

      <!-- number: ID -->
      <template v-else-if="property.config.isId">
        {{ property.value }}
      </template>

      <!-- number: float or integer -->
      <template v-else>
        {{ filters.toPrecision(property.value) }}
      </template>
    </template>

    <!-- boolean -->
    <template v-else-if="property.config.type==='boolean'">
      {{ property.value }}
    </template>

    <!-- entity object (just one) -->
    <template v-else-if="property.config.type==='object'">
      <router-link
          :to="'/'+property.value.id"
      >
          {{ property.value.display_name }}
        </router-link>
    </template>

    <!-- array -->
    <template v-else-if="property.config.type==='array'">
      <!-- array: entity objects-->
      <template v-if="isEntityArray(property.value)">
        <router-link
            v-for="(entity, i) in property.value"
            :key="'entity-'+i"
            :to="'/' + entity.id"
        >
          {{ entity?.display_name }}{{ i < property.value.length - 1 ? ', ' : '' }}
        </router-link>
      </template>

      <!-- array: primitives -->
      <template v-else>
        <span
            v-for="(item, i) in property.value"
            :key="'item-'+i"
        >
          {{ item }}{{ i < property.value.length - 1 ? ', ' : '' }}
        </span>
      </template>
    </template>

  </span>
</template>


<script setup>
import filters from '@/filters'

defineOptions({ name: 'ColumnValue' });

const{ property } = defineProps({
  property: Object,
}); 

function isEntityArray(arr) {
  return Array.isArray(arr) &&
         arr.length > 0 &&
         typeof arr[0] === 'object' &&
         arr[0] !== null &&
         'id' in arr[0] &&
         'display_name' in arr[0];
}
</script>