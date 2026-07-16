<template>
  <!-- Two-section story: Available (left) vs Selected (right). Available is a
       single-column list grouped under collapsible category headings (#601 r2 —
       the old category-TOC rail is gone); the search field sits on the
       "Available" header row and scopes to Available only. A selected property
       is REMOVED from Available (not greyed) — it exists only on the right. -->
  <div class="column-editor d-flex" :style="{ height, minHeight: '320px' }">
    <!-- ============ LEFT: AVAILABLE ============ -->
    <!-- In disabled/preset mode (e.g. RIS / WoS export) the whole Available
         side is greyed out and non-interactive — the column set is fixed. -->
    <div class="ce-available d-flex flex-column" :class="{ 'ce-available--disabled': disabled }">
      <div class="ce-col-header d-flex align-center">
        <span class="flex-shrink-0">Available ({{ availableCount }})</span>
        <v-spacer />
        <v-text-field
          ref="searchFieldRef"
          v-model="searchQuery"
          :placeholder="mode === 'group_by' ? 'Search stats' : 'Search columns'"
          variant="outlined"
          density="compact"
          rounded="lg"
          hide-details
          clearable
          prepend-inner-icon="mdi-magnify"
          class="ce-header-search"
          :disabled="disabled"
        />
      </div>

      <!-- one-column grouped list: collapsible category headings, add-only
           property rows (title + hover arrow, no per-field icon). Removal /
           reorder happen on the right. -->
      <div class="ce-available-body flex-grow-1 overflow-y-auto pa-2">
        <div v-for="cat in categories" :key="cat.displayName">
          <button type="button" class="ce-cat-toggle" @click="toggleCategory(cat.displayName)">
            <v-icon size="16" class="ce-cat-icon">{{ cat.icon }}</v-icon>
            <span class="text-capitalize">{{ cat.displayName }}</span>
            <v-icon size="18" class="ce-cat-chevron ml-auto">
              {{ isExpanded(cat.displayName) ? 'mdi-chevron-down' : 'mdi-chevron-right' }}
            </v-icon>
          </button>
          <v-list v-show="isExpanded(cat.displayName)" density="compact" class="py-0">
            <v-list-item
              v-for="item in cat.items"
              :key="item.key"
              @click="addItem(item.key)"
              rounded
              class="rounded-lg ce-prop-row"
            >
              <v-list-item-title class="text-capitalize">
                {{ item.label }}
              </v-list-item-title>
              <template #append>
                <v-icon size="18" class="ce-add-arrow">mdi-arrow-right</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </div>
        <div v-if="!categories.length" class="text-medium-emphasis text-center py-8">
          {{ mode === 'group_by' ? 'No matching stats.' : 'No matching columns.' }}
        </div>
      </div>
    </div>

    <!-- ============ RIGHT: SELECTED ============ -->
    <div class="ce-selected d-flex flex-column">
      <div class="ce-col-header d-flex align-center">Selected ({{ selectedCount }})</div>

      <!-- selected columns as a draggable LIST (grab handle + label + remove),
           in column order (#601 r2 — was chips). [x] de-selects (disabled on
           the last row — ≥1-column floor); drag to reorder. Edits emit live via
           v-model — the embedding container owns whether/when they're committed
           (table dialog defers to Apply; the export dialog uses them directly). -->
      <div class="ce-rows flex-grow-1 overflow-y-auto pa-2">
        <!-- Disabled/preset mode: static rows from presetLabels — no grip, no
             remove, not draggable. Labels are already human-readable (acronyms
             intact), so no capitalize filter. -->
        <template v-if="disabled">
          <div
            v-for="label in presetLabels"
            :key="label"
            class="ce-selected-row ce-selected-row--static"
          >
            <span class="ce-selected-row-label">{{ label }}</span>
          </div>
        </template>
        <!-- Editable mode: draggable rows with remove. -->
        <template v-else>
          <div
            v-for="(key, i) in modelValue"
            :key="key"
            class="ce-selected-row"
            :class="{ 'ce-selected-row--dragover': dragOverIndex === i }"
            draggable="true"
            @dragstart="onDragStart(i, $event)"
            @dragover.prevent="onDragOver(i)"
            @dragleave="onDragLeave(i)"
            @drop="onDrop(i)"
            @dragend="onDragEnd"
          >
            <v-icon size="16" class="ce-selected-row-grip">mdi-drag-vertical</v-icon>
            <span class="ce-selected-row-label text-capitalize">{{ selectedLabel(key) }}</span>
            <v-btn
              icon
              variant="text"
              size="x-small"
              class="ce-selected-row-remove"
              :disabled="modelValue.length <= minItemsFloor"
              :title="modelValue.length <= minItemsFloor ? 'At least one column is required' : (mode === 'group_by' ? 'Remove stat' : 'Remove column')"
              @click="removeItem(key)"
            >
              <v-icon size="16">mdi-close</v-icon>
            </v-btn>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import filters from '@/filters';
