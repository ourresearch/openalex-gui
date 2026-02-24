<template>
  <div>
    <DashboardBreadcrumbs :items="breadcrumbItems" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="error" class="py-8">
      <v-alert type="error" variant="tonal">{{ error }}</v-alert>
    </div>

    <div v-else-if="curation">
      <h1 class="text-h5 font-weight-bold mb-6">Curation Detail</h1>

      <v-card variant="outlined" class="bg-white">
        <v-card-text>
          <v-table density="comfortable" class="detail-table">
            <tbody>
              <tr>
                <td class="label-col text-medium-emphasis">Status</td>
                <td>
                  <v-chip
                    :color="curation.is_applied ? 'success' : 'amber-darken-2'"
                    size="small"
                    variant="tonal"
                  >
                    <v-icon start size="14">{{ curation.is_applied ? 'mdi-check-circle' : 'mdi-clock-outline' }}</v-icon>
                    {{ curation.is_applied ? 'Applied' : 'Pending' }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Action</td>
                <td>
                  <v-chip
                    :color="curation.action === 'add' ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                  >
                    {{ curation.action === 'add' ? 'Match' : 'Unmatch' }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Affiliation</td>
                <td class="affiliation-text">{{ curation.entity_id }}</td>
              </tr>
              <tr v-if="curation.value">
                <td class="label-col text-medium-emphasis">Institution</td>
                <td><code class="value-code">{{ curation.value }}</code></td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">User</td>
                <td>
                  <span v-if="curation.user_id">{{ curation.user_name || curation.user_id }}</span>
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Created</td>
                <td>{{ formatExactDate(curation.created) }}</td>
              </tr>
              <tr v-if="curation.is_applied && curation.applied_at">
                <td class="label-col text-medium-emphasis">Applied</td>
                <td>{{ formatExactDate(curation.applied_at) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';

defineOptions({ name: 'AdminCurationDetail' });

const route = useRoute();
const isAdminContext = computed(() => route.path.startsWith('/admin'));

const props = defineProps({
  curationId: { type: String, required: true },
});

const curation = ref(null);
const loading = ref(true);
const error = ref('');

const breadcrumbItems = computed(() => {
  const detail = curation.value ? truncate(curation.value.entity_id, 50) : 'Detail';
  if (isAdminContext.value) {
    return [
      { text: 'Admin', to: '/admin/users' },
      { text: 'Curations', to: '/admin/curations' },
      { text: detail },
    ];
  }
  const isSiteContext = route.path.startsWith('/settings/site-');
  return [
    { text: 'Settings', to: '/settings' },
    { text: 'Curations', to: isSiteContext ? '/settings/site-curations' : '/settings/curations' },
    { text: detail },
  ];
});

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

function formatExactDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

async function fetchCuration() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(
      `${urlBase.userApi}/curations/${props.curationId}`,
      axiosConfig({ userAuth: true })
    );
    curation.value = res.data;
  } catch (e) {
    error.value = e?.response?.status === 404
      ? 'Curation not found.'
      : (e?.response?.data?.message || 'Failed to load curation.');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchCuration();
});
</script>

<style scoped>
.detail-table {
  background: transparent !important;
}

.label-col {
  width: 120px;
  font-weight: 500;
  white-space: nowrap;
  vertical-align: top;
}

.affiliation-text {
  word-break: break-word;
  line-height: 1.5;
}

.value-code {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

</style>
