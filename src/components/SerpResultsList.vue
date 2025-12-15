<template>
  <div class="serp-results-list">
    <div class="flex items-center mb-2">
      <h2 class="font-bold mr-2">
        {{ filters.capitalize(filters.pluralize(entityType, 2)) }}
      </h2>
      <div class="flex-1" />
      <serp-results-sort-button />

      <serp-results-export-button v-if="entityType === 'works'" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical class="h-5 w-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Results per page:</DropdownMenuLabel>
          <DropdownMenuItem @click="url.setPerPage(10)">
            10
            <Check v-if="url.getPerPage() === 10" class="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
          <DropdownMenuItem @click="url.setPerPage(100)">
            100
            <Check v-if="url.getPerPage() === 100" class="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <Card>
      <div v-if="resultsObject?.results" class="divide-y">
        <serp-results-list-item
          v-for="result in resultsObject.results"
          :key="result.id"
          :result="result"
          show-icon
        />
      </div>
      <div class="serp-bottom" v-if="resultsObject?.results?.length">
        <Pagination
          v-if="showPagination"
          class="pb-8 pt-3"
          :total="resultsObject.meta?.count || 0"
          :sibling-count="1"
          :items-per-page="url.getPerPage()"
          :page="page"
          @update:page="page = $event"
        >
          <PaginationList v-slot="{ items }" class="flex items-center gap-1 justify-center">
            <PaginationFirst @click="page = 1" />
            <PaginationPrev @click="page = Math.max(1, page - 1)" />
            <template v-for="(item, index) in items" :key="index">
              <PaginationListItem v-if="item.type === 'page'" :value="item.value" as-child>
                <Button :variant="item.value === page ? 'default' : 'outline'" size="icon" class="w-9 h-9">
                  {{ item.value }}
                </Button>
              </PaginationListItem>
              <PaginationEllipsis v-else :index="index" />
            </template>
            <PaginationNext @click="page = Math.min(numPages, page + 1)" />
            <PaginationLast @click="page = numPages" />
          </PaginationList>
        </Pagination>
      </div>
      <div v-if="!resultsObject?.meta?.count" class="text-muted-foreground mt-2 p-4">
        There are no results for this search.
      </div>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import { MoreVertical, Check } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Pagination, PaginationList, PaginationListItem, PaginationFirst, PaginationPrev, PaginationNext, PaginationLast, PaginationEllipsis } from '@/components/ui/pagination';

import { url } from '@/url';
import filters from '@/filters';

import SerpResultsExportButton from '@/components/SerpResultsExportButton.vue';
import SerpResultsSortButton from '@/components/SerpResultsSortButton.vue';
import SerpResultsListItem from '@/components/SerpResultsListItem.vue';

defineOptions({
  name: 'SerpResultsList',
});

const props = defineProps({
  resultsObject: Object,
});

const store = useStore();

const entityType = computed(() => store.getters['entityType']);

const isMobile = computed(() => {
  // Vuetify 3 support
  return typeof window !== 'undefined' && window.innerWidth <= 600;
});

const numPages = computed(() => {
  const maxToShow = isMobile.value ? 4 : 10;
  const count = props.resultsObject.meta?.count || 0;
  const perPage = url.getPerPage();
  return Math.min(Math.floor(count / perPage), maxToShow);
});

const showPagination = computed(() => {
  return props.resultsObject.meta?.count > url.getPerPage();
});

const page = computed({
  get() {
    return props.resultsObject.meta?.page ?? 1;
  },
  set(val) {
    const valToUse = val === 1 ? undefined : val;
    url.setPage(valToUse);
  },
});
</script>


<style lang="scss">
.serp-results-list .v-toolbar__content {
  padding-right: 0 !important;
}
</style>