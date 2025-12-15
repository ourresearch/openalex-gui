<template>
  <div class="py-0 sm:py-12 min-h-[70vh]" ref="scrollContainer">
    <div v-if="!isAdmin" class="container mx-auto max-w-[600px] mt-24">
      <Alert>
        <AlertCircle class="h-4 w-4" />
        <AlertDescription>This page is available to OpenAlex admins only.</AlertDescription>
      </Alert>
    </div>
    
    <div v-else class="container mx-auto px-0 sm:px-4">
      <h1 class="text-3xl font-bold mb-6">Curation Moderation</h1>

      <!-- Filters -->
      <div class="mb-1 flex items-center gap-1">
        <!-- Status Filter -->
        <Popover v-model:open="statusMenu">
          <PopoverTrigger asChild>
            <Button v-if="statusFilter === 'all'" variant="outline" class="text-muted-foreground">
              Status
              <ChevronDown class="h-4 w-4 ml-1" />
            </Button>
            <Button v-else variant="outline">
              {{ statusDisplayNames[statusFilter] }}
              <X class="h-4 w-4 ml-1" @click.stop="statusFilter = 'all'" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px]">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-semibold">Status</h4>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="statusMenu = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <RadioGroup v-model="statusFilter">
              <div class="flex items-center space-x-2"><RadioGroupItem value="all" id="status-all" /><Label for="status-all">All</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="needs-moderation" id="status-needs" /><Label for="status-needs">Needs Moderation</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="approved" id="status-approved" /><Label for="status-approved">Approved</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="denied" id="status-denied" /><Label for="status-denied">Denied</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="live" id="status-live" /><Label for="status-live">Live</Label></div>
            </RadioGroup>
          </PopoverContent>
        </Popover>

        <!-- Entity Filter -->
        <Popover v-model:open="entityMenu">
          <PopoverTrigger asChild>
            <Button v-if="entityFilter === 'all'" variant="outline" class="text-muted-foreground">
              Entity Type
              <ChevronDown class="h-4 w-4 ml-1" />
            </Button>
            <Button v-else variant="outline">
              {{ entityFilter === 'locations' ? 'Works' : 'Sources' }}
              <X class="h-4 w-4 ml-1" @click.stop="entityFilter = 'all'" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px]">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-semibold">Entity Type</h4>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="entityMenu = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <RadioGroup v-model="entityFilter">
              <div class="flex items-center space-x-2"><RadioGroupItem value="all" id="entity-all" /><Label for="entity-all">All</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="locations" id="entity-works" /><Label for="entity-works">Works</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="sources" id="entity-sources" /><Label for="entity-sources">Sources</Label></div>
            </RadioGroup>
          </PopoverContent>
        </Popover>

        <!-- Property Filter -->
        <Popover v-model:open="propertyMenu">
          <PopoverTrigger asChild>
            <Button v-if="propertyFilter === 'all'" variant="outline" class="text-muted-foreground">
              Property
              <ChevronDown class="h-4 w-4 ml-1" />
            </Button>
            <Button v-else variant="outline">
              {{ propertyFilter }}
              <X class="h-4 w-4 ml-1" @click.stop="propertyFilter = 'all'" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[300px]">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-semibold">Property</h4>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="propertyMenu = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <RadioGroup v-model="propertyFilter">
              <div class="flex items-center space-x-2"><RadioGroupItem value="all" id="prop-all" /><Label for="prop-all">All</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="pdf_url" id="prop-pdf" /><Label for="prop-pdf">pdf_url</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="landing_page_url" id="prop-landing" /><Label for="prop-landing">landing_page_url</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="license" id="prop-license" /><Label for="prop-license">license</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="is_oa" id="prop-isoa" /><Label for="prop-isoa">is_oa</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="display_name" id="prop-name" /><Label for="prop-name">display_name</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="type" id="prop-type" /><Label for="prop-type">type</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="homepage_url" id="prop-homepage" /><Label for="prop-homepage">homepage_url</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="host_organization" id="prop-host" /><Label for="prop-host">host_organization</Label></div>
              <div class="flex items-center space-x-2"><RadioGroupItem value="oa_flip_year" id="prop-flip" /><Label for="prop-flip">oa_flip_year</Label></div>
            </RadioGroup>
          </PopoverContent>
        </Popover>

        <!-- Submitter Filter -->
        <Popover v-model:open="submitterMenu">
          <PopoverTrigger asChild>
            <Button v-if="!submitterEmailFilter" variant="outline" class="text-muted-foreground">
              Submitter
              <ChevronDown class="h-4 w-4 ml-1" />
            </Button>
            <Button v-else variant="outline">
              {{ submitterEmailFilter }}
              <X class="h-4 w-4 ml-1" @click.stop="clearEmailFilter" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[350px]">
            <div class="flex justify-between items-center mb-4">
              <h4 class="font-semibold">Submitter</h4>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="submitterMenu = false">
                <X class="h-4 w-4" />
              </Button>
            </div>
            <Input
              v-model="submitterEmailInput"
              placeholder="Enter email address"
              class="mb-3"
            />
            <div class="flex justify-end gap-2">
              <Button variant="ghost" @click="submitterMenu = false">Cancel</Button>
              <Button :disabled="submitterEmailInput === ''" @click="applyEmailFilter">Filter</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- Result Count and Sort -->
      <div class="flex items-center pb-1 px-4">
        <div v-if="curations.length > 0" class="text-sm text-muted-foreground">
          {{ resultsRangeText }}
        </div>

        <div class="flex-1"></div>

        <!-- Sort -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" class="text-muted-foreground">
              Sort: {{ sortOrder === 'desc' ? 'Newest' : 'Oldest' }}
              <ChevronDown class="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-[150px]">
            <DropdownMenuItem @click="sortOrder = 'desc'">
              <Check v-if="sortOrder === 'desc'" class="h-4 w-4 mr-2" />
              <span v-else class="w-4 mr-2"></span>
              Newest
            </DropdownMenuItem>
            <DropdownMenuItem @click="sortOrder = 'asc'">
              <Check v-if="sortOrder === 'asc'" class="h-4 w-4 mr-2" />
              <span v-else class="w-4 mr-2"></span>
              Oldest
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card class="p-4 pt-0">   
        <div>
          <div v-if="curations.length > 0">
            <!-- Bulk Actions -->
            <div v-if="selectedRows.length > 0" class="bulk-actions-row px-4 py-2 bg-muted/50 rounded mb-2">
              <div class="flex items-center">
                <span class="text-sm font-medium mr-4">{{ selectedRows.length }} item{{ selectedRows.length > 1 ? 's' : '' }} selected</span>
                <div class="flex items-center gap-2">
                  <Button size="sm" @click="bulkModerate(true)">
                    <Check class="h-4 w-4 mr-1" />
                    Approve Selected
                  </Button>
                  <Button size="sm" variant="ghost" class="text-destructive" @click="bulkModerate(false)">
                    <X class="h-4 w-4 mr-1" />
                    Deny Selected
                  </Button>
                </div>
              </div>
            </div>

            <!-- Data Table -->
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[30px]">
                    <Checkbox 
                      :checked="selectAll" 
                      :indeterminate="isIndeterminate"
                      @update:checked="toggleSelectAll"
                    />
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Live</TableHead>
                  <TableHead class="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in curations" :key="item.id">
                  <TableCell>
                    <Checkbox 
                      v-if="!item.is_live"
                      :checked="selectedRows.includes(item.id)"
                      @update:checked="(checked) => toggleRowSelection(item.id, checked)"
                    />
                  </TableCell>
                  <TableCell>
                    <div v-if="item.status === 'needs-moderation'" class="whitespace-nowrap">
                      <Button size="icon" variant="ghost" class="h-8 w-8 mr-1" @click="moderateCorrection(item.id, true)">
                        <Check class="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" class="h-8 w-8 text-destructive" @click="moderateCorrection(item.id, false)">
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                    <span v-else class="font-medium whitespace-nowrap">
                      <span v-if="item.status === 'approved' && !item.is_live" class="text-green-700"><Check class="h-4 w-4 inline mr-1" />Approved</span>
                      <span v-else-if="item.status === 'denied'" class="text-red-700"><X class="h-4 w-4 inline mr-1" />Denied</span>
                      <span v-else-if="item.status === 'approved' && item.is_live" class="text-blue-700"><Globe class="h-4 w-4 inline mr-1" />Live</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center min-w-0">
                      <FileText v-if="item.entity === 'locations'" class="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
                      <BookOpen v-else class="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
                      <a
                        :href="item.entity === 'locations' ? `https://api.openalex.org/locations/${item.entity_id}?data-version=2` : `https://openalex.org/${item.entity_id}`"
                        target="_blank"
                        class="truncate max-w-[200px] hover:underline"
                      >
                        {{ (item.entity === 'locations' ? item.apiData?.title : item.apiData?.display_name) ?? item.entity_id }}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code v-if="item.property === null && item.create_new && item.entity === 'locations'">new location</code>
                    <code v-else>{{ item.property }}</code>
                  </TableCell>
                  <TableCell>
                    <div class="max-w-[280px]">
                      <!-- New Location -->
                      <template v-if="item.create_new && item.entity === 'locations'">
                        <div class="mb-2">
                          <a :href="JSON.parse(item.property_value).work_id" target="_blank" class="hover:underline">
                            {{ JSON.parse(item.property_value).title }}
                            <ExternalLink class="h-3 w-3 inline ml-1 text-muted-foreground" />
                          </a>
                        </div>
                        <div><code><span class="text-muted-foreground">is_oa:</span> {{ JSON.parse(item.property_value).is_oa }}</code></div>
                        <div v-if="JSON.parse(item.property_value).landing_page_url" class="truncate">
                          <code><span class="text-muted-foreground">landing_page_url:</span> <a :href="JSON.parse(item.property_value).landing_page_url" target="_blank" class="hover:underline">{{ JSON.parse(item.property_value).landing_page_url }}</a></code>
                        </div>
                        <div v-if="JSON.parse(item.property_value).pdf_url" class="truncate">
                          <code><span class="text-muted-foreground">pdf_url:</span> <a :href="JSON.parse(item.property_value).pdf_url" target="_blank" class="hover:underline">{{ JSON.parse(item.property_value).pdf_url }}</a></code>
                        </div>
                        <div v-if="JSON.parse(item.property_value).version">
                          <code><span class="text-muted-foreground">version:</span> {{ JSON.parse(item.property_value).version }}</code>
                        </div>
                        <div v-if="JSON.parse(item.property_value).license">
                          <code><span class="text-muted-foreground">license:</span> {{ JSON.parse(item.property_value).license }}</code>
                        </div>
                        <div class="truncate">
                          <code><span class="text-muted-foreground">source_id:</span> <a :href="JSON.parse(item.property_value).source_id" target="_blank" class="hover:underline">{{ JSON.parse(item.property_value).source_id }}</a></code>
                        </div>
                      </template>
                      <!-- Other Values -->
                      <template v-else>
                        <div>
                          <a v-if="isValidUrl(item.property_value)" :href="item.property_value" target="_blank" class="block truncate font-mono hover:underline">{{ item.property_value }}</a>
                          <span v-else-if="item.property_value === null || item.property_value === ''" class="text-muted-foreground">-</span>
                          <span v-else><code>{{ item.property_value }}</code></span>
                        </div>
                        <div v-if="item.previous_value && ![null, true, false].includes(item.previous_value)" class="mt-1 text-muted-foreground text-xs flex items-center">
                          <span class="mr-1 flex-shrink-0">Now:</span>
                          <a v-if="isValidUrl(item.previous_value)" :href="item.previous_value" target="_blank" class="truncate font-mono hover:underline flex-1 min-w-0">{{ item.previous_value }}</a>
                          <span v-else-if="item.previous_value === null" class="text-muted-foreground">-</span>
                          <span v-else>{{ item.previous_value }}</span>
                        </div>
                      </template>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div class="whitespace-nowrap">{{ getRelativeTime(item.submitted_date) }}</div>
                    <div class="text-muted-foreground text-xs">{{ item.submitter_email }}</div>
                  </TableCell>
                  <TableCell>
                    <span v-if="item.live_date" class="whitespace-nowrap">{{ getRelativeTime(item.live_date) }}</span>
                    <div v-else class="text-muted-foreground text-center">-</div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <MoreVertical class="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem v-if="item.entity === 'sources' && item.apiData?.homepage_url" asChild>
                          <a :href="item.apiData.homepage_url" target="_blank" class="flex items-center">
                            <Home class="h-4 w-4 mr-2" />Source homepage<ExternalLink class="h-3 w-3 ml-auto" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem v-if="item.entity === 'works' && item.apiData?.doi" asChild>
                          <a :href="item.apiData.doi" target="_blank" class="flex items-center">
                            <Home class="h-4 w-4 mr-2" />DOI<ExternalLink class="h-3 w-3 ml-auto" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a :href="`https://openalex.org/${item.entity_id}`" target="_blank" class="flex items-center">
                            <FileText class="h-4 w-4 mr-2" />OpenAlex profile<ExternalLink class="h-3 w-3 ml-auto" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a :href="`https://api.openalex.org/${item.entity_id}?data-version=2`" target="_blank" class="flex items-center">
                            <Code class="h-4 w-4 mr-2" />OpenAlex API<ExternalLink class="h-3 w-3 ml-auto" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <router-link :to="`/curate/${item.entity}/${item.entity_id}`" class="flex items-center">
                            <Pencil class="h-4 w-4 mr-2" />Curate this {{ item.entity === 'works' ? 'work' : 'source' }}
                          </router-link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div v-else-if="isLoading" class="text-center text-muted-foreground py-6">
            <div class="animate-pulse space-y-3">
              <div v-for="i in 10" :key="i" class="h-12 bg-muted rounded"></div>
            </div>
          </div>

          <div v-else-if="curations.length === 0" class="text-center pb-8 pt-12">
            <div v-if="isModerationQueue" class="text-center text-muted-foreground">
              <Trophy class="h-36 w-36 mx-auto mb-4 text-amber-500" />
              <br>
              There are no more requests in need of moderation.
              <br>
              You get a gold star!
            </div>
            <div v-else class="text-muted-foreground">
              No curation requests matched your filters.
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="showPagination" class="mt-8 flex justify-center">
          <Pagination v-slot="{ page: currentPage }" :total="pagination.total" :items-per-page="pagination.per_page" :sibling-count="1" show-edges :default-page="page" @update:page="page = $event">
            <PaginationList v-slot="{ items }" class="flex items-center gap-1">
              <PaginationFirst />
              <PaginationPrev />
              <template v-for="(item, index) in items">
                <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
                  <Button class="w-10 h-10 p-0" :variant="item.value === currentPage ? 'default' : 'outline'">
                    {{ item.value }}
                  </Button>
                </PaginationListItem>
                <PaginationEllipsis v-else :key="item.type" :index="index" />
              </template>
              <PaginationNext />
              <PaginationLast />
            </PaginationList>
          </Pagination>
        </div>
        
      </Card>
    </div>
  </div>


