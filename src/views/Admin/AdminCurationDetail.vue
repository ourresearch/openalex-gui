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
                <td class="label-col text-medium-emphasis">Entity</td>
                <td>
                  <v-chip color="primary" size="small" variant="tonal">
                    {{ descriptor.kindLabel }}
                  </v-chip>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Status</td>
                <td class="icon-text">
                  <v-icon size="16">{{ status.icon }}</v-icon>
                  <span>{{ status.label }}</span>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Action</td>
                <td class="icon-text">
                  <v-icon size="16">{{ action.icon }}</v-icon>
                  <span>{{ action.label }}</span>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Subject</td>
                <td>
                  <CurationEntityRef :entity-ref="descriptor.headerRef" :entity-map="entityMap" stacked />
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Property</td>
                <td>{{ propertyText }}</td>
              </tr>
              <tr v-if="curation.value">
                <td class="label-col text-medium-emphasis">New value</td>
                <td>
                  <span v-if="isRemove" class="text-medium-emphasis">none</span>
                  <CurationEntityRef v-else :entity-ref="descriptor.targetRef" :entity-map="entityMap" stacked />
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Owner</td>
                <td>
                  <div v-if="curation.user_name || curation.user_id" class="owner-stacked">
                    <span class="owner-main">{{ curation.user_name || curation.user_id }}</span>
                    <span v-if="curation.user_name && curation.user_id" class="owner-sub">{{ curation.user_id }}</span>
                  </div>
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
              </tr>
              <tr>
                <td class="label-col text-medium-emphasis">Created</td>
                <td>
                  <div v-if="curation.created" class="owner-stacked">
                    <span class="owner-main">{{ formatRelativeDate(curation.created) }}</span>
                    <span class="owner-sub">{{ formatExactDate(curation.created) }}</span>
                  </div>
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
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
import CurationEntityRef from '@/components/CurationEntityRef.vue';
import {
  curationDescriptor,
  useEntityResolver,
  actionMeta,
  statusMeta,
  propertyLabel,
  formatExactDate,
  formatRelativeDate,
} from '@/composables/useCurationDescriptor';

defineOptions({ name: 'AdminCurationDetail' });

const route = useRoute();
const isAdminContext = computed(() => route.path.startsWith('/admin'));

const props = defineProps({
  curationId: { type: String, required: true },
});

const curation = ref(null);
const loading = ref(true);
const error = ref('');
const { entityMap, resolve: resolveEntities } = useEntityResolver();

const descriptor = computed(() =>
  curation.value
    ? curationDescriptor(curation.value)
    : { kindLabel: '', headerRef: { type: 'text' }, targetRef: { type: 'text' } }
);
const status = computed(() => statusMeta(curation.value));
const action = computed(() => actionMeta(curation.value?.action));
const propertyText = computed(() => propertyLabel(curation.value));
const isRemove = computed(() => curation.value?.action === 'remove');

const breadcrumbItems = computed(() => {
  const detail = props.curationId;
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

async function fetchCuration() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(
      `${urlBase.userApi}/curations/${props.curationId}`,
      axiosConfig({ userAuth: true })
    );
    curation.value = res.data;
    resolveEntities([curation.value]);
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

.icon-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(0, 0, 0, 0.87);
}

.owner-stacked {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.owner-main {
  font-size: 14px;
}

.owner-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
}
</style>
