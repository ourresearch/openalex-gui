<template>
  <!-- Shared categorized field/property picker body (oxjob #505). The
       presentation engine behind the OQL "All fields" dialog
       (BuilderFieldDialog) and the filter selector (NoviceFilterDialog); the
       column selector (ColumnEditorPanel) used it too until #601 r2 moved to a
       single-column collapsible list. It owns the left category TOC rail, scroll-spy
       (IntersectionObserver + onScroll fallback), the grouped list with category
       headers/icons, and the empty state. Each parent keeps its own search field
       above this and builds the `categories` array; the per-row affordance comes
       through the `#row` scoped slot, so filtering / column-add / OQL-pick each keep
       their own row UI while sharing the layout + scroll machinery.

       Field rows carry NO per-field icon by design (oxjob #505 complaint #1) —
       icons live only on the category rail + the category headers. -->
  <div class="cfp d-flex" :style="{ height }">
    <!-- left: category TOC -->
    <div class="cfp-toc pa-2" :style="{ minWidth: tocWidth, maxWidth: tocWidth }">
      <v-list density="compact" nav class="py-0">
        <v-list-item
          v-for="cat in categories"
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

    <!-- right: grouped property list -->
    <div ref="listRef" class="cfp-list flex-grow-1 overflow-y-auto pa-2" @scroll="onScroll">
      <div
        v-for="cat in categories"
        :key="cat.displayName"
        :ref="el => setCategoryRef(cat.displayName, el)"
      >
        <div class="cfp-cat-header d-flex align-center mt-3 mb-1 pl-2">
          <v-icon size="15" class="cfp-cat-icon mr-1">{{ cat.icon }}</v-icon>
          <span class="text-capitalize">{{ cat.displayName }}</span>
        </div>
        <v-list density="compact" class="py-0">
          <template v-for="item in cat.items" :key="item.key">
            <slot name="row" :item="item" :category="cat">
              <!-- default row: icon-less title, click to select -->
              <v-list-item
                :title="item.label"
                rounded
                class="rounded-lg"
                @click="$emit('select', item.key)"
              />
            </slot>
          </template>
        </v-list>
      </div>
      <div v-if="!categories.length" class="text-medium-emphasis text-center py-8">
        {{ emptyText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from "vue";

defineOptions({ name: "CategorizedFacetPicker" });

const props = defineProps({
  // [{ displayName, icon, items: [{ key, label, ... }] }] — already filtered by the
  // parent (search string, action, whitelist, etc.). Empty categories should be
  // pre-stripped by the parent; this component just renders what it's given.
  categories: { type: Array, default: () => [] },
  height: { type: String, default: "60vh" },
  emptyText: { type: String, default: "No matching fields" },
  tocWidth: { type: String, default: "170px" },
});
defineEmits(["select"]);

const activeCategoryName = ref(null);
const listRef = ref(null);
const categoryRefMap = {};

function setCategoryRef(name, el) {
  if (el) categoryRefMap[name] = el;
  else delete categoryRefMap[name];
}

// --- click-to-scroll ---
let isScrollingProgrammatically = false;
function scrollToCategory(name) {
  activeCategoryName.value = name;
  const el = categoryRefMap[name];
  if (el) {
    isScrollingProgrammatically = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { isScrollingProgrammatically = false; }, 500);
  }
}

// --- IntersectionObserver scroll-spy (ported from NoviceFilterDialog) ---
let observer = null;
function setupObserver() {
  cleanupObserver();
  const container = listRef.value;
  if (!container) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (isScrollingProgrammatically) return;
      // topmost intersecting category wins — on open several short categories can
      // sit in the top band at once; last-wins then highlights a lower one.
      const visible = entries.filter((e) => e.isIntersecting);
      if (!visible.length) return;
      const topmost = visible.reduce((a, b) =>
        a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
      );
      const name = topmost.target.dataset.categoryName;
      if (name) activeCategoryName.value = name;
    },
    { root: container, rootMargin: "0px 0px -70% 0px", threshold: 0 },
  );
  for (const [name, el] of Object.entries(categoryRefMap)) {
    if (el) {
      el.dataset.categoryName = name;
      observer.observe(el);
    }
  }
}
function cleanupObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

// --- manual scroll fallback (when IO entries don't fire) ---
function onScroll() {
  if (isScrollingProgrammatically) return;
  const container = listRef.value;
  if (!container) return;
  const scrollTop = container.scrollTop;
  let closestName = null;
  let closestDist = Infinity;
  for (const [name, el] of Object.entries(categoryRefMap)) {
    if (!el) continue;
    const dist = Math.abs(el.offsetTop - scrollTop);
    if (dist < closestDist) { closestDist = dist; closestName = name; }
  }
  if (closestName) activeCategoryName.value = closestName;
}

// Re-seed the active category + (re)wire the observer whenever the rendered
// category set changes (e.g. the parent's search box filters the list, or the
// dialog opens and the categories first populate).
watch(
  () => props.categories,
  (cats) => {
    activeCategoryName.value = cats?.[0]?.displayName ?? null;
    nextTick(() => setupObserver());
  },
  { immediate: true, deep: false },
);

onBeforeUnmount(cleanupObserver);
</script>

<style scoped>
.cfp {
  min-height: 0;
}
.cfp-toc {
  overflow-y: auto;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.cfp-list {
  min-width: 0;
}
/* Category sub-heading inside the property list — smaller/lighter than the rail,
   with a leading icon matching the TOC entry for that category. */
.cfp-cat-header {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
}
.cfp-cat-icon {
  color: rgba(0, 0, 0, 0.45);
}
</style>
