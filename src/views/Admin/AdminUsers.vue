<template>
  <div>
    <!-- Page title -->
    <h1 class="text-xl font-bold mb-4">Users</h1>
    
    <!-- Controls row: Search, Filters, Export, Create -->
    <div class="flex items-center gap-3 mb-4">
      <!-- Search field (always visible, Linear-style) -->
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

      <!-- Plan filter button -->
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {{ selectedPlan ? getPlanDisplayName(selectedPlan) : 'All plans' }}
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="clearPlanFilter">
            <span class="flex-1">All plans</span>
            <Check v-if="!selectedPlan" class="h-4 w-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            v-for="plan in availablePlans"
            :key="plan.name"
            @click="selectPlanFilter(plan.name)"
          >
            <span class="flex-1">{{ plan.display_name }}</span>
            <Check v-if="selectedPlan === plan.name" class="h-4 w-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Organization filter button -->
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {{ selectedOrg ? selectedOrg.name : 'All organizations' }}
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-[280px] p-2">
          <Input
            v-model="orgSearchQuery"
            placeholder="Search organizations..."
            @input="onOrgSearch($event.target.value)"
          />
          <div v-if="orgSearchLoading" class="py-2 text-center">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
          </div>
          <div v-else class="mt-2 max-h-[200px] overflow-y-auto">
            <button
              v-for="org in orgSearchResults"
              :key="org.id"
              class="w-full text-left px-2 py-1.5 text-sm hover:bg-accent rounded"
              @click="onOrgSelect(org)"
            >
              {{ org.name }}
              <div v-if="org.domains?.length" class="text-xs text-muted-foreground">
                {{ org.domains.join(', ') }}
              </div>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <div class="flex-1"></div>

      <!-- Create user button -->
      <Button size="sm" @click="openCreateDialog">
        New User
      </Button>
    </div>

    <!-- Error alert -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Results info and table -->
    <div v-if="users.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-sm text-muted-foreground">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} users
        </span>
      </div>

      <!-- Users table -->
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              class="cursor-pointer hover:bg-accent"
              :class="{ 'text-primary': sortField === 'name' }"
              @click="toggleSort('name')"
            >
              User
              <ArrowDown v-if="sortField === 'name' && sortDesc" class="h-3 w-3 ml-1 inline" />
              <ArrowUp v-if="sortField === 'name' && !sortDesc" class="h-3 w-3 ml-1 inline" />
            </TableHead>
            <TableHead>Organization</TableHead>
            <TableHead 
              class="cursor-pointer hover:bg-accent"
              :class="{ 'text-primary': sortField === 'created' }"
              @click="toggleSort('created')"
            >
              Created
              <ArrowDown v-if="sortField === 'created' && sortDesc" class="h-3 w-3 ml-1 inline" />
              <ArrowUp v-if="sortField === 'created' && !sortDesc" class="h-3 w-3 ml-1 inline" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="user in users" 
            :key="user.id"
            class="cursor-pointer hover:bg-accent/50"
            @click="openUserPanel(user.id)"
          >
            <!-- User (avatar + name + email) -->
            <TableCell>
              <div class="flex items-center py-2">
                <Avatar class="h-10 w-10 mr-3" :style="{ backgroundColor: getAvatarColor(user) }">
                  <AvatarImage 
                    v-if="user.gravatar_url" 
                    :src="user.gravatar_url"
                    :alt="user.display_name"
                  />
                  <AvatarFallback class="text-white font-medium">
                    {{ getInitial(user) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ user.display_name || '—' }}</span>
                    <Crown v-if="user.is_admin" class="h-3 w-3 text-amber-500" />
                    <Badge
                      v-if="user.plan"
                      variant="outline"
                      class="text-[10px] h-[18px]"
                    >
                      {{ getPlanDisplayName(user.plan) }}
                    </Badge>
                  </div>
                  <div class="text-xs text-muted-foreground">{{ user.email || '—' }}</div>
                </div>
              </div>
            </TableCell>
            
            <!-- Organization -->
            <TableCell>{{ user.organization_name || '—' }}</TableCell>
            
            <!-- Age -->
            <TableCell>
              <Tooltip>
                <TooltipTrigger>
                  <span>{{ formatAge(user.created) }}</span>
                </TooltipTrigger>
                <TooltipContent>{{ formatDateTime(user.created) }}</TooltipContent>
              </Tooltip>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- Bottom pagination -->
      <div class="flex justify-end items-center mt-4 gap-2">
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
    <div v-else-if="searched && !loading" class="text-center text-muted-foreground py-8">
      No users found.
    </div>

    <!-- Create User Dialog -->
    <Dialog v-model:open="createDialogOpen">
      <DialogContent class="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <Alert v-if="createError" variant="destructive" class="mb-4">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ createError }}</AlertDescription>
        </Alert>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Name</Label>
            <Input v-model="newUser.name" :disabled="createLoading" />
          </div>
          <div class="space-y-2">
            <Label>Email</Label>
            <Input v-model="newUser.email" :disabled="createLoading" />
          </div>
          <div class="space-y-2">
            <Label>Organization (optional)</Label>
            <Input 
              v-model="newUserOrgQuery" 
              placeholder="Search organizations..."
              :disabled="createLoading"
              @input="onNewUserOrgSearch($event.target.value)"
            />
            <div v-if="newUserOrgResults.length" class="border rounded max-h-[150px] overflow-y-auto">
              <button
                v-for="org in newUserOrgResults"
                :key="org.id"
                class="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                @click="newUser.organization = org; newUserOrgQuery = org.name"
              >
                {{ org.name }}
              </button>
            </div>
          </div>
          <div v-if="newUser.organization" class="space-y-2">
            <Label>Role</Label>
            <Select v-model="newUser.role" :disabled="createLoading">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>Plan (optional)</Label>
            <Select v-model="newUser.plan" :disabled="createLoading">
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="plan in availablePlans" :key="plan.name" :value="plan.name">
                  {{ plan.display_name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCreateDialog" :disabled="createLoading">Cancel</Button>
          <Button @click="createUser" :disabled="!canCreateUser || createLoading">
            <template v-if="createLoading">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            </template>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';

import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, ArrowDown, ArrowUp, Crown, AlertCircle } from 'lucide-vue-next';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { urlBase, axiosConfig } from '@/apiConfig';
import { exportToCsv } from '@/utils/csvExport';

defineOptions({ name: 'AdminUsers' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const users = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const exporting = ref(false);

// Local search query (for v-model)
const localSearchQuery = ref('');

// Plan filter
const availablePlans = ref([]);

// Organization filter
const orgSearchResults = ref([]);
const orgSearchLoading = ref(false);
const orgSearchQuery = ref('');
const selectedOrg = ref(null);
let orgSearchTimer = null;

// Computed for active filters
const hasActiveFilters = computed(() => {
  return selectedPlan.value || selectedOrg.value;
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (selectedPlan.value) count++;
  if (selectedOrg.value) count++;
  return count;
});

// Create user dialog
const createDialogOpen = ref(false);
const createLoading = ref(false);
const createError = ref('');
const newUser = ref({
  name: '',
  email: '',
  organization: null,
  role: 'member',
  plan: null
});
const newUserOrgResults = ref([]);
const newUserOrgLoading = ref(false);
const newUserOrgQuery = ref('');
let newUserOrgTimer = null;
const roleOptions = [
  { title: 'Member', value: 'member' },
  { title: 'Owner', value: 'owner' }
];

const canCreateUser = computed(() => {
  return newUser.value.name?.trim() && newUser.value.email?.trim();
});

// URL-synced state (computed from route query)
const searchQuery = computed({
  get: () => route.query.q || '',
  set: (val) => updateUrlParams({ q: val || undefined })
});

const selectedPlan = computed({
  get: () => route.query.plan || null,
  set: (val) => updateUrlParams({ plan: val || undefined })
});

// Selected organization (URL-synced)
const selectedOrgId = computed({
  get: () => route.query.org || null,
  set: (val) => updateUrlParams({ org: val || undefined })
});

// Pagination
const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

// Sorting
const sortField = ref('created');
const sortDesc = ref(true);

// Debounce timer
let debounceTimer = null;

// Avatar colors for users without gravatar
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

// Computed
const showingStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(page.value * perPage.value, totalCount.value);
});

// Methods
async function fetchUsers() {
  error.value = '';
  loading.value = true;

  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      per_page: perPage.value.toString(),
      sort: sortField.value,
      desc: sortDesc.value.toString(),
    });

    if (searchQuery.value.trim()) {
      params.set('q', searchQuery.value.trim());
    }

    if (selectedPlan.value) {
      params.set('plan', selectedPlan.value);
    }

    if (selectedOrgId.value) {
      params.set('organization_id', selectedOrgId.value);
    }

    const res = await axios.get(
      `${urlBase.userApi}/users?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    users.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    searched.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch users.';
    users.value = [];
  } finally {
    loading.value = false;
  }
}

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
  if ('q' in params || 'plan' in params || 'org' in params) {
    delete newQuery.page;
  }
  router.replace({ query: newQuery });
}

function debouncedSearch() {
  loading.value = true;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    updateUrlParams({ q: localSearchQuery.value || undefined });
  }, 300);
}

function clearSearch() {
  localSearchQuery.value = '';
  updateUrlParams({ q: undefined });
}

function clearAllFilters() {
  selectedPlan.value = null;
  selectedOrg.value = null;
  selectedOrgId.value = null;
}

function toggleSort(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = true;
  }
  page.value = 1;
  fetchUsers();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchUsers();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchUsers();
  }
}

function openUserPanel(userId) {
  router.push(`/admin/users/${userId}`);
}

// Create user dialog functions
function openCreateDialog() {
  createDialogOpen.value = true;
  createError.value = '';
  newUser.value = {
    name: '',
    email: '',
    organization: null,
    role: 'member',
    plan: null
  };
  newUserOrgResults.value = [];
  newUserOrgQuery.value = '';
}

function closeCreateDialog() {
  createDialogOpen.value = false;
}

function onNewUserOrgSearch(val) {
  newUserOrgQuery.value = val || '';
  clearTimeout(newUserOrgTimer);
  
  if (!val || !val.trim()) {
    newUserOrgResults.value = [];
    newUserOrgLoading.value = false;
    return;
  }
  
  newUserOrgLoading.value = true;
  
  newUserOrgTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      newUserOrgResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      newUserOrgResults.value = [];
    } finally {
      newUserOrgLoading.value = false;
    }
  }, 300);
}

async function createUser() {
  createLoading.value = true;
  
  try {
    const payload = {
      display_name: newUser.value.name.trim(),
      email: newUser.value.email.trim()
    };
    
    if (newUser.value.organization) {
      payload.organization_id = newUser.value.organization.id;
      payload.organization_role = newUser.value.role;
    }
    
    if (newUser.value.plan) {
      payload.plan = newUser.value.plan;
    }
    
    await axios.post(
      `${urlBase.userApi}/admin/users`,
      payload,
      axiosConfig({ userAuth: true })
    );
    
    closeCreateDialog();
    store.commit('snackbar', 'User created.');
    await fetchUsers();
  } catch (e) {
    console.error('Failed to create user:', e);
    createError.value = e?.response?.data?.message || 'Failed to create user.';
  } finally {
    createLoading.value = false;
  }
}


function getInitial(user) {
  if (user.display_name) return user.display_name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(user) {
  // Generate consistent color based on user id or email
  const str = user.id || user.email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  // If the date string doesn't have timezone info, treat it as UTC
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

function getExpiryTooltip(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 0) {
    return 'Expires today';
  } else if (diffDays === 1) {
    return 'Expires in 1 day';
  } else if (diffDays < 30) {
    return `Expires in ${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.round(diffDays / 30);
    return `Expires in ${months} month${months !== 1 ? 's' : ''}`;
  } else {
    const years = Math.round(diffDays / 365);
    return `Expires in ${years} year${years !== 1 ? 's' : ''}`;
  }
}

