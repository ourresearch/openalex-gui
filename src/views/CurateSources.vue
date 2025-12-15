<template>
  <div class="py-0 sm:py-12 min-h-[70vh]" ref="scrollContainer">
    <div class="container mx-auto px-0 sm:px-4 max-w-[900px]">
      <nav class="flex items-center gap-1 text-sm text-muted-foreground px-0 -mt-10 mb-4">
        <router-link to="/curate" class="hover:text-foreground">Curate</router-link>
        <span>›</span>
        <span>Sources</span>
      </nav>
      <h1 class="text-3xl font-bold mb-2">
        Unpaywall Sources Curation
      </h1>

      <p class="text-base text-muted-foreground mb-4">
        Change the Open Access status of sources. Changes will show up within two days.
      </p>

      <div class="relative mb-10">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="search"
          placeholder="Search by title, ISSN, or OpenAlex ID"
          class="pl-10 pr-10 rounded-full bg-slate-200 border-0"
        />
        <Button
          v-if="search"
          variant="ghost"
          size="icon"
          class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          @click="search = ''"
        >
          <X class="h-4 w-4" />
        </Button>
      </div>

      <div v-if="resultsRangeText" class="text-sm text-muted-foreground mb-2 px-4">
        {{ resultsRangeText }}
      </div>

      <Card class="p-4">
        <div>
          <div v-if="searchResults.length > 0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[40px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead class="w-[120px] text-right">OA Flip Year</TableHead>
                  <TableHead class="w-[100px] text-right">Works</TableHead>
                  <TableHead class="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in searchResults"
                  :key="item.id"
                  class="cursor-pointer hover:bg-muted/50"
                  @click="editSource(item)"
                >
                  <TableCell class="-mr-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <component
                          :is="getTypeIcon(item.type)"
                          class="h-4 w-4"
                          :class="item.is_oa ? 'text-yellow-600' : 'text-muted-foreground'"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {{ filtersUtil.titleCase(item.type) }}{{ item.is_oa ? ' (Open Access)' : '' }}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell class="pr-2 py-1">
                    <div>{{ item.display_name }}</div>
                    <div class="text-xs text-muted-foreground">{{ item.issn_l }}</div>
                  </TableCell>
                  <TableCell class="text-right">
                    <span v-if="typeof item.oa_flip_year === 'number'">{{ item.oa_flip_year }}</span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <code>{{ typeof item.works_count === 'number' ? item.works_count.toLocaleString() : "-" }}</code>
                  </TableCell>
                  <TableCell class="text-right" @click.stop>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <MoreVertical class="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="editSource(item)">
                          <Pencil class="h-4 w-4 mr-2" />
                          Change Open Access Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a :href="item.id" target="_blank" class="flex items-center">
                            <BookOpen class="h-4 w-4 mr-2" />
                            OpenAlex profile
                            <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a :href="item.homepage_url" target="_blank" class="flex items-center">
                            <Home class="h-4 w-4 mr-2" />
                            Source website
                            <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a :href="`${item.id.replace('://', '://api.')}?data-version=2`" target="_blank" class="flex items-center">
                            <Code class="h-4 w-4 mr-2" />
                            OpenAlex API
                            <ExternalLink class="h-3 w-3 ml-1 text-muted-foreground" />
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div v-if="searchResultsTotalCount > 100" class="flex justify-center pt-8">
              <Pagination v-model:page="page" :total="searchResultsTotalCount" :items-per-page="100" />
            </div>
          </div>
          <div v-if="debounceTimer" class="text-center text-muted-foreground py-6">
            <div class="animate-pulse space-y-3">
              <div v-for="i in 6" :key="i" class="h-12 bg-muted rounded"></div>
            </div>
          </div>
          <div v-else-if="searchResults.length === 0" class="text-center text-muted-foreground py-6">
            No sources found for "{{ search }}".
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { Search, X, MoreVertical, Pencil, BookOpen, Home, ExternalLink, Code, Notebook, Landmark, Book, Users } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Pagination } from '@/components/ui/pagination';

import { useParams } from '@/composables/useStorage';
import filtersUtil from '@/filters';

useHead({ title: 'Unpaywall Sources Curation' });

function getTypeIcon(type) {
  const iconMap = {
    'journal': Notebook,
    'repository': Landmark,
    'ebook platform': BookOpen,
    'book series': Book,
    'conference': Users,
  };
  return iconMap[type] || Book;
}