</template>


<script setup>

import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { 
  ChevronDown, X, Check, MoreVertical, Home, FileText, BookOpen, 
  Code, ExternalLink, Pencil, Globe, Trophy, AlertCircle 
} from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Pagination, PaginationList, PaginationListItem, PaginationFirst, PaginationPrev, PaginationNext, PaginationLast, PaginationEllipsis } from '@/components/ui/pagination';

import { useParams } from '@/composables/useStorage';
import { urlBase } from '@/apiConfig';

useHead({ title: 'Unpaywall Curation Moderation' });

const store = useStore();

const correctionsHost = urlBase.correctionsApi;

const curations               = ref([]);
const page                    = useParams('page', 'number', 1);
const perPage                 = useParams('per_page', 'number', 20);
const isLoading               = ref(false);
const selectedRows            = ref([]);
const moderatedOffset          = ref(0);
const pagination              = ref(null);
  
// Filter variables
const entityFilter = useParams('entity', 'string', 'all');
const propertyFilter = useParams('property', 'string', 'all');
const statusFilter = useParams('status', 'string', 'needs-moderation');
const sortOrder = useParams('sort_order', 'string', 'desc');
const submitterEmailFilter = useParams('email', 'string', '');

// Menu states
const entityMenu = ref(false);
const propertyMenu = ref(false);
const statusMenu = ref(false);
const sortMenu = ref(false);
const submitterMenu = ref(false);

