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
          :loading="searchLoading"
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

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <template v-else-if="organization">
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

      <!-- Results info and table -->
      <div v-if="filteredMembers.length || searchExpanded">
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
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>

    <!-- Member detail dialog -->
    <v-dialog v-model="memberDialogOpen" max-width="600">
      <v-card v-if="selectedMember">
        <v-card-title class="d-flex align-center">
          <v-avatar size="48" class="mr-3" :color="getAvatarColor(selectedMember)">
            <v-img 
              v-if="selectedMember.gravatar_url" 
              :src="selectedMember.gravatar_url"
              :alt="selectedMember.display_name"
            />
            <span v-else class="text-white text-h6">
              {{ getInitial(selectedMember) }}
            </span>
          </v-avatar>
          <div>
            <div>{{ selectedMember.display_name || 'Unknown' }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ selectedMember.email }}</div>
          </div>
        </v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-badge-account-outline</v-icon>
              </template>
              <v-list-item-title>Role</v-list-item-title>
              <template #append>
                <span class="text-capitalize">{{ selectedMember.organization_role || 'Member' }}</span>
              </template>
            </v-list-item>
            <v-list-item v-if="selectedMember.created">
              <template #prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>Joined</v-list-item-title>
              <template #append>
                {{ formatAge(selectedMember.created) }}
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="memberDialogOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import { format } from 'timeago.js';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'SettingsOrgMembers' });

useHead({ title: 'Organization Members' });

const route = useRoute();
const router = useRouter();
const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');
const searchExpanded = ref(false);
const searchField = ref(null);
const searchLoading = ref(false);
const memberDialogOpen = ref(false);
const selectedMember = ref(null);
const updatingRoleMemberId = ref(null);

const organizationId = computed(() => store.state.user.organizationId);

// Role filter
const roleOptions = [
  { title: 'Owner', value: 'owner' },
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
  return organization.value?.members || [];
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

async function fetchOrganization() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    organization.value = null;
  } finally {
    loading.value = false;
  }
}

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
  searchLoading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: searchQuery.value || undefined });
    searchLoading.value = false;
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
    searchQuery.value = '';
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
  selectedMember.value = allMembers.value.find(m => m.id === memberId);
  memberDialogOpen.value = true;
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
      `${urlBase.userApi}/organizations/${organizationId.value}/members/${member.id}`,
      { organization_role: newRole },
      axiosConfig({ userAuth: true })
    );
    // Update the member in the list immediately
    member.organization_role = newRole;
    store.commit('snackbar', 'Role updated.');
  } catch (e) {
    console.error('Failed to update role:', e);
    error.value = e?.response?.data?.message || 'Failed to update role.';
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

// Expand search if arriving with query
watch(
  () => route.query.q,
  (q) => {
    if (q) {
      searchExpanded.value = true;
      searchQuery.value = q;
    }
  },
  { immediate: true }
);

onMounted(() => {
  fetchOrganization();
});
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
  width: 280px;
}

.member-row {
  cursor: pointer;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>
