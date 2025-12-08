<template>
  <div>
    <div class="d-flex align-center mb-4">
      <div class="text-h5">Exports</div>
      <v-spacer />
      <v-btn
        v-if="exports.length"
        variant="text"
        color="error"
        size="small"
        prepend-icon="mdi-delete-outline"
        @click="deleteAllExports"
      >
        Delete all
      </v-btn>
    </div>

    <v-card flat variant="outlined" class="bg-white">
      <v-card-text v-if="isLoading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-4 text-grey">Loading your exports...</div>
      </v-card-text>

      <v-card-text v-else-if="error" class="py-8">
        <v-alert type="error" variant="tonal">
          {{ error }}
        </v-alert>
      </v-card-text>

      <v-card-text v-else-if="!exports.length" class="py-8 text-center text-grey">
        You haven't created any exports yet.
      </v-card-text>

      <v-table v-else>
        <thead>
          <tr>
            <th>Format</th>
            <th>Created</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exp in exports" :key="exp.id">
            <td>
              <v-icon size="small" class="mr-2">mdi-file-document-outline</v-icon>
              {{ exp.format?.toUpperCase() || 'CSV' }}
            </td>
            <td>
              {{ formatDate(exp.created || exp.submitted) }}
            </td>
            <td>
              <v-chip
                size="small"
                :color="getStatusColor(exp.status)"
                variant="flat"
              >
                {{ exp.status }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                v-if="(exp.status === 'finished' || exp.status === 'completed') && exp.result_url"
                size="small"
                variant="text"
                color="primary"
                :href="exp.result_url"
                target="_blank"
              >
                <v-icon start>mdi-download</v-icon>
                Download
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'MeExports' });

useHead({ title: 'Exports' });

const store = useStore();

const exports = ref([]);
const isLoading = ref(false);
const error = ref(null);

const userId = computed(() => store.getters['user/userId']);

const fetchExports = async () => {
  if (!userId.value) {
    error.value = 'You must be logged in to view your exports.';
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const response = await axios.get(
      `${urlBase.userApi}/user/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = response.data.exports || response.data || [];
  } catch (err) {
    console.error('Error fetching exports:', err);
    error.value = 'Unable to load your exports. Please try again later.';
    exports.value = [];
  } finally {
    isLoading.value = false;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'finished':
    case 'completed':
      return 'green';
    case 'processing':
    case 'running':
      return 'blue';
    case 'failed':
    case 'error':
      return 'red';
    default:
      return 'grey';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const deleteAllExports = async () => {
  try {
    await axios.delete(
      `${urlBase.userApi}/user/${userId.value}/exports`,
      axiosConfig({ userAuth: true })
    );
    exports.value = [];
    store.commit('snackbar', 'All exports deleted');
  } catch (err) {
    console.error('Error deleting exports:', err);
    store.commit('snackbar', 'Failed to delete exports');
  }
};

onMounted(() => {
  fetchExports();
});
</script>
