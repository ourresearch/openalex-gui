<template>
  <div>
    <!-- Controls row: Search, Filters, Export -->
    <div class="d-flex align-center ga-3 mb-4">
      <!-- Search field (always visible, Linear-style) -->
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search by name or email"
        hide-details
        class="search-field"
        @update:model-value="debouncedSearch"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="searchQuery" #append-inner>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="clearSearch"
          >
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>

      <!-- Role filter button -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="outlined"
            size="small"
            class="text-none filter-btn"
          >
            {{ selectedRole ? getRoleDisplayName(selectedRole) : 'All roles' }}
            <v-icon end size="small">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            :active="!selectedRole"
            @click="clearRoleFilter"
          >
            <v-list-item-title>All roles</v-list-item-title>
            <template v-if="!selectedRole" #append>
              <v-icon size="small">mdi-check</v-icon>
            </template>
          </v-list-item>
          <v-list-item
            v-for="role in roleOptions"
            :key="role.value"
            :active="selectedRole === role.value"
            @click="selectRoleFilter(role.value)"
          >
            <v-list-item-title>{{ role.title }}</v-list-item-title>
            <template v-if="selectedRole === role.value" #append>
              <v-icon size="small">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-spacer />

      <!-- Export CSV button -->
      <v-btn
        variant="outlined"
        size="small"
        class="text-none"
        :loading="exporting"
        :disabled="exporting || !allMembers.length"
        @click="exportMembers"
      >
        <v-icon start size="small">mdi-download</v-icon>
        Export CSV
      </v-btn>
    </div>

    <!-- Results info and table -->
    <div v-if="filteredMembers.length || searchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-body-2 text-medium-emphasis">
          Showing {{ filteredMembers.length }} of {{ allMembers.length }} members
        </span>
      </div>

      <!-- Members table -->
      <v-card variant="outlined" class="bg-white">
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
            <th 
              :class="{ 'sortable': true, 'sorted': sortField === 'last_seen' }"
              @click="toggleSort('last_seen')"
              style="cursor: pointer;"
            >
              Last seen
              <v-icon v-if="sortField === 'last_seen'" size="small" class="ml-1">
                {{ sortDesc ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="member in paginatedMembers" 
            :key="member.id"
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
            <td @click.stop>
              <v-menu location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="text"
                    size="small"
                    class="text-none px-1"
                    style="min-width: auto;"
                    :loading="updatingRoleMemberId === member.id"
                  >
                    {{ getRoleDisplayName(member.organization_role) }}
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="role in roleOptions"
                    :key="role.value"
                    :active="member.organization_role === role.value"
                    @click="updateMemberRole(member, role.value)"
                  >
                    <v-list-item-title>{{ role.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
            
            <!-- Joined -->
            <td>
              <v-tooltip :text="formatDateTime(member.created)" location="top">
                <template #activator="{ props }">
                  <span v-bind="props">{{ formatAge(member.created) }}</span>
                </template>
              </v-tooltip>
            </td>
            
            <!-- Last seen -->
            <td>
              <v-tooltip v-if="member.last_seen" :text="formatDateTime(member.last_seen)" location="top">
                <template #activator="{ props }">
                  <span v-bind="props">{{ formatAge(member.last_seen) }}</span>
                </template>
              </v-tooltip>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
      </v-card>

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
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { format } from 'timeago.js';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { exportArrayToCsv } from '@/utils/csvExport';

const props = defineProps({
  organization: {
    type: Object,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updated']);

const route = useRoute();
const router = useRouter();
const store = useStore();

const exporting = ref(false);
const updatingRoleMemberId = ref(null);

// Role filter
const roleOptions = [
  { title: 'Owner', value: 'owner' },
  { title: 'Curator', value: 'curator' },
  { title: 'Member', value: 'member' }
];

// URL-synced state
const searchQuery = ref(route.query.q || '');
const selectedRole = ref(route.query.role || null);

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
    } else if (sortField.value === 'last_seen') {
      aVal = a.last_seen ? new Date(a.last_seen).getTime() : 0;
      bVal = b.last_seen ? new Date(b.last_seen).getTime() : 0;
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
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: searchQuery.value || undefined });
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  updateUrlParams({ q: undefined });
}

// Export members to CSV
function exportMembers() {
  if (!filteredMembers.value.length) return;
  
  exporting.value = true;
  
  try {
    const columns = [
      { key: 'display_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'organization_role', label: 'Role' },
      { key: 'created', label: 'Joined' },
      { key: 'last_seen', label: 'Last Seen' },
    ];
    
    const orgName = props.organization?.name || 'members';
    const filename = `${orgName.replace(/[^a-z0-9]/gi, '_')}_members_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = exportArrayToCsv(filteredMembers.value, columns, filename);
    
    store.commit('snackbar', `Exported ${count} members.`);
  } catch (e) {
    console.error('Failed to export members:', e);
  } finally {
    exporting.value = false;
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

function getRoleDisplayName(role) {
  const option = roleOptions.find(r => r.value === role);
  return option?.title || 'Member';
}

async function updateMemberRole(member, newRole) {
  if (member.organization_role === newRole) return;
  
  updatingRoleMemberId.value = member.id;
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}/members/${member.id}`,
      { organization_role: newRole },
      axiosConfig({ userAuth: true })
    );
    // Update the member in the list immediately
    member.organization_role = newRole;
    store.commit('snackbar', 'Role updated');
    emit('updated');
  } catch (e) {
    console.error('Failed to update role:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to update role');
  } finally {
    updatingRoleMemberId.value = null;
  }
}

function selectRoleFilter(role) {
  selectedRole.value = role;
  updateUrlParams({ role });
}

function clearRoleFilter() {
  selectedRole.value = null;
  updateUrlParams({ role: undefined });
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

// Sync search query from URL on arrival
watch(
  () => route.query.q,
  (q) => {
    if (q) {
      searchQuery.value = q;
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.members-table {
  background: transparent !important;
  
  th {
    font-size: 13px !important;
    font-weight: bold !important;
    white-space: nowrap;
  }
  
  th.sortable:hover {
    background-color: rgba(0, 0, 0, 0.04) !important;
  }
  
  th.sorted {
    color: rgb(var(--v-theme-primary));
  }
  
  td {
    font-size: 14px !important;
  }
}

.search-field {
  max-width: 320px;
  flex-shrink: 0;
  
  :deep(.v-field) {
    border-radius: 6px;
  }
}

.filter-btn {
  border-radius: 6px;
}

.member-row {
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>