function getPlanDisplayName(planName) {
  if (!planName) return '';
  const plan = availablePlans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

function getPlanColor(plan) {
  const planColors = {
    'starter': 'grey',
    '1M-daily': 'primary',
    '2M-daily': 'primary',
    'academic-waiver': 'info',
  };
  return planColors[plan] || 'grey';
}

async function fetchPlans() {
  try {
    const res = await axios.get(
      `${urlBase.userApi}/plans`,
      axiosConfig({ userAuth: true })
    );
    availablePlans.value = res.data.results || [];
  } catch (e) {
    console.error('Failed to fetch plans:', e);
  }
}

function selectPlanFilter(planId) {
  selectedPlan.value = planId;
}

function clearPlanFilter() {
  selectedPlan.value = null;
}

// Organization filter functions
function onOrgSearch(val) {
  orgSearchQuery.value = val || '';
  clearTimeout(orgSearchTimer);
  
  if (!val || !val.trim()) {
    orgSearchResults.value = [];
    orgSearchLoading.value = false;
    return;
  }
  
  orgSearchLoading.value = true;
  
  orgSearchTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      orgSearchResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      orgSearchResults.value = [];
    } finally {
      orgSearchLoading.value = false;
    }
  }, 300);
}

function onOrgSelect(org) {
  if (org) {
    selectedOrgId.value = org.id;
    selectedOrg.value = org;
  } else {
    selectedOrgId.value = null;
    selectedOrg.value = null;
  }
}

