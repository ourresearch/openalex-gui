<template>
  <v-dialog v-model="isOpen" max-width="920" scroll-strategy="none">
    <v-card class="bg-white" elevation="8">
      <!-- Title bar -->
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">Edit columns</span>
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
          :placeholder="'Search columns…'"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
        />
      </div>

      <v-divider />

      <!-- Three-column layout: categories | properties (add-only) | selected chips -->
      <div class="d-flex" style="height: 60vh; min-height: 320px;">
        <!-- Left: category TOC -->
        <div class="pa-2 edit-columns-toc">
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

        <!-- Center: property list grouped by category. Add-only — icon per row,
             NO checkboxes; a property already selected is greyed + disabled.
             Removal / reorder happen on the right (chip rail). -->
        <div ref="listRef" class="flex-grow-1 overflow-y-auto pa-2 edit-columns-list" @scroll="onScroll">
          <div
            v-for="cat in categories"
            :key="cat.displayName"
            :ref="el => setCategoryRef(cat.displayName, el)"
          >
            <div class="text-overline text-medium-emphasis mt-3 mb-1 pl-2">
              {{ cat.displayName }}
            </div>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="item in cat.items"
                :key="item.key"
                :disabled="isSelected(item.key)"
                @click="addItem(item.key)"
                rounded
                class="rounded-lg"
              >
                <template #prepend>
                  <v-icon size="18" class="mr-3" :disabled="isSelected(item.key)">{{ item.icon }}</v-icon>
                </template>
                <v-list-item-title class="text-capitalize">
                  {{ item.label }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
          <div v-if="!categories.length" class="text-medium-emphasis text-body-2 pa-4">
            No matching columns.
          </div>
        </div>

        <!-- Right: selected columns as draggable chips, in column order. Chip [x]
             de-selects (disabled on the last chip — ≥1-column floor); drag to
             reorder. All edits stay in the draft until Apply. -->
        <div class="pa-3 edit-columns-chips">
          <div class="text-overline text-medium-emphasis mb-2">Selected columns</div>
          <div
            v-for="(key, i) in draftKeys"
            :key="key"
            class="edit-columns-chip"
            :class="{ 'edit-columns-chip--dragover': dragOverIndex === i }"
            draggable="true"
            @dragstart="onDragStart(i, $event)"
            @dragover.prevent="onDragOver(i)"
            @dragleave="onDragLeave(i)"
            @drop="onDrop(i)"
            @dragend="onDragEnd"
          >
            <v-icon size="16" class="edit-columns-chip-grip">mdi-drag-vertical</v-icon>
            <span class="edit-columns-chip-label text-capitalize">{{ chipLabel(key) }}</span>
            <v-btn
              icon
              variant="text"
              size="x-small"
              class="edit-columns-chip-remove"
              :disabled="draftKeys.length <= 1"
              :title="draftKeys.length <= 1 ? 'At least one column is required' : 'Remove column'"
              @click="removeItem(key)"
            >
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Deferred-commit footer -->
      <v-divider />
      <v-card-actions class="pa-3 justify-end">
        <v-btn variant="plain" class="text-black" @click="close">Cancel</v-btn>
        <v-btn variant="flat" color="black" :disabled="!hasChanges" @click="applyChanges">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import filters from '@/filters';
import { facetsByCategory } from '@/facetConfigUtils';
import { resolveColumn, deriveColumnRender, isColumnEligible } from '@/components/Results/Table/columnConfig';

defineOptions({ name: 'EditColumnsDialog' });

// The "Edit columns" dialog — the column-mode property browser, distinct from the
// filter picker (NoviceFilterDialog, 2-column). Three columns:
//   left   = category TOC (click-to-scroll, active-highlight on scroll)
//   center = add-only property list (icon rows, greyed when already selected),
//            including the auto-derived ":ids" sibling rows
//   right  = the selected columns as draggable chips, in order, each with an [x]
// All edits mutate a local ordered draft; nothing reaches the table until Apply.
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  entityType: { type: String, required: true },
  // The table's current ordered column keys. Seeds the draft on open.
  selectedKeys: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'apply']);

// Render kinds whose values are entities — these get an auto-derived ":ids"
// sibling row (the bare-ID column alongside the linked-names column).
const ENTITY_KINDS = new Set(['entityLink', 'entityList']);

const isOpen = ref(false);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => { if (!v) emit('update:modelValue', false); });

const searchQuery = ref('');
const searchFieldRef = ref(null);
const activeCategoryName = ref(null);
const listRef = ref(null);
const categoryRefMap = {};

// ---- ordered draft (deferred-commit) ----
const draftKeys = ref([]);
const hasChanges = computed(() => {
  const a = draftKeys.value;
  const b = props.selectedKeys;
  // Order matters here (drag reorder is a real change), so compare positionally.
  return a.length !== b.length || a.some((k, i) => k !== b[i]);
});

