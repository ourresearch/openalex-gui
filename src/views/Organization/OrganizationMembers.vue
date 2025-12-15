<template>
  <div>
    <!-- Page title -->
    <h1 class="text-xl font-bold mb-4">Members</h1>

    <!-- Controls row: Search, Filters, Export -->
    <div class="flex items-center gap-3 mb-4">
      <!-- Search field -->
      <div class="relative max-w-[320px] flex-shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localSearchQuery"
          placeholder="Search by name or email"
          class="pl-9 pr-8"
          @input="debouncedSearch"
          @keydown.escape="clearSearch"
        />
        <Button
          v-if="localSearchQuery"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
          @click="clearSearch"
        >
          <X class="h-3 w-3" />
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
            <span class="flex-1">All roles</span>
            <Check v-if="!selectedRole" class="h-4 w-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            v-for="role in roleOptions"
            :key="role.value"
            @click="selectRoleFilter(role.value)"
          >
            <span class="flex-1">{{ role.title }}</span>
            <Check v-if="selectedRole === role.value" class="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="flex-1"></div>

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

    <!-- Error alert -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Results info and table -->
    <div v-if="filteredMembers.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-sm text-muted-foreground">
          Showing {{ filteredMembers.length }} of {{ allMembers.length }} members
        </span>
      </div>

      <!-- Members table -->
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              class="cursor-pointer hover:bg-accent"
              :class="{ 'text-primary': sortField === 'name' }"
              @click="toggleSort('name')"
            >
              Member
              <ArrowDown v-if="sortField === 'name' && sortDesc" class="h-3 w-3 ml-1 inline" />
              <ArrowUp v-if="sortField === 'name' && !sortDesc" class="h-3 w-3 ml-1 inline" />
            </TableHead>
            <TableHead>Role</TableHead>
            <TableHead 
              class="cursor-pointer hover:bg-accent"
              :class="{ 'text-primary': sortField === 'created' }"
              @click="toggleSort('created')"
            >
              Joined
              <ArrowDown v-if="sortField === 'created' && sortDesc" class="h-3 w-3 ml-1 inline" />
              <ArrowUp v-if="sortField === 'created' && !sortDesc" class="h-3 w-3 ml-1 inline" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="member in paginatedMembers" 
            :key="member.id"
            class="cursor-pointer hover:bg-accent/50"
            @click="openMemberDetail(member.id)"
          >
            <!-- Member (avatar + name + email) -->
            <TableCell>
              <div class="flex items-center py-2">
                <Avatar class="h-10 w-10 mr-3" :style="{ backgroundColor: getAvatarColor(member) }">
                  <AvatarImage 
                    v-if="member.gravatar_url" 
                    :src="member.gravatar_url"
                    :alt="member.display_name"
                  />
                  <AvatarFallback class="text-white font-medium">
                    {{ getInitial(member) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ member.display_name || '—' }}</span>
                    <Crown v-if="member.is_admin" class="h-3 w-3 text-amber-500" />
                  </div>
                  <div class="text-xs text-muted-foreground">{{ member.email || '—' }}</div>
                </div>
              </div>
            </TableCell>
            
            <!-- Role -->
            <TableCell>
              <Badge
                v-if="member.organization_role === 'owner'"
                variant="secondary"
              >
                Owner
              </Badge>
              <span v-else class="capitalize">{{ member.organization_role || 'Member' }}</span>
            </TableCell>
            
            <!-- Joined -->
            <TableCell>
              <Tooltip>
                <TooltipTrigger>
                  <span>{{ formatAge(member.created) }}</span>
                </TooltipTrigger>
                <TooltipContent>{{ formatDateTime(member.created) }}</TooltipContent>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Bottom pagination -->
      <div v-if="totalPages > 1" class="flex justify-end items-center mt-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          :disabled="page <= 1"
          @click="prevPage"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm">Page {{ page }} of {{ totalPages }}</span>
        <Button
          variant="ghost"
          size="icon"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
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

import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, ArrowDown, ArrowUp, Download, Crown, AlertCircle } from 'lucide-vue-next';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { exportArrayToCsv } from '@/utils/csvExport';

defineOptions({ name: 'OrganizationMembers' });

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const route = useRoute();
const router = useRouter();
const store = useStore();

// State
const error = ref('');
const loading = ref(false);
const exporting = ref(false);
const localSearchQuery = ref(route.query.q || '');

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
  if (localSearchQuery.value.trim()) {
    const q = localSearchQuery.value.toLowerCase().trim();
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
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: localSearchQuery.value || undefined });
  }, 300);
}

function clearSearch() {
  localSearchQuery.value = '';
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
    ];
    
    const orgName = props.organization?.name || 'members';
    const filename = `${orgName.replace(/[^a-z0-9]/gi, '_')}_members_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = exportArrayToCsv(filteredMembers.value, columns, filename);
    
    store.commit('snackbar', `Exported ${count} members.`);
  } catch (e) {
    console.error('Failed to export members:', e);
    error.value = 'Failed to export members.';
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

// Sync local search with URL
watch(
  () => route.query.q,
  (q) => {
    localSearchQuery.value = q || '';
  },
  { immediate: true }
);
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
