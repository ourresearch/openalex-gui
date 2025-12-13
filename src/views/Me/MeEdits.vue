<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-2">Edits</h1>
    <div class="text-body-2 text-grey-darken-1 mb-4">
      Edits take up to one week to go live; you can track progress here.
    </div>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your edits...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!edits.length" class="py-8 text-center text-grey">
        You haven't submitted any edits yet.
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
          <tr v-for="edit in edits" :key="edit.id">
            <td>
              {{ edit.entity }}
            </td>
            <td>
              <router-link :to="getEntityLink(edit)" class="text-primary">
                {{ formatEntityId(edit.entity_id) }}
              </router-link>
            </td>
            <td>
              <code class="text-caption">{{ edit.property }}</code>
            </td>
            <td>
              <span class="text-caption">{{ formatValue(edit.property_value) }}</span>
            </td>
            <td>
              <v-chip
                size="small"
                :color="getStatusColor(edit)"
                variant="flat"
              >
                {{ getStatus(edit) }}
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
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

defineOptions({ name: 'MeEdits' });

useHead({ title: 'Edits' });

const store = useStore();

const edits = ref([]);
const isLoading = ref(false);
const error = ref(null);
const page = ref(1);
const pagination = ref(null);
const perPage = 20;

const userEmail = computed(() => store.getters['user/userEmail']);

const fetchEdits = async () => {
  if (!userEmail.value) {
    error.value = 'You must be logged in to view your edits.';
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
    edits.value = response.data.results || [];
    pagination.value = response.data.pagination || null;
  } catch (err) {
    console.error('Error fetching edits:', err);
    error.value = 'Unable to load your edits. Please try again later.';
    edits.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getEntityLink = (edit) => {
  const entityType = edit.entity === 'locations' ? 'works' : edit.entity;
  return `/${entityType}/${edit.entity_id}`;
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

const getStatus = (edit) => {
  return edit.is_live ? 'live' : 'submitted';
};

const getStatusColor = (edit) => {
  return edit.is_live ? 'green' : 'grey';
};

watch(page, () => {
  fetchEdits();
});

onMounted(() => {
  fetchEdits();
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