const router = useRouter();

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const worksFilter             = useParams('worksFilter', 'number', 0);
const page                    = useParams('page', 'number', 1);

const editDialog = ref(false);

const correctedOA = ref(null);
const alwaysOA = ref(true);
const oaDate = ref(null);

let debounceTimer = null;
let currentRequestId = 0;
let errorTimer = null;

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Sources', to: '/curate/sources', disabled: true },
];

const headers = [
  { title: '', key: 'type', width: '10px' },
  { title: 'Title', key: 'display_name', align: 'start' },
  { title: 'OA Flip Year', key: 'oa_flip_year', width: '120px', align: 'end' },
  { title: 'Works', key: 'works_count', width: '100px', align: 'end' },
  { title: '', key: 'dots_menu', width: '40px', align: 'end', sortable: false },
];

const typeIcons = {
  "journal": 'mdi-notebook-outline',
  "repository": 'mdi-town-hall',
  "ebook platform": 'mdi-book-open-outline',
  "book series": 'mdi-book-open-variant-outline',
  "conference": 'mdi-account-group',
  "igsnCatalog": 'mdi-book-outline',
  "other": 'mdi-book-outline',
};

const editSource = (source) => {
  router.push('/curate/sources/' + extractId(source.id));
};

const onRowClick = (event, item) => {
  editSource(item.item);
};

const isYear = (value) => {
  if (!value) return false;
  return /^(19|20)\d{2}$/.test(value);
};

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    const response = await axios.get(`https://api.openalex.org/sources?${filterString.value}&per_page=100&sort=works_count:desc&page=${page.value}&data-version=2`);
    
    // Only update results if this is still the most recent request
    if (requestId === currentRequestId) {
      searchResults.value = response.data.results;
      searchResultsTotalCount.value = response.data.meta.count;
      debounceTimer = null;
    }
  } catch (error) {
    // Only handle error if this is still the most recent request
    if (requestId === currentRequestId) {
      console.error('Search failed:', error);
      searchResults.value = [];
    }
  }
};

const filterString = computed(() => {
  const filters = [searchFilterString.value, openAccessFilterString.value, worksFilterString.value].filter(f => f !== null);
  return filters.length > 0 ? `filter=${filters.join(',')}` : '';
});

const searchFilterString = computed(() => {
  if (search.value) {
    if (isOpenAlexId(search.value)) {
      return `ids.openalex:${search.value}`;
    } else if (isISSN(search.value)) {
      return `issn:${search.value}`;
    } else {
      return `display_name.search:${search.value}`;
    }
  }
  return null;
});

const openAccessFilterString = computed(() => {
  if (openAccessFilter.value === 'open') {
    return 'is_oa:true';
  } else if (openAccessFilter.value === 'closed') {
    return 'is_oa:false';
  } else {
    return null;
  }
});

const worksFilterString = computed(() => {
  if (worksFilter.value > 0) {
    return `works_count:>${worksFilter.value}`;
  } else {
    return null;
  }
});

const isISSN = (issn) => {
  return /^\d{4}-\d{3}[0-9X]$/.test(issn);
};

const isOpenAlexId = (id) => {
  return /^S\d+$/.test(id);
}

const resultsRangeText = computed(() => {
  if (searchResults.value.length === 0) return null;
  
  const start = (page.value - 1) * 100 + 1;
  const end = Math.min(start + searchResults.value.length - 1, searchResultsTotalCount.value);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${searchResultsTotalCount.value.toLocaleString()}`;
});

const debouncedSearch = () => {
  // Clear existing timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Set new timer for 200ms
  debounceTimer = setTimeout(() => {
    getSearchResults();
  }, 200);
};


const extractId = (id) => {
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
}

debouncedSearch();

watch(search, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(openAccessFilter, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(worksFilter, () => {
  searchResults.value = [];
  page.value = 1;
  debouncedSearch();
});

watch(page, () => {
  searchResults.value = [];
  debouncedSearch();
});

watch(editDialog, () => {
  if (!editDialog.value) {
    setTimeout(() => {
      correctedOA.value = null;
      alwaysOA.value = true;
      oaDate.value = null;
    }, 500);
  }
});

watch(oaDate, () => {
  if (errorTimer) clearTimeout(errorTimer);
  if (alwaysOA.value) {
    oaDateError.value = false;
    return;
  }
  if (!isYear(oaDate.value)) {
    errorTimer = setTimeout(() => {
      oaDateError.value = true;
    }, 300);  
  } else {
    oaDateError.value = false;
  }
});

</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
