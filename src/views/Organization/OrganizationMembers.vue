<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">Members</h1>
      <div class="d-flex align-center">
        <!-- Expandable search -->
        <v-text-field
          v-if="searchExpanded"
          ref="searchField"
          v-model="searchQuery"
          variant="outlined"
          density="compact"
          placeholder="Search by name or email"
          hide-details
          autofocus
          :loading="loading"
          class="search-field"
          @update:model-value="debouncedSearch"
          @blur="collapseSearchIfEmpty"
          @keydown.escape="collapseSearch"
        >
          <template #append-inner>
            <v-btn
              icon
              variant="text"
              size="x-small"
              @click="collapseSearch"
            >
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </template>
        </v-text-field>
        <v-btn
          v-else
          icon
          variant="text"
          size="small"
          @click="expandSearch"
        >
          <v-icon>mdi-magnify</v-icon>
          <v-tooltip activator="parent" location="bottom">Search members</v-tooltip>
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <div class="d-flex ga-2 mb-4">
      <!-- Role filter -->
      <v-menu>
        <template #activator="{ props }">
          <v-chip
            v-bind="selectedRole ? {} : props"
            :variant="selectedRole ? 'flat' : 'outlined'"
            :color="selectedRole ? 'primary' : undefined"
            :append-icon="selectedRole ? undefined : 'mdi-chevron-down'"
          >
            <span v-if="!selectedRole" v-bind="props" style="cursor: pointer;">Role</span>
            <template v-else>
              {{ getRoleDisplayName(selectedRole) }}
              <v-icon size="small" class="ml-1" @click.stop="clearRoleFilter">mdi-close</v-icon>
            </template>
          </v-chip>
        </template>
        <v-list density="compact">
          <v-list-item
            v-for="role in roleOptions"
            :key="role.value"
            @click="selectRoleFilter(role.value)"
          >
            <v-list-item-title>{{ role.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Results info and table -->
    <div v-if="filteredMembers.length || loading || searchExpanded">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ filteredMembers.length }} of {{ allMembers.length }} members
        </span>
      </div>

      <!-- Members table -->
      <v-table density="comfortable" class="members-table">
        <thead>
          <tr>
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'name' }"
              @click="toggleSort('name')"
              style="cursor: pointer;"
            >
              Member
              <v-icon v-if="sortField === 'name'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
            <th>Role</th>
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'created' }"
              @click="toggleSort('created')"
              style="cursor: pointer;"
            >
              Joined
              <v-icon v-if="sortField === 'created'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="member in paginatedMembers" 
            :key="member.id"
            class="member-row"
            @click="openMemberDetail(member.id)"
          >
            <!-- Member (avatar + name + email) -->
            <td>
              <div class="d-flex align-center py-2">
                <v-avatar size="40" class="mr-3" :color="getAvatarColor(member)">
                  <v-img 
                    v-if="member.gravatar_url" 
                    :src="member.gravatar_url"
                    :alt="member.display_name"
                  />
                  <span v-else class="text-white font-weight-medium">
                    {{ getInitial(member) }}
                  </span>
                </v-avatar>
                <div>
                  <div class="d-flex align-center ga-2">
                    <span class="font-weight-medium">{{ member.display_name || '—' }}</span>
                    <v-icon v-if="member.is_admin" size="x-small" color="amber-darken-2">mdi-crown</v-icon>
                  </div>
                  <div class="text-caption text-medium-emphasis">{{ member.email || '—' }}</div>
                </div>
              </div>
            </td>
            
            <!-- Role -->
            <td>
              <v-chip
                v-if="member.organization_role === 'owner'"
                size="small"
                color="primary"
                variant="tonal"
              >
                Owner
              </v-chip>
              <span v-else class="text-capitalize">{{ member.organization_role || 'Member' }}</span>
            </td>
            
            <!-- Joined -->
            <td>
              <v-tooltip :text="formatDateTime(member.created)" location="top">
                <template #activator="{ props }">
                  <span v-bind="props">{{ formatAge(member.created) }}</span>
                </template>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Bottom pagination -->
      <div v-if="totalPages > 1" class="d-flex justify-end align-center mt-4">
        <v-btn
          icon
          variant="text"
          size="small"
          :disabled="page <= 1"
          @click="prevPage"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-body-2 mx-2">Page {{ page }} of {{ totalPages }}</span>
        <v-btn
          icon
          variant="text"
          size="small"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- No results -->
    <div v-else class="text-center text-medium-emphasis py-8">
      No members found.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'timeago.js';