function isSelected(key) {
  return draftKeys.value.includes(key);
}

function addItem(key) {
  if (draftKeys.value.includes(key)) return;
  draftKeys.value = [...draftKeys.value, key];
}

function removeItem(key) {
  // ≥1-column floor — never remove the last chip.
  if (draftKeys.value.length <= 1) return;
  draftKeys.value = draftKeys.value.filter((k) => k !== key);
}

function chipLabel(key) {
  const col = resolveColumn(props.entityType, key);
  return filters.capitalize(col?.label ?? key);
}

function applyChanges() {
  emit('apply', [...draftKeys.value]);
  isOpen.value = false;
}
function close() {
  isOpen.value = false;
}

// ---- center list: column-eligible + renderable properties, by category ----
// Eligibility is centralized in columnConfig (render kind + extractFn derived
// from the property's `type`, Phase 6). Each entity-kind property also
// contributes a ":ids" sibling row.
function isEligible(c) {
  return c.entityToFilter === props.entityType && isColumnEligible(c);
}

const categories = computed(() => {
  return facetsByCategory(props.entityType, searchQuery.value, [], [])
    .map((cat) => {
      const items = [];
      for (const c of cat.filterConfigs) {
        if (!isEligible(c)) continue;
        items.push({
          key: c.key,
          label: filters.capitalize(c.displayName ?? c.key),
          icon: c.icon ?? 'mdi-table-column',
        });
        // Auto-derived bare-ID sibling for entity-typed columns.
        if (!c.isIdentityColumn && ENTITY_KINDS.has(deriveColumnRender(c)?.kind)) {
          const idsKey = `${c.key}:ids`;
          items.push({
            key: idsKey,
            label: filters.capitalize(resolveColumn(props.entityType, idsKey)?.label ?? idsKey),
            icon: c.icon ?? 'mdi-table-column',
          });
        }
      }
      return { displayName: cat.displayName, icon: cat.icon, items };
    })
    .filter((cat) => cat.items.length > 0);
});

// ---- left TOC: click-to-scroll + active highlight ----
function setCategoryRef(name, el) {
  if (el) categoryRefMap[name] = el;
  else delete categoryRefMap[name];
}

let isScrollingProgrammatically = false;
function scrollToCategory(name) {
  activeCategoryName.value = name;
  const el = categoryRefMap[name];
  if (el) {
    isScrollingProgrammatically = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrollingProgrammatically = false; }, 500);
  }
}

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
    if (dist < closestDist) {
      closestDist = dist;
      closestName = name;
    }
  }
  if (closestName) activeCategoryName.value = closestName;
}

// ---- chip drag-to-reorder (native HTML5 DnD) ----
const dragIndex = ref(null);
const dragOverIndex = ref(null);
function onDragStart(i, e) {
  dragIndex.value = i;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    // Firefox needs data set for the drag to fire.
    e.dataTransfer.setData('text/plain', String(i));
  }
}
function onDragOver(i) {
  dragOverIndex.value = i;
}
function onDragLeave(i) {
  if (dragOverIndex.value === i) dragOverIndex.value = null;
}
function onDrop(targetIndex) {
  const from = dragIndex.value;
  if (from === null || from === targetIndex) return;
  const keys = [...draftKeys.value];
  const [moved] = keys.splice(from, 1);
  keys.splice(targetIndex, 0, moved);
  draftKeys.value = keys;
  dragIndex.value = null;
  dragOverIndex.value = null;
}
function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

// ---- open/close lifecycle ----
watch(isOpen, (open) => {
  if (open) {
    searchQuery.value = '';
    // Snapshot the current columns into the ordered draft. Nothing leaves the
    // dialog until Apply.
    draftKeys.value = [...props.selectedKeys];
    activeCategoryName.value = categories.value[0]?.displayName ?? null;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
  } else {
    document.documentElement.style.overflow = '';
  }
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = '';
});
</script>

<style scoped>
.edit-columns-toc {
  min-width: 160px;
  max-width: 180px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}
.edit-columns-list {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.edit-columns-chips {
  width: 240px;
  min-width: 240px;
  overflow-y: auto;
}
.edit-columns-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 6px;
  margin-bottom: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #fafafa;
  cursor: grab;
  user-select: none;
}
.edit-columns-chip:active {
  cursor: grabbing;
}
.edit-columns-chip--dragover {
  border-color: rgba(0, 0, 0, 0.55);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset;
}
.edit-columns-chip-grip {
  color: rgba(0, 0, 0, 0.3);
  flex: 0 0 auto;
}
.edit-columns-chip-label {
  flex: 1 1 auto;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.edit-columns-chip-remove {
  flex: 0 0 auto;
}
</style>
