<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <ArrowUpNarrowWide class="h-5 w-5 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>Sort by:</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="option in menuOptions"
        :key="option.key"
        @click="clickOption(option.key)"
        :disabled="menuOptions.length === 1"
      >
        <component :is="getIcon(option.icon)" class="h-4 w-4 mr-2" />
        {{ option.displayName }}
        <Check v-if="selectedOption === option.key" class="h-4 w-4 ml-auto" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { ArrowUpNarrowWide, Check, Search, Calendar, Quote, TrendingUp, Users, FileText } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

import { facetConfigs } from '@/facetConfigs';
import { url } from '@/url';

// Map mdi icons to lucide icons
const iconMap = {
  'mdi-magnify': Search,
  'mdi-calendar': Calendar,
  'mdi-format-quote-close': Quote,
  'mdi-trending-up': TrendingUp,
  'mdi-account-group': Users,
  'mdi-file-document': FileText,
};

function getIcon(mdiIcon) {
  return iconMap[mdiIcon] || FileText;
}

defineOptions({ name: 'SerpResultsSortButton' });

const store = useStore();
const route = useRoute();

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);

// Computed: selected option
const selectedOption = computed(() => {
  return url.getSort(route);
});

// Computed: sort options
const popularOptions = computed(() => {
  const optionsFromConfigs = facetConfigs(entityType.value)
    .filter(conf => conf.actionsPopular?.includes('sort'))
    .filter(conf => !conf.requiresApiKey || isAdmin.value);

  if (url.isSearchFilterApplied(route)) {
    optionsFromConfigs.unshift({
      key: 'relevance_score',
      icon: 'mdi-magnify',
      displayName: 'relevance score'
    });
  }

  return optionsFromConfigs;
});

const menuOptions = computed(() => popularOptions.value);

// Methods
function clickOption(key) {
  url.setSort(key);
}
</script>


<style scoped lang="scss">

</style>