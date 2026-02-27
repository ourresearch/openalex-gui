<template>
  <v-container class="page" style="max-width: 700px;">
    <div class="text-center mt-8 mb-6">
      <div class="text-h4 font-weight-bold mb-2">Repository Dashboard</div>
      <div class="text-body-1 text-medium-emphasis">
        Check if OpenAlex is harvesting your repository correctly
      </div>
    </div>

    <v-autocomplete
      v-model="selectedSource"
      :items="results"
      :loading="loading"
      item-title="display_name"
      item-value="id"
      placeholder="Search for your repository..."
      variant="outlined"
      rounded
      hide-no-data
      hide-details
      return-object
      :custom-filter="() => true"
      autofocus
      @update:search="onSearch"
      @update:model-value="onSelect"
      class="mb-6"
    >
      <template v-slot:item="{ item, props }">
        <v-list-item
          v-bind="props"
          :title="item.raw.display_name"
          :subtitle="item.raw.hint"
        ></v-list-item>
      </template>
    </v-autocomplete>

    <div class="text-center">
      <router-link to="/repositories/add" class="text-body-2">
        Don't see your repository? Add a new one
      </router-link>
    </div>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { debounce } from 'lodash';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'RepositoriesLanding' });
useHead({ title: 'Repository Dashboard' });

const router = useRouter();
const selectedSource = ref(null);
const results = ref([]);
const loading = ref(false);

const fetchResults = debounce(async (query) => {
  if (!query || query.length < 2) {
    results.value = [];
    return;
  }
  loading.value = true;
  try {
    const resp = await axios.get(
      `${urlBase.api}/autocomplete/sources?q=${encodeURIComponent(query)}&filter=type:repository&mailto=ui@openalex.org`,
      axiosConfig()
    );
    results.value = resp.data?.results || [];
  } catch (e) {
    console.error('Autocomplete error:', e);
    results.value = [];
  } finally {
    loading.value = false;
  }
}, 300);

const onSearch = (val) => {
  fetchResults(val);
};

const onSelect = (source) => {
  if (!source) return;
  // Extract the short ID (e.g., "S12345" from "https://openalex.org/S12345")
  const id = source.id?.replace('https://openalex.org/', '') || source.short_id || source.id;
  router.push(`/repositories/${id}`);
};
</script>
