<template>
  <v-dialog
    v-model="isOpen"
    :max-width="isSemanticSearch ? 400 : 700"
    scroll-strategy="none"
  >
    <v-card class="bg-white" elevation="8">
      <!-- Title bar -->
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">Select Filters</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Semantic search: simple flat list -->
      <template v-if="isSemanticSearch">
        <div class="px-4 pb-2">
          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="text-body-2"
          >
            Semantic search supports a limited set of filters.
          </v-alert>
        </div>

        <v-list density="compact" class="py-0 px-2 pb-2">
          <v-list-item
            v-for="fc in semanticFilterConfigs"
            :key="fc.key"
            @click="selectFilter(fc)"
            rounded
            class="rounded-lg"
          >
            <template #prepend>
              <v-icon size="18" class="mr-3">{{ fc.icon }}</v-icon>
            </template>
            <v-list-item-title class="text-capitalize">
              {{ titleCase(fc.displayName) }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </template>

      <!-- Boolean search: full categorized layout -->
      <template v-else>
        <!-- Search -->
        <div class="px-4 pb-2">
          <v-text-field
            ref="searchFieldRef"
            v-model="searchQuery"
            placeholder="Search filters..."
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-magnify"
            clearable
          />
        </div>

        <v-divider />

        <!-- Two-column layout -->
        <div class="d-flex" style="height: 60vh; min-height: 300px;">
          <!-- Left: category TOC -->
          <div
            class="pa-2"
            style="min-width: 160px; max-width: 180px; border-right: 1px solid rgba(0,0,0,0.12); overflow-y: auto;"
          >
            <v-list density="compact" nav class="py-0">
              <v-list-item
                v-for="cat in filteredCategories"
                :key="cat.displayName"
                :active="activeCategoryName === cat.displayName"
                @click="scrollToCategory(cat.displayName)"
                rounded
                class="mb-1"
              >
                <template #prepend>
                  <v-icon size="18">{{ cat.icon }}</v-icon>
                </template>
                <v-list-item-title class="text-capitalize text-body-2">
                  {{ cat.displayName }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>

          <!-- Right: filter list grouped by category -->
          <div ref="filterListRef" class="flex-grow-1 overflow-y-auto pa-2" @scroll="onScroll">
            <div
              v-for="cat in filteredCategories"
              :key="cat.displayName"
              :ref="el => setCategoryRef(cat.displayName, el)"
            >
              <div class="text-overline text-medium-emphasis mt-3 mb-1 pl-2">
                {{ cat.displayName }}
              </div>
              <v-list density="compact" class="py-0">
                <v-list-item
                  v-for="fc in cat.filterConfigs"
                  :key="fc.key"
                  @click="selectFilter(fc)"
                  rounded
                  class="rounded-lg"
                >
                  <template #prepend>
                    <v-icon size="18" class="mr-3">{{ fc.icon }}</v-icon>
                  </template>
                  <v-list-item-title class="text-capitalize">
                    {{ titleCase(fc.displayName) }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
          </div>
        </div>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { facetsByCategory } from '@/facetConfigUtils';
import { facetConfigs } from '@/facetConfigs';

defineOptions({ name: 'NoviceFilterDialog' });

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue', 'select']);

const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);
const isSemanticSearch = computed(() => !!route.query['search.semantic']);

// Local dialog state synced with prop (v-dialog needs v-model for reliable open/close)
const isOpen = ref(false);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => { if (!v) emit('update:modelValue', false); });

const searchQuery = ref('');
const searchFieldRef = ref(null);
const activeCategoryName = ref(null);
const filterListRef = ref(null);
const categoryRefMap = {};

function setCategoryRef(name, el) {
  if (el) {
    categoryRefMap[name] = el;
  }
}

// Reset state when dialog opens; lock page scroll
watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = '';
    activeCategoryName.value = null;
    document.documentElement.style.overflow = 'hidden';
    if (!isSemanticSearch.value) {
      setupObserver();
      setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
    }
  } else {
    document.documentElement.style.overflow = '';
    cleanupObserver();
  }
});

// --- Semantic: flat filter list ---
const semanticFilterConfigs = computed(() => {
  return facetConfigs(entityType.value)
    .filter(c => c.semanticSearchAllowed && c.entityToFilter === entityType.value)
    .filter(c => ['selectEntity', 'boolean', 'range'].includes(c.type))
    .filter(c => c.actions?.includes('filter'))
    .filter(c => c.key !== 'is_xpac');
});

// --- Boolean: categorized filter list ---
const filteredCategories = computed(() => {
  return facetsByCategory(
    entityType.value,
    searchQuery.value,
    ['selectEntity', 'boolean', 'range'],
    [],
  ).map(cat => ({
    ...cat,
    filterConfigs: cat.filterConfigs.filter(fc => {
      if (!fc.actions?.includes('filter')) return false;
      if (fc.key === 'is_xpac') return false;
      return true;
    })
  })).filter(cat => cat.filterConfigs.length > 0);
});

// Set initial active category when categories load
watch(filteredCategories, (cats) => {
  if (cats.length > 0 && !activeCategoryName.value) {
    activeCategoryName.value = cats[0].displayName;
  }
}, { immediate: true });

// --- Click-to-scroll ---
let isScrollingProgrammatically = false;

function scrollToCategory(name) {
  activeCategoryName.value = name;
  const el = categoryRefMap[name];
  if (el) {
    isScrollingProgrammatically = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Reset after animation completes
    setTimeout(() => { isScrollingProgrammatically = false; }, 500);
  }
}

// --- IntersectionObserver scroll tracking ---
let observer = null;

function setupObserver() {
  // Wait for DOM to render
  setTimeout(() => {
    cleanupObserver();
    const container = filterListRef.value;
    if (!container) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const name = entry.target.dataset.categoryName;
            if (name) activeCategoryName.value = name;
          }
        }
      },
      {
        root: container,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe each category section
    for (const [name, el] of Object.entries(categoryRefMap)) {
      if (el) {
        el.dataset.categoryName = name;
        observer.observe(el);
      }
    }
  }, 100);
}

function cleanupObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

onBeforeUnmount(cleanupObserver);

// --- Manual scroll fallback for when IntersectionObserver entries don't fire ---
function onScroll() {
  if (isScrollingProgrammatically) return;
  // IntersectionObserver handles most cases, but update on scroll too
  const container = filterListRef.value;
  if (!container) return;

  const scrollTop = container.scrollTop;
  let closestName = null;
  let closestDist = Infinity;

  for (const [name, el] of Object.entries(categoryRefMap)) {
    if (!el) continue;
    const dist = Math.abs(el.offsetTop - scrollTop);
    if (dist < closestDist) {
      closestDist = dist;
      closestName = name;
    }
  }

  if (closestName) {
    activeCategoryName.value = closestName;
  }
}

// --- Select filter ---
function selectFilter(fc) {
  isOpen.value = false;
  emit('select', fc.key);
}

function close() {
  isOpen.value = false;
}

// --- Utils ---
function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}
</script>
