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
          <div class="detail-grid">
            <!-- target entity -->
            <div class="dg-label">target entity</div>
            <div class="dg-main">
              <v-icon size="18" class="mr-1">{{ entityIcon }}</v-icon>
              <span class="font-weight-medium">{{ descriptor.kindLabel }}:</span>
              {{ subjectName }}
            </div>
            <div class="dg-id">
              <a v-if="headerUrl" :href="headerUrl" target="_blank" rel="noopener">{{ headerShort }}</a>
              <span v-else></span>
            </div>

            <!-- target property -->
            <div class="dg-label">target property</div>
            <div class="dg-main">{{ propertyText }}</div>
            <div class="dg-id"><code v-if="curation.property">{{ curation.property }}</code></div>

            <!-- action -->
            <div class="dg-label">action</div>
            <div class="dg-main">{{ action.label }}</div>
            <div class="dg-id"></div>

            <!-- new value -->
            <div class="dg-label">new value</div>
            <div class="dg-main">
              <span v-if="isRemove" class="text-medium-emphasis">none</span>
              <template v-else>{{ newValueName }}</template>
            </div>
            <div class="dg-id">
              <a v-if="newValueUrl" :href="newValueUrl" target="_blank" rel="noopener">{{ newValueShort }}</a>
              <span v-else></span>
            </div>

            <div class="dg-divider"></div>

            <!-- status -->
            <div class="dg-label">status</div>
            <div class="dg-main icon-text">
              <v-icon size="16">{{ status.icon }}</v-icon>
              <span>{{ status.label }}</span>
            </div>
            <div class="dg-id"></div>

            <!-- owner -->
            <div class="dg-label">owner</div>
            <div class="dg-main">{{ curation.user_name || '—' }}</div>
            <div class="dg-id">{{ curation.user_id || '' }}</div>

            <!-- created -->
            <div class="dg-label">created</div>
            <div class="dg-main">{{ curation.created ? formatRelativeDate(curation.created) : '—' }}</div>
            <div class="dg-id">{{ curation.created ? formatExactDate(curation.created) : '' }}</div>
          </div>
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
import {
  curationDescriptor,
  useEntityResolver,
  actionMeta,
  statusMeta,
  propertyLabel,
  formatExactDate,
  formatRelativeDate,
  shortId,
  oxEntityUrl,
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

const ENTITY_ICON = {
  Work: 'mdi-file-document-outline',
  Author: 'mdi-account-outline',
  RAS: 'mdi-card-account-details-outline',
};
const entityIcon = computed(
  () => ENTITY_ICON[descriptor.value.kindLabel] || 'mdi-shape-outline'
);

const resolvedName = (ref) =>
  ref?.id ? entityMap.value[ref.id]?.display_name : null;

const headerRef = computed(() => descriptor.value.headerRef);
const subjectName = computed(
  () =>
    resolvedName(headerRef.value) ||
    headerRef.value.text ||
    shortId(headerRef.value.id) ||
    '—'
);
const headerUrl = computed(() => oxEntityUrl(headerRef.value));
const headerShort = computed(() =>
  headerRef.value.type !== 'text' ? shortId(headerRef.value.id) : ''
);

const ENTITY_REF_TYPES = ['author', 'institution', 'work'];
const newValueIsEntity = computed(
  () =>
    !isRemove.value &&
    ENTITY_REF_TYPES.includes(descriptor.value.targetRef?.type) &&
    !!descriptor.value.targetRef?.id
);
const newValueName = computed(() => {
  const t = descriptor.value.targetRef;
  if (newValueIsEntity.value) return resolvedName(t) || shortId(t.id);
  return t?.text || '—';
});
const newValueUrl = computed(() =>
  newValueIsEntity.value ? oxEntityUrl(descriptor.value.targetRef) : null
);
const newValueShort = computed(() =>
  newValueIsEntity.value ? shortId(descriptor.value.targetRef.id) : ''
);

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
.detail-grid {
  display: grid;
  grid-template-columns: 140px minmax(0, 1.4fr) minmax(0, 1fr);
  align-items: baseline;
  row-gap: 14px;
  column-gap: 16px;
  font-size: 14px;
}

.dg-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
  white-space: nowrap;
}

.dg-main {
  color: rgba(0, 0, 0, 0.87);
}

.dg-id {
  color: rgba(0, 0, 0, 0.5);
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  word-break: break-word;
}

.dg-id a {
  color: #1976d2;
  text-decoration: none;
}

.dg-id a:hover {
  text-decoration: underline;
}

.dg-id code {
  font-family: inherit;
}

.dg-divider {
  grid-column: 1 / -1;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  margin: 6px 0;
}

.icon-text {
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
