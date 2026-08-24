<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Hiring</h1>

    <!-- Controls row -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-text-field
        v-model="localQ"
        variant="outlined"
        density="compact"
        placeholder="Search applications + notes"
        hide-details
        class="search-field"
        @update:model-value="debouncedSearch"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="localQ" #append-inner>
          <v-btn icon variant="text" size="x-small" @click="clearSearch">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <v-select
        v-model="roleFilter"
        :items="roleOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Role"
        class="filter-select"
      />
      <v-select
        v-model="stageFilter"
        :items="stageOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Stage"
        class="filter-select"
      />
      <v-select
        v-model="ownerFilter"
        :items="ownerOptions"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        label="Owner"
        class="filter-select filter-select-narrow"
      />
    </div>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <div v-if="applications.length || loading">
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          {{ sorted.length }} application{{ sorted.length === 1 ? '' : 's' }}
        </span>
      </div>

      <v-table density="comfortable" class="hiring-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Location</th>
            <th class="col-sortable" @click="toggleSort('created')">
              Applied
              <v-icon v-if="sortKey === 'created'" size="14">{{ sortIcon }}</v-icon>
            </th>
            <th class="col-sortable" @click="toggleSort('stage')">
              Stage
              <v-icon v-if="sortKey === 'stage'" size="14">{{ sortIcon }}</v-icon>
            </th>
            <th>Owner</th>
            <th>Attributes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in sorted" :key="a.id">
            <td>
              <router-link :to="`/admin/hiring/${a.id}`" class="hiring-name-link">
                {{ a.name || a.id }}
              </router-link>
            </td>
            <td class="text-medium-emphasis">{{ roleTitle(a.role_slug) }}</td>
            <td class="text-medium-emphasis hiring-trunc">{{ a.location || '—' }}</td>
            <td class="col-created">
              <v-tooltip location="bottom" :text="formatExactDate(a.created)">
                <template #activator="{ props: tipProps }">
                  <span v-bind="tipProps" class="text-medium-emphasis">{{ formatRelativeShort(a.created) }}</span>
                </template>
              </v-tooltip>
            </td>
            <td>
              <v-chip :color="STAGE_COLORS[a.stage]" size="small" variant="tonal" label>{{ a.stage }}</v-chip>
            </td>
            <td class="text-medium-emphasis">{{ a.owner || '—' }}</td>
            <td>
              <span v-for="(chip, i) in attrChips(a)" :key="i" class="attr-chip">{{ chip }}</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <div v-else-if="!loading" class="text-center text-medium-emphasis py-8">
      No applications found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatRelativeShort, formatExactDate } from '@/composables/useCurationDescriptor';
import { ROLE_TITLES, roleTitle, STAGES, STAGE_COLORS, OWNERS, formatAttrValue } from './hiringVocab';

defineOptions({ name: 'AdminHiring' });

const route = useRoute();
const router = useRouter();

const applications = ref([]);
const loading = ref(false);
const error = ref('');

const localQ = ref(route.query.q || '');
const roleFilter = ref(route.query.role || null);
const stageFilter = ref(route.query.stage || null);
const ownerFilter = ref(route.query.owner || null);

const sortKey = ref('created');
const sortAsc = ref(false);
const sortIcon = computed(() => (sortAsc.value ? 'mdi-arrow-up' : 'mdi-arrow-down'));

const roleOptions = Object.entries(ROLE_TITLES).map(([value, title]) => ({ value, title }));
const stageOptions = STAGES.map((s) => ({ value: s, title: s }));
const ownerOptions = OWNERS.map((o) => ({ value: o, title: o }));

let debounceTimer = null;
function debouncedSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchApplications(), 350);
}
function clearSearch() {
  localQ.value = '';
  fetchApplications();
}

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key === 'stage';
  }
}

const sorted = computed(() => {
  const arr = [...applications.value];
  const key = sortKey.value;
  arr.sort((a, b) => {
    let av; let bv;
    if (key === 'stage') {
      av = STAGES.indexOf(a.stage);
      bv = STAGES.indexOf(b.stage);
    } else {
      av = a.created || '';
      bv = b.created || '';
    }
    if (av < bv) return sortAsc.value ? -1 : 1;
    if (av > bv) return sortAsc.value ? 1 : -1;
    return 0;
  });
  return arr;
});

function attrChips(a) {
  const attrs = a.attributes || {};
  return Object.keys(attrs).sort().slice(0, 3)
    .map((k) => `${k}: ${formatAttrValue(attrs[k])}`);
}

async function fetchApplications() {
  loading.value = true;
  error.value = '';
  const params = new URLSearchParams();
  if (roleFilter.value) params.set('role', roleFilter.value);
  if (stageFilter.value) params.set('stage', stageFilter.value);
  if (ownerFilter.value) params.set('owner', ownerFilter.value);
  if (localQ.value.trim()) params.set('q', localQ.value.trim());

  // Keep filters shareable/bookmarkable
  const query = Object.fromEntries(params.entries());
  router.replace({ query }).catch(() => {});

  try {
    const res = await axios.get(
      `${urlBase.userApi}/jobs/applications?${params.toString()}`,
      axiosConfig({ userAuth: true }),
    );
    applications.value = res.data.applications || [];
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load applications.';
    applications.value = [];
  } finally {
    loading.value = false;
  }
}

watch([roleFilter, stageFilter, ownerFilter], fetchApplications);
onMounted(fetchApplications);
</script>

<style lang="scss" scoped>
.search-field {
  max-width: 320px;
  flex-shrink: 0;

  :deep(.v-field) {
    border-radius: 6px;
  }
}

.filter-select {
  max-width: 190px;
}

.filter-select-narrow {
  max-width: 130px;
}

.hiring-table {
  th { white-space: nowrap; }
}

.col-sortable {
  cursor: pointer;
  user-select: none;
}

.col-created { white-space: nowrap; }

.hiring-name-link {
  color: inherit;
  font-weight: 500;
  text-decoration: none;

  &:hover { text-decoration: underline; }
}

.hiring-trunc {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attr-chip {
  display: inline-block;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 1px 6px;
  margin: 1px 4px 1px 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}
</style>
