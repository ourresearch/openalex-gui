<template>
  <div class="oqo-display">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center pa-4">
      <v-progress-circular indeterminate size="24" />
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="pa-3">
      <v-alert type="error" density="compact">{{ loadError }}</v-alert>
    </div>

    <!-- Display Mode -->
    <div v-else-if="!isEditing" class="oqo-display-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <pre class="oqo-json">{{ formattedOqo }}</pre>
      </v-card>
    </div>

    <!-- Edit Mode -->
    <div v-else class="oqo-edit-mode">
      <v-card variant="outlined" class="bg-white pa-3">
        <v-textarea
          v-model="editText"
          :error="!!parseError"
          :error-messages="parseError"
          variant="outlined"
          rows="10"
          auto-grow
          placeholder="Enter OQO JSON..."
          class="oqo-textarea"
          hide-details="auto"
          @keydown="handleEditKeydown"
        />
        <div class="d-flex justify-end mt-2 ga-2">
          <v-btn variant="text" @click="cancelEditing">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="applyOqo"
            :loading="isApplying"
            :disabled="!!parseError"
          >Apply</v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';

const route = useRoute();
const router = useRouter();

const isLoading = ref(false);
const loadError = ref('');
const serverOqo = ref(null);
const isEditing = ref(false);
const editText = ref('');
const parseError = ref('');
const isApplying = ref(false);

const formattedOqo = ref('');

async function fetchFromServer() {
  const entityType = route.params?.entityType || 'works';
  const filterString = route.query?.filter || null;
  const sortString = route.query?.sort || null;
  const sample = route.query?.sample ? parseInt(route.query.sample, 10) : null;

  isLoading.value = true;
  loadError.value = '';

  try {
    const response = await api.translateQuery({
      entity_type: entityType,
      input_format: 'url',
      input: { filter: filterString, sort: sortString, sample },
    });

    if (response.oqo) {
      serverOqo.value = response.oqo;
      formattedOqo.value = JSON.stringify(response.oqo, null, 2);
    } else {
      loadError.value = response.validation?.errors?.[0]?.message || 'Failed to load OQO';
    }
  } catch (e) {
    loadError.value = e.message || 'Failed to fetch from server';
  } finally {
    isLoading.value = false;
  }
}

const startEditing = () => {
  editText.value = formattedOqo.value;
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
    if (!parseError.value) applyOqo();
  }
};

const applyOqo = async () => {
  parseError.value = '';
  isApplying.value = true;

  try {
    let oqoInput;
    try {
      oqoInput = JSON.parse(editText.value);
    } catch (e) {
      parseError.value = `Invalid JSON: ${e.message}`;
      isApplying.value = false;
      return;
    }

    const entityType = route.params?.entityType || 'works';
    const response = await api.translateQuery({
      entity_type: entityType,
      input_format: 'oqo',
      input: oqoInput,
    });

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
    parseError.value = e.message || 'Failed to apply OQO';
  } finally {
    isApplying.value = false;
  }
};

watch(() => editText.value, (newVal) => {
  if (!newVal) { parseError.value = ''; return; }
  try {
    JSON.parse(newVal);
    parseError.value = '';
  } catch (e) {
    parseError.value = `Invalid JSON: ${e.message}`;
  }
});

watch(
  () => [route.query?.filter, route.query?.sort, route.query?.sample, route.params?.entityType],
  () => { if (!isEditing.value) fetchFromServer(); },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.oqo-display {
  width: 100%;
}

.oqo-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #333;
}

.oqo-textarea {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
}

:deep(.oqo-textarea textarea) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
}
</style>