function clearOrgFilter() {
  selectedOrgId.value = null;
  selectedOrg.value = null;
  orgSearchResults.value = [];
}

// Export users to CSV
async function exportUsers() {
  if (!selectedOrgId.value) return;
  
  exporting.value = true;
  
  try {
    const params = {
      organization_id: selectedOrgId.value,
      sort: sortField.value,
      desc: sortDesc.value.toString(),
    };
    
    if (localSearchQuery.value.trim()) {
      params.q = localSearchQuery.value.trim();
    }
    
    if (selectedPlan.value) {
      params.plan = selectedPlan.value;
    }
    
    const columns = [
      { key: 'display_name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'organization_role', label: 'Role' },
      { key: 'plan', label: 'Plan', transform: (val) => getPlanDisplayName(val) || '' },
      { key: 'api_key', label: 'API Key' },
      { key: 'created', label: 'Created' },
      { key: 'last_seen', label: 'Last Seen' },
    ];
    
    const orgName = selectedOrg.value?.name || 'users';
    const filename = `${orgName.replace(/[^a-z0-9]/gi, '_')}_users_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = await exportToCsv({
      url: `${urlBase.userApi}/users`,
      params,
      columns,
      filename,
      perPage: 100,
      maxPages: 100,
    });
    
    store.commit('snackbar', `Exported ${count} users.`);
  } catch (e) {
    console.error('Failed to export users:', e);
    error.value = 'Failed to export users.';
  } finally {
    exporting.value = false;
  }
}

async function fetchOrgIfNeeded() {
  // If we have an org ID in URL but no selectedOrg, fetch it
  if (selectedOrgId.value && !selectedOrg.value) {
    try {
      const res = await axios.get(
        `${urlBase.userApi}/organizations/${selectedOrgId.value}`,
        axiosConfig({ userAuth: true })
      );
      selectedOrg.value = res.data;
    } catch (e) {
      console.error('Failed to fetch organization:', e);
    }
  }
}

// Watch route query changes and fetch users
watch(
  () => route.query,
  () => {
    fetchUsers();
  },
  { deep: true }
);

// Sync local search with URL
watch(() => route.query.q, (val) => {
  localSearchQuery.value = val || '';
}, { immediate: true });

// Load plans and users on mount
onMounted(() => {
  localSearchQuery.value = route.query.q || '';
  fetchPlans();
  fetchOrgIfNeeded();
  fetchUsers();
});
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
