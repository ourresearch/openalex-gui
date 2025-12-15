<template>
  <div>
    <Transition name="scale">
      <selection-menu
        v-if="isFabShowing"
        :all-keys="potentialFilters.map(f => f.key)"
        :popular-keys="potentialFiltersPopular.map(f => f.key)"
        :disabled-keys="potentialFilters.filter(f => f.disabled).map(f => f.key)"
        :get-display-name="getFilterDisplayName"
        :get-icon="getFilterIcon"
        search-placeholder="Search all filters"
        more-dialog-title="All Filters"
        location="top left"
        :offset="[-60, 0]"
        @select="setNewFilterKey"
      >
        <template #activator="{ props }">
          <Button
            v-bind="props"
            size="lg"
            class="rounded-full h-14 w-14"
          >
            <Plus class="h-6 w-6" />
          </Button>
        </template>
      </selection-menu>
    </Transition>

    <!-- Filter Dialog: Value Inputs or Full Filter List -->
    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[800px] p-0">
        <div class="flex items-center border-b p-3">
          <Button variant="ghost" size="icon" class="mr-2" @click="newFilterKey ? (newFilterKey = null) : null">
            <component :is="newFilterKey ? ArrowLeft : Search" class="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            v-model="searchString"
            autofocus
            :placeholder="placeholderText"
            class="flex-1 border-0 text-lg focus-visible:ring-0"
            @keyup.enter="onEnter"
            @keydown.down="onDownArrow"
          />
          <Button variant="ghost" size="icon" @click="clickCloseSearch">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea :style="{height: dialogBodyHeight}" class="transition-all duration-300">
          <!-- Filter selected, user choosing value -->
          <div v-if="newFilterKey">
            <filter-select-add-option
              v-if="newFilterConfig.type === 'select'"
              :filter-key="newFilterKey"
              :is-open="isDialogOpen"
              :search-string="searchString"
              :filters="url.readFilters($route)"
            />
          </div>

          <!-- No filter selected, what are my options? -->
          <div v-else class="p-2">
            <p class="text-xs text-muted-foreground px-3 py-2">
              {{ searchString ? "Search results" : "All filters" }}
              ({{ potentialFiltersSearchResults.length }})
            </p>
            <div class="flex flex-wrap">
              <button
                  v-for="filter in potentialFiltersSearchResults"
                  :key="filter.key"
                  @click="!filter.disabled && setNewFilterKey(filter.key)"
                  :disabled="filter.disabled"
                  class="flex items-start gap-2 p-2 rounded-md hover:bg-accent text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  style="flex: 0 1 250px; min-width: 0;"
              >
                <component :is="getIconComponent(filter.icon)" class="h-4 w-4 mt-0.5 shrink-0" />
                <span class="text-sm">{{ filters.titleCase(filter.displayName) }}</span>
              </button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';

