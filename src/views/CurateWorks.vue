<template>
  <div class="py-0 sm:py-12 min-h-[70vh]" ref="scrollContainer">
    <div class="container mx-auto px-0 sm:px-4 max-w-[900px]">
      <nav class="flex items-center gap-1 text-sm text-muted-foreground px-0 -mt-10 mb-4">
        <router-link to="/curate" class="hover:text-foreground">Curate</router-link>
        <span>›</span>
        <span>Works</span>
      </nav>
      <h1 class="text-3xl font-bold mb-2">
        Unpaywall Works Curation
      </h1>

      <p class="text-base text-muted-foreground mb-4">
        Change the Open Access links and licenses of works. Changes will show up within two days.
      </p>

      <div class="relative mb-10">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="search"
          placeholder="Search by title, DOI, or OpenAlex ID"
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead class="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="item in searchResults"
                  :key="item.id"
                  class="cursor-pointer hover:bg-muted/50"
                  @click="editWork(item)"
                >
                  <TableCell class="pr-2 py-1">
                    <span>{{ item.display_name }}</span>
                  </TableCell>
                  <TableCell>{{ item.type }}</TableCell>
                  <TableCell>
                    <span v-if="typeof item.publication_year === 'number'">{{ item.publication_year }}</span>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell class="text-right" @click.stop>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" class="h-8 w-8">
                          <MoreVertical class="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="editWork(item)">
                          <Pencil class="h-4 w-4 mr-2" />
                          Edit Work
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <a :href="item.id" target="_blank" class="flex items-center">
                            <FileText class="h-4 w-4 mr-2" />
                            OpenAlex profile
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
            No works found for "{{ search }}".
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';

import { Search, X, MoreVertical, Pencil, FileText, ExternalLink, Code } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';

import { useParams } from '@/composables/useStorage';

useHead({ title: 'Unpaywall Work Curation' });

const router = useRouter();

const search                  = useParams('search', 'string', '');
const searchResults           = ref([]);
const searchResultsTotalCount = ref(0);
const openAccessFilter        = useParams('openAccessFilter', 'string', 'all');
const page                    = useParams('page', 'number', 1);

const openAccessMenu = ref(false);

const breadcrumbs = [
  { title: 'Curate', to: '/curate' },
  { title: 'Works', to: '/curate/works', disabled: true },
];

let debounceTimer = null;
let currentRequestId = 0;

const headers = [
  { title: 'Title', key: 'display_name', align: 'start' },
  { title: 'Type', key: 'type'},
  { title: 'Year', key: 'publication_year'},
  { title: '', key: 'dots_menu', width: '40px', align: 'end', sortable: false },
];

const editWork = (work) => {
  router.push('/curate/works/' + extractId(work.id));
};

const onRowClick = (event, item) => {
  editWork(item.item);
};

const extractId = (id) => {
  if (id.startsWith('https://openalex.org/')) {
    return id.replace('https://openalex.org/', '');
  }
  return id;
}

const openAccessFilterString = computed(() => {
  if (openAccessFilter.value === 'open') {
    return 'is_oa:true';
  } else if (openAccessFilter.value === 'closed') {
    return 'is_oa:false';
  } else {
    return null;
  }
});

const searchFilterString = computed(() => {
  if (search.value) {
    if (isOpenAlexId(search.value)) {
      return `ids.openalex:${search.value}`;
    } else if (isDOI(search.value)) {
      return `doi:${search.value.toLowerCase()}`;
    } else {
      return `display_name.search:${search.value}`;
    }
  }
  return null;
});

const getSearchResults = async () => {
  // Increment request ID to track the latest request
  const requestId = ++currentRequestId;
  
  try {
    const filterStr = [searchFilterString.value, openAccessFilterString.value].filter(s => s !== null).join(',');
    const response = await axios.get(`https://api.openalex.org/works?filter=${filterStr}&per_page=100&sort=cited_by_count:desc&page=${page.value}&data-version=2`);
    
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

const isDOI = (doi) => {
  return /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/.test(doi);
};

const isOpenAlexId = (id) => {
  return /^W\d+$/.test(id);
}

const resultsRangeText = computed(() => {
  if (searchResults.value.length === 0) return null;
  
  const start = (page.value - 1) * 100 + 1;
  const end = Math.min(start + searchResults.value.length - 1, searchResultsTotalCount.value);
  
  return `${start.toLocaleString()}-${end.toLocaleString()} results of ${searchResultsTotalCount.value.toLocaleString()}`;
});

const debouncedSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    getSearchResults();
  }, 200);
};

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

watch(page, () => {
  searchResults.value = [];
  debouncedSearch();
});

</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>
