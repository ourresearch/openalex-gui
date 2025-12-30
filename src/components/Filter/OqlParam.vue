<template>
  <span class="oql-param">
    <!-- sort by [value] -->
    <template v-if="param.type === 'sort'">
      <span class="oql-key mr">sort by</span><span class="oql-value">{{ param.value }}</span>
    </template>

    <!-- sample [value] -->
    <template v-else-if="param.type === 'sample'">
      <span class="oql-key mr">sample</span><span class="oql-value">{{ param.value }}</span>
    </template>

    <!-- group by [value] -->
    <template v-else-if="param.type === 'group_by'">
      <span class="oql-key mr">group by</span><span class="oql-value">{{ param.value }}</span>
    </template>

    <!-- include xpac (all bold) -->
    <template v-else-if="param.type === 'include_xpac'">
      <span class="oql-value">include xpac</span>
    </template>

    <!-- Fallback -->
    <template v-else>
      <span class="oql-key mr">{{ param.type }}</span><span class="oql-value">{{ param.value }}</span>
    </template>
  </span>
</template>

<script setup>
const props = defineProps({
  param: {
    type: Object,
    required: true,
  },
});
</script>

<style lang="scss" scoped>
.oql-param {
  // Container styling if needed
}

.mr {
  margin-right: 0.35em;
}

.oql-key {
  // Regular weight
}

.oql-value {
  font-weight: 600;
}
</style>