import { facetsByCategory, getFacetConfig } from '@/facetConfigUtils';
import { resolveColumn, isColumnEligible, hasIdsSibling } from '@/components/Results/Table/columnConfig';

defineOptions({ name: 'ColumnEditorPanel' });

// The reusable column editor body (job #304). Two main sections:
//   AVAILABLE (left)  — search (on the header row) + one-column categorized
//                       list with collapsible headings; add-only rows
//   SELECTED  (right) — the chosen columns as a draggable list, in order,
//                       each with a grab handle + [x]
//
// This panel is a CONTROLLED v-model over the ordered key list: every add /
// remove / reorder emits `update:modelValue` immediately. Deferred-commit (the
// table-view "Apply" semantics) lives in the EditColumnsDialog wrapper, which
// binds this panel to a local draft; the export dialog binds it to an ephemeral
// draft used directly at export time.
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  entityType: { type: String, required: true },
  // CSS height for the editor body (the embedding context may want less than
  // the standalone dialog's 60vh).
  height: { type: String, default: '60vh' },
  // Read-only/preset mode: greys out the Available side and renders the Selected
  // side as static (non-removable, non-draggable) rows from `presetLabels`.
  // Used for fixed-shape exports (RIS / WoS) where the column set isn't editable.
  disabled: { type: Boolean, default: false },
  // Human-readable column labels shown as static rows when `disabled` (acronyms
  // already cased correctly — rendered verbatim, no capitalize filter).
  presetLabels: { type: Array, default: () => [] },
  // What this panel edits (#440 r6): 'column' (default — table columns, the
  // original behavior, all existing consumers untouched) or 'group_by' (the
  // SERP stats widgets: group_by-eligible properties, no :ids siblings, and the
  // selection may be emptied — a stats rail with zero widgets is valid).
  mode: { type: String, default: 'column' },
  // Keys to hide from the Available side (e.g. admin-gated group_bys for
  // non-admins). Passed through to facetsByCategory's exclude list.
  excludeKeys: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const searchQuery = ref('');
const searchFieldRef = ref(null);

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

// Columns keep the ≥1 floor; a stats rail may be emptied (group_by mode).
const minItemsFloor = computed(() => (props.mode === 'group_by' ? 0 : 1));

function removeItem(key) {
  if (props.modelValue.length <= minItemsFloor.value) return;
  commit(props.modelValue.filter((k) => k !== key));
}

function selectedLabel(key) {
  if (props.mode === 'group_by') {
    return filters.titleCase(getFacetConfig(props.entityType, key)?.displayName ?? key);
  }
  const col = resolveColumn(props.entityType, key);
  return filters.capitalize(col?.label ?? key);
}

// Header counts. Selected = chosen columns. Available = addable (not-yet-
// selected) properties currently shown — so both numbers move when a property
// is added/removed, and Available reflects the active search filter.
const selectedCount = computed(() =>
  props.disabled && props.presetLabels.length ? props.presetLabels.length : props.modelValue.length,
);
const availableCount = computed(() =>
  categories.value.reduce((n, cat) => n + cat.items.length, 0),
);

// ---- collapsible category headings (#601 r2) ----
// All categories start CLOSED (r3) — the point of collapse is scanning every
// category in one glance. State is remembered per category name for the life
// of the panel (the dialog remounts it each open). While a search query is
// active every (matching) category is force-expanded so hits are never hidden.
const expandedCats = ref(new Set());

function isExpanded(name) {
  if (searchQuery.value) return true;
  return expandedCats.value.has(name);
}

