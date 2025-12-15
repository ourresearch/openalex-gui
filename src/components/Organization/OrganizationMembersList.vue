<template>
  <div>
    <!-- Controls row: Search, Filters, Export -->
    <div class="flex items-center gap-3 mb-4">
      <!-- Search field -->
      <div class="relative max-w-[320px] flex-shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search by name or email"
          class="pl-9 pr-8"
          @update:model-value="debouncedSearch"
          @keydown.escape="clearSearch"
        />
        <Button
          v-if="searchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          @click="clearSearch"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <!-- Role filter button -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {{ selectedRole ? getRoleDisplayName(selectedRole) : 'All roles' }}
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="clearRoleFilter">
            <Check v-if="!selectedRole" class="h-4 w-4 mr-2" />
            <span v-else class="w-4 mr-2"></span>
            All roles
          </DropdownMenuItem>
          <DropdownMenuItem
            v-for="role in roleOptions"
            :key="role.value"
            @click="selectRoleFilter(role.value)"
          >
            <Check v-if="selectedRole === role.value" class="h-4 w-4 mr-2" />
            <span v-else class="w-4 mr-2"></span>
            {{ role.title }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="flex-1" />

      <!-- Export CSV button -->
      <Button
        variant="outline"
        size="sm"
        :disabled="exporting || !allMembers.length"
        @click="exportMembers"
      >
        <Download class="h-4 w-4 mr-1" />
        Export CSV
      </Button>
    </div>

    <!-- Results info and table -->
    <div v-if="filteredMembers.length || searchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-sm text-muted-foreground">
          Showing {{ filteredMembers.length }} of {{ allMembers.length }} members
        </span>
      </div>

      <!-- Members table -->
      <Card>
        <Table class="members-table">
          <TableHeader>
            <TableRow>
              <TableHead 
                :class="{ 'sortable': true, 'sorted': sortField === 'name' }"
                @click="toggleSort('name')"
                class="cursor-pointer"
              >
                Member
                <ArrowDown v-if="sortField === 'name' && sortDesc" class="h-4 w-4 ml-1 inline" />
                <ArrowUp v-else-if="sortField === 'name'" class="h-4 w-4 ml-1 inline" />
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead 
                :class="{ 'sortable': true, 'sorted': sortField === 'created' }"
                @click="toggleSort('created')"
                class="cursor-pointer"
              >
                Joined
                <ArrowDown v-if="sortField === 'created' && sortDesc" class="h-4 w-4 ml-1 inline" />
                <ArrowUp v-else-if="sortField === 'created'" class="h-4 w-4 ml-1 inline" />
              </TableHead>
              <TableHead 
                :class="{ 'sortable': true, 'sorted': sortField === 'last_seen' }"
                @click="toggleSort('last_seen')"
                class="cursor-pointer"
              >
                Last seen
                <ArrowDown v-if="sortField === 'last_seen' && sortDesc" class="h-4 w-4 ml-1 inline" />
                <ArrowUp v-else-if="sortField === 'last_seen'" class="h-4 w-4 ml-1 inline" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="member in paginatedMembers" 
              :key="member.id"
            >
              <!-- Member (avatar + name + email) -->
              <TableCell>
                <div class="flex items-center py-2">
                  <Avatar class="h-10 w-10 mr-3">
                    <AvatarImage v-if="member.gravatar_url" :src="member.gravatar_url" :alt="member.display_name" />
                    <AvatarFallback :style="{ backgroundColor: getAvatarColor(member) }" class="text-white font-medium">
                      {{ getInitial(member) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ member.display_name || '—' }}</span>
                      <Crown v-if="member.is_admin" class="h-3 w-3 text-amber-600" />
                    </div>
                    <div class="text-xs text-muted-foreground">{{ member.email || '—' }}</div>
                  </div>
                </div>
              </TableCell>
              
              <!-- Role -->
              <TableCell @click.stop>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" class="px-1" :disabled="updatingRoleMemberId === member.id">
                      {{ getRoleDisplayName(member.organization_role) }}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      v-for="role in roleOptions"
                      :key="role.value"
                      @click="updateMemberRole(member, role.value)"
                    >
                      <Check v-if="member.organization_role === role.value" class="h-4 w-4 mr-2" />
                      <span v-else class="w-4 mr-2"></span>
                      {{ role.title }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              
              <!-- Joined -->
              <TableCell>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{{ formatAge(member.created) }}</span>
                  </TooltipTrigger>
                  <TooltipContent>{{ formatDateTime(member.created) }}</TooltipContent>
                </Tooltip>
              </TableCell>
              
              <!-- Last seen -->
              <TableCell>
                <Tooltip v-if="member.last_seen">
                  <TooltipTrigger asChild>
                    <span>{{ formatAge(member.last_seen) }}</span>
                  </TooltipTrigger>
                  <TooltipContent>{{ formatDateTime(member.last_seen) }}</TooltipContent>
                </Tooltip>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <!-- Bottom pagination -->
      <div v-if="totalPages > 1" class="flex justify-end items-center mt-4">
        <Button variant="ghost" size="icon" :disabled="page <= 1" @click="prevPage">
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm mx-2">Page {{ page }} of {{ totalPages }}</span>
        <Button variant="ghost" size="icon" :disabled="page >= totalPages" @click="nextPage">
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- No results -->
    <div v-else class="text-center text-muted-foreground py-8">
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

import { Search, X, ChevronDown, Check, Download, ArrowDown, ArrowUp, Crown, ChevronLeft, ChevronRight } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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

<style scoped>
.members-table th.sortable:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
.members-table th.sorted {
  color: hsl(var(--primary));
}
</style>
