<template>
  <div>
    <!-- Page title -->
    <h1 class="text-xl font-bold mb-4">Organizations</h1>
    
    <!-- Controls row: Search, Filters, Export, Create -->
    <div class="flex items-center gap-3 mb-4">
      <!-- Search field -->
      <div class="relative max-w-[320px] flex-shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localSearchQuery"
          placeholder="Search by name or domain"
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

      <div class="flex-1"></div>

      <!-- Export CSV button -->
      <Button
        variant="outline"
        size="sm"
        :disabled="exporting"
        @click="exportOrganizations"
      >
        <Download class="h-4 w-4 mr-1" />
        Export CSV
      </Button>

      <!-- Create organization button -->
      <Button size="sm" @click="openCreateDialog">
        New Organization
      </Button>
    </div>

    <!-- Error alert -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Results info and table -->
    <div v-if="organizations.length || loading || localSearchQuery">
      <!-- Info row -->
      <div class="mb-2">
        <span class="text-sm text-muted-foreground">
          Showing {{ showingStart }}-{{ showingEnd }} of {{ totalCount }} organizations
        </span>
      </div>

      <!-- Organizations table -->
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead 
                class="cursor-pointer hover:bg-accent"
                :class="{ 'text-primary': sortField === 'member_count' }"
                @click="toggleSort('member_count')"
              >
                Members
                <ArrowDown v-if="sortField === 'member_count' && sortDesc" class="h-3 w-3 ml-1 inline" />
                <ArrowUp v-if="sortField === 'member_count' && !sortDesc" class="h-3 w-3 ml-1 inline" />
              </TableHead>
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
              v-for="org in organizations" 
              :key="org.id"
              class="cursor-pointer hover:bg-accent/50"
              @click="openOrgDetail(org.id)"
            >
              <!-- Organization (name + domains) -->
              <TableCell>
                <div class="py-2">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ org.name || '—' }}</span>
                  </div>
                  <div v-if="org.domains && org.domains.length" class="text-xs text-muted-foreground">
                    {{ org.domains.join(', ') }}
                  </div>
                </div>
              </TableCell>
              
              <!-- Plan -->
              <TableCell @click.stop>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="px-1 min-w-0"
                      :disabled="updatingPlanOrgId === org.id"
                    >
                      {{ getPlanDisplayName(org.plan) || '—' }}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      v-for="plan in availablePlans"
                      :key="plan.name"
                      @click="updateOrgPlan(org, plan.name)"
                    >
                      {{ plan.display_name }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator v-if="org.plan" />
                    <DropdownMenuItem
                      v-if="org.plan"
                      @click="updateOrgPlan(org, null)"
                      class="text-muted-foreground"
                    >
                      Remove plan
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              
              <!-- Members count -->
              <TableCell>{{ org.members ? org.members.length : 0 }}</TableCell>
              
              <!-- Created -->
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    <span>{{ formatAge(org.created) }}</span>
                  </TooltipTrigger>
                  <TooltipContent>{{ formatDateTime(org.created) }}</TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

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
      No organizations found.
    </div>

    <!-- Create Organization Dialog -->
    <Dialog v-model:open="createDialogOpen">
      <DialogContent class="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <Alert v-if="createError" variant="destructive" class="mb-4">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ createError }}</AlertDescription>
        </Alert>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label>Name</Label>
            <Input v-model="newOrg.name" :disabled="createLoading" />
          </div>
          <div class="space-y-2">
            <Label>Plan (optional)</Label>
            <Select v-model="newOrg.plan" :disabled="createLoading">
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
          <Button @click="createOrganization" :disabled="!canCreateOrg || createLoading">
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

import { Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, ArrowDown, ArrowUp, Download, AlertCircle } from 'lucide-vue-next';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { urlBase, axiosConfig } from '@/apiConfig';
import { exportToCsv } from '@/utils/csvExport';

defineOptions({ name: 'AdminOrganizations' });

const store = useStore();
const route = useRoute();
const router = useRouter();

// State
const organizations = ref([]);
const error = ref('');
const loading = ref(false);
const searched = ref(false);
const exporting = ref(false);

// Local search query (for v-model)
const localSearchQuery = ref('');

// Plan filter
const availablePlans = ref([]);

// Plan update loading state
const updatingPlanOrgId = ref(null);

// Create organization dialog
const createDialogOpen = ref(false);
const createLoading = ref(false);
const createError = ref('');
const newOrg = ref({
  name: '',
  plan: null
});

const canCreateOrg = computed(() => {
  return newOrg.value.name?.trim();
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

// Computed
const showingStart = computed(() => {
  if (totalCount.value === 0) return 0;
  return (page.value - 1) * perPage.value + 1;
});

const showingEnd = computed(() => {
  return Math.min(page.value * perPage.value, totalCount.value);
});

// Methods
async function fetchOrganizations() {
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

    const res = await axios.get(
      `${urlBase.userApi}/organizations?${params.toString()}`,
      axiosConfig({ userAuth: true })
    );

    organizations.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    searched.value = true;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch organizations.';
    organizations.value = [];
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
  if ('q' in params || 'plan' in params) {
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

function toggleSort(field) {
  if (sortField.value === field) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortField.value = field;
    sortDesc.value = true;
  }
  page.value = 1;
  fetchOrganizations();
}

function prevPage() {
  if (page.value > 1) {
    page.value--;
    fetchOrganizations();
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
    fetchOrganizations();
  }
}

function openOrgDetail(orgId) {
  router.push(`/admin/organizations/${orgId}`);
}

// Create organization dialog functions
function openCreateDialog() {
  createDialogOpen.value = true;
  createError.value = '';
  newOrg.value = {
    name: '',
    plan: null
  };
}

function closeCreateDialog() {
  createDialogOpen.value = false;
}

async function createOrganization() {
  createLoading.value = true;
  
  try {
    const payload = {
      name: newOrg.value.name.trim()
    };
    
    if (newOrg.value.plan) {
      payload.plan = newOrg.value.plan;
    }
    
    await axios.post(
      `${urlBase.userApi}/organizations`,
      payload,
      axiosConfig({ userAuth: true })
    );
    
    closeCreateDialog();
    store.commit('snackbar', 'Organization created.');
    await fetchOrganizations();
  } catch (e) {
    console.error('Failed to create organization:', e);
    createError.value = e?.response?.data?.message || 'Failed to create organization.';
  } finally {
    createLoading.value = false;
  }
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

function getPlanDisplayName(planName) {
  if (!planName) return '';
  const plan = availablePlans.value.find(p => p.name === planName);
  return plan?.display_name || planName;
}

function getPlanColor(plan) {
  if (!plan) return 'default';
  const colors = {
    '1M-daily': 'blue',
    '2M-daily': 'purple',
    'academic-waiver': 'green',
  };
  return colors[plan] || 'default';
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

async function updateOrgPlan(org, planName) {
  updatingPlanOrgId.value = org.id;
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${org.id}`,
      { plan: planName },
      axiosConfig({ userAuth: true })
    );
    // Update the org in the list immediately
    org.plan = planName;
    store.commit('snackbar', planName ? 'Plan updated.' : 'Plan removed.');
  } catch (e) {
    console.error('Failed to update plan:', e);
    error.value = e?.response?.data?.message || 'Failed to update plan.';
  } finally {
    updatingPlanOrgId.value = null;
  }
}

function selectPlanFilter(planId) {
  selectedPlan.value = planId;
}

function clearPlanFilter() {
  selectedPlan.value = null;
}

// Export organizations to CSV
async function exportOrganizations() {
  exporting.value = true;
  
  try {
    const params = {
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
      { key: 'name', label: 'Name' },
      { key: 'domains', label: 'Domains', transform: (val) => val?.join(', ') || '' },
      { key: 'plan', label: 'Plan', transform: (val) => getPlanDisplayName(val) || '' },
      { key: 'ror_id', label: 'ROR ID' },
      { key: 'members', label: 'Members', transform: (val) => val?.length || 0 },
      { key: 'created', label: 'Created' },
    ];
    
    const filename = `organizations_${new Date().toISOString().split('T')[0]}.csv`;
    
    const count = await exportToCsv({
      url: `${urlBase.userApi}/organizations`,
      params,
      columns,
      filename,
      perPage: 100,
      maxPages: 100,
    });
    
    store.commit('snackbar', `Exported ${count} organizations.`);
  } catch (e) {
    console.error('Failed to export organizations:', e);
    error.value = 'Failed to export organizations.';
  } finally {
    exporting.value = false;
  }
}

// Watch route query changes and fetch organizations
watch(
  () => route.query,
  () => {
    fetchOrganizations();
  },
  { deep: true }
);

// Sync local search with URL
watch(() => route.query.q, (val) => {
  localSearchQuery.value = val || '';
}, { immediate: true });

// Load organizations on mount
onMounted(() => {
  localSearchQuery.value = route.query.q || '';
  fetchPlans();
  fetchOrganizations();
});
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