defineOptions({ name: 'OrganizationMembers' });

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const route = useRoute();
const router = useRouter();

// State
const error = ref('');
const loading = ref(false);
const searchExpanded = ref(false);
const searchField = ref(null);

// Role filter
const roleOptions = [
  { title: 'Owner', value: 'owner' },
  { title: 'Member', value: 'member' }
];

// URL-synced state
const searchQuery = computed({
  get: () => route.query.q || '',
  set: (val) => updateUrlParams({ q: val || undefined })
});

const selectedRole = computed({
  get: () => route.query.role || null,
  set: (val) => updateUrlParams({ role: val || undefined })
});

// Pagination
const page = ref(1);
const perPage = ref(25);

// Sorting
const sortField = ref('name');
const sortDesc = ref(false);

// Debounce timer
let debounceTimer = null;

// Avatar colors
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

// All members from organization
const allMembers = computed(() => {
  return props.organization?.members || [];
});

// Filtered members
const filteredMembers = computed(() => {
  let members = [...allMembers.value];
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    members = members.filter(m => 
      (m.display_name && m.display_name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }
  
  // Apply role filter
  if (selectedRole.value) {
    members = members.filter(m => m.organization_role === selectedRole.value);
  }
  
  // Apply sorting
  members.sort((a, b) => {
    let aVal, bVal;
    if (sortField.value === 'name') {
      aVal = (a.display_name || a.email || '').toLowerCase();
      bVal = (b.display_name || b.email || '').toLowerCase();
    } else if (sortField.value === 'created') {
      aVal = a.created ? new Date(a.created).getTime() : 0;
      bVal = b.created ? new Date(b.created).getTime() : 0;
    }
    
    if (aVal < bVal) return sortDesc.value ? 1 : -1;
    if (aVal > bVal) return sortDesc.value ? -1 : 1;
    return 0;
  });
  
  return members;
});

// Paginated members
const paginatedMembers = computed(() => {
  const start = (page.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredMembers.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredMembers.value.length / perPage.value) || 1;
});

// Methods
function updateUrlParams(params) {
  const newQuery = { ...route.query };
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      delete newQuery[key];
    } else {
      newQuery[key] = value;
    }
  }
  // Reset page when filters change
  if ('q' in params || 'role' in params) {
    page.value = 1;
  }
  router.replace({ query: newQuery });
}

function debouncedSearch() {
  loading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: searchQuery.value || undefined });
    loading.value = false;
  }, 300);
}

function expandSearch() {
  searchExpanded.value = true;
  nextTick(() => {
    searchField.value?.focus();
  });
}

function collapseSearch() {
  searchExpanded.value = false;
  if (searchQuery.value) {
    updateUrlParams({ q: undefined });
  }
}

function collapseSearchIfEmpty() {
  if (!searchQuery.value) {
    searchExpanded.value = false;
  }
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = false;
  }
  page.value = 1;
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
  }
}

function openMemberDetail(memberId) {
  const orgId = route.params.orgId;
  router.push(`/organizations/${orgId}/members/${memberId}`);
}

function getRoleDisplayName(role) {
  const option = roleOptions.find(r => r.value === role);
  return option?.title || role;
}

function selectRoleFilter(role) {
  selectedRole.value = role;
}

function clearRoleFilter() {
  selectedRole.value = null;
}

function getInitial(member) {
  if (member.display_name) return member.display_name.charAt(0).toUpperCase();
  if (member.email) return member.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(member) {
  const str = member.id || member.email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(dateStr);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatAge(dateStr) {
  if (!dateStr) return '—';
  return format(parseUTCDate(dateStr));
}

// Expand search if arriving with query
watch(
  () => route.query.q,
  (q) => {
    if (q) {
      searchExpanded.value = true;
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.members-table {
  th.sortable:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
  
  th.sorted {
    color: rgb(var(--v-theme-primary));
  }
  
  th {
    font-size: 13px !important;
    white-space: nowrap;
  }
  
  td {
    font-size: 14px !important;
  }
}

.search-field {
  width: 280px;
}

.member-row {
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>
