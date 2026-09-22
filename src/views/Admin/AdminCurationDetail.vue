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

            <!-- previous value (oxjob #193 R8): hidden when null. The same
                 OpenAlex-side scalar at submit time that #241 captures into
                 `curations.previous_value`. -->
            <template v-if="hasPreviousValue">
              <div class="dg-label">previous value</div>
              <div class="dg-main dg-previous">{{ previousValueName }}</div>
              <div class="dg-id">
                <a v-if="previousValueUrl" :href="previousValueUrl" target="_blank" rel="noopener">{{ previousValueShort }}</a>
                <span v-else></span>
              </div>
            </template>

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

            <!-- verification history (oxjob #1282). Detail view only: the
                 status worker re-checks every pending row until it is seen
                 live; these say when it last looked, what it saw, and when
                 it looks next. The curations table shows just status. -->
            <div class="dg-divider"></div>

            <div class="dg-label">last checked</div>
            <div class="dg-main">
              <template v-if="curation.last_checked_at">{{ formatRelativeDate(curation.last_checked_at) }}</template>
              <span v-else class="text-medium-emphasis">not yet</span>
            </div>
            <div class="dg-id">{{ curation.last_checked_at ? formatExactDate(curation.last_checked_at) : '' }}</div>

            <div class="dg-label">observed</div>
            <div class="dg-main">
              <template v-if="curation.last_observed">{{ curation.last_observed }}</template>
              <span v-else class="text-medium-emphasis">—</span>
            </div>
            <div class="dg-id">
              <span v-if="curation.last_check_error" class="dg-error">{{ curation.last_check_error }}</span>
            </div>

            <template v-if="curation.status !== 'applied'">
              <div class="dg-label">next check</div>
              <div class="dg-main">{{ nextCheckText }}</div>
              <div class="dg-id">{{ curation.next_check_at ? formatExactDate(curation.next_check_at) : '' }}</div>
            </template>

            <div class="dg-label">checks</div>
            <div class="dg-main">{{ checksText }}</div>
            <div class="dg-id"></div>
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
  Affiliation: 'mdi-map-marker-outline',
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

// Previous value (oxjob #193 R8). Mirrors the new-value computeds but on
// `previousTargetRef`. The whole row is hidden when null (most curations).
const hasPreviousValue = computed(
  () => descriptor.value.previousTargetRef != null
);
const previousValueIsEntity = computed(
  () =>
    hasPreviousValue.value &&
    ENTITY_REF_TYPES.includes(descriptor.value.previousTargetRef?.type) &&
    !!descriptor.value.previousTargetRef?.id
);
const previousValueName = computed(() => {
  const t = descriptor.value.previousTargetRef;
  if (!t) return '';
  if (previousValueIsEntity.value) return resolvedName(t) || shortId(t.id);
  return t.text || '—';
});
const previousValueUrl = computed(() =>
  previousValueIsEntity.value ? oxEntityUrl(descriptor.value.previousTargetRef) : null
);
const previousValueShort = computed(() =>
  previousValueIsEntity.value ? shortId(descriptor.value.previousTargetRef.id) : ''
);

// Verification history (oxjob #1282). next_check_at is a future instant
// (or null = due on the worker's next pass); the shared formatters only do
// the past, so a small "in …" formatter lives here.
function formatUntil(dateStr) {
  const diffSeconds = Math.floor((new Date(dateStr) - Date.now()) / 1000);
  if (diffSeconds < 60) return 'due now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  const diffDays = Math.floor(diffHours / 24);
  return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
}
const nextCheckText = computed(() =>
  curation.value?.next_check_at ? formatUntil(curation.value.next_check_at) : 'due now'
);
const checksText = computed(() => {
  const n = curation.value?.check_count || 0;
  if (curation.value?.status === 'applied') {
    return n === 0 ? 'seen live on first check' : `seen live after ${n} miss${n === 1 ? '' : 'es'}`;
  }
  return n === 0 ? 'none yet' : `${n} so far, not seen live yet`;
});

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

/* Previous-value row (oxjob #193 R8): muted + strikethrough so the page
   reads as a diff (previous above, new below). */
.dg-previous {
  color: rgba(0, 0, 0, 0.5);
  text-decoration: line-through;
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

.dg-error {
  color: #b71c1c;
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
