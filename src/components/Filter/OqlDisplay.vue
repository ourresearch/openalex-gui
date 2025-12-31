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
        <div class="oql-text">{{ oqlText }}</div>
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
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';

const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const loadError = ref('');
const oqlText = ref('');
const isEditing = ref(false);
const editText = ref('');
const parseError = ref('');
const isApplying = ref(false);

async function fetchFromServer() {
  const entityType = route.params?.entityType || 'works';
  const filterString = route.query?.filter || null;
  const sortString = route.query?.sort || null;
  const sample = route.query?.sample ? parseInt(route.query.sample, 10) : null;

  isLoading.value = true;
  loadError.value = '';

  try {
    const response = await api.getQuery({
      entity_type: entityType,
      filter: filterString,
      sort: sortString,
      sample,
    });

    if (response.oql) {
      oqlText.value = response.oql;
    } else {
      loadError.value = response.validation?.errors?.[0]?.message || 'Failed to load OQL';
    }
  } catch (e) {
    loadError.value = e.message || 'Failed to fetch from server';
  } finally {
    isLoading.value = false;
  }
}

const startEditing = () => {
  editText.value = oqlText.value;
  parseError.value = '';
  isEditing.value = true;
};

defineExpose({ startEditing, fetchFromServer });

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

watch(
  () => [route.query?.filter, route.query?.sort, route.query?.sample, route.params?.entityType],
  () => { if (!isEditing.value) fetchFromServer(); },
  { immediate: true }
);
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
