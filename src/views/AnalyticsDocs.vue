<template>
  <div class="pt-3">
  <div class="container mx-auto px-4">
    <!-- Sidebar for desktop -->
    <aside 
      v-if="!isMobile || isNavOpen"
      class="fixed left-0 top-[70px] w-[250px] h-[calc(100vh-70px)] bg-white border-r overflow-y-auto z-50"
      :class="{ 'shadow-lg': isMobile }"
    >
      <div class="flex items-center gap-2 px-4 py-3">
        <Settings class="h-4 w-4" />
        <span class="font-medium text-xs">Entity Types</span>
      </div>
      <Separator class="mb-3" />
      <nav class="space-y-1 px-2">
        <a 
          v-for="config in sortedConfigs"
          :key="config.displayName"
          :href="'#' + config.id"
          class="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent transition-colors"
          :class="{ 'bg-primary/10 text-primary': activeSection === config.id }"
          @click="isMobile && (isNavOpen = false)"
        >
          <component :is="getEntityIcon(config.icon)" class="h-4 w-4" />
          {{ filtersUtil.titleCase(config.displayName) }}
        </a>
      </nav>
    </aside>

    <!-- Mobile toggle button -->
    <Button
      v-if="isMobile"
      @click="isNavOpen = !isNavOpen" 
      class="fixed top-[75px] left-[10px] z-[9999]"
    >
      Entity Types
      <ChevronDown class="h-4 w-4 ml-1" />
    </Button>

    <!-- Overlay for mobile -->
    <div 
      v-if="isMobile && isNavOpen" 
      class="fixed inset-0 bg-black/50 z-40"
      @click="isNavOpen = false"
    ></div>

    <Card class="px-8 py-6 mt-4 max-w-[800px] mx-auto ml-0 md:ml-[260px]">
      <h1 class="text-2xl font-bold mb-2" @click="handleTitleClick">Analytics Documentation</h1>
      
      <p class="mb-4 text-muted-foreground">
        Queries in OpenAlex Analytics start by generating a set of works to consider.
        These works can be optionally grouped into a different entity type like authors or institutions. 
        If no works filters are applied then all works in OpenAlex are considered in the query.
        When grouping into another entity type, another set of filters can be applied specific to that entity type. 
        Below is a list of all available fields for filtering each entity type, displaying data columns, or sorting.
      </p>

      <div class="relative mb-8">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchStr"
          placeholder="Search all fields"
          class="pl-9"
        />
      </div>

      <!-- Debug Mode Controls -->
      <div v-if="debugMode" class="mb-6 p-4 bg-muted rounded">
        <h3 class="font-semibold mb-3">Show</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          <div v-for="field in sortedAvailableFields" :key="field" class="flex items-center gap-2">
            <Checkbox
              :id="`field-${field}`"
              :checked="selectedFields.includes(field)"
              @update:checked="(val) => toggleField(field, val)"
            />
            <Label :for="`field-${field}`" class="text-sm">{{ field }}</Label>
          </div>
        </div>
        
        <!-- Filter Controls -->
        <h3 class="font-semibold mt-4 mb-3">Filter</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          <div v-for="(filter, index) in sortedFilterFunctions" :key="index" class="flex items-center gap-2">
            <Checkbox
              :id="`filter-${filter.name}`"
              :checked="activeFilters.includes(filter.name)"
              @update:checked="(val) => toggleFilter(filter.name, val)"
            />
            <Label :for="`filter-${filter.name}`" class="text-sm">{{ filter.name }}</Label>
          </div>
        </div>
      </div>

      <!-- Entity Sections -->
      <div v-for="config in sortedConfigs" :key="config.displayName" class="mb-14">
        <h2 class="text-xl font-bold mb-1" :id="config.id">
          {{ filtersUtil.titleCase(config.displayName) }}
          <span v-if="debugMode" class="text-sm text-muted-foreground ml-2">
            ({{ countVisibleColumns(config.columns) }} columns)
          </span>
        </h2>
        <p class="mb-4 text-muted-foreground">{{ config.descrFull }}</p>
        <div class="border rounded">
          <div v-for="(column, columnId) in columnsToShow(config.id)" :key="columnId" class="mb-3">
            <div class="bg-green-50 mb-3 py-2 px-3 flex items-center flex-wrap gap-2">
              <component :is="getEntityIcon(config.icon)" class="h-3 w-3 text-muted-foreground" />
              <strong>{{ filtersUtil.titleCase(column.displayName) }}</strong> 
              <span class="text-green-700 mx-4">{{ column.id }}</span>
              <span class="inline-flex gap-1">
                <Badge v-if="column.actions && column.actions.includes('filter')" class="bg-blue-500">filter</Badge>
                <Badge v-if="column.actions && column.actions.includes('column')" class="bg-indigo-500">column</Badge>
                <Badge v-if="column.actions && column.actions.includes('sort')" class="bg-pink-500">sort</Badge>
              </span>
            </div>

            <div class="text-muted-foreground py-2 px-9">
              {{ column.descr }}
            </div>
              
            <!-- Debug field information -->
            <div v-if="debugMode && availableSelectedFields(column).length > 0" class="mt-2 pl-4 text-muted-foreground text-sm">
              <div v-for="field in availableSelectedFields(column)" :key="field">
                <strong>{{ field }}:</strong> {{ formatFieldValue(column[field]) }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Card>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

import { Settings, Search, ChevronDown, FileText, Users, Building2, BookOpen, Tag, Bookmark, Briefcase, DollarSign, Lightbulb } from 'lucide-vue-next';

import { useBreakpoints } from '@/composables/useBreakpoints';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import filtersUtil from '@/filters';
import { getConfigs } from '@/oaxConfigs';

defineOptions({ name: 'AnalyticsDocs' });

const { smAndDown } = useBreakpoints();
const isMobile = computed(() => smAndDown.value);

const configs = ref(getConfigs());
const debugMode = ref(false);
const clickCount = ref(0);
const searchStr = ref('');
const activeSection = ref(null);
const isNavOpen = ref(!isMobile.value);

function getEntityIcon(iconName) {
  const iconMap = {
    'mdi-file-document-outline': FileText,
    'mdi-account-outline': Users,
    'mdi-domain': Building2,
    'mdi-book-open-outline': BookOpen,
    'mdi-tag-outline': Tag,
    'mdi-bookmark-outline': Bookmark,
    'mdi-briefcase-outline': Briefcase,
    'mdi-currency-usd': DollarSign,
    'mdi-lightbulb-outline': Lightbulb,
    'mdi-cog': Settings,
  };
  return iconMap[iconName] || FileText;
}

function toggleField(field, checked) {
  if (checked) {
    selectedFields.value.push(field);
  } else {
    selectedFields.value = selectedFields.value.filter(f => f !== field);
  }
}

function toggleFilter(filterName, checked) {
  if (checked) {
    activeFilters.value.push(filterName);
  } else {
    activeFilters.value = activeFilters.value.filter(f => f !== filterName);
  }
}

let clickTimer = null;

const selectedFields = ref([]);
const activeFilters = ref([]);

const filterFunctions = [
  {
    name: 'Actions Empty',
    filter: col => !col.actions || col.actions.length === 0,
  },
  {
    name: 'Has Actions',
    filter: col => col.actions && col.actions.length > 0,
  },
  {
    name: 'Has Actions Popular',
    filter: col => col.actionsPopular && col.actionsPopular.length > 0,
  },
  {
    name: 'Redshift Columns Unequal',
    filter: col => col.redshiftFilterColumn !== col.redshiftDisplayColumn,
  },
  {
    name: "Type is not 'string'",
    filter: col => col.type !== 'string',
  },
  {
    name: "Type is 'object' or 'array'",
    filter: col => col.type === 'object' || col.type === 'array',
  },
  {
    name: 'Name contains ()',
    filter: col => col.id.includes('('),
  },
];

// Computed
const sortedConfigs = computed(() => {
  const results = [];
  Object.keys(configs.value)
    .filter(
      key => hasVisibleColumns(configs.value[key].columns)
    )
    .sort()
    .forEach(key => {
      results.push(configs.value[key]);
    });

    // Move works to the front if it exists in the results
    const worksIndex = results.findIndex(config => config.id === 'works');
    if (worksIndex !== -1) {
      const worksConfig = results.splice(worksIndex, 1)[0];
      results.unshift(worksConfig);
    }

    return results;
});

const availableFields = computed(() => {
  const fieldSet = new Set();
  Object.values(configs.value).forEach(config => {
    if (config.columns) {
      Object.values(config.columns).forEach(column => {
        Object.keys(column).forEach(key => fieldSet.add(key));
      });
    }
  });
  return Array.from(fieldSet);
});

const sortedAvailableFields = computed(() =>
  [...availableFields.value].sort()
);

const sortedFilterFunctions = computed(() =>
  [...filterFunctions].sort((a, b) => a.name.localeCompare(b.name))
);

// Methods
function formatFieldValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return value.toString();
}