import { Plus, ArrowLeft, Search, X, FileText, Users, BookOpen, Building2, Landmark, Lightbulb, MapPin, Award, DollarSign, Calendar, Tag, Lock, Unlock, Globe, Hash, BarChart3 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { url } from '@/url';
import filters from '@/filters';
import { createSimpleFilter } from '@/filterConfigs';
import { facetConfigs, getFacetConfig } from '@/facetConfigs';

import FilterSelectAddOption from '@/components/Filter/FilterSelectAddOption.vue';
import SelectionMenu from '@/components/Misc/SelectionMenu.vue';

defineOptions({ name: 'AddFilter' });

const iconMap = {
  'mdi-file-document-outline': FileText,
  'mdi-account-outline': Users,
  'mdi-book-open-page-variant-outline': BookOpen,
  'mdi-domain': Building2,
  'mdi-town-hall': Landmark,
  'mdi-lightbulb-outline': Lightbulb,
  'mdi-map-marker-outline': MapPin,
  'mdi-trophy-outline': Award,
  'mdi-cash-multiple': DollarSign,
  'mdi-calendar': Calendar,
  'mdi-tag': Tag,
  'mdi-lock': Lock,
  'mdi-lock-open': Unlock,
  'mdi-earth': Globe,
  'mdi-pound': Hash,
  'mdi-chart-bar': BarChart3,
};

function getIconComponent(mdiIcon) {
  return iconMap[mdiIcon] || Tag;
}

const route = useRoute();
const store = useStore();

const searchString = ref('');
const isDialogOpen = ref(false);
const newFilterKey = ref(null);
const isFabShowing = ref(false);

const entityType = computed(() => store.getters.entityType);
const isAdmin = computed(() => store.getters['user/isAdmin']);

// Derived config
const newFilterConfig = computed(() => {
  if (!newFilterKey.value) { return null; }
  return getFacetConfig(entityType.value, newFilterKey.value);
});

// Computed values
const dialogBodyHeight = computed(() => {
  const fullHeight = !newFilterKey.value || newFilterConfig.value?.type === 'select';
  return fullHeight ? '80vh' : 0;
});

const prependIcon = computed(() => newFilterKey.value ? 'mdi-arrow-left' : 'mdi-magnify');

const potentialFilters = computed(() =>
  facetConfigs(entityType.value)
    .filter(conf => conf.actions?.includes('filter'))
    .filter(conf => !conf.requiresApiKey || isAdmin.value)
    .filter(conf => {
      // Hide is_xpac filter unless include_xpac is enabled
      if (conf.key === 'is_xpac' && route.query.include_xpac !== 'true') {
        return false;
      }
      return true;
    })
    .map(f => ({
      ...f,
      disabled: !url.isFilterKeyAvailableToCreate(route, entityType.value, f.key)
    }))
);

const potentialFiltersPopular = computed(() =>
  potentialFilters.value.filter(f => f.actionsPopular?.includes('filter'))
);

const potentialFiltersSearchResults = computed(() => {
  const query = searchString.value.toLowerCase();
  return potentialFilters.value.filter(f =>
    f.displayName.toLowerCase().includes(query)
  );
});

const placeholderText = computed(() => {
  const displayName = newFilterConfig.value?.displayName;
  const pluralized = displayName ? filters.pluralize(displayName, 2) : null;

  if (!newFilterKey.value) return 'Search all filters';
  if (newFilterKey.value === 'publication_year') return 'Enter year or range of years';
  if (newFilterConfig.value?.type === 'range') return 'Enter number or range';
  if (newFilterConfig.value?.type === 'search') return 'Search within ' + pluralized;
  return 'Search ' + pluralized;
});

const getFilterDisplayName = (key) => {
  return filters.titleCase(potentialFilters.value.find(f => f.key === key)?.displayName || '');
};

const getFilterIcon = (key) => {
  return potentialFilters.value.find(f => f.key === key)?.icon || 'mdi-tag';
};

// Methods
function onDownArrow(event) {
  // Workaround to allow down arrow press to focus first element in list
  event.preventDefault();
  const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = Array.from(document.querySelectorAll(focusable))
    .filter(el => !el.disabled && el.offsetParent !== null);
  const currentIndex = elements.indexOf(event.target);
  if (currentIndex > -1 && currentIndex < elements.length - 1) {
    elements[currentIndex + 1].focus();
  } else if (elements.length > 0) {
    elements[0].focus();
  }
}

function onEnter() {
  if (['search', 'range'].includes(newFilterConfig.value?.type) && searchString.value) {
    url.createFilter(entityType.value, newFilterKey.value, searchString.value);
  }
}

function setNewFilterKey(filterKey) {
  const config = getFacetConfig(entityType.value, filterKey);
  if (config.type === 'boolean') {
    const oldFilters = url.readFilters(route);
    const newFilter = createSimpleFilter(entityType.value, filterKey, true);
    //console.log("Pushing new filter", newFilter);
    url.pushNewFilters([...oldFilters, newFilter]);
  } else {
    newFilterKey.value = filterKey;
    if (filterKey) { isDialogOpen.value = true; }
  }
}

function clickCloseSearch() {
  searchString.value ? searchString.value = '' : closeDialog();
}

function closeDialog() {
  searchString.value = '';
  isDialogOpen.value = false;
  newFilterKey.value = null;
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    // Fab Animation
    isFabShowing.value = true;
  }, 1);
});

// Watchers
watch(isDialogOpen, to => {
  if (!to) {
    closeDialog();
  }
});

watch(newFilterKey, () => {
  searchString.value = '';
});

watch(() => route.fullPath, () => {
  closeDialog();
});
</script>


<style scoped>
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
</style>