// Email input for submitter filter
const submitterEmailInput = ref('');

const isAdmin = computed(() => store.state.user.isAdmin);
const moderatorEmail = computed(() => store.getters['user/userEmail']);

const snackbar = (val) => store.commit('snackbar', val);

const statusDisplayNames = {
  'needs-moderation': 'Needs Moderation',
  'approved': 'Approved',
  'denied': 'Denied',
  'live': 'Live'
};

// Select all functionality
const selectAll = computed({
  get: () => curations.value.length > 0 && selectedRows.value.length === curations.value.length,
  set: (value) => {
    if (value) {
      selectedRows.value = curations.value.filter(item => item.status !== 'live').map(item => item.id);
    } else {
      selectedRows.value = [];
    }
  }
});

const isIndeterminate = computed(() => {
  return selectedRows.value.length > 0 && selectedRows.value.length < curations.value.length;
});

const toggleSelectAll = (checked) => {
  if (checked) {
    selectedRows.value = curations.value.filter(item => !item.is_live).map(item => item.id);
  } else {
    selectedRows.value = [];
  }
};

const toggleRowSelection = (id, checked) => {
  if (checked) {
    if (!selectedRows.value.includes(id)) {
      selectedRows.value.push(id);
    }
  } else {
    selectedRows.value = selectedRows.value.filter(rowId => rowId !== id);
  }
};

