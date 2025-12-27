<template>
  <div>
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-2">Affiliation Matching</h1>
    <p class="text-body-2 text-grey-darken-1 mb-6">
      Search and manage affiliation strings for any institution.
    </p>

    <!-- Affiliation Panel -->
    <AffiliationMatchingPanel :institution-id="institutionId" is-admin>
      <template #institution-selector>
        <v-autocomplete
          v-model="selectedInstitution"
          :items="institutionResults"
          :loading="isSearching"
          item-title="display_name"
          item-value="id"
          return-object
          placeholder="Select institution..."
          variant="outlined"
          density="compact"
          hide-details
          clearable
          autocomplete="off"
          name="institution-search-nofill"
          style="min-width: 280px;"
          @update:search="onInstitutionSearch"
          :custom-filter="() => true"
        >
          <template v-slot:item="{ item, props }">
            <v-list-item
              v-bind="props"
              :title="item.raw.display_name"
              :subtitle="item.raw.hint"
            />
          </template>
        </v-autocomplete>
      </template>
    </AffiliationMatchingPanel>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { debounce } from 'lodash';
import axios from 'axios';
import { api } from '@/api';
import AffiliationMatchingPanel from '@/components/AffiliationMatchingPanel.vue';

defineOptions({ name: 'AdminAffiliations' });

useHead({ title: 'Admin - Affiliations' });

const route = useRoute();
const router = useRouter();

const selectedInstitution = ref(null);
const institutionResults = ref([]);
const isSearching = ref(false);
const isLoadingInstitution = ref(false);

const institutionId = computed(() => {
  if (!selectedInstitution.value) return null;
  const id = selectedInstitution.value.id || selectedInstitution.value.short_id;
  if (!id) return null;
  return normalizeInstitutionId(id);
});

function normalizeInstitutionId(id) {
  if (!id) return null;
  let normalized = id;
  if (normalized.startsWith('https://openalex.org/')) {
    normalized = normalized.replace('https://openalex.org/', '');
  }
  if (normalized.toUpperCase().startsWith('INSTITUTIONS/')) {
    normalized = normalized.substring('INSTITUTIONS/'.length);
  }
  return normalized.toUpperCase();
}

// Institution search
const debouncedSearch = debounce(async (query) => {
  if (!query || query.length < 2) {
    institutionResults.value = [];
    return;
  }
  isSearching.value = true;
  try {
    const results = await api.getAutocomplete('institutions', { q: query });
    institutionResults.value = results || [];
  } catch (err) {
    console.error('Error searching institutions:', err);
    institutionResults.value = [];
  } finally {
    isSearching.value = false;
  }
}, 300);

function onInstitutionSearch(query) {
  debouncedSearch(query);
}

// Sync institution ID to URL
watch(institutionId, (newId) => {
  const currentQuery = { ...route.query };
  if (newId) {
    currentQuery.institution = newId;
  } else {
    delete currentQuery.institution;
  }
  router.replace({ query: currentQuery });
});

// Load institution from URL on mount
onMounted(async () => {
  const urlInstitutionId = route.query.institution;
  if (urlInstitutionId) {
    await loadInstitutionById(urlInstitutionId);
  }
});

async function loadInstitutionById(id) {
  isLoadingInstitution.value = true;
  try {
    const response = await axios.get(`https://api.openalex.org/institutions/${id}`);
    if (response.data) {
      selectedInstitution.value = {
        id: response.data.id,
        display_name: response.data.display_name,
      };
    }
  } catch (err) {
    console.error('Error loading institution:', err);
  } finally {
    isLoadingInstitution.value = false;
  }
}
</script>

<style scoped>
</style>
