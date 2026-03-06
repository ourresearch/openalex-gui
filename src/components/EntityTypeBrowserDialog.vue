<template>
  <v-dialog
    v-model="isOpen"
    max-width="700"
    scroll-strategy="none"
  >
    <v-card class="bg-white" elevation="8">
      <!-- Title bar -->
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">Select Entity Type</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Search -->
      <div class="px-4 pb-2">
        <v-text-field
          ref="searchFieldRef"
          v-model="searchQuery"
          placeholder="Search entity types..."
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
              :key="cat.id"
              :active="activeCategoryId === cat.id"
              @click="scrollToCategory(cat.id)"
              rounded
              class="mb-1"
            >
              <v-list-item-title class="text-body-2">
                {{ cat.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <!-- Right: entity list grouped by category -->
        <div ref="entityListRef" class="flex-grow-1 overflow-y-auto pa-2" @scroll="onScroll">
          <div
            v-for="cat in filteredCategories"
            :key="cat.id"
            :ref="el => setCategoryRef(cat.id, el)"
          >
            <div class="text-overline text-medium-emphasis mt-3 mb-1 pl-2">
              {{ cat.name }}
            </div>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="entity in cat.entities"
                :key="entity.name"
                @click="selectEntity(entity)"
                rounded
                class="rounded-lg"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-3">{{ entity.icon }}</v-icon>
                </template>
                <v-list-item-title class="text-capitalize">
                  {{ entity.displayName }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ entity.descr }}
                </v-list-item-subtitle>
                <template #append>
                  <v-icon v-if="currentEntityType === entity.name">mdi-check</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { entityCategories, getEntitiesForBrowser } from '@/entityConfigs';

defineOptions({ name: 'EntityTypeBrowserDialog' });

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue', 'select']);

const route = useRoute();
const currentEntityType = computed(() => route.params.entityType);

const isOpen = ref(false);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => { if (!v) emit('update:modelValue', false); });

const searchQuery = ref('');
const searchFieldRef = ref(null);
const activeCategoryId = ref(null);
const entityListRef = ref(null);
const categoryRefMap = {};

function setCategoryRef(id, el) {
  if (el) {
    categoryRefMap[id] = el;
  } else {
    delete categoryRefMap[id];
  }
}

// Reset state when dialog opens
watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = '';
    activeCategoryId.value = null;
    document.documentElement.style.overflow = 'hidden';
    setupObserver();
    setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
  } else {
    document.documentElement.style.overflow = '';
    cleanupObserver();
  }
});

const allEntities = computed(() => getEntitiesForBrowser());

const filteredCategories = computed(() => {
  const query = searchQuery.value?.toLowerCase() || '';
  return entityCategories
    .map(cat => ({
      ...cat,
      entities: allEntities.value
        .filter(e => e.category === cat.id)
        .filter(e => {
          if (!query) return true;
          return e.displayName.toLowerCase().includes(query)
            || e.descr?.toLowerCase().includes(query)
            || e.nameSingular?.toLowerCase().includes(query);
        })
    }))
    .filter(cat => cat.entities.length > 0);
});

watch(filteredCategories, (cats) => {
  if (cats.length > 0 && !activeCategoryId.value) {
    activeCategoryId.value = cats[0].id;
  }
}, { immediate: true });

// --- Click-to-scroll ---
let isScrollingProgrammatically = false;

function scrollToCategory(id) {
  activeCategoryId.value = id;
  const el = categoryRefMap[id];
  if (el) {
    isScrollingProgrammatically = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrollingProgrammatically = false; }, 500);
  }
}

// --- IntersectionObserver scroll tracking ---
let observer = null;

function setupObserver() {
  setTimeout(() => {
    cleanupObserver();
    const container = entityListRef.value;
    if (!container) return;

    observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingProgrammatically) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.categoryId;
            if (id) activeCategoryId.value = id;
          }
        }
      },
      {
        root: container,
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    );

    for (const [id, el] of Object.entries(categoryRefMap)) {
      if (el) {
        el.dataset.categoryId = id;
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

function onScroll() {
  if (isScrollingProgrammatically) return;
  const container = entityListRef.value;
  if (!container) return;

  const scrollTop = container.scrollTop;
  let closestId = null;
  let closestDist = Infinity;

  for (const [id, el] of Object.entries(categoryRefMap)) {
    if (!el) continue;
    const dist = Math.abs(el.offsetTop - scrollTop);
    if (dist < closestDist) {
      closestDist = dist;
      closestId = id;
    }
  }

  if (closestId) {
    activeCategoryId.value = closestId;
  }
}

function selectEntity(entity) {
  isOpen.value = false;
  emit('select', entity.name);
}

function close() {
  isOpen.value = false;
}
</script>
