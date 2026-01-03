<template>
  <div class="oql-display">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center pa-4">
      <v-progress-circular indeterminate size="24" />
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="pa-3">
      <v-alert type="error" density="compact">{{ loadError }}</v-alert>
    </div>

    <!-- Display Mode -->
    <div v-else-if="!isEditing" class="oql-display-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <oql-render-tree
          v-if="oqlRender"
          :tree="oqlRender"
          @remove="handleRemoveValue"
          @change-operator="handleChangeOperator"
          @toggle-join="handleToggleJoin"
          @add="handleAddValues"
          @remove-directive="handleRemoveDirective"
          @change-directive="handleChangeDirective"
        />
        <div v-else class="oql-text">{{ oqlText }}</div>
      </v-card>
    </div>

    <!-- Edit Mode -->
    <div v-else class="oql-edit-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <v-textarea
          v-model="editText"
          :error="!!parseError"
          :error-messages="parseError"
          variant="outlined"
          rows="6"
          auto-grow
          placeholder="Enter OQL query..."
          class="oql-textarea"
          hide-details="auto"
          @keydown="handleEditKeydown"
        />
        <div class="d-flex justify-end mt-2 ga-2">
          <v-btn variant="text" @click="cancelEditing">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="applyOql"
            :loading="isApplying"
            :disabled="!!parseError"
          >Apply</v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import OqlRenderTree from './Oql/OqlRenderTree.vue';
import * as url from '@/url';

const route = useRoute();
const router = useRouter();
const store = useStore();

const isLoading = computed(() => store.getters.queryObjectLoading);
const loadError = computed(() => {
  const error = store.getters.queryObjectError;
  if (error) return error;
  const queryObj = store.getters.queryObject;
  if (queryObj && !queryObj.oql) {
    return queryObj.validation?.errors?.[0]?.message || 'Failed to load OQL';
  }
  return '';
});
const oqlText = computed(() => store.getters.queryObject?.oql || '');
const oqlRender = computed(() => store.getters.queryObject?.oql_render);
const entityType = computed(() => route.params?.entityType || 'works');

const isEditing = ref(false);

// Handle remove value from OQL tree
const handleRemoveValue = async (data) => {
  const { columnId, value, sourcePointer } = data;

  // Try to use deleteFilterOptionByKey if we have columnId and value
  if (columnId && value) {
    await url.deleteFilterOptionByKey(entityType.value, columnId, value);
  } else if (sourcePointer) {
    // Fallback: parse source_pointer to get filter index
    const match = sourcePointer.match(/^\/filter_rows\/(\d+)/);
    if (match) {
      const filterIndex = parseInt(match[1], 10);
      await url.deleteFilter(entityType.value, filterIndex);
    }
  }
};

// Handle change operator (e.g., changing "is" to "is not")
const handleChangeOperator = async (data) => {
  const { columnId, oldOperator, newOperator, sourcePointer } = data;

  // Parse source_pointer to get filter index
  const match = sourcePointer?.match(/^\/filter_rows\/(\d+)/);
  if (!match) {
    console.warn('Cannot change operator: no valid source_pointer', data);
    return;
  }

  const filterIndex = parseInt(match[1], 10);

  // Determine if we're toggling negation
  const negatingOperators = ['is not', 'is none of', 'does not contain'];
  const isNowNegated = negatingOperators.includes(newOperator);

  // Use url.setIsFilterNegated to toggle negation
  await url.setIsFilterNegated(entityType.value, filterIndex, isNowNegated);
};

// Handle toggle AND/OR join
// Note: This is a complex operation that requires OQO modification
// For now, this is a placeholder - full implementation would need to:
// 1. Get current OQO from store
// 2. Navigate to the group using source_pointer
// 3. Change the join_op
// 4. Submit modified OQO to API
// 5. Apply returned URL params
const handleToggleJoin = async (data) => {
  const { currentJoin, newJoin, sourcePointer } = data;
  console.log('Toggle join requested:', { currentJoin, newJoin, sourcePointer });

  // TODO: Implement OQO-level modification
  // This requires modifying the filter structure at a deeper level
  // than the current URL-based filter manipulation supports
  console.warn('AND/OR toggle not yet implemented - requires OQO modification');
};

// Handle add values to a filter
const handleAddValues = async (data) => {
  const { columnId, values, sourcePointer } = data;

  // Add each value to the filter
  for (const value of values) {
    await url.addFilterOptionByKey(entityType.value, columnId, value);
  }
};

// Handle remove directive (sort or sample)
const handleRemoveDirective = async (data) => {
  const { type } = data;

  if (type === 'sort') {
    await url.setSort(undefined);
  } else if (type === 'sample') {
    await url.setSample(null);
  }
};

// Handle change directive (sample size)
const handleChangeDirective = async (data) => {
  const { type, value } = data;

  if (type === 'sample') {
    await url.setSample(value);
  }
};
const editText = ref('');
const parseError = ref('');
const isApplying = ref(false);

const startEditing = () => {
  editText.value = oqlText.value;
  parseError.value = '';
  isEditing.value = true;
};

defineExpose({ startEditing });

const cancelEditing = () => {
  isEditing.value = false;
  editText.value = '';
  parseError.value = '';
};

const handleEditKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (!parseError.value) applyOql();
  }
};

const applyOql = async () => {
  parseError.value = '';
  isApplying.value = true;

  try {
    const entityType = route.params?.entityType || 'works';
    // OQL editing not yet supported - server needs OQL parser
    parseError.value = 'OQL editing is not yet supported. Edit using Filters or OQO instead.';
    isApplying.value = false;
    return;
    /* Future: when server supports OQL parsing
    const response = await api.getQuery({
      entity_type: entityType,
      oql: editText.value,
    });
    */

    if (!response.validation?.valid) {
      parseError.value = response.validation?.errors?.[0]?.message || 'Validation failed';
      isApplying.value = false;
      return;
    }

    const urlData = response.url;
    if (urlData) {
      const newQuery = { ...route.query };
      if (urlData.filter) newQuery.filter = urlData.filter;
      else delete newQuery.filter;
      if (urlData.sort) newQuery.sort = urlData.sort;
      else delete newQuery.sort;
      if (urlData.sample) newQuery.sample = String(urlData.sample);
      else delete newQuery.sample;
      await router.push({ query: newQuery });
    }

    isEditing.value = false;
  } catch (e) {
    parseError.value = e.message || 'Failed to apply OQL';
  } finally {
    isApplying.value = false;
  }
};

</script>

<style lang="scss" scoped>
.oql-display {
  width: 100%;
}

.oql-text {
  font-size: 16px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.oql-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}
</style>