function isDisplayedInDefault(field) {
  const defaultFields = ['id', 'displayName', 'descr', 'actions'];
  return defaultFields.includes(field);
}

function shouldShowColumn(column) {
  if (!debugMode.value) {
    if (!column.actions || column.actions.length === 0) { return false; }
    if (searchStr.value.length > 0) {
      const query = searchStr.value.toLowerCase();
      const fields = ['displayName', 'descr', 'id'];
      const content = fields.map(field => column[field].toLowerCase()).join(' ');
      return content.includes(query);
    }
  }

  if (activeFilters.value.length === 0) {
    return true;
  }

  return activeFilters.value.every(filterName => {
    const filterFunc = filterFunctions.find(f => f.name === filterName)?.filter;
    return filterFunc ? filterFunc(column) : true;
  });
}

function hasVisibleColumns(columns) {
  return Object.values(columns).some(col => shouldShowColumn(col));
}

function countVisibleColumns(columns) {
  return Object.values(columns).filter(col => shouldShowColumn(col)).length;
}

function columnsToShow(configKey) {
  const columns = configs.value[configKey].columns;
  return Object.values(columns).filter(col => shouldShowColumn(col));
}

function availableSelectedFields(column) {
  return selectedFields.value.filter(
    field =>
      column[field] !== undefined && !isDisplayedInDefault(field)
  );
}

function handleTitleClick() {
  if (clickTimer) {
    clearTimeout(clickTimer);
  }

  clickCount.value++;
  if (clickCount.value === 4) {
    debugMode.value = !debugMode.value;
  }

  clickTimer = setTimeout(() => {
    clickCount.value = 0;
  }, 1000);
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          console.log(entry.target.id);
          activeSection.value = entry.target.id;
        }
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.6 // adjust as needed
    }
  );

  sortedConfigs.value.forEach(config => {
    const el = document.getElementById(config.id);
    if (el) observer.observe(el);
  });

  onUnmounted(() => {
    observer.disconnect();
  });
});

// Note: App bar fixed positioning is now handled via Tailwind in the main layout

</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>