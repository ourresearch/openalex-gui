<template>
  <div>
    <!-- Search -->
    <div class="px-4 pb-2 pt-1">
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
    <div class="d-flex" :style="{ height, minHeight: '320px' }">
      <!-- Left: category TOC -->
      <div class="pa-2 column-editor-toc">
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
      <div ref="listRef" class="flex-grow-1 overflow-y-auto pa-2 column-editor-list" @scroll="onScroll">
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
           reorder. Edits emit live via v-model — the embedding container owns
           whether/when they're committed (table dialog defers to Apply; the
           export dialog uses them directly). -->
      <div class="pa-3 column-editor-chips">
        <div class="text-overline text-medium-emphasis mb-2">Selected columns</div>
        <div
          v-for="(key, i) in modelValue"
          :key="key"
          class="column-editor-chip"
          :class="{ 'column-editor-chip--dragover': dragOverIndex === i }"
          draggable="true"
          @dragstart="onDragStart(i, $event)"
          @dragover.prevent="onDragOver(i)"
          @dragleave="onDragLeave(i)"
          @drop="onDrop(i)"
          @dragend="onDragEnd"
        >
          <v-icon size="16" class="column-editor-chip-grip">mdi-drag-vertical</v-icon>
          <span class="column-editor-chip-label text-capitalize">{{ chipLabel(key) }}</span>
          <v-btn
            icon
            variant="text"
            size="x-small"
            class="column-editor-chip-remove"
            :disabled="modelValue.length <= 1"
            :title="modelValue.length <= 1 ? 'At least one column is required' : 'Remove column'"
            @click="removeItem(key)"
          >
            <v-icon size="16">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import filters from '@/filters';
import { facetsByCategory } from '@/facetConfigUtils';
import { resolveColumn, isColumnEligible, hasIdsSibling } from '@/components/Results/Table/columnConfig';

defineOptions({ name: 'ColumnEditorPanel' });

// The reusable three-column column editor body, extracted from EditColumnsDialog
// (job #304). Columns:
//   left   = category TOC (click-to-scroll, active-highlight on scroll)
//   center = add-only property list (icon rows, greyed when already selected),
//            including the auto-derived ":ids" sibling rows
//   right  = the selected columns as draggable chips, in order, each with an [x]
//
// This panel is a CONTROLLED v-model over the ordered key list: every add /
// remove / reorder emits `update:modelValue` immediately. Deferred-commit (the
// table-view "Apply" semantics) lives in the EditColumnsDialog wrapper, which
// binds this panel to a local draft; the export dialog binds it to an ephemeral
// draft used directly at export time.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  entityType: { type: String, required: true },
  // CSS height for the three-column body (the embedding context may want less
  // than the standalone dialog's 60vh).
  height: { type: String, default: '60vh' },
});
const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const searchFieldRef = ref(null);
const activeCategoryName = ref(null);
const listRef = ref(null);
const categoryRefMap = {};

function commit(keys) {
  emit('update:modelValue', keys);
}

function isSelected(key) {
  return props.modelValue.includes(key);
}

function addItem(key) {
  if (props.modelValue.includes(key)) return;
  commit([...props.modelValue, key]);
}

function removeItem(key) {
  // ≥1-column floor — never remove the last chip.
  if (props.modelValue.length <= 1) return;
  commit(props.modelValue.filter((k) => k !== key));
}

function chipLabel(key) {
  const col = resolveColumn(props.entityType, key);
  return filters.capitalize(col?.label ?? key);
}

// ---- center list: column-eligible + renderable properties, by category ----
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
        // Auto-derived bare-ID sibling, only for entity-typed columns whose
        // items carry a parseable OpenAlex id (hasIdsSibling — gates out
        // controlled vocabularies like `type`/`language`/`country_codes`).
        if (hasIdsSibling(c)) {
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
  const keys = [...props.modelValue];
  const [moved] = keys.splice(from, 1);
  keys.splice(targetIndex, 0, moved);
  commit(keys);
  dragIndex.value = null;
  dragOverIndex.value = null;
}
function onDragEnd() {
  dragIndex.value = null;
  dragOverIndex.value = null;
}

onMounted(() => {
  activeCategoryName.value = categories.value[0]?.displayName ?? null;
  setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
});
</script>

<style scoped>
.column-editor-toc {
  min-width: 160px;
  max-width: 180px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  overflow-y: auto;
}
.column-editor-list {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.column-editor-chips {
  width: 240px;
  min-width: 240px;
  overflow-y: auto;
}
.column-editor-chip {
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
.column-editor-chip:active {
  cursor: grabbing;
}
.column-editor-chip--dragover {
  border-color: rgba(0, 0, 0, 0.55);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset;
}
.column-editor-chip-grip {
  color: rgba(0, 0, 0, 0.3);
  flex: 0 0 auto;
}
.column-editor-chip-label {
  flex: 1 1 auto;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.column-editor-chip-remove {
  flex: 0 0 auto;
}
</style>
