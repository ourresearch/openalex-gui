<template>
  <!-- Two-section story: the MAIN split is Available (left) vs Selected (right).
       Inside Available there's a SUBORDINATE split of category TOC vs property
       list. The search bar scopes to Available only (it searches properties). -->
  <div class="column-editor d-flex" :style="{ height, minHeight: '320px' }">
    <!-- ============ LEFT: AVAILABLE ============ -->
    <!-- In disabled/preset mode (e.g. RIS / WoS export) the whole Available
         side is greyed out and non-interactive — the column set is fixed. -->
    <div class="ce-available d-flex flex-column" :class="{ 'ce-available--disabled': disabled }">
      <div class="ce-col-header">Available ({{ availableCount }})</div>

      <div class="ce-search px-3 py-2">
        <v-text-field
          ref="searchFieldRef"
          v-model="searchQuery"
          :placeholder="mode === 'group_by' ? 'Search stats…' : 'Search columns…'"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          :disabled="disabled"
        />
      </div>

      <!-- subordinate split: category TOC | property list -->
      <div class="ce-available-body d-flex flex-grow-1">
        <!-- category TOC -->
        <div class="ce-toc pa-2">
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

        <!-- property list grouped by category. Add-only — icon per row, NO
             checkboxes; a property already selected is greyed + disabled.
             Removal / reorder happen on the right (chip rail). -->
        <div ref="listRef" class="ce-props flex-grow-1 overflow-y-auto pa-2" @scroll="onScroll">
          <div
            v-for="cat in categories"
            :key="cat.displayName"
            :ref="el => setCategoryRef(cat.displayName, el)"
          >
            <div class="ce-cat-header d-flex align-center mt-3 mb-1 pl-2">
              <v-icon size="15" class="ce-cat-icon mr-1">{{ cat.icon }}</v-icon>
              <span class="text-capitalize">{{ cat.displayName }}</span>
            </div>
            <v-list density="compact" class="py-0">
              <v-list-item
                v-for="item in cat.items"
                :key="item.key"
                :disabled="isSelected(item.key)"
                @click="addItem(item.key)"
                rounded
                class="rounded-lg ce-prop-row"
              >
                <v-list-item-title class="text-capitalize">
                  {{ item.label }}
                </v-list-item-title>
                <!-- On hover, a right-arrow hints that clicking moves this
                     property into the Selected section. Hidden for already-
                     selected (disabled) rows. Space is reserved (opacity) so
                     rows don't shift on hover. -->
                <template #append>
                  <v-icon v-if="!isSelected(item.key)" size="18" class="ce-add-arrow">mdi-arrow-right</v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>
          <div v-if="!categories.length" class="text-medium-emphasis text-body-2 pa-4">
            No matching {{ mode === 'group_by' ? 'stats' : 'columns' }}.
          </div>
        </div>
      </div>
    </div>

    <!-- ============ RIGHT: SELECTED ============ -->
    <div class="ce-selected d-flex flex-column">
      <div class="ce-col-header">Selected ({{ selectedCount }})</div>

      <!-- selected columns as draggable chips, in column order. Chip [x]
           de-selects (disabled on the last chip — ≥1-column floor); drag to
           reorder. Edits emit live via v-model — the embedding container owns
           whether/when they're committed (table dialog defers to Apply; the
           export dialog uses them directly). -->
      <div class="ce-chips flex-grow-1 overflow-y-auto pa-3">
        <!-- Disabled/preset mode: static chips from presetLabels — no grip, no
             remove, not draggable. Labels are already human-readable (acronyms
             intact), so no capitalize filter. -->
        <template v-if="disabled">
          <div
            v-for="label in presetLabels"
            :key="label"
            class="column-editor-chip column-editor-chip--static"
          >
            <span class="column-editor-chip-label">{{ label }}</span>
          </div>
        </template>
        <!-- Editable mode: draggable chips with remove. -->
        <template v-else>
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
//   AVAILABLE (left)  — search + category TOC (subordinate) + add-only property list
//   SELECTED  (right) — the chosen columns as draggable chips, in order, each [x]
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
  // side as static (non-removable, non-draggable) chips from `presetLabels`.
  // Used for fixed-shape exports (RIS / WoS) where the column set isn't editable.
  disabled: { type: Boolean, default: false },
  // Human-readable column labels shown as static chips when `disabled` (acronyms
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

// Columns keep the ≥1 floor; a stats rail may be emptied (group_by mode).
const minItemsFloor = computed(() => (props.mode === 'group_by' ? 0 : 1));

function removeItem(key) {
  if (props.modelValue.length <= minItemsFloor.value) return;
  commit(props.modelValue.filter((k) => k !== key));
}

function chipLabel(key) {
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
  categories.value.reduce((n, cat) => n + cat.items.filter((i) => !isSelected(i.key)).length, 0),
);

// ---- center list: eligible properties, by category ----
// column mode: column-eligible + renderable; group_by mode: group_by-actionable.
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
          items.push({
            key: c.key,
            label: filters.titleCase(c.displayName ?? c.key),
            icon: c.icon ?? 'mdi-chart-box-outline',
          });
          continue; // no :ids siblings for stats widgets
        }
        items.push({
          key: c.key,
          // Use the resolved column label (respects `column.label` overrides,
          // e.g. "Work ID") so the picker matches the chip + table header.
          label: filters.capitalize(resolveColumn(props.entityType, c.key)?.label ?? c.displayName ?? c.key),
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
  // Don't auto-focus the (disabled) search field in preset mode.
  if (!props.disabled) {
    setTimeout(() => searchFieldRef.value?.$el?.querySelector('input')?.focus(), 150);
  }
});
</script>

<style scoped>
/* Framed two-section editor: Available | Selected. The frame + the main
   vertical divider read as the primary split; the category/property divider
   inside Available is intentionally lighter (subordinate). */
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

/* Column headers — the two main sections (Available / Selected). These are the
   DOMINANT level of the in-panel hierarchy: larger/bolder/darker than the
   category sub-headings inside the Available list (.ce-cat-header). */
.ce-col-header {
  flex: 0 0 auto;
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(0, 0, 0, 0.87);
  padding: 12px 16px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.ce-search {
  flex: 0 0 auto;
}

.ce-available-body {
  min-height: 0; /* let children scroll within the flex column */
}

.ce-toc {
  flex: 0 0 140px;
  width: 140px;
  overflow-y: auto;
  /* SUBORDINATE split — lighter than the main Available|Selected divider */
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

/* Category sub-heading inside the Available property list. SUBORDINATE to the
   .ce-col-header section titles — smaller, lighter, with a leading icon that
   matches the TOC entry for that category. */
.ce-cat-header {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
}
.ce-cat-icon {
  color: rgba(0, 0, 0, 0.45);
}

.ce-props {
  min-width: 0;
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

.ce-chips {
  min-height: 0;
}

/* Disabled/preset mode: grey out the whole Available side and block interaction.
   The Selected side stays legible (static chips) so users can read the preset. */
.ce-available--disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* selected-column chips */
.column-editor-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 6px;
  margin-bottom: 6px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #fff;
  cursor: grab;
  user-select: none;
}
.column-editor-chip:active {
  cursor: grabbing;
}
/* Static (preset) chip — not draggable/removable; default cursor, left padding
   restored since there's no grip icon. */
.column-editor-chip--static {
  cursor: default;
  padding-left: 10px;
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
