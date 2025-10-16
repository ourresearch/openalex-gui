<template>
  <div>
    <div class="text-h4 mb-2">My Corrections</div>
    <div class="text-body-1 text-grey-darken-1 mb-4">Corrections take up to one week to go live; you can track progress here.</div>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your corrections...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!corrections.length" class="py-8 text-center text-grey">
        You haven't submitted any corrections yet.
      </v-card-text>

      <v-table v-else>
        <thead>
          <tr>
            <th>Entity Type</th>
            <th>Entity ID</th>
            <th>Property</th>
            <th>New Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="correction in corrections" :key="correction.id">
            <td>
              {{ correction.entity }}
            </td>
            <td>
              <router-link :to="getEntityLink(correction)" class="text-primary">
                {{ formatEntityId(correction.entity_id) }}
              </router-link>
            </td>
            <td>
              <code class="text-caption">{{ correction.property }}</code>
            </td>
            <td>
              <span class="text-caption">{{ formatValue(correction.property_value) }}</span>
            </td>
            <td>
              <v-chip
                size="small"
                :color="getSimpleStatusColor(correction)"
                variant="flat"
              >
                {{ getSimpleStatus(correction) }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-card-actions v-if="pagination && pagination.total > pagination.per_page">
        <v-spacer></v-spacer>
        <v-pagination
          v-model="page"
          :length="Math.ceil(pagination.total / pagination.per_page)"
          :total-visible="5"
          density="comfortable"
        ></v-pagination>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

defineOptions({ name: 'MeCorrections' });

const store = useStore();

const corrections = ref([]);
const isLoading = ref(false);
const error = ref(null);
const page = ref(1);
const pagination = ref(null);
const perPage = 20;

const userEmail = computed(() => store.getters['user/userEmail']);

const fetchCorrections = async () => {
  if (!userEmail.value) {
    error.value = 'You must be logged in to view your corrections.';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const offset = (page.value - 1) * perPage;
    const params = new URLSearchParams({
      submitter_email: userEmail.value,
      per_page: perPage,
      offset: offset,
      sort_order: 'desc',
    });

    const response = await axios.get(`${urlBase.correctionsApi}/v2/corrections?${params.toString()}`);
    corrections.value = response.data.results || [];
    pagination.value = response.data.pagination || null;
  } catch (err) {
    console.error('Error fetching corrections:', err);
    error.value = 'Unable to load your corrections. Please try again later.';
    corrections.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getEntityLink = (correction) => {
  const entityType = correction.entity === 'locations' ? 'works' : correction.entity;
  return `/${entityType}/${correction.entity_id}`;
};

const formatEntityId = (id) => {
  return id.length > 20 ? `${id.substring(0, 20)}...` : id;
};

const formatValue = (value) => {
  if (typeof value === 'string' && value.length > 50) {
    return `${value.substring(0, 50)}...`;
  }
  return value;
};

const getSimpleStatus = (correction) => {
  return correction.is_live ? 'live' : 'submitted';
};

const getSimpleStatusColor = (correction) => {
  return correction.is_live ? 'green' : 'grey';
};

watch(page, () => {
  fetchCorrections();
});

onMounted(() => {
  fetchCorrections();
});
</script>

<style scoped>
a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>