const resultsRangeText = computed(() => {
  if (!pagination.value) return '';
  
  const start = pagination.value.offset + 1;
  const end = Math.min(start + curations.value.length - 1, pagination.value.total);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${pagination.value.total.toLocaleString()}`;
});


const headers = [
  { title: '', key: 'checkbox', sortable: false, width: '30px'},
  { title: 'Status', key: 'status'},
  { title: 'Title', key: 'entity_id'},
  { title: 'Property', key: 'property'},
  { title: 'Value', key: 'property_value'},
  { title: 'Submitted', key: 'submitted_date'},
  { title: 'Live', key: 'live_date'},
  { title: '', key: 'dots_menu'},
];

const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diff = now - date;
  
  if (diff < 0) {
    return 'in the future';
  }
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  }
}

const searchOffset = computed(() => {
  const offset = (page.value - 1) * perPage.value - moderatedOffset.value;
  return offset < 0 ? 0 : offset;
});

const getCurations = async () => {
  try {
    isLoading.value = true;
    curations.value = [];
    
    // Build query parameters
    const params = new URLSearchParams({ offset: searchOffset.value });
    
    if (entityFilter.value !== 'all') {
      params.append('entity', entityFilter.value);
    }
    if (propertyFilter.value !== 'all') {
      params.append('property', propertyFilter.value);
    }
    if (statusFilter.value !== 'all') {
      if (statusFilter.value === 'approved') {
        params.append('status', 'approved');
        params.append('is_live', 'false');
      } else if (statusFilter.value === 'live') {
        params.append('is_live', 'true');
      } else {
        params.append('status', statusFilter.value);
      }
    }
    if (submitterEmailFilter.value) {
      params.append('submitter_email', submitterEmailFilter.value);
    }
    if (sortOrder.value !== 'desc') {
      params.append('sort_order', sortOrder.value);
    }
    if (perPage.value !== 20) {
      params.append('per_page', perPage.value);
    }
    
    const response = await axios.get(`${correctionsHost}/v2/corrections?${params.toString()}`);
    
    curations.value = response.data.results;
    pagination.value = response.data.pagination;

  } catch (error) {
    console.error('Search failed:', error);
    curations.value = [];
    pagination.value = null;
  }
  isLoading.value = false;
};

const showPagination = computed(() => {
  return pagination.value && pagination.value.total > 0 
    && (pagination.value.total > pagination.value.per_page || pagination.value.offset !== 0);
});

const isModerationQueue = computed(() => {
  return entityFilter.value === 'all' && 
    propertyFilter.value === 'all' && 
    statusFilter.value === 'needs-moderation' && 
    submitterEmailFilter.value === '';
});

const moderateCorrection = (id, value) => {
  const status = value ? "approved" : "denied";
  try {
    axios.post(`${correctionsHost}/v2/corrections/${id}`, { status: status, moderator_email: moderatorEmail.value });
    curations.value = curations.value.map(c => c.id === id ? { ...c, status: status } : c);
    if (statusFilter.value === "needs-moderation") {
      moderatedOffset.value++;
    }
  } catch (error) {
    console.error('Error in moderate correction:', error);
    snackbar("There was an error processing your moderation request. Please try again.");
    curations.value = curations.value.map(c => c.id === id ? { ...c, status: "needs-moderation" } : c);
    if (statusFilter.value === "needs-moderation") {
      moderatedOffset.value--;
    }
  }
};

const bulkModerate = async (value) => {
  try {
    // Process all selected rows
    const promises = selectedRows.value.map(id => 
      moderateCorrection(id, value)
    );
    
    await Promise.all(promises);
    selectedRows.value = [];
    
  } catch (error) {
    console.error('Error in bulk approve:', error);
  }
};

const applyEmailFilter = () => {
  submitterEmailFilter.value = submitterEmailInput.value.trim();
  submitterMenu.value = false;
  page.value = 1;
  getCurations();
};

const clearEmailFilter = () => {
  submitterEmailFilter.value = '';
  submitterEmailInput.value = '';
};

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

getCurations();

// Initialize email input with current filter value
if (submitterEmailFilter.value) {
  submitterEmailInput.value = submitterEmailFilter.value;
}

watch(page, () => {
  getCurations();
});

// Watch all filter changes and reset pagination
watch([entityFilter, propertyFilter, statusFilter, sortOrder, submitterEmailFilter], () => {
  page.value = 1;
  moderatedOffset.value = 0;
  getCurations();
});

</script>

<style scoped>
/* Table link styles */
table a {
  color: inherit;
  text-decoration: none;
}
table a:hover {
  text-decoration: underline;
}
</style>
