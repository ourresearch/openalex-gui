<template>
  <v-dialog
    v-model="isOpen"
    :max-width="isSemanticSearch ? 400 : 700"
    scroll-strategy="none"
  >
    <v-card class="bg-white" elevation="8">
      <!-- Title bar -->
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">{{ title }}</span>
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
            :disabled="disabledKeys.includes(fc.key)"
            rounded
            class="rounded-lg"
          >
            <template #prepend>
              <v-icon size="18" class="mr-3" :disabled="disabledKeys.includes(fc.key)">{{ fc.icon }}</v-icon>
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
            :placeholder="searchPlaceholder"
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
                  :disabled="disabledKeys.includes(fc.key)"
                  rounded
                  class="rounded-lg"
                >
                  <template #prepend>
                    <v-checkbox-btn
                      v-if="showCheckboxes"
                      :model-value="effectiveSelected.includes(fc.key)"
                      :disabled="disabledKeys.includes(fc.key)"
                      density="compact"
                      class="mr-2"
                      style="pointer-events: none;"
                    />
                    <v-icon v-if="!showCheckboxes" size="18" class="mr-3" :disabled="disabledKeys.includes(fc.key)">{{ fc.icon }}</v-icon>
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

      <!-- Deferred-commit footer: nothing is applied to the table until Apply;
           Cancel discards the draft. Apply is disabled until something changes. -->
      <template v-if="applyMode">
        <v-divider />
        <v-card-actions class="pa-3 justify-end">
          <v-btn variant="plain" class="text-black" @click="close">Cancel</v-btn>
          <v-btn variant="flat" color="black" :disabled="!hasChanges" @click="applyChanges">Apply</v-btn>
        </v-card-actions>
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
  // Optional whitelist of property keys. When null, show every property the
  // dialog's own filtering allows. When provided, additionally restrict to keys
  // in the list — used by AddFilter (its `potentialFilters` set) and AddColumn
  // (its column-eligible set). `facetKeys` is the legacy alias for `itemKeys`.
  itemKeys: { type: Array, default: null },
  facetKeys: { type: Array, default: null },
  // Keys to render as disabled (e.g. already-applied filters, or the mandatory
  // identity column that can't be removed).
  disabledKeys: { type: Array, default: () => [] },
  // Which action gates property inclusion: "filter" (default) | "column" | ...
  // This is the crux of the unified mental model — the SAME categorized property
  // browser serves filtering, columns, (later) sorting & grouping; only the
  // action gate and the per-row affordance differ.
  action: { type: String, default: 'filter' },
  // Facet types to include. Filters care about a restricted set; columns don't
  // restrict by type (pass []).
  includeTypes: { type: Array, default: () => ['selectEntity', 'boolean', 'range', 'search'] },
  // Keys currently "on" (applied filters / columns in the table). When
  // showCheckboxes is true, each row shows a checkbox reflecting membership.
  selectedKeys: { type: Array, default: () => [] },
  showCheckboxes: { type: Boolean, default: false },
  // When false the dialog stays open after a selection so the user can edit the
  // whole set in one sitting (column editing). Filters close on select.
  closeOnSelect: { type: Boolean, default: true },
  // Deferred-commit mode: toggling a row only edits a LOCAL draft; nothing is
  // applied until the user clicks Apply (Cancel discards). Used for column
  // editing so the dialog never leaks state into the table mid-edit. Emits
  // `apply` with the final ordered key list. Filters don't use this (live).
  applyMode: { type: Boolean, default: false },
  title: { type: String, default: 'Select Filters' },
  searchPlaceholder: { type: String, default: 'Search filters...' },
});
const emit = defineEmits(['update:modelValue', 'select', 'apply']);

const store = useStore();
const route = useRoute();
const entityType = computed(() => store.getters.entityType);
// The semantic-search flat-list shortcut is filter-specific; columns always use
// the full categorized browser.
const isSemanticSearch = computed(() => props.action === 'filter' && !!route.query['search.semantic']);

// Effective whitelist (new `itemKeys` wins; `facetKeys` kept for back-compat).
const whitelist = computed(() => props.itemKeys ?? props.facetKeys);

// Local dialog state synced with prop (v-dialog needs v-model for reliable open/close)
const isOpen = ref(false);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => { if (!v) emit('update:modelValue', false); });

const searchQuery = ref('');
const searchFieldRef = ref(null);
const activeCategoryName = ref(null);
const filterListRef = ref(null);
const categoryRefMap = {};

// Deferred-commit draft (applyMode). Seeded from selectedKeys on open; row
// toggles mutate only this until Apply. In live mode the checkboxes read
// selectedKeys directly.
const draftKeys = ref([]);
const effectiveSelected = computed(() => (props.applyMode ? draftKeys.value : props.selectedKeys));
const hasChanges = computed(() => {
  if (!props.applyMode) return false;
  const a = [...draftKeys.value].sort();
  const b = [...props.selectedKeys].sort();
  return a.length !== b.length || a.some((k, i) => k !== b[i]);
});

function applyChanges() {
  emit('apply', [...draftKeys.value]);
  isOpen.value = false;
}

function setCategoryRef(name, el) {
  if (el) {
    categoryRefMap[name] = el;
  } else {
    delete categoryRefMap[name];
  }
}

// Reset state when dialog opens; lock page scroll
watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = '';
    // Snapshot the current selection into the draft (applyMode). Nothing leaves
    // the dialog until Apply.
    draftKeys.value = [...props.selectedKeys];
    // Highlight the first (topmost) category on open. (The IntersectionObserver
    // refines this as the user scrolls; without seeding it here, opening can show
    // no highlight, or the observer's first async fire can land on a lower one.)
    activeCategoryName.value = filteredCategories.value[0]?.displayName ?? null;
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
    .filter(c => c.actions?.includes(props.action))
    .filter(c => c.key !== 'is_xpac')
    .filter(c => !whitelist.value || whitelist.value.includes(c.key));
});

// --- Categorized property list ---
const filteredCategories = computed(() => {
  return facetsByCategory(
    entityType.value,
    searchQuery.value,
    props.includeTypes,
    [],
  ).map(cat => ({
    ...cat,
    filterConfigs: cat.filterConfigs.filter(fc => {
      if (!fc.actions?.includes(props.action)) return false;
      if (fc.key === 'is_xpac') return false;
      if (whitelist.value && !whitelist.value.includes(fc.key)) return false;
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
        // Pick the TOPMOST intersecting category, not whichever entry happens to
        // come last. On open, several short categories can all sit in the top
        // band at once; last-wins then highlights a lower one (e.g. "Open Access"
        // instead of the top "Author"). Topmost-wins is correct here and on scroll.
        const visible = entries.filter((e) => e.isIntersecting);
        if (!visible.length) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        const name = topmost.target.dataset.categoryName;
        if (name) activeCategoryName.value = name;
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

onBeforeUnmount(() => {
  cleanupObserver();
  document.documentElement.style.overflow = '';
});

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

// --- Select / toggle a property ---
function selectFilter(fc) {
  if (props.disabledKeys.includes(fc.key)) return;
  // Deferred-commit: toggle the local draft only; nothing reaches the table
  // until Apply.
  if (props.applyMode) {
    draftKeys.value = draftKeys.value.includes(fc.key)
      ? draftKeys.value.filter((k) => k !== fc.key)
      : [...draftKeys.value, fc.key];
    return;
  }
  // Live mode: column editing keeps the dialog open so the user can toggle the
  // whole set in one sitting; filter selection closes (it proceeds to value-picking).
  if (props.closeOnSelect) isOpen.value = false;
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