function toggleCategory(name) {
  const next = new Set(expandedCats.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  expandedCats.value = next;
}

// ---- available list: eligible, NOT-yet-selected properties, by category ----
// column mode: column-eligible + renderable; group_by mode: group_by-actionable.
// Selected keys are dropped entirely (they live on the right); a category whose
// properties are all selected disappears.
function isEligible(c) {
  if (c.entityToFilter !== props.entityType) return false;
  if (props.mode === 'group_by') return c.actions?.includes('group_by');
  return isColumnEligible(c);
}

const categories = computed(() => {
  return facetsByCategory(props.entityType, searchQuery.value, [], props.excludeKeys)
    .map((cat) => {
      const items = [];
      for (const c of cat.filterConfigs) {
        if (!isEligible(c)) continue;
        if (props.mode === 'group_by') {
          if (!isSelected(c.key)) {
            items.push({
              key: c.key,
              label: filters.titleCase(c.displayName ?? c.key),
              icon: c.icon ?? 'mdi-chart-box-outline',
            });
          }
          continue; // no :ids siblings for stats widgets
        }
        if (!isSelected(c.key)) {
          items.push({
            key: c.key,
            // Use the resolved column label (respects `column.label` overrides,
            // e.g. "Work ID") so the picker matches the selected row + table header.
            label: filters.capitalize(resolveColumn(props.entityType, c.key)?.label ?? c.displayName ?? c.key),
            icon: c.icon ?? 'mdi-table-column',
          });
        }
        // Auto-derived bare-ID sibling, only for entity-typed columns whose
        // items carry a parseable OpenAlex id (hasIdsSibling — gates out
        // controlled vocabularies like `type`/`language`/`country_codes`).
        if (hasIdsSibling(c)) {
          const idsKey = `${c.key}:ids`;
          if (!isSelected(idsKey)) {
            items.push({
              key: idsKey,
              label: filters.capitalize(resolveColumn(props.entityType, idsKey)?.label ?? idsKey),
              icon: c.icon ?? 'mdi-table-column',
            });
          }
        }
      }
      return { displayName: cat.displayName, icon: cat.icon, items };
    })
    .filter((cat) => cat.items.length > 0);
});

// ---- row drag-to-reorder (native HTML5 DnD) ----
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
  // Don't auto-focus the (disabled) search field in preset mode.
  if (!props.disabled) {
    setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
  }
});
</script>

<style scoped>
/* Framed two-section editor: Available | Selected. The frame + the main
   vertical divider read as the primary split. */
.column-editor {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  overflow: hidden;
}

/* Available | Selected split 50/50 — both halves get equal width. */
.ce-available {
  flex: 1 1 50%;
  min-width: 0;
  /* MAIN split — same weight as the frame */
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.ce-selected {
  flex: 1 1 50%;
  min-width: 0;
  background: rgba(0, 0, 0, 0.015);
}

/* Column headers — the two main sections (Available / Selected). Fixed height
   on both sides so the header borders align even though only the left one
   hosts the search field. */
.ce-col-header {
  flex: 0 0 auto;
  min-height: 56px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

/* Search field on the Available header row — compact, right-aligned. */
.ce-header-search {
  flex: 0 1 220px;
  max-width: 220px;
  font-weight: 400;
}

.ce-available-body {
  min-height: 0; /* let it scroll within the flex column */
}

/* Collapsible category heading — darker and more heading-y than the old
   uppercase micro-labels (#601 r2). Full-row click target with a chevron. */
.ce-cat-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  margin-top: 4px;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.87);
  text-align: left;
  cursor: pointer;
}
.ce-cat-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}
.ce-cat-icon {
  color: rgba(0, 0, 0, 0.6);
}
.ce-cat-chevron {
  color: rgba(0, 0, 0, 0.45);
}

/* Hover affordance: a right-arrow on an available property row, signalling that
   a click moves it into Selected. Space reserved via opacity so rows are stable. */
.ce-add-arrow {
  /* !important to beat Vuetify's default icon opacity (≈0.5), so the arrow is
     fully hidden until the row is hovered. Space stays reserved (opacity, not
     display) so rows don't shift. */
  opacity: 0 !important;
  transition: opacity 0.12s ease;
  color: rgba(0, 0, 0, 0.45);
}
.ce-prop-row:hover .ce-add-arrow {
  opacity: 1 !important;
}

.ce-rows {
  min-height: 0;
}

/* Disabled/preset mode: grey out the whole Available side and block interaction.
   The Selected side stays legible (static rows) so users can read the preset. */
.ce-available--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* selected-column rows — list rows, not chips (#601 r2): full-width, no border,
   hover background; grab handle on the left, remove on the right. */
.ce-selected-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px 5px 8px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: grab;
  user-select: none;
}
.ce-selected-row:hover {
  background: rgba(0, 0, 0, 0.04);
}
.ce-selected-row:active {
  cursor: grabbing;
}
/* Static (preset) row — not draggable/removable; default cursor, left padding
   restored since there's no grip icon. */
.ce-selected-row--static {
  cursor: default;
  padding-left: 12px;
}
.ce-selected-row--dragover {
  background: rgba(0, 0, 0, 0.06);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35) inset;
}
.ce-selected-row-grip {
  color: rgba(0, 0, 0, 0.3);
  flex: 0 0 auto;
}
.ce-selected-row-label {
  flex: 1 1 auto;
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ce-selected-row-remove {
  flex: 0 0 auto;
}
</style>
