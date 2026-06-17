<template>
  <div ref="builderRootEl" class="builder" :style="OQL_ROLE_CSS_VARS" @keydown="onBuilderKeydown">
    <!-- Drag-to-delete zone (oxjob #467 Phase 4): an overlay strip pinned to the top of
         the builder that appears only while a value chip is being dragged (shared
         useChipDrag state). Dashed + muted "Drag here to delete" while armed; turns solid
         + red "Release to delete" when the chip is dragged over it. Its `drop` handler is
         the reliable delete path (a real registered target). Children are pointer-events:
         none so dragenter/dragleave don't flicker as the cursor crosses the icon/label. -->
    <div v-show="chipDragging" class="delete-zone" :class="{ 'delete-zone--hot': zoneHot }"
      :style="chromeH ? { height: chromeH + 'px' } : null"
      @dragenter.prevent="zoneHot = true"
      @dragover.prevent="onZoneDragover"
      @dragleave="zoneHot = false"
      @drop.prevent="onZoneDrop">
      <v-icon class="dz-icon">{{ zoneHot ? 'mdi-trash-can' : 'mdi-trash-can-outline' }}</v-icon>
      <span class="dz-label">{{ zoneHot ? 'Release to delete' : 'Drag here to delete' }}</span>
    </div>

    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query out of bricks — no syntax to learn.
      </p>
    </header>

    <!-- Line-flow canvas (oxjob #428): the builder takes the server's
         `oql_render_v2` TOKENS but re-derives its own line breaks CLIENT-SIDE from
         the query's paren structure (builderLayout.js) — so a leaf value-bag is ONE
         line that flex-wraps to the viewport instead of the server's fixed 80-col
         wrap. (This intentionally diverges from #463's OQL text-pane line numbers;
         the two are different views now.) Each `.bline` is one logical line; tokens
         are interactive bricks keyed back to v2 nodes for editing. Incomplete new
         filters live as local "drafts" appended after the committed lines, folding
         into the query (server re-render) once they have a value. -->
    <v-card variant="outlined" class="tree-card" :class="{ 'tree-card--embedded': embedded, 'tree-card--toolbar': showToolbar }">
      <v-progress-linear v-if="propsLoading" indeterminate color="deep-purple" />

      <!-- Toolbar (oxjob #428): the builder's chrome lives here instead of a footer.
           Narrow, quiet text buttons; "edit raw" hands authoring off to the host's
           view-code dialog, the rest act on the query in place. -->
      <div v-if="showToolbar" class="builder-toolbar">
        <!-- CONTEXTUAL chip actions (left): the chip pop-up menus were removed; a chip's
             actions appear here when it's highlighted (oxjob #428, Jason 2026-06-17). With
             nothing selected this is just "Add filter" (the lone builder-level default;
             the old Columns/Sort menu buttons were dropped). ≥2 chips selected → batch. -->
        <OqlChipActions
          :active-tok="activeTok"
          :row-selection="rowSelectionInfo"
          :selected-count="selectedIds.size"
          :can-subclause="canSubclause"
          :selection-kind="selectionKind"
          :cmd-label="cmdLabel"
          v-model:editor-open="editorOpen"
          @add-filter="addRootFilter"
          @delete="onActiveDelete"
          @toggle-neg="onActiveToggleNeg"
          @pick-bool="onActivePickBool"
          @pick-date="onActivePickDate"
          @edit-text="onActiveEditText"
          @edit-entity="onActiveEditEntity"
          @row-toggle-join="onRowToggleJoin"
          @row-change-operator="onRowChangeOperator"
          @row-delete="onRowSelectionDelete"
          @wrap-subclause="onAddToSubclause"
          @delete-selected="onDeleteSelected" />

        <!-- Clear-query trashcan (oxjob #475, Jason 2026-06-17): lives at the right edge of the
             left section, and ONLY in the nothing-selected context — when a value/row/multi is
             selected the contextual actions own this space, so it would compete with Delete. -->
        <v-btn v-if="nothingSelected" size="small" variant="text" icon
          :disabled="!hasQuery" @click="clearQuery">
          <v-icon color="grey-darken-1">mdi-trash-can-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Clear</v-tooltip>
        </v-btn>

        <v-spacer />

        <!-- EDITOR controls (right, icon buttons + native tooltips): act on the
             query's representation — edit code · copy · clear. (oxjob #428)
             Use the app-standard icon-button recipe (matches SerpRightToolbar /
             GroupBySidebar): `icon variant="text" size="small"` + a
             `grey-darken-1` v-icon, no custom sizing — so they don't read heavier
             or bigger than icon buttons elsewhere. -->
        <v-btn size="small" variant="text" icon
          @click="emit('edit-raw', renderedOql)">
          <v-icon color="grey-darken-1">mdi-code-tags</v-icon>
          <v-tooltip activator="parent" location="bottom">Edit code</v-tooltip>
        </v-btn>
        <v-btn size="small" variant="text" icon
          :color="copied ? 'success' : undefined" @click="copyOql">
          <v-icon :color="copied ? undefined : 'grey-darken-1'">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ copied ? 'Copied' : 'Copy' }}</v-tooltip>
        </v-btn>

        <!-- Settings (oxjob #475, Jason 2026-06-17): rightmost slot. Placeholder menu for now. -->
        <v-menu location="bottom end" offset="4">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" size="small" variant="text" icon>
              <v-icon color="grey-darken-1">mdi-cog-outline</v-icon>
              <v-tooltip activator="parent" location="bottom">Settings</v-tooltip>
            </v-btn>
          </template>
          <v-card min-width="160" class="menu-card">
            <v-list density="compact" class="py-0">
              <v-list-item disabled>
                <v-list-item-title class="text-medium-emphasis">Coming soon</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
      </div>

      <div ref="linesEl" class="builder-lines" @mouseleave="clearHover">
        <!-- The whole row band is clickable (oxjob #475): a click anywhere on a line that maps
             to a logical row selects that row (`onLineClick` reads the precomputed `_selectRow`).
             VALUE chips stopPropagation (they self-select); parens/conjunctions/property are
             inert decorations, so their clicks bubble here. `.stop` keeps the band click off the
             document-level deselect handler (it manages its own selection). -->
        <div v-for="(line, lineIdx) in displayLines" :key="line.key" class="bline"
          :class="{ 'bline--hl': isHovered(lineIdx), 'bline--sel': isSelectedLine(lineIdx), 'bline--rowsel': !!line._selectRow }"
          :style="{ '--depth': line.depth }"
          @mouseenter="onLineHover(lineIdx)"
          @click.stop="onLineClick(lineIdx)">
          <div class="bl-body">
            <!-- key VALUE bricks by their stable token id (so #467's per-chip UI
                 state — open menu / inline-edit — follows the value when a negate
                 reorders tokens), everything else by index. NB: can't use a bare
                 `tok.id` — conn/paren/col/op tokens share a group/clause id, which
                 would collide; only vbrick ids are unique. (oxjob #428 / #467.) -->
            <template v-for="(tok, ti) in line.tokens" :key="tok.t === 'vbrick' && tok.id ? tok.id : ti">
              <!-- Every VISIBLE brick (entity selector / keyword / connector / paren /
                   field / operator / value / text passthrough) is ONE OqlBrick
                   dispatcher now (oxjob #467): it routes on tok.t to the per-type chip
                   and re-emits a union of intents, so the builder binds them all and
                   never branches on type. A brick simply never emits intents that don't
                   apply to it. The INVISIBLE pieces below — the draft "filter clause"
                   chrome and the anchorOnly entity value pickers — aren't chips, so they
                   stay parent-rendered (NOT in OqlBrick, per the #467 contract). -->
              <OqlBrick v-if="isBrick(tok)" :tok="tok" :ctx="brickCtx"
                :active="isSelectedLine(lineIdx) || (tok.t === 'vbrick' && tok.id === activeValueId)"
                :edit-open="tok.t === 'vbrick' && tok.id === editTextId"
                :selected="isSelected(tok)" :selection-active="selectionActive"
                @select="onChipSelect($event)"
                @batch-menu="onBatchMenu($event)"
                @select-clear="clearSelection()"
                @set-entity="getRows = $event"
                @negate-group="onGroupNegate(tok)"
                @request-edit="onRequestEdit(tok)"
                @select-field="(k) => pickField(tok, k)"
                @open-field-menu="(v) => onFieldMenuOpen(tok, v)"
                @more-fields="openFieldDialog(tok)"
                @delete-filter="deleteFilter(tok)"
                @value-input="onValueInput(tok, $event)"
                @value-keydown="onValueKeydown(tok, $event)"
                @value-blur="onValueBlur(tok)"
                @add="onChipAdd(tok)"
                @remove="onRemoveValue(tok)" />

              <!-- Leading "dot" placeholder (oxjob #475, Jason 2026-06-17): the FIRST child of a
                   multi-item group has no connector, so it would jut out to the left of its
                   `and`/`or`-led siblings. layoutLines prepends this inert dot in the same
                   hanging-indent column a connector occupies, so every sibling aligns. -->
              <span v-else-if="tok.t === 'dot'" class="lead-dot" :class="{ 'lead-dot--sel': isSelectedLine(lineIdx) }" aria-hidden="true">·</span>

              <!-- ENTITY value picker — INVISIBLE (anchorOnly), opened in place from a
                   value chip's "New" / draft creation, so there's no floating "+". One
                   per draft clause (here) and per committed entity clause (below),
                   registered by clause/draft id. NOT a chip → parent-rendered. (#467.) -->
              <BuilderAddValue v-else-if="tok.t === 'addvalue' && tok._kind === 'entity'" anchor-only
                :ref="(el) => registerPicker(tok._targetId, el)"
                :value-kind="tok._kind"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @pick="(p) => onPickEntityValueTo(tok._targetId, p, tok._draft)"
                @abandon="onAbandonValue(tok._targetId)" />

              <!-- One invisible in-place picker PER committed entity value, keyed by
                   the VALUE id (not the clause) — so the trailing "+" add-value chip
                   (or Cmd/Ctrl+Enter) opens a picker anchored right after THAT chip and
                   inserts the new value to its right, including for a value inside a
                   nested group. (#428) -->
              <BuilderAddValue v-if="tok.t === 'vbrick' && tok._kind === 'entity' && !tok._draft && !tok._placeholder" anchor-only
                :ref="(el) => registerPicker(tok.id, el)"
                :value-kind="tok._kind"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @pick="(p) => onPickEntityValue(tok, p)"
                @abandon="editingEntityId = null" />

              <!-- Trailing "+" add-value chip (oxjob #428, restored #475): the green square chip
                   that adds another value to a filter's value series. displayLines injects an
                   `addvaluechip` token right before each value-bag's close paren (the last value
                   of the bag) and right after a single-value filter (no parens); clicking it =
                   that value's "New" (onAddValueChip → onChipAdd). Booleans / single-only fields
                   don't get one. It paints black when its row is selected. -->
              <AddValueChip v-else-if="tok.t === 'addvaluechip'" :active="isSelectedLine(lineIdx)" @add="onAddValueChip(tok)" />
            </template>

            <!-- field-picker "More" → categorized field tour (one per builder) -->
            <BuilderFieldDialog v-if="line._hasFieldMenu" v-model="fieldDialogOpen"
              :properties="properties" @select="onFieldDialogSelect" />
          </div>
        </div>

        <!-- sort by — its own numbered line (kept as a component row; aligns with
             the server's sort directive line on #463's text pane). -->
        <div v-if="sortShown" class="bline" :style="{ '--depth': 0 }">
          <div class="bl-body">
            <v-chip class="kw-chip" size="small" label variant="flat">sort by</v-chip>
            <template v-for="(s, i) in sortBy" :key="i">
              <span v-if="i > 0" class="sort-sep">,</span>
              <v-menu location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <v-chip v-bind="mp" class="sort-chip" label size="small"
                    variant="flat" append-icon="mdi-menu-down">{{ sortFieldTitle(s.column_id) }}</v-chip>
                </template>
                <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
                  <v-list density="compact" class="py-0">
                    <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title"
                      :active="s.column_id === o.value" @click="s.column_id = o.value; onSortChange()" />
                  </v-list>
                </v-card>
              </v-menu>
              <v-menu location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <v-chip v-bind="mp" class="sort-chip" label size="small"
                    variant="flat" append-icon="mdi-menu-down">{{ s.direction }}</v-chip>
                </template>
                <v-card min-width="100" class="menu-card">
                  <v-list density="compact" class="py-0">
                    <v-list-item title="desc" :active="s.direction === 'desc'" @click="s.direction = 'desc'; onSortChange()" />
                    <v-list-item title="asc" :active="s.direction === 'asc'" @click="s.direction = 'asc'; onSortChange()" />
                  </v-list>
                </v-card>
              </v-menu>
              <v-btn class="sort-remove" icon size="x-small" variant="text" density="comfortable" @click="removeSort(i)">
                <v-icon size="13">mdi-close</v-icon>
              </v-btn>
            </template>
            <template v-if="sortPending">
              <span v-if="sortBy.length" class="sort-sep">,</span>
              <v-menu v-model="sortPendingMenuOpen" location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <v-chip v-bind="mp" class="sort-chip pending" label size="small" variant="outlined">select field</v-chip>
                </template>
                <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
                  <v-list density="compact" class="py-0">
                    <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title" @click="addSortEntry(o.value)" />
                  </v-list>
                </v-card>
              </v-menu>
            </template>
            <v-menu v-if="sortBy.length" location="bottom start" offset="4">
              <template #activator="{ props: mp }">
                <v-btn v-bind="mp" class="add-sort-btn hover-reveal" icon size="x-small" variant="text" density="comfortable">
                  <v-icon size="16">mdi-plus</v-icon>
                  <v-tooltip activator="parent" location="top">Add a sort</v-tooltip>
                </v-btn>
              </template>
              <v-card min-width="220" max-height="320" class="menu-card" style="overflow-y:auto">
                <v-list density="compact" class="py-0">
                  <v-list-item v-for="o in sortItems" :key="o.value" :title="o.title" @click="addSortEntry(o.value)" />
                </v-list>
              </v-card>
            </v-menu>
          </div>
        </div>

        <!-- return — which columns come back (OQL `return …`) -->
        <div v-if="returnShown" class="bline" :style="{ '--depth': 0 }">
          <div class="bl-body">
            <v-chip class="kw-chip" size="small" label variant="flat">return</v-chip>
            <v-chip v-for="c in returnColumns" :key="c.key" class="return-chip" label size="small" variant="flat"
              :closable="returnColumns.length > 1" @click:close="removeColumn(c.key)">{{ c.label }}</v-chip>
            <AddColumn :entity-type="getRows">
              <template #activator="{ props: mp }">
                <v-btn v-bind="mp" class="add-sort-btn hover-reveal" icon size="x-small" variant="text" density="comfortable">
                  <v-icon size="16">mdi-plus</v-icon>
                  <v-tooltip activator="parent" location="top">Add a column</v-tooltip>
                </v-btn>
              </template>
            </AddColumn>
            <v-btn class="sort-remove" icon size="x-small" variant="text" density="comfortable" @click="resetReturn">
              <v-icon size="13">mdi-close</v-icon>
              <v-tooltip activator="parent" location="top">Back to default columns</v-tooltip>
            </v-btn>
          </div>
        </div>

        <!-- root add line — the main thing to do next. Hidden when the toolbar is
             shown (its "add filter / columns / sort" live up there instead). -->
        <div v-if="!showToolbar" class="bline" :style="{ '--depth': 0 }">
          <div class="bl-body">
            <v-menu location="bottom start" offset="2">
              <template #activator="{ props: mp }">
                <v-btn v-bind="mp" class="add-main" size="small" variant="outlined" density="comfortable">
                  <v-icon size="16" start>mdi-plus</v-icon>add</v-btn>
              </template>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-plus" title="Add a filter" @click="addRootFilter" />
                <v-divider />
                <v-list-item prepend-icon="mdi-sort" title="Add sort" @click="startSortPending" />
                <v-list-item v-if="!returnShown" prepend-icon="mdi-table-column-plus-after" title="Add return columns" @click="returnForced = true" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </div><!-- /.builder-lines -->

      <!-- embedded (SERP): foot is a real card footer — a full-width white strip
           with a top border, clearly separated from the card body. -->
      <template v-if="embedded && showFoot">
        <div class="builder-foot builder-foot--in-card">
          <v-chip v-if="validation" size="x-small" :color="validation.valid ? 'green' : 'red'" variant="tonal">{{ statusLabel }}</v-chip>
          <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
          <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
          <span v-if="inlineRun && resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
          <v-spacer />
          <!-- Host-injected foot actions (e.g. the #463 "view code" button), placed
               next to Run. The builder renders whatever the host passes and knows
               nothing about it — it is NOT part of this component's behaviour. -->
          <slot name="foot-actions" :oql="renderedOql" />
          <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
        </div>
      </template>
    </v-card>

    <!-- non-embedded (playground): foot sits below the card, as before -->
    <div v-if="!embedded && showFoot" class="builder-foot">
      <v-chip
        v-if="validation"
        size="x-small"
        :color="validation.valid ? 'green' : 'red'"
        variant="tonal"
      >{{ statusLabel }}</v-chip>
      <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
      <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
      <span v-if="inlineRun && resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
      <v-spacer />
      <!-- Host-injected foot actions (#463 "view code"), next to Run. See note above. -->
      <slot name="foot-actions" :oql="renderedOql" />
      <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
    </div>

    <!-- MULTI-SELECT batch menu (oxjob #472): pops automatically the instant a ≥2-chip
         selection forms (a Cmd/Ctrl-click after touching a first chip), anchored (fixed,
         viewport coords) over the just-clicked chip. A plain custom overlay — NOT a Vuetify
         v-menu — because a coordinate-targeted v-menu (no activator element) is flaky: it
         opens in state but the click-outside heuristic dismisses it. There's NO backdrop: the
         selection is ephemeral and a document click handler (onDocClick) dismisses it on any
         click off the menu/chips. First line is a "N values selected" subheading, then: wrap
         the selection into a subclause (enabled only when same-field) and delete the values. -->
    <!-- Only when there's NO toolbar (the view-code dialog projection): with a toolbar,
         batch actions live in OqlChipActions, so this floating menu is suppressed. -->
    <template v-if="!showToolbar && batchMenuOpen && batchMenuTarget">
      <v-card class="batch-menu menu-card chip-menu"
        :style="{ left: batchMenuTarget[0] + 'px', top: batchMenuTarget[1] + 'px' }">
        <v-list density="compact" class="py-0">
          <v-list-subheader class="batch-subhead">{{ selectedIds.size }} {{ selectionKind === 'filters' ? 'filter' : 'value' }}{{ selectedIds.size === 1 ? "" : "s" }} selected</v-list-subheader>
          <v-list-item :disabled="!canSubclause" @click="onAddToSubclause">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-code-parentheses</v-icon></template>
            <v-list-item-title>Wrap as subclause</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item class="mi-danger" @click="onDeleteSelected">
            <template #prepend><v-icon size="16" class="mi-icon">mdi-delete-outline</v-icon></template>
            <v-list-item-title>Delete {{ selectionKind === 'filters' ? 'filters' : 'values' }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { debounce } from "lodash";
import { api } from "@/api";
import OqlBrick from "@/components/Oql/OqlBrick.vue";
import OqlChipActions from "@/components/Oql/OqlChipActions.vue";
import AddValueChip from "@/components/Oql/AddValueChip.vue";
import BuilderFieldDialog from "@/components/OqlPlayground/BuilderFieldDialog.vue";
import BuilderAddValue from "@/components/OqlPlayground/BuilderAddValue.vue";
import AddColumn from "@/components/Results/Table/AddColumn.vue";
import { resolveColumns } from "@/components/Results/Table/columnConfig";
import { useColumnsState } from "@/composables/useColumnsState";
import { useLocalColumns } from "@/composables/useLocalColumns";
import { facetConfigs } from "@/facetConfigs";
import {
  valueKindForProperty, autocompleteEntityFor, isListVocabEntity,
  uiOperatorsForProperty,
} from "@/components/OqlPlayground/oqoTree";
import { v2ToOqo } from "@/components/OqlPlayground/v2ToOqo";
import * as edit from "@/components/OqlPlayground/v2Edit";
import { layoutLines } from "@/components/Oql/builderLayout";
import { oqlForUrl } from "@/oqlSerialize";
import { fieldKeys, popularFieldKeys, fieldIcon } from "@/components/OqlPlayground/builderFieldMeta";
import { OQL_ROLE_CSS_VARS } from "@/components/Oql/oqlPalette";
import { useChipDrag } from "@/components/Oql/useChipDrag";

defineOptions({ name: "OqlQueryBuilder" });

const props = defineProps({
  oql: { type: String, default: null },
  seedOql: { type: String, default: null },
  entity: { type: String, default: null },
  showHeader: { type: Boolean, default: true },
  // Render the valid/Run foot. The #463 "view code" dialog mounts the builder as a
  // pure projection and provides its own actions, so it hides the foot (showFoot=false).
  showFoot: { type: Boolean, default: true },
  // true: Run executes here + shows count. false: Run emits "run" with the OQL.
  inlineRun: { type: Boolean, default: true },
  runLabel: { type: String, default: "Run" },
  embedded: { type: Boolean, default: false },
  standalone: { type: Boolean, default: false },
  // Render the #428 toolbar (edit raw · copy · clear · add filter · columns · sort)
  // along the top of the card. When shown it replaces the footer and the root
  // "[+ add]" line — those affordances all move up into the toolbar.
  showToolbar: { type: Boolean, default: false },
});
const emit = defineEmits(["run", "update:oql", "edit-raw"]);

const store = useStore();
const route = useRoute();

const ENTITY_TYPES = [
  "works", "authors", "sources", "institutions",
  "topics", "publishers", "funders", "keywords",
];

// ---- model -----------------------------------------------------------------
// v2 = the server's `oql_render_v2` tree (committed query, single source of
// truth). drafts = local incomplete clauses being created (no server repr yet);
// they render after the committed lines and fold into the query once complete.
const getRows = ref("works");
const v2 = ref(null);
const drafts = ref([]);
const sortBy = ref([]);
let suppressCommit = false;

const properties = computed(() => store.getters["oqlBuilder/propsFor"](getRows.value) || {});
const propsLoading = computed(() => store.state.oqlBuilder.propertiesLoading);

const renderedOql = ref("");
const oxurl = ref("");
const validation = ref(null);
const rendering = ref(false);
const seedError = ref(null);
let lastEmittedOql = null;

const openFieldMenuId = ref(null);
const fieldDialogOpen = ref(false);
let fieldDialogTok = null;

const statusLabel = computed(() => {
  const v = validation.value;
  if (!v) return "";
  if (!v.valid) return `${(v.errors || []).length || 1} error${(v.errors || []).length === 1 ? "" : "s"}`;
  const w = (v.warnings || []).filter((x) => x.type !== "url_not_representable").length;
  return w ? `valid · ${w} warning${w === 1 ? "" : "s"}` : "valid";
});

// ---- tree index: token id -> column / clause / row, for editing ------------
const treeIndex = computed(() => {
  const tokenColumn = {}, tokenClause = {}, clauseFlat = {}, topRowOf = {};
  const sole = {}; // value id -> true when it is the clause's ONLY value (can't ×)
  // value id -> true when it is the LAST value of a LEAF value bag (a `(a or b or …)`
  // whose children are all vleaves) OR a simple clause's sole value. These get the
  // trailing green "+" add-value chip — one per bag, including bags nested inside a
  // non-flat clause (e.g. each `( … )` of `title has ((…) and (…))`). (oxjob #428.)
  const bagLast = {};
  // vgroup id -> { kind, lastChildId }. Every value group (at any nesting level) records its
  // own kind + last child, so displayLines can put a "+" before that group's CLOSE paren (add
  // a sibling member to the group). The leaf-bag chips ride INSIDE via `bagLast`; this drives
  // the OUTER/block group close-paren chip (`((a or b) and (c or d)) +)`) — Jason 2026-06-17.
  const valueGroupInfo = {};
  const walkClause = (c, top) => {
    tokenColumn[c.id] = c.column_id; tokenClause[c.id] = c.id; topRowOf[c.id] = top;
    if (c.value) {
      const leaves = []; let nested = false;
      // "flat" = a single line of scalar values (leaf, or a vgroup whose children
      // are all vleaves) — these get the inline "+ add value" affordance and ×.
      // Only a NESTED sub-vgroup (a vgroup inside a vgroup) marks the clause
      // non-flat (it explodes onto multiple lines per the layout rule), so the
      // top-level value vgroup itself (depth 0) does NOT count as nesting.
      const gather = (val, depth) => {
        tokenColumn[val.id] = c.column_id; tokenClause[val.id] = c.id; topRowOf[val.id] = top;
        if (val.node === "vgroup") { if (depth > 0) nested = true; val.children.forEach((ch) => gather(ch, depth + 1)); }
        else leaves.push(val);
      };
      gather(c.value, 0);
      clauseFlat[c.id] = !nested;
      if (leaves.length === 1) sole[leaves[0].id] = true;
      // Where the trailing "+" add-value chip goes (oxjob #475, Jason 2026-06-17):
      //   • BEFORE every close paren → mark the last value of each LEAF bag (all-vleaf
      //     vgroup), recursing through nested groups to reach each leaf bag.
      //   • AFTER a single value (a clause whose value is a lone vleaf — no parens, since
      //     we don't wrap a single item) → mark that value.
      // (The kind gate in enrichToken then drops it for booleans / single-only fields.)
      const markBags = (vg) => {
        if (!vg || vg.node !== "vgroup" || !vg.children.length) return;
        if (vg.children.every((ch) => ch.node === "vleaf")) bagLast[vg.children[vg.children.length - 1].id] = true;
        else vg.children.forEach(markBags);
      };
      markBags(c.value);
      if (c.value.node === "vleaf") bagLast[c.value.id] = true; // single value, no parens
      // Record every value group's kind + last child → close-paren "+" (add a sibling member).
      const kind = valueKindForProperty(properties.value[c.column_id]);
      const walkVgroup = (vg) => {
        if (!vg || vg.node !== "vgroup" || !vg.children.length) return;
        valueGroupInfo[vg.id] = { kind, lastChildId: vg.children[vg.children.length - 1].id };
        vg.children.forEach(walkVgroup);
      };
      walkVgroup(c.value);
    } else { clauseFlat[c.id] = true; sole[c.id] = true; bagLast[c.id] = true; }
  };
  const walkExpr = (n, top) => {
    topRowOf[n.id] = top;
    if (n.node === "clause") walkClause(n, top);
    else n.children.forEach((ch) => walkExpr(ch, top));
  };
  const w = v2.value && v2.value.where;
  if (w) {
    if (w.node === "group" && w.implicit) w.children.forEach((c) => walkExpr(c, c.id));
    else walkExpr(w, w.id);
  }
  drafts.value.forEach((d) => walkClause(d, d.id));
  return { tokenColumn, tokenClause, clauseFlat, topRowOf, sole, bagLast, valueGroupInfo };
});

// ---- field picker data ------------------------------------------------------
const allFieldKeys = computed(() => fieldKeys(properties.value));
const popularFields = computed(() => popularFieldKeys(getRows.value, allFieldKeys.value));
const getFieldDisplayName = (k) => properties.value[k]?.display_name || k;
const getFieldIcon = (k) => fieldIcon(getRows.value, k, properties.value);

// The brick types OqlBrick dispatches (oxjob #467). The anchorOnly entity pickers
// (addvalue) and the trailing add-value chip (addvaluechip) aren't chips dispatched
// here, so they fall through to their own parent-rendered branches in the token v-for.
const BRICK_TYPES = new Set(["kw", "conn", "paren", "col", "vbrick", "text"]);
// "Multi-value" filter kinds — those whose value list can hold ≥2 values, so they get
// the trailing square "+" add-value chip (oxjob #428; #475 added `number`). Numbers DO
// support a value list (`publication_year is (2020 or 2021)` is valid OQL — verified),
// so per Jason 2026-06-17 ("the + adds year values 2021, 2022") they get it. Booleans
// (true/false) and dates stay single-value, so they never show the chip.
const MULTI_VALUE_KINDS = new Set(["entity", "text", "number"]);

// Fold each `op` (predicate) token INTO its same-clause `col` token: the predicate is
// no longer its own brick (Jason 2026-06-15) — non-numeric predicates are fixed and
// just read as part of the property ("keyword is" / "title/abstract contains"), and a
// numeric one ("year ≥") is changed from the property chip's own menu. Copies the op's
// display text + numeric operator options onto the col, then drops the `op` tokens so
// they never render separately. (col + op share the clause id, in both server `lines`
// and draftBodyTokens.) Mutates the col tokens in place; returns the op-less list.
const PRETTY_OP = { ">=": "≥", "<=": "≤" }; // match the operator-menu glyphs (uiOperatorsForProperty)
function foldPredicates(tokens) {
  const opById = {};
  tokens.forEach((t) => { if (t.t === "op") opById[t.id] = t; });
  tokens.forEach((t) => {
    if (t.t === "col" && opById[t.id]) {
      const raw = (opById[t.id].text || "").trim();
      t._predicate = PRETTY_OP[raw] || raw;
      t._ops = opById[t.id]._ops || [];
    }
  });
  return tokens.filter((t) => t.t !== "op");
}
const isBrick = (tok) => BRICK_TYPES.has(tok.t);

// One ctx bag shared by every OqlBrick — the catalog/helpers the field picker +
// entity selector need. Recomputes when its inputs change (e.g. openFieldMenuId on
// menu open) so the field chip's controlled picker stays in sync. (oxjob #467.)
const brickCtx = computed(() => ({
  entity: getRows.value,
  // The leading `where` keyword is folded INTO the entity chip (`works where`) when a
  // committed where-clause exists; the standalone `where` brick is suppressed. Empty /
  // mid-draft states (no committed where) keep a bare `works`. (oxjob #467, 2026-06-16.)
  hasWhere: !!(v2.value && v2.value.where),
  allFieldKeys: allFieldKeys.value,
  popularFields: popularFields.value,
  getFieldDisplayName,
  getFieldIcon,
  openFieldMenuId: openFieldMenuId.value,
  properties: properties.value,
}));

// ---- enrich a raw token with edit metadata ---------------------------------
function enrichToken(tok) {
  const t = { ...tok };
  const idx = treeIndex.value;
  if (tok.t === "kw" && tok.id && tok.id === getRows.value) t._entity = true;
  if (tok.t === "col") {
    const col = tok.column_id || idx.tokenColumn[tok.id];
    t._column = col;
    const p = properties.value[col];
    t._label = p ? (p.display_name || p.name) : (tok.text ? tok.text.trim() : "select field");
  }
  if (tok.t === "op") {
    const col = tok.column_id || idx.tokenColumn[tok.id];
    t._column = col;
    const p = properties.value[col];
    // The predicate is FIXED for everything except a numeric range field — OQL has
    // no predicate-level negation (negation lives on the value), and booleans use the
    // combined phrase brick, so `is`/`contains` aren't user-changeable. Only an
    // integer comparison (>, <, ≥, ≤) keeps an interactive menu. (oxjob #428.)
    t._ops = (col && valueKindForProperty(p) === "number")
      ? uiOperatorsForProperty(p).filter((o) => !o.unary)
      : [];
  }
  if (tok.t === "vbrick") {
    const col = tok.column_id || idx.tokenColumn[tok.id];
    const p = properties.value[col];
    t._column = col;
    // Prefer the server's clause-kind hint: the /properties catalog is keyed by
    // group, so a column like `domain.id` can't be looked up there and would fall
    // back to a bare scalar brick instead of an entity chip. (oxjob #428 bug 5.)
    t._kind = tok.kind === "entity" ? "entity"
      : tok.kind === "boolean" ? "boolean" : valueKindForProperty(p);
    t._boolPhrase = !!tok.bool_phrase;
    t._numeric = t._kind === "number";
    t._autocompleteEntity = autocompleteEntityFor(p);
    t._listVocab = isListVocabEntity(p);
    t._sole = !!idx.sole[tok.id];
    // a VISIBLE trailing "+" add-value chip on the last value of every committed
    // MULTI-VALUE (entity/text) LEAF bag (oxjob #428 change 4) — including each bag nested
    // inside a non-flat clause, so `title has ((a or b) and (c or d))` gets a "+" inside
    // BOTH bags (Jason 2026-06-16). displayLines injects an `addvaluechip` token right after
    // this value; clicking it = the value's "New".
    t._addChip = !tok._draft && MULTI_VALUE_KINDS.has(t._kind) && idx.bagLast[tok.id];
    // resolved entity name: the server embeds it as `<id> [Display Name]` in the
    // rendered text/display (or carries an entity dict). Prefer the name for the
    // chip; the raw id stays in tok.value for edits.
    if (t._kind === "entity") {
      const m = String(t.display != null ? t.display : t.text || "").match(/\[(.+)\]\s*$/);
      t._entityName = (t.entity && t.entity.display_name) || (m && m[1]) || null;
    }
  }
  return t;
}

// ---- display lines: committed (server) where-lines + local draft lines ------
// While a committed clause is popped open to add a value (onAddScalarValue), the
// server re-render is async: for that round-trip `where` is already mutated but the
// server `lines` we render from are stale, so the popped clause would render TWICE
// (stale committed line + the new draft line) — the "third-line flash". Freezing the
// displayed bricks on a pre-pop snapshot until the render swaps in suppresses it; the
// view then transitions once, cleanly, to the draft state. (oxjob #428/#467.)
const frozenDisplay = ref(null);
// A scalar/search "New" inside a NESTED ( ) group adds an empty vleaf to the COMMITTED
// tree (Option B, #472) — not a flattening draft. The empty can't survive a server
// round-trip (v2ToOqo strips it via vFilled), so until the user commits we render a
// transient box for it locally, spliced into displayLines right after the clicked chip.
// { id, afterId, columnId, kind, numeric, join }. Cleared on blur/Enter (then we
// round-trip: a typed value comes back as a real chip; an empty one is stripped).
const pendingScalar = ref(null);

const displayLines = computed(() => {
  if (frozenDisplay.value) return frozenDisplay.value;
  const tree = v2.value;
  const lines = (tree && tree.lines) || [];
  const dirCount = (tree && tree.directives || []).length;
  const whereLines = dirCount ? lines.slice(0, lines.length - dirCount) : lines.slice();
  // Flatten ALL where-lines into ONE enriched token stream: we IGNORE the server's
  // char-based `format_oql` line breaks (it wraps a wide bag at 80 cols mid-group)
  // and re-derive layout CLIENT-SIDE from the paren structure, so leaf value-bags
  // become one line that flex-wraps to the *viewport*. (oxjob #428, 2026-06-15.)
  // Harvest entity-name `id` segments (`[Harvard University]`) across the whole
  // stream, then enrich and drop the bare id + whitespace-only text tokens.
  const raw = whereLines.flatMap((ln) => ln.tokens || []);
  const names = {};
  raw.forEach((t) => {
    if (t.t === "id" && /^\[.*\]$/.test((t.text || "").trim()))
      names[t.id] = t.text.trim().replace(/^\[|\]$/g, "");
  });
  const flat = raw
    .filter((t) => t.t !== "id" && !(t.t === "text" && !(t.text || "").trim()))
    .map((t) => {
      const e = enrichToken(t);
      if (e.t === "vbrick" && e._kind === "entity")
        e._entityName = e._entityName || names[t.id] || null;
      return e;
    });
  // Inject a VISIBLE trailing "+" add-value chip right after each value that `enrichToken`
  // flagged `_addChip` — i.e. the last value of each leaf bag (so it rides INSIDE the bag,
  // `( a or b + )`, right before the close paren) and the lone value of a single-value
  // filter (`year is 2020 +`, no parens). Clicking it routes to that value's "New"
  // (onAddValueChip). Booleans / single-only fields are never flagged. (oxjob #428/#475.)
  const withAddChips = [];
  flat.forEach((t) => {
    withAddChips.push(t);
    if (t._addChip) withAddChips.push({ t: "addvaluechip", _targetValId: t.id, _kind: t._kind });
  });
  // layoutLines applies the one invariant: each child GROUP on its own line; bare
  // VALUES flow as one (wrapping) line; a group with no child-groups is just that
  // value-line. Every filter ends up on its own line. (Replaces explodeParens +
  // splitClauses.) Then append local draft lines for incomplete new filters.
  const out = layoutLines(foldPredicates(withAddChips), { key: "s" });
  // Tag each committed line with the one logical row a band-click selects (#475). (The old
  // per-line +/🗑 affordance was removed 2026-06-17 — the add-value "+" chip is now injected
  // inline above; row delete/add live in the toolbar.) Also drop a "+" add-value chip right
  // BEFORE each BLOCK value-group's close paren (`((a or b) and (c or d)) +)` — Jason
  // 2026-06-17, "before every close parenthesis"): leaf bags already carry an inline chip via
  // `bagLast`; this covers the outer/block groups, whose `)` sits alone on its own line. The
  // chip adds a SIBLING member to that group (onAddValueChip via `_afterGroupId`).
  out.forEach((line, idx) => {
    line._selectRow = rowTargetForLine(line);
    if (line._groupSpan && line._groupSpan[1] === idx) {
      const closeParen = line.tokens.find((t) => t.t === "paren");
      const info = closeParen && treeIndex.value.valueGroupInfo[closeParen.id];
      if (info && MULTI_VALUE_KINDS.has(info.kind)) {
        line.tokens = [{ t: "addvaluechip", _afterGroupId: info.lastChildId, _kind: info.kind }, ...line.tokens];
      }
    }
  });
  // incomplete new filters (drafts) render as their own lines after the committed query.
  drafts.value.forEach((d) => out.push(draftLine(d, out)));
  // A pending scalar value (committed-tree "New" in a nested group, #472) renders as a
  // transient empty box spliced in right after the clicked chip, with the group's join
  // as its leading connector. The box is a normal vbrick → OqlBrick → OqlTextChip
  // (empty value ⇒ editable input); it commits on blur/Enter (onValueBlur/onValueKeydown).
  if (pendingScalar.value) splicePendingScalar(out);
  // exactly one BuilderFieldDialog instance (shared) on the last draft/add line
  if (out.length) out[out.length - 1]._hasFieldMenu = true;
  return out;
});

function splicePendingScalar(out) {
  const ps = pendingScalar.value;
  // live value off the committed tree (onValueInput writes there) so the box is a
  // controlled input that survives a mid-type displayLines recompute.
  const hit = edit.locate(v2.value, ps.id, drafts.value);
  const value = (hit && hit.node && hit.node.value) || "";
  for (const line of out) {
    // Anchor the transient box right after the clicked VALUE (inline add inside a nested bag),
    // or — for the close-paren chip (#475) — after the value-group's CLOSE paren, so the new
    // sibling renders one level up, beside the bag rather than inside it. (Both ids = afterId.)
    const i = ps.afterGroup
      ? line.tokens.findIndex((t) => t.t === "paren" && t.id === ps.afterId && (t.text || "").includes(")"))
      : line.tokens.findIndex((t) => t.t === "vbrick" && t.id === ps.afterId);
    if (i < 0) continue;
    const conn = { t: "conn", id: ps.id, text: ` ${ps.join} `, label: ps.join };
    const box = enrichToken({ t: "vbrick", id: ps.id, column_id: ps.columnId, value });
    line.tokens.splice(i + 1, 0, conn, box);
    return;
  }
}

// The brick stream for ONE draft clause MINUS its lead-in keyword (col · op ·
// values · entity-picker).
function draftBodyTokens(d) {
  const tokens = [];
  tokens.push(enrichToken({ t: "col", id: d.id, column_id: d.column_id, text: d.column, _draft: true }));
  if (d.column_id && !d.unary) {
    tokens.push(enrichToken({ t: "op", id: d.id, column_id: d.column_id, text: ` ${d.operator} `, _draft: true }));
    if (d.value) {
      d.value.children.forEach((v, i) => {
        if (i) tokens.push({ t: "conn", id: d.value.id, text: ` ${d.value.join} `, label: d.value.join, _draft: true });
        tokens.push(enrichToken({ t: "vbrick", id: v.id, column_id: d.column_id,
          value: v.value, display: v.display, negated: v.negated, entity: v.entity, _draft: true }));
      });
    }
    // ENTITY drafts carry a hidden in-place picker (opened from pickField). Until the
    // user picks the first value, show a VISIBLE green PLACEHOLDER brick where that
    // value will land — the picker itself is invisible (anchorOnly), so without this
    // the user just sees empty space + a floating dropdown (Jason, 2026-06-16). The
    // placeholder is a normal `vbrick` (kind=entity, _placeholder) so it flows through
    // the OqlBrick → OqlValueChip → OqlEntityChip path and renders as a chip; the
    // addvalue anchor sits right after it so the picker opens in place. On pick the
    // draft folds and the placeholder is replaced by the committed value chip; on
    // abandon the incomplete draft is dropped (onAbandonValue), so the placeholder
    // never lingers. Scalar drafts need no add token — pickField focuses an empty
    // editable value box and Enter / the chip's "New" adds more. (oxjob #428/#467.)
    const kind = valueKindForProperty(properties.value[d.column_id]);
    if (kind === "entity") {
      const p = properties.value[d.column_id];
      const hasValue = !!(d.value && d.value.children
        && d.value.children.some((v) => v.value !== "" && v.value != null));
      if (!hasValue) {
        tokens.push(enrichToken({ t: "vbrick", id: `${d.id}_ph`, column_id: d.column_id,
          value: "", kind: "entity", _draft: true, _placeholder: true,
          _placeholderLabel: `new ${((p && (p.display_name || p.name)) || "value").toLowerCase()}` }));
      }
      tokens.push({ t: "addvalue", _targetId: d.id, _kind: kind,
        _autocompleteEntity: autocompleteEntityFor(p),
        _listVocab: isListVocabEntity(p), _draft: true });
    }
  } else if (d.column_id && d.unary) {
    tokens.push(enrichToken({ t: "op", id: d.id, column_id: d.column_id, text: ` ${d.operator} `, _draft: true }));
  }
  // fold the predicate into the draft's field chip too, so a half-built filter reads
  // the same as a committed one ("keyword is …") instead of a separate op brick.
  return foldPredicates(tokens);
}

function draftLine(d, prior) {
  const hasCommitted = !!(v2.value && v2.value.where);
  const joining = hasCommitted || prior.length;
  // A draft top-level filter must render IDENTICALLY to a committed one (Jason
  // 2026-06-16): depth 0 (no stray indent) and its leading join is a real `conn`
  // chip — the beige `and`/`or` block committed filters lead with — NOT an inert
  // `kw` text. Only the truly-first filter of an empty query keeps the inert `where`
  // keyword (committed first lines carry no leading connector either).
  const lead = joining
    ? [{ t: "conn", text: " and ", label: "and" }]
    : [{ t: "kw", text: " where ", label: "where" }];
  const tokens = [...lead, ...draftBodyTokens(d)];
  return { key: `d${d.id}`, depth: 0, tokens, _removeId: null, _removeDraftId: d.id, _hasFieldMenu: false };
}

// ---- rendering (OQO -> server) ----------------------------------------------
// currentOqo folds COMPLETE drafts into the OQO so the OQL string is live while a
// new filter is being typed; on a swap render those drafts are absorbed into the
// returned v2 tree and dropped from the local list.
function currentOqo() {
  const oqo = v2ToOqo({ tree: v2.value, getRows: getRows.value, sortBy: sortBy.value, select: oqoSelect.value });
  // `editing` drafts (a committed flat clause popped open to add a value, via
  // popClauseToDraft) are excluded: they re-render via draftLine, so folding them in
  // too would duplicate the row. Plain new-filter drafts fold once complete.
  const extra = drafts.value
    .filter((d) => edit.draftComplete(d) && !d.editing)
    .map(edit.draftToFilter);
  if (extra.length) oqo.filter_rows = [...(oqo.filter_rows || []), ...extra];
  return oqo;
}

let commitSeq = 0;
const renderQuery = async ({ swap }) => {
  if (suppressCommit) return;
  const oqo = currentOqo();
  const seq = ++commitSeq;
  rendering.value = true;
  const data = await store.dispatch("oqlBuilder/renderOqo", oqo);
  if (seq !== commitSeq) return;
  rendering.value = false;
  if (swap && data.oql_render_v2) {
    v2.value = data.oql_render_v2;
    // complete drafts were folded into the OQO above and are now in the tree — drop
    // them. `editing` drafts (a popped-open committed flat clause, via popClauseToDraft)
    // stay local until the user commits (blur clears `editing`), so they survive the swap.
    drafts.value = drafts.value.filter((d) => !edit.draftComplete(d) || d.editing);
    // The server RENUMBERS value ids on every swap, so any multi-selection (oxjob #472)
    // by id is invalidated — clear it (our own batch actions already cleared before this).
    clearSelection();
  }
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  emit("update:oql", renderedOql.value);
};
const debouncedRender = debounce(() => renderQuery({ swap: false }), 300);

// Any route change (the SERP dice, a shared link, back/forward) means the query
// we're rendering is no longer the one on screen. Invalidate in-flight renders so
// a late-resolving dispatch can't fire a stale `update:oql` for the OLD query —
// which the SERP auto-run would write over the new URL. Covers navigations that
// DON'T change our `:oql` prop (e.g. the random-query dice → /works?filter=…,
// where seedOql stays put until the translate lands). (oxjob #428 dice bug)
watch(() => route.fullPath, () => { ++commitSeq; });

// committed structural edit (toggle / remove / operator): re-render + swap so the
// server-canonical lines reflect it. Draft edits are local + instant; just keep
// the OQL string fresh.
const afterEdit = (tok) => { if (tok && tok._draft) debouncedRender(); else renderQuery({ swap: true }); };

// ---- multi-select (oxjob #472; ephemeral redesign 2026-06-16) ----------------
// You build a transient selection to surface a batch menu, then it dies the instant you
// click off the menu. A plain click on a value chip records it as the ANCHOR; a Cmd/Ctrl-
// click on a SECOND chip folds the anchor in too (so you needn't have modifier-clicked the
// first) and IMMEDIATELY opens the 2-item menu ("Wrap as subclause" / "Delete values") over
// the just-clicked chip. Selection clears on a click off the menu (document handler), on
// Escape, and on any committing re-render (the swap renumbers ids). Keyed by value-token ids.
const selectedIds = ref(new Set());
const selectionAnchorId = ref(null);          // last toggle-clicked chip — anchors Shift-range
const lastSingleId = ref(null);               // last PLAIN-clicked chip — seeds a Cmd-extension
const batchMenuOpen = ref(false);
const batchMenuTarget = ref(null);            // the clicked chip element the menu anchors to
const selectionActive = computed(() => selectedIds.value.size > 0);
const isSelected = (tok) => selectedIds.value.has(tok.id);

// ---- unified single selection (oxjob #475, 2026-06-17) -----------------------
// ONE selection ref replaces the old trio (position-key `activeKey` + `selectedRow`):
//
//   selection = null
//             | { kind: 'value', id }                          ← a single value chip
//             | { kind: 'row', groupId, clauseId, withProperty } ← a whole logical row
//
// VALUE selection is keyed by the value's UNIQUE token id (only vbrick ids are unique —
// the col/conn/paren id ambiguity that forced the `"<line>:<tok>"` position key no longer
// matters, because structural chips are inert decorations now and rows select by GROUP id).
// ROW selection picks one tree node — a group (a clause's value vgroup, or a clause-group
// of filters), optionally carrying the clause's property. Toggling re-clicks deselect; a
// committing swap renumbers ids, so we clear on swap. `editorOpen` opens the toolbar
// "Edit" chooser/calendar; `editTextId` kicks a text value into in-place edit (by value id).
const selection = ref(null);
const editorOpen = ref(false);
const editTextId = ref(null);
const cmdLabel = (typeof navigator !== "undefined" && /mac/i.test(navigator.platform || "")) ? "⌘" : "Ctrl";
const activeValueId = computed(() => (selection.value?.kind === "value" ? selection.value.id : null));
// The highlighted VALUE token (resolved live from displayLines by its unique id), or null
// when the selection is a row / empty. Drives the toolbar's single-chip actions.
const activeTok = computed(() => {
  const id = activeValueId.value;
  if (id == null) return null;
  for (const line of displayLines.value)
    for (const t of line.tokens) if (t.t === "vbrick" && t.id === id) return t;
  return null;
});

// ---- logical-row selection (oxjob #428 → row-centric model #475, 2026-06-17) -
// The query is a tree of nested logical rows; the ROW is the unit of selection. Clicking
// anywhere on a line's band (parens, property, a conjunction, or empty space) selects that
// line's ONE logical group — never bubbles past the clicked level (an inner value-bag's
// line selects just that bag). Parens/conjunctions/property are inert DECORATIONS now;
// they don't select themselves, they're just painted onto the selected row to show its
// containing shape. `selectedRow` is a thin view onto the unified `selection` ref.
//
//   selectedRow = { groupId|null, clauseId|null, withProperty }
//     • groupId      the selected group's tree id (open paren, close paren, and the group's
//                    direct connectors all carry it) — null for a single-value filter.
//     • withProperty true when the group is the clause's OUTERMOST value group, so the
//                    selection IS "the whole filter": paint the property + the broadest
//                    (outer) paren pair. An inner bag selects just itself (no property).
//     • a STANDALONE clause group (a subclause of whole filters, `(F1 or F2)`) has no owning
//       property — just its parens.
// Decoration (Jason 2026-06-17): selecting a row paints BLACK *every* chip on the lines the
// row spans — parens, property, conjunctions, and values alike (no per-chip special-casing).
// Yellow-highlight = the same lines. Keyed by tree ids, so a committing swap (renumber) clears it.
const selectedRow = computed(() => (selection.value?.kind === "row" ? selection.value : null));
// entity value being RE-PICKED (double-click / Enter / toolbar Edit): its picker opens in
// REPLACE mode, so the pick lands ON this value instead of adding a sibling. (oxjob #428.)
const editingEntityId = ref(null);
const clearActive = () => {
  selection.value = null; editorOpen.value = false; editTextId.value = null;
  editingEntityId.value = null;
};

// The id of the value vgroup directly under a clause (its OUTERMOST value group / top-level
// and-or join target), or null when the clause is single-valued (`leaf`, no vgroup).
const clauseValueGroupId = (cid) => {
  const hit = edit.locate(v2.value, cid, drafts.value);
  const v = hit && hit.node && hit.node.value;
  return v && v.node === "vgroup" ? v.id : null;
};
// Work out the group a structural token selects. Stays at the clicked level — never bubbles.
const rowForToken = (tok) => {
  const idx = treeIndex.value;
  if (tok.t === "col") {
    // property → the whole filter = its outermost value group (if any) + the property itself.
    return { groupId: clauseValueGroupId(tok.id), clauseId: tok.id, withProperty: true };
  }
  if (tok.t === "paren" || tok.t === "conn") {
    const G = tok.id;
    const owningClause = idx.tokenClause[G];
    if (owningClause != null) {
      // a VALUE group of `owningClause`. Include the property ONLY when G is the clause's
      // OUTERMOST value group; an inner bag selects just itself (no property, no bubbling).
      const top = clauseValueGroupId(owningClause) === G;
      return { groupId: G, clauseId: top ? owningClause : null, withProperty: top };
    }
    return { groupId: G, clauseId: null, withProperty: false }; // standalone clause group
  }
  return null;
};
// The single logical-row target a click anywhere on a display line selects (ONE group per
// line — Jason 2026-06-17). Anchor precedence: a committed `col` on the line → the whole
// filter (property + outermost value group); else the line's first `paren` → that group;
// else a committed bare `vbrick` (e.g. a boolean-phrase clause) → its clause. The entity
// (`works where`) / sort / return / draft lines aren't selectable → null.
const rowTargetForLine = (line) => {
  const toks = line.tokens || [];
  if (toks.some((t) => t.t === "kw" && t._entity)) return null; // entity line = whole query
  const idx = treeIndex.value;
  const col = toks.find((t) => t.t === "col" && !t._draft && idx.tokenClause[t.id]);
  if (col) return rowForToken(col);
  const paren = toks.find((t) => t.t === "paren");
  if (paren) return rowForToken(paren);
  const vb = toks.find((t) => t.t === "vbrick" && !t._draft && idx.tokenClause[t.id]);
  if (vb) {
    const cid = idx.tokenClause[vb.id];
    return { groupId: clauseValueGroupId(cid), clauseId: cid, withProperty: true };
  }
  return null;
};
const sameRowTarget = (a, b) =>
  !!a && !!b && a.groupId === b.groupId && a.clauseId === b.clauseId && a.withProperty === b.withProperty;
// Commit a row selection (clears any value / multi selection + open editors first).
const selectRowTarget = (r) => {
  if (!r) return;
  if (selectedIds.value.size) selectedIds.value = new Set();
  selectionAnchorId.value = null;
  lastSingleId.value = null;
  batchMenuOpen.value = false;
  editorOpen.value = false; editTextId.value = null; editingEntityId.value = null;
  selection.value = { kind: "row", ...r };
};
// A click anywhere on a display line's band selects its one logical row (toggling off when
// it's already the selected row); a non-selectable band clears any selection. Value chips
// stopPropagation (they self-select), so this only fires for band / paren / property /
// conjunction clicks. (oxjob #475.)
const onLineClick = (lineIdx) => {
  const target = displayLines.value[lineIdx]?._selectRow;
  if (!target) { if (selection.value) clearSelection(); return; }
  if (sameRowTarget(selectedRow.value, target)) { clearSelection(); return; }
  selectRowTarget(target);
};

// Selecting a row paints BLACK *every* chip on the lines the row spans — parens, the filter
// property, conjunctions, AND values alike (Jason 2026-06-17: "make ALL its chips black").
// Driven per-line off `isSelectedLine` (the row's `selectedRange`), not per-token, so there's
// no chip-type special-casing; the yellow band still marks the same span.
//
// Which committed lines the selected group spans (→ yellow highlight): min..max line index
// carrying one of the group's OWN tokens (its parens/conns, plus the property line). A
// single-value filter (no group) highlights just its property line.
const selectedRange = computed(() => {
  const r = selectedRow.value;
  if (!r) return null;
  let lo = Infinity, hi = -1;
  displayLines.value.forEach((ln, i) => {
    const toks = ln.tokens || [];
    const hit = (r.groupId != null && toks.some((t) => (t.t === "paren" || t.t === "conn") && t.id === r.groupId))
      || (r.withProperty && r.clauseId != null && toks.some((t) => t.t === "col" && t.id === r.clauseId));
    if (hit) { lo = Math.min(lo, i); hi = Math.max(hi, i); }
  });
  return hi >= 0 ? [lo, hi] : null;
});
const isSelectedLine = (idx) => {
  const r = selectedRange.value;
  return !!r && idx >= r[0] && idx <= r[1];
};

// The row toolbar's view of the current selection: the selected GROUP's join (for the
// "use AND/use OR" button) and, only when a whole filter is selected, the numeric operator.
const findColTok = (cid) => {
  for (const line of displayLines.value)
    for (const t of line.tokens) if (t.t === "col" && t.id === cid) return t;
  return null;
};
const rowSelectionInfo = computed(() => {
  const r = selectedRow.value;
  if (!r) return null;
  let join = null;
  if (r.groupId != null) {
    const hit = edit.locate(v2.value, r.groupId, drafts.value);
    join = (hit && hit.node && hit.node.join) || null;
  }
  let opChoices = [], predicate = null;
  if (r.withProperty && r.clauseId != null) {
    const c = findColTok(r.clauseId); opChoices = (c && c._ops) || []; predicate = (c && c._predicate) || null;
  }
  return { kind: r.withProperty ? "filter" : "subclause", join, hasJoin: !!join, opChoices, predicate };
});

// Document order of the selectable ids (for Shift-range): committed VALUE chips AND
// committed FIELD chips (a `col` token = a whole filter, selectable for the clause-level
// wrap, #472). Drafts/transient boxes aren't selectable — only committed nodes carry a
// stable id worth grouping.
const selectableOrder = computed(() => {
  const ids = [];
  for (const line of displayLines.value)
    for (const tok of line.tokens)
      if ((tok.t === "vbrick" || tok.t === "col") && tok.id != null && !tok._draft) ids.push(tok.id);
  return ids;
});

// "Wrap as subclause" enables in TWO modes (the gates are mutually exclusive — a value id
// is never a filter id, so at most one returns truthy):
//   • VALUES — every selected chip is a value of the SAME field (groupableValues, #472 v1).
//   • FILTERS — every selected chip is a whole top-level filter; ≥2 siblings wrap into a
//     CLAUSE group `(A or B)` (groupableFilters, #472 → unblocks #428 Phase B).
// Delete is always available.
const canGroupValues = computed(() => !!edit.groupableValues(v2.value, [...selectedIds.value], drafts.value));
const canGroupFilters = computed(() => !!edit.groupableFilters(v2.value, [...selectedIds.value]));
const canSubclause = computed(() => canGroupValues.value || canGroupFilters.value);
// What the current selection is made of, for the menu's wording ("values" vs "filters").
const selectionKind = computed(() => (canGroupFilters.value ? "filters" : "values"));
// Nothing selected (no single value, no row, no multi-select) → the toolbar's left section is
// just "Add filter", so the clear-query trashcan rides alongside it. (oxjob #475.)
const nothingSelected = computed(() => !activeTok.value && !selectedRow.value && !selectionActive.value);

const clearSelection = () => {
  if (selectedIds.value.size) selectedIds.value = new Set();
  selectionAnchorId.value = null;
  lastSingleId.value = null;
  batchMenuOpen.value = false;
  batchMenuTarget.value = null;
  clearActive();
};

// A click that touches the selection — emitted ONLY by VALUE chips now (structural chips are
// inert; a band click selects the row via onLineClick). mode "single" (plain click — select
// THIS value + surface its toolbar actions; re-click deselects; also seeds a later Cmd-click
// extension); "toggle" (Cmd/Ctrl); "range" (Shift, from the anchor in document order). Reassign
// a fresh Set so the reactive `.has()`/`.size` reads update.
const onChipSelect = ({ id, mode, el }) => {
  if (mode === "single") {
    // re-click the already-selected value → deselect (toggle).
    if (selection.value?.kind === "value" && selection.value.id === id) { clearSelection(); return; }
    lastSingleId.value = id;
    selection.value = { kind: "value", id };
    editorOpen.value = false;
    editTextId.value = null;
    editingEntityId.value = null;
    if (selectedIds.value.size) selectedIds.value = new Set(); // single replaces any multi
    selectionAnchorId.value = null;
    batchMenuOpen.value = false;
    return;
  }
  if (!id) return;
  // a multi gesture supersedes the single highlight
  clearActive();
  const set = new Set(selectedIds.value);
  // Seed an empty selection with the last plain-clicked chip so "click banana, then Cmd-click
  // cherry" yields {banana, cherry} even though banana wasn't modifier-clicked (Jason).
  if (set.size === 0 && lastSingleId.value && lastSingleId.value !== id) set.add(lastSingleId.value);
  if (mode === "range") {
    const anchor = selectionAnchorId.value || lastSingleId.value;
    const order = selectableOrder.value;
    const a = order.indexOf(anchor), b = order.indexOf(id);
    if (a >= 0 && b >= 0) { const [lo, hi] = a < b ? [a, b] : [b, a]; for (let i = lo; i <= hi; i++) set.add(order[i]); }
    else set.add(id);
    selectionAnchorId.value = id;
  } else {
    if (set.has(id)) set.delete(id); else set.add(id);
    selectionAnchorId.value = id;
  }
  selectedIds.value = set;
  // Ephemeral: a multi-selection exists ONLY to surface the batch menu. As soon as ≥2 chips
  // are selected, pop the menu over the just-clicked chip; below 2 there's nothing to batch.
  if (set.size >= 2) openBatchMenuAt(el);
  else batchMenuOpen.value = false;
};

// Anchor the batch menu just below `el`. Store COORDINATES (not the element): a DOM node in a
// reactive ref becomes a Vue proxy, mishandled by overlay positioning.
const openBatchMenuAt = (el) => {
  if (!el || !el.getBoundingClientRect) return;
  const r = el.getBoundingClientRect();
  batchMenuTarget.value = [r.left, r.bottom + 4];
  batchMenuOpen.value = true;
};
// A plain click on an already-selected chip re-anchors the open menu to it.
const onBatchMenu = (el) => openBatchMenuAt(el);

// The selection is ephemeral: a click anywhere that isn't a value chip or the batch menu
// itself dismisses it (the user "uses it or loses it"). Clicks ON a chip are left to the
// chip's own handler (Cmd-extend / re-anchor / clear-and-act); clicks IN the menu run the
// batch action. Also drops a stale anchor when you click into empty space.
const onDocClick = (e) => {
  const t = e.target;
  // Band clicks (`.bline`) stop propagation and manage their own selection, so this only
  // fires for clicks OUTSIDE the lines. A click on a value chip or the batch menu is still
  // guarded here in case the event reaches the document; none of these should self-dismiss.
  const onChip = t?.closest?.(".val-chip");
  const onMenu = t?.closest?.(".batch-menu");
  // the contextual toolbar + any open editor/picker popover (teleported overlay) are
  // "inside" — clicking them acts on the selection, so they must NOT dismiss it.
  const onToolbar = t?.closest?.(".builder-toolbar");
  const onOverlay = t?.closest?.(".v-overlay__content");
  const inside = onChip || onMenu || onToolbar || onOverlay;
  if (!inside) {
    lastSingleId.value = null;
    if (selection.value) clearActive();  // empty-space click deselects
  }
  if (!selectionActive.value || inside) return;
  clearSelection();
};

const onDeleteSelected = () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  const noun = selectionKind.value === "filters" ? "filter" : "value";
  batchMenuOpen.value = false;
  clearSelection();
  edit.removeNodes(v2.value, ids, drafts.value);
  renderQuery({ swap: true });
  store.commit("snackbar", `${ids.length} ${noun}${ids.length === 1 ? "" : "s"} deleted`);
};

const onAddToSubclause = () => {
  const ids = [...selectedIds.value];
  batchMenuOpen.value = false;
  // Whole-filter selection → clause-group wrap; otherwise the value wrap. Both mutate the
  // committed tree (Option B); everything is complete so the server canonicalizes the swap.
  const ok = canGroupFilters.value
    ? edit.wrapFiltersInGroup(v2.value, ids)
    : edit.wrapValuesInGroup(v2.value, ids, drafts.value);
  clearSelection();
  if (ok) renderQuery({ swap: true });
};

// ---- contextual toolbar actions (oxjob #428/#475) ---------------------------
// The toolbar (OqlChipActions) acts on the single highlighted VALUE chip (`activeTok`) or the
// selected row, reusing the SAME edit handlers the chip menus used to. A `request-edit` from
// a VALUE chip (double-click / Enter) routes by kind (structural chips are inert now — their
// dblclick does nothing; the row toolbar carries the AND/OR toggle):
//   • entity value → re-pick the entity (open its picker in replace mode).
//   • bool / date  → open the toolbar editor; a text chip edits in place.
const onRequestEdit = (tok) => {
  if (tok.t === "vbrick" && tok._kind === "entity") {
    selection.value = { kind: "value", id: tok.id };
    if (selectedIds.value.size) selectedIds.value = new Set();
    onEditEntity(tok);
    return;
  }
  selection.value = { kind: "value", id: tok.id };
  if (selectedIds.value.size) selectedIds.value = new Set();
  editorOpen.value = true;
};
const onActiveEditText = () => { if (activeValueId.value != null) editTextId.value = activeValueId.value; };
const onActiveEditEntity = () => { const t = activeTok.value; if (t) onEditEntity(t); };
// Row-selection toolbar (oxjob #428): "use AND/use OR" toggle, numeric operator chooser,
// and delete-row. All target the currently-selected logical row, not a single chip.
const onRowToggleJoin = () => {
  const r = selectedRow.value; if (!r || r.groupId == null) return;
  edit.toggleJoin(v2.value, r.groupId, drafts.value);
  renderQuery({ swap: true });
};
const onRowChangeOperator = (o) => {
  const r = selectedRow.value; if (!r || !r.withProperty || r.clauseId == null) return;
  pickOperator({ id: r.clauseId }, o);
};
// Delete: a whole filter (property selected) removes the clause; otherwise just the
// selected group (an inner value bag, or a standalone clause group).
const onRowSelectionDelete = () => {
  const r = selectedRow.value; if (!r) return;
  removeRow(r.withProperty && r.clauseId != null ? r.clauseId : r.groupId);
};
// Single-chip toolbar actions — `activeTok` is always a VALUE now (structural selection is the
// row toolbar above). So Delete removes the value; Negate / Edit (bool/date popover, entity
// re-pick, text in-place) act on it.
const onActiveDelete = () => { const t = activeTok.value; if (t) onRemoveValue(t); };
const onActiveToggleNeg = () => { const t = activeTok.value; if (t) onToggleNeg(t); };
const onActivePickBool = (v) => { const t = activeTok.value; if (t) pickBool(t, v); };
const onActivePickDate = (iso) => { const t = activeTok.value; if (t) pickDate(t, iso); };

// ---- field / operator -------------------------------------------------------
const draftById = (id) => drafts.value.find((d) => d.id === id);
const draftOwning = (id) =>
  drafts.value.find((d) => d.id === id || (d.value && d.value.children.some((v) => v.id === id)));

const pickField = (tok, key) => {
  const p = properties.value[key];
  const kind = valueKindForProperty(p);
  const ops = uiOperatorsForProperty(p);
  const first = ops[0] || { op: "is", unary: false };
  const meta = { column_id: key, column: p?.display_name || p?.name || key, kind, op: first.op, unary: first.unary };
  openFieldMenuId.value = null;
  let d = tok._draft ? draftById(tok.id) : null;
  if (!d) {
    // committed field re-pick: pop the clause back into a fresh draft (v1)
    edit.removeNode(v2.value, tok.id, drafts.value);
    d = edit.makeDraft(); drafts.value.push(d);
    renderQuery({ swap: true });
  }
  edit.draftSetField(d, meta);
  if (d.unary) { foldNow(d); return; }
  // booleans fold immediately (default true) so they render as the combined phrase
  // brick ("it's open access") from the outset — not `field is true`. Click the
  // phrase to flip it negative. (oxjob #428 boolean-filter fix.)
  if (kind === "boolean") { foldNow(d); return; }
  // entity: open the (invisible) picker in place; scalar: focus the empty value box.
  // Both replace the old draft "+" affordance. (oxjob #428.)
  if (kind === "entity") openPicker(d.id);
  else focusValueSoon(d.value.children[0]?.id);
};

const openFieldDialog = (tok) => { fieldDialogTok = tok; fieldDialogOpen.value = true; };
const onFieldDialogSelect = (key) => { if (fieldDialogTok) pickField(fieldDialogTok, key); };

const onFieldMenuOpen = (tok, open) => {
  if (open) { openFieldMenuId.value = tok.id; return; }
  if (openFieldMenuId.value === tok.id) openFieldMenuId.value = null;
  if (tok._draft) {
    setTimeout(() => {
      const d = draftById(tok.id);
      if (d && !d.column_id && !fieldDialogOpen.value) drafts.value = drafts.value.filter((x) => x !== d);
    }, 150);
  }
};

const pickOperator = (tok, o) => {
  const d = tok._draft ? draftById(tok.id) : null;
  if (d) { edit.draftSetOperator(d, o); if (d.unary) foldNow(d); else debouncedRender(); return; }
  const clauseId = treeIndex.value.tokenClause[tok.id] || tok.id;
  edit.setOperator(v2.value, clauseId, o, drafts.value);
  renderQuery({ swap: true });
};

// ---- values -----------------------------------------------------------------
const onValueInput = (tok, e) => {
  edit.setValue(v2.value, tok.id, e.target.value, { numeric: tok._numeric }, drafts.value);
  debouncedRender();
};
const onValueKeydown = (tok, e) => {
  if (e.key === "Backspace" && tok.negated && e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    edit.toggleNeg(v2.value, tok.id, drafts.value); e.preventDefault(); afterEdit(tok); return;
  }
  if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    // First Enter = FINISH this value: commit (server canonicalizes) and re-SELECT the
    // resulting chip. Do NOT auto-add a value — a SECOND Enter on the selected chip does
    // that (the chip's onEnter → @add). The server render renumbers value ids on commit,
    // so re-select by matching the value text, not id. Both a draft value AND a pending
    // committed value (nested "New", #472) take this path; only the pre-commit cleanup
    // differs (clear the draft's `editing` flag vs. clear pendingScalar).
    const pending = pendingScalar.value && tok.id === pendingScalar.value.id;
    if (tok._draft || pending) {
      const want = String(e.target.value ?? "").trim();
      if (pending) pendingScalar.value = null;
      else { const d = draftOwning(tok.id); if (d) d.editing = false; }
      renderQuery({ swap: true }).then(() => nextTick(() => {
        const chip = [...document.querySelectorAll(".val-chip")]
          .find((c) => c.textContent.trim().replace(/^"|"$/g, "") === want.replace(/^"|"$/g, ""));
        chip?.focus();
      }));
    }
  }
};
const onValueBlur = (tok) => {
  editTextId.value = null; // the in-place edit ended; don't re-trigger on the next render
  setTimeout(() => {
    if (document.querySelector(".v-overlay--active")) return;
    // pending committed value (nested "New", #472): clear the transient box and let the
    // swap render canonicalize — a typed value comes back as a real chip in the nested
    // group; an empty one is stripped by v2ToOqo (vFilled) and vanishes on the swap.
    if (pendingScalar.value && tok.id === pendingScalar.value.id) pendingScalar.value = null;
    if (tok._draft) {
      const d = draftOwning(tok.id);
      if (d && !d.editing && !edit.draftComplete(d) && d.column_id) { drafts.value = drafts.value.filter((x) => x !== d); return; }
      if (d) d.editing = false; // commit: let it fold into the query on the swap
    }
    renderQuery({ swap: true });
  }, 150);
};
const onToggleNeg = (tok) => { edit.toggleNeg(v2.value, tok.id, drafts.value); afterEdit(tok); };
// The single choke point for removing a VALUE — every path (chip menu "Delete", the ⌫
// shortcut, drag-to-the-delete-zone, and drag-outside-the-builder) routes through here,
// so the "Value deleted" toast lives here once and fires for all of them. (oxjob #467.)
const onRemoveValue = (tok) => {
  // ENTITY delete flash fix (oxjob #428, 2026-06-17): the display is driven by the server's
  // `lines` token stream, which only updates on the swap render (~300ms). During that window
  // a locally-removed entity value still rides the stale lines, but treeIndex no longer maps
  // it, so it degrades to its raw `id [Name]` form for a beat. Freeze the display across the
  // round-trip (the existing frozenDisplay pattern) so the old, correctly-resolved view holds
  // until the fresh tree swaps in. Only committed entity values hit this; drafts render
  // locally and have no stale-lines problem.
  if (!tok._draft && tok._kind === "entity") {
    frozenDisplay.value = displayLines.value;
    edit.removeNode(v2.value, tok.id, drafts.value);
    store.commit("snackbar", "Value deleted");
    renderQuery({ swap: true }).finally(() => { frozenDisplay.value = null; });
    return;
  }
  edit.removeNode(v2.value, tok.id, drafts.value);
  afterEdit(tok);
  store.commit("snackbar", "Value deleted");
};

// ---- drag-to-delete zone (oxjob #467 Phase 4 feedback) ----------------------
// A delete drop-zone appears at the top of the builder while a value chip is being
// dragged (shared state from useChipDrag). Dropping a chip ON the zone removes it — a
// real registered drop target, which fires a reliable `drop` (unlike "release into empty
// space", which the HTML5 DnD API reports unreliably). The chip's own dragend also still
// deletes on a release fully OUTSIDE the builder card (forgiving fallback) — see
// useChipShortcuts. Both end in onRemoveValue, so both toast.
const chipDrag = useChipDrag();
// `chipDrag.dragging` is a ref nested in a plain object — Vue templates only auto-unwrap
// TOP-LEVEL setup refs, so bind it to a top-level const for `v-show` to read the boolean
// (otherwise the template sees a truthy Ref object and the zone never hides).
const chipDragging = chipDrag.dragging;
const zoneHot = ref(false); // true while a chip is dragged OVER the zone (solid + red)
// The zone is OPAQUE and sized to cover exactly the header chrome (the toolbar in the
// SERP, or the title header in the standalone sandbox) so none of it shows through and
// reads as droppable while dragging. We measure that height = the brick lines' offset
// from the top of the builder (everything above the bricks IS the chrome), so it's robust
// whatever chrome a host renders. Measured when a drag starts (the overlay is absolute, so
// it doesn't perturb the layout it's measuring).
const builderRootEl = ref(null);
const linesEl = ref(null);
const chromeH = ref(0);
watch(chipDragging, (on) => {
  if (!on) return;
  nextTick(() => {
    const lines = linesEl.value, root = builderRootEl.value;
    // Viewport-rect delta (NOT offsetTop — the Vuetify card is position:relative, so
    // offsetTop would be measured from the card and miss a header that sits above it).
    chromeH.value = (lines && root)
      ? Math.max(0, Math.round(lines.getBoundingClientRect().top - root.getBoundingClientRect().top))
      : 0;
  });
});
const findValueTok = (id) => {
  for (const line of displayLines.value) {
    const t = line.tokens.find((tk) => tk.t === "vbrick" && tk.id === id);
    if (t) return t;
  }
  return null;
};
// preventDefault (via @dragover.prevent) is what makes the zone a valid drop target; also
// show the "move" effect cursor while over it (the only cursor native DnD lets us set).
const onZoneDragover = (e) => { if (e.dataTransfer) e.dataTransfer.dropEffect = "move"; };
const onZoneDrop = () => {
  zoneHot.value = false;
  const id = chipDrag.draggingId.value;
  // Claim the drop so the chip's dragend outside-rect fallback skips it (no double-remove).
  chipDrag.draggingId.value = null;
  if (!id) return;
  const tok = findValueTok(id);
  if (tok) onRemoveValue(tok);
  else { edit.removeNode(v2.value, id, drafts.value); renderQuery({ swap: true }); store.commit("snackbar", "Value deleted"); }
};

// ---- group negate (group `not` chrome from OqlKeywordChip) ------------------
// Addresses the group by its keyword-token id and re-renders from the server. Whole-
// group DELETE is the row toolbar's Delete (onRowSelectionDelete → removeRow); clause
// CREATION is #472's select-and-wrap. (#428 Phase B dropped the menu paths.)
const onGroupNegate = (tok) => { edit.negateGroup(v2.value, tok.id, drafts.value); renderQuery({ swap: true }); };

const pickBool = (tok, val) => {
  edit.setBool(v2.value, tok.id, val, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};
// Date value picked from OqlDateChip's calendar (oxjob #467). Mirrors pickBool: set the
// ISO value (a plain string), then fold the draft / re-render the committed clause.
const pickDate = (tok, iso) => {
  edit.setValue(v2.value, tok.id, iso, { numeric: false }, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};

const onAddScalarValue = (tok) => {
  if (tok._draft) { const nid = edit.addValueAfter(v2.value, tok.id, drafts.value); focusValueSoon(nid); return; }
  // committed scalar clause: pop it (and all its values) into an editing draft so
  // the new empty value box renders — the server `lines` can't carry an empty
  // intermediate. Folds back canonically on blur (onValueBlur clears `editing`).
  const clauseId = treeIndex.value.tokenClause[tok.id] || tok.id;
  // NESTED ( ) group: edit the committed tree DIRECTLY (Option B, #472) — the draft
  // model is a single flat vgroup, so popping a non-flat clause to a draft would
  // FLATTEN it (lose the inner parens). Instead insert an empty vleaf right after the
  // clicked value, in its OWN vgroup (addValueAfter — nesting preserved), and render a
  // transient local box for it (pendingScalar → spliced into displayLines). No server
  // round-trip yet: v2ToOqo would strip the empty (vFilled) and the swap would replace
  // the tree, losing the box. It commits on blur/Enter. Mirrors entity "New", which
  // already edits the committed tree. (Flat clauses keep the pop-to-draft path below;
  // unifying them onto this path — and deleting popClauseToDraft — is the follow-up.)
  if (!treeIndex.value.clauseFlat[clauseId]) {
    const nid = edit.addValueAfter(v2.value, tok.id, drafts.value);
    if (!nid) return;
    pendingScalar.value = { id: nid, afterId: tok.id, columnId: tok._column,
      kind: tok._kind, numeric: !!tok._numeric, join: edit.joinOfValue(v2.value, nid, drafts.value) };
    focusValueSoon(nid);
    return;
  }
  const p = properties.value[tok._column];
  // Freeze the bricks on the current view across the pop + async re-render so the
  // popped clause doesn't render twice mid-flight (see frozenDisplay note above);
  // unfreeze onto the fresh tree + draft, then focus the new empty value box.
  // `afterId: tok.id` makes the new box land right after the clicked chip, not at
  // the clause end (Jason 2026-06-16).
  frozenDisplay.value = displayLines.value;
  const res = edit.popClauseToDraft(v2.value, clauseId, drafts.value,
    { column: p?.display_name || p?.name || tok._column, kind: tok._kind, afterId: tok.id });
  if (!res) { frozenDisplay.value = null; return; }
  renderQuery({ swap: true }).finally(() => { frozenDisplay.value = null; focusValueSoon(res.newId); });
};
// "New" picked an entity value: insert it immediately AFTER the clicked value
// `tok` (its own in-place picker), not at the clause end (Jason 2026-06-16). Works
// for a value in a nested group too (addValueAfter inserts into that value's own
// vgroup) — which is what fixes the subclause "New" no-op (#428).
const onPickEntityValue = (tok, { value, label }) => {
  // RE-PICK (oxjob #428): double-click / Enter / toolbar Edit opened this value's picker in
  // replace mode (editingEntityId) — set the new entity ON this value instead of adding a
  // sibling.
  if (editingEntityId.value === tok.id) {
    editingEntityId.value = null;
    edit.setEntityValue(v2.value, tok.id, value, label, drafts.value);
    // The clause id is stable across the swap, so the picker component isn't unmounted —
    // close it explicitly so it doesn't linger after a single re-pick.
    pickers.get(tok.id)?.closePicker?.();
    const d = tok._draft ? draftOwning(tok.id) : null;
    if (d) foldNow(d); else renderQuery({ swap: true });
    return;
  }
  const nid = edit.addValueAfter(v2.value, tok.id, drafts.value);
  if (nid) edit.setEntityValue(v2.value, nid, value, label, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};
// Re-pick a committed entity value (double-click / Enter / toolbar Edit): open its in-place
// picker in REPLACE mode. The picker is registered under the value id; on pick,
// onPickEntityValue sees editingEntityId === tok.id and sets the value rather than adding.
const onEditEntity = (tok) => {
  if (!tok || tok._kind !== "entity" || tok._draft) return;
  editingEntityId.value = tok.id;
  openPicker(tok.id);
};
// entity picker closed WITHOUT picking (blur / click-away): drop the still-incomplete
// draft so the half-made entity brick disappears (mirrors onValueBlur's cleanup of
// incomplete drafts). A completed draft is left alone — picking already folded it.
const onAbandonValue = (clauseId) => {
  const d = draftById(clauseId);
  if (d && !edit.draftComplete(d)) {
    drafts.value = drafts.value.filter((x) => x !== d);
    renderQuery({ swap: true });
  }
};
// entity value picked from a draft clause's in-place picker (addressed by clause id)
const onPickEntityValueTo = (clauseId, { value, label }, isDraft) => {
  const nid = edit.addValue(v2.value, clauseId, drafts.value);
  if (nid) edit.setEntityValue(v2.value, nid, value, label, drafts.value);
  const d = isDraft ? draftById(clauseId) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};

// fold a now-complete draft into the query (server re-render swaps the tree)
const foldNow = (d) => { if (edit.draftComplete(d)) renderQuery({ swap: true }); };

const focusValueSoon = (id) => {
  if (!id) return;
  nextTick(() => { const el = document.querySelector(`[data-vid="${id}"]`); if (el) el.focus(); });
};

const removeRow = (id) => { edit.removeNode(v2.value, id, drafts.value); renderQuery({ swap: true }); };

// Delete a whole filter from the field-chip menu (replaces the hover trashcan). A
// draft (not yet committed) is just dropped; a committed clause removes its whole
// top-level row.
const deleteFilter = (tok) => {
  if (tok._draft) {
    const d = draftById(tok.id);
    if (d) drafts.value = drafts.value.filter((x) => x !== d);
    return;
  }
  const row = treeIndex.value.topRowOf[tok.id];
  if (row) removeRow(row);
};

// ---- entity value pickers (invisible; opened in place from a chip's "New") -----
// Each entity clause / entity draft renders a hidden `anchorOnly` BuilderAddValue,
// registered here by its clause/draft id; "New" (or starting an entity filter)
// opens it where it sits — so there's no floating "+".
const pickers = new Map();
const registerPicker = (id, el) => { if (el) pickers.set(id, el); else pickers.delete(id); };
const openPicker = (id) => { nextTick(() => pickers.get(id)?.openPicker()); };
const clauseOf = (tok) => treeIndex.value.tokenClause[tok.id] || tok.id;

// the value chip's "New": entity → open its picker in place; scalar → a fresh
// editable value box (onAddScalarValue pops the clause to a focused draft box).
const onChipAdd = (tok) => {
  // committed entity value → its OWN per-value picker (registered under the value
  // id), so the picker opens next to the clicked chip and the pick lands to its
  // right, including inside a nested group (the subclause "New" fix, #428). A draft
  // still uses its clause-level picker (the addvalue token, keyed by the draft id).
  if (tok._kind === "entity") openPicker(tok._draft ? clauseOf(tok) : tok.id);
  else onAddScalarValue(tok);
};

// The trailing "+" add-value chip (oxjob #428/#475). Two flavours:
//   • `_targetValId` (the common one, INSIDE a bag / after a single value) → run the same add
//     as that value's own "New": entity opens its picker, text/number drops a focused box.
//   • `_afterGroupId` (the chip before a BLOCK value-group's close paren) → add a SIBLING
//     member AFTER that group's last child, in the group (a transient box, like #428's nested
//     add). Lets you extend `((a or b) and (c or d))` to `(… and NEWTERM)`. (Jason 2026-06-17.)
const onAddValueChip = (tok) => {
  if (tok._afterGroupId) { addSiblingValueToGroup(tok._afterGroupId, tok._kind); return; }
  const target = findValueTok(tok._targetValId);
  if (target) onChipAdd(target);
};
const addSiblingValueToGroup = (afterGroupId, kind) => {
  const sib = edit.addSiblingValueAfterGroup(v2.value, afterGroupId, drafts.value);
  if (!sib) return;
  pendingScalar.value = {
    id: sib.id, afterId: afterGroupId, afterGroup: true,
    columnId: treeIndex.value.tokenColumn[afterGroupId], kind,
    numeric: kind === "number", join: sib.join,
  };
  focusValueSoon(sib.id);
};

// ---- add filter -------------------------------------------------------------
// A new flat top-level filter (toolbar "Add Filter", per-line "+", field-chip Cmd+Enter).
// Clause CREATION is #472's select-and-wrap, not a menu — there's no "add clause" path.
const addRootFilter = () => {
  const d = edit.makeDraft();
  drafts.value.push(d);
  nextTick(() => { openFieldMenuId.value = d.id; });
};

// ---- toolbar: copy / clear --------------------------------------------------
const copied = ref(false);
let copiedTimer = null;
const copyOql = () => {
  const text = renderedOql.value || "";
  if (!text || !navigator.clipboard?.writeText) return;
  navigator.clipboard.writeText(text).then(() => {
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1300);
  }).catch(() => {});
};
const hasQuery = computed(() =>
  !!(v2.value && v2.value.where) || drafts.value.length > 0
  || sortBy.value.length > 0 || !columnsAreDefault.value);
const clearQuery = () => {
  drafts.value = [];
  sortBy.value = [];
  returnForced.value = false;
  if (!columnsAreDefault.value) setColumns(defaultColumnKeys.value);
  v2.value = null;            // wipe the committed where-tree…
  renderQuery({ swap: true }); // …then re-render the empty starting query
};

// ---- hover block-highlight (oxjob #428) -------------------------------------
// Highlight the SMALLEST logical block under the cursor: the entity line lights
// the whole query, a paren-boundary line lights its group, any other line lights
// just itself. Works anywhere along the row (the .bline spans the full canvas).
const hoverRange = ref(null);
const onLineHover = (idx) => {
  const line = displayLines.value[idx];
  if (!line) { hoverRange.value = null; return; }
  if ((line.tokens || []).some((t) => t.t === "kw" && t._entity)) {
    hoverRange.value = [0, displayLines.value.length - 1]; // whole query
  } else if (line._groupSpan) {
    hoverRange.value = [line._groupSpan[0], line._groupSpan[1]]; // the whole group
  } else {
    hoverRange.value = [idx, idx]; // just this clause
  }
};
const clearHover = () => { hoverRange.value = null; };
const isHovered = (idx) => !!hoverRange.value && idx >= hoverRange.value[0] && idx <= hoverRange.value[1];

// ---- sort -------------------------------------------------------------------
const sortItems = computed(() => {
  let opts = [];
  try {
    opts = facetConfigs(getRows.value)
      .filter((c) => (c.actionsPopular || []).includes("sort") || (c.actions || []).includes("sort"))
      .map((c) => ({ title: c.displayName, value: c.key }));
  } catch { /* entity may have no configs */ }
  if (!opts.length) {
    opts = [
      { title: "citation count", value: "cited_by_count" },
      { title: "publication date", value: "publication_year" },
    ];
  }
  const seen = new Set();
  return opts.filter((o) => !seen.has(o.value) && seen.add(o.value));
});
const sortFieldTitle = (col) => (sortItems.value.find((o) => o.value === col) || {}).title || col;
const sortPending = ref(false);
const sortPendingMenuOpen = ref(false);
const sortShown = computed(() => sortBy.value.length > 0 || sortPending.value);
const startSortPending = () => { sortPending.value = true; nextTick(() => { sortPendingMenuOpen.value = true; }); };
watch(sortPendingMenuOpen, (open) => { if (!open) setTimeout(() => { sortPending.value = false; }, 120); });
const addSortEntry = (col) => { sortBy.value.push({ column_id: col, direction: "desc" }); sortPending.value = false; onSortChange(); };
const removeSort = (i) => { sortBy.value.splice(i, 1); onSortChange(); };
const onSortChange = () => renderQuery({ swap: true });

// ---- return columns ---------------------------------------------------------
const { columnKeys, defaultColumnKeys, removeColumn, setColumns } =
  props.standalone ? useLocalColumns(getRows) : useColumnsState(getRows);
const returnForced = ref(false);
const columnsAreDefault = computed(() => JSON.stringify(columnKeys.value) === JSON.stringify(defaultColumnKeys.value));
const returnShown = computed(() => !columnsAreDefault.value || returnForced.value);
const returnColumns = computed(() => resolveColumns(getRows.value, columnKeys.value));
const resetReturn = () => {
  returnForced.value = false;
  if (!columnsAreDefault.value) setColumns(defaultColumnKeys.value);
};
const selectNameForKey = (k) => {
  const base = String(k).split(":")[0];
  for (const cand of [base, base.split(".")[0]]) {
    const p = properties.value[cand];
    if (p && (p.actions || []).includes("select")) return cand;
  }
  return null;
};
const oqoSelect = computed(() => {
  if (columnsAreDefault.value) return null;
  const names = [...new Set(columnKeys.value.map(selectNameForKey).filter(Boolean))];
  return names.length ? names : null;
});
const SELECT_TO_COLUMN_ALIASES = { title: "display_name" };
const guiKeysFromSelect = (names) => {
  const out = [];
  const candidates = [...new Set([...columnKeys.value, ...defaultColumnKeys.value])];
  for (const raw of names) {
    const name = SELECT_TO_COLUMN_ALIASES[raw] || raw;
    if (resolveColumns(getRows.value, [name]).length) { out.push(name); continue; }
    const hit = candidates.find((k) => String(k).split(":")[0].split(".")[0] === name);
    if (hit) { out.push(hit); continue; }
    console.warn(`builder return: no table column for select field "${raw}" — dropped`);
  }
  return [...new Set(out)];
};
watch(columnKeys, () => renderQuery({ swap: false }));

// ---- entity change ----------------------------------------------------------
watch(getRows, async () => {
  if (suppressCommit) return;
  drafts.value = [];
  await store.dispatch("oqlBuilder/loadProperties", getRows.value);
  renderQuery({ swap: true });
});

// ---- v-model:oql ------------------------------------------------------------
watch(() => props.oql, async (next) => {
  if (next == null) return;
  const incoming = String(next);
  if (incoming === lastEmittedOql) return;
  if (incoming === renderedOql.value) return;
  // auto-run feeds our own OQL back in whitespace-collapsed (the URL form); treat a
  // layout-only difference as identity so it doesn't churn a reseed/round-trip.
  if (oqlForUrl(incoming) === oqlForUrl(renderedOql.value || "")) return;
  // An external query change (the SERP dice, a shared link, back/forward) reseeds
  // us. Invalidate any in-flight renderQuery NOW so its late-resolving dispatch
  // can't fire a stale `update:oql` for the PREVIOUS query — which the SERP's
  // auto-run would then write back to the URL, leaving the page one step behind
  // the dice (oxjob #428 dice "bounce / lands on the previous query" bug).
  ++commitSeq;
  const data = await store.dispatch("oqlBuilder/seedFromOql", incoming);
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
});

// ---- seed from a parse payload ---------------------------------------------
const rebuildFromOqo = async (data) => {
  const oqo = data.oqo;
  // Drop any in-flight render from the query we're replacing (see the props.oql
  // watcher note) — covers the onMounted seed and the exposed rebuildFromOql path.
  ++commitSeq;
  suppressCommit = true;
  drafts.value = [];
  if (oqo.get_rows && ENTITY_TYPES.includes(oqo.get_rows)) {
    getRows.value = oqo.get_rows;
    await store.dispatch("oqlBuilder/loadProperties", oqo.get_rows);
  }
  sortBy.value = (oqo.sort_by || []).map((s) => ({ column_id: s.column_id, direction: s.direction || "asc" }));
  if (Array.isArray(oqo.select) && oqo.select.length) {
    const keys = guiKeysFromSelect(oqo.select);
    if (keys.length) setColumns(keys);
  }
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  await nextTick();
  suppressCommit = false;
  if (data.oql_render_v2) v2.value = data.oql_render_v2;
  else renderQuery({ swap: true }); // older API w/o v2: derive from the OQO
};

// ---- keydown / run ----------------------------------------------------------
const onBuilderKeydown = (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runQuery(); return; }
  // multi-select (oxjob #472): Escape dismisses the selection; Backspace/Delete deletes the
  // whole set — but NOT while typing in a value input (that Backspace edits text and is
  // handled by the chip), so guard on the focused element.
  if (!selectionActive.value) return;
  const tag = (e.target?.tagName || "").toLowerCase();
  const inField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
  if (e.key === "Escape") { clearSelection(); return; }
  if (!inField && (e.key === "Backspace" || e.key === "Delete")) { e.preventDefault(); onDeleteSelected(); }
};
const running = ref(false);
const resultCount = ref(null);
const runQuery = async () => {
  const oql = renderedOql.value;
  if (!props.inlineRun) { emit("run", oql); return; }
  running.value = true; resultCount.value = null;
  try {
    const data = await api.executeOql(oql);
    resultCount.value = data?.meta?.count ?? null;
  } catch (e) {
    store.commit("snackbar", { msg: "Query failed to run", color: "error" });
  } finally { running.value = false; }
};

// ---- init -------------------------------------------------------------------
onMounted(async () => {
  // ephemeral multi-selection (oxjob #472): a click off the menu/chips dismisses it. Register
  // FIRST — the seeded-OQL path below early-returns, so a later line wouldn't always run.
  document.addEventListener("click", onDocClick);
  if (props.entity && ENTITY_TYPES.includes(props.entity)) getRows.value = props.entity;
  await store.dispatch("oqlBuilder/loadProperties", getRows.value);
  const sharedOql = props.oql != null ? props.oql
    : props.seedOql != null ? props.seedOql
    : props.standalone ? null : route.query.oql;
  if (sharedOql) {
    const data = await store.dispatch("oqlBuilder/seedFromOql", String(sharedOql));
    if (data.oqo) { await rebuildFromOqo(data); return; }
    seedError.value = data.error;
  }
  renderQuery({ swap: true }); // render the (empty) starting query -> populate v2
});

onBeforeUnmount(() => {
  if (copiedTimer) { clearTimeout(copiedTimer); copiedTimer = null; }
  document.removeEventListener("click", onDocClick);
});

defineExpose({ rebuildFromOql: async (oql) => {
  const data = await store.dispatch("oqlBuilder/seedFromOql", String(oql));
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
} });
</script>

<style scoped>
/* MULTI-SELECT batch menu (oxjob #472): a plain fixed-position overlay anchored to the
   clicked chip (viewport coords). The backdrop sits just under the card and closes it on
   any outside click. Not a Vuetify v-menu (coordinate-target menus dismiss themselves). */
.batch-menu { position: fixed; z-index: 2001; min-width: 210px; }
/* the "N values selected" subheading: compact, muted, non-interactive. */
.batch-subhead { min-height: 28px; height: 28px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.6; }

/* Line-flow canvas (oxjob #428): every visual line is a `.bline`
     [line number ::before]  [.bl-body — indented by --depth, content wraps]
   Role colours (--kw-*, --conn-*, --prop-*, --rel-*, --val-*) are bound via
   :style from oqlPalette.js — the single source shared with the #357 text
   editor's syntax highlighting. Don't reintroduce hex values here. */
.builder {
  max-width: 900px;
  /* Spacing (Jason 2026-06-17): ONE uniform gap between chips, the SAME horizontally
     and vertically in every context — between chips on a line, between the wrapped
     rows of one logical line, AND between separate logical lines. (The earlier
     "rows story" that gave wrapped rows a tighter Y gap than between-line gaps is
     intentionally dropped for now.) `--gx` is that one gap. (2px — Jason 2026-06-17.) */
  --gx: 2px;
  --num-w: 30px;
  /* THE indent unit = the width of one paren block (28px, fixed below) + its
     right gap. ALL indentation uses this one unit: each nesting level AND the
     hanging indent of wrapped bag lines, so a wrapped value lands exactly under
     the first value of its bag. (oxjob #428, Jason 2026-06-15.) */
  --indent: calc(28px + var(--gx));
  --brick-fs: 0.8125rem;
  position: relative; /* positioning context for the drag-to-delete overlay */
}
.builder :deep(.v-chip.v-chip--size-small) { font-size: var(--brick-fs); }
.builder-head { margin-bottom: 18px; }

/* Drag-to-delete zone (oxjob #467 Phase 4): an OPAQUE overlay that, while a value chip is
   dragged, covers exactly the builder's header chrome (the toolbar in the SERP, or the
   title header in the sandbox) — its height is set inline to the brick lines' offset so
   none of that chrome shows through (the peek-through made it read as "drop on a button").
   Overlay (not in flow) so revealing it doesn't reflow the bricks mid-drag. Two states:
   armed (dashed border, soft solid-red fill) and hot (solid red fill, white text). */
.delete-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px; /* fallback until chromeH is measured; inline style overrides */
  border: 2px dashed rgba(179, 38, 30, 0.55);
  border-radius: 8px;
  background: #fbe9e7; /* OPAQUE — nothing behind it shows through */
  color: #b3261e;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: copy;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.delete-zone--hot {
  border-style: solid;
  border-color: #b3261e;
  background: #b3261e; /* solid red */
  color: #fff;
}
/* children non-hittable so dragenter/dragleave only fire on the zone (no flicker) */
.delete-zone > * { pointer-events: none; }
.delete-zone .dz-icon { color: #b3261e; }
.delete-zone--hot .dz-icon { color: #fff; }
.tree-card { padding: 14px 16px; background: white; }
/* with the toolbar, the card opens flush at the top so the toolbar strip reads as
   chrome (its own bottom border) above the canvas. */
.tree-card--toolbar { padding-top: 0; }
/* Toolbar: a narrow strip of quiet text buttons with a bottom rule. */
.builder-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  margin: 0 -16px 8px;
  padding: 4px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.builder-toolbar :deep(.tbtn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.66);
  padding: 0 8px;
}
.builder-toolbar :deep(.tbtn:hover) { color: rgba(0, 0, 0, 0.9); }
.builder-toolbar :deep(.tbtn .v-icon) { font-size: 17px; }
/* editor controls (edit code · copy · clear) use the stock icon-button recipe —
   no overrides — so they match icon buttons elsewhere in the app. */
/* checkmark in the columns/sort toggle menus — kept (opacity 0 when off) so the
   label never shifts. Tight against the label, Word-menu style. */
.menu-check { font-size: 18px; }
/* Lines stack with the SAME uniform gap (--gx) between them as between chips —
   the column gap here is the between-line vertical whitespace (Jason 2026-06-17). */
.builder-lines { counter-reset: bline; display: flex; flex-direction: column; gap: var(--gx); }
.bline {
  display: flex;
  align-items: flex-start;
  /* Squared off — no border-radius, so the left/right rails read as straight up-and-down
     borders, not rounded pills (Jason 2026-06-17, #475). */
  border-radius: 0;
  /* Full-card-width bleed on EVERY line (was hover-only): equal +/- margin/padding so
     content stays put while the hover band + the rails reach the card edges. */
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
  /* Persistent rails on BOTH the far-left AND far-right card margins: invisible (white)
     normally, grey on hover, bold black when the row is selected. The pair frames the hover
     band so the highlight reads as separate from the card background. Thicker (4px) and
     always present so changing state never shifts layout (oxjob #475, Jason 2026-06-17). */
  box-shadow: inset 4px 0 0 0 #fff, inset -4px 0 0 0 #fff;
}
/* A line that maps to a logical row is clickable anywhere on its band (oxjob #475): pointer
   cursor over the whole row, including its parens / conjunctions / property marks. The
   `.bl-body` content still has its own cursors (value chips = pointer, inputs = text). */
.bline--rowsel { cursor: pointer; }
/* hover block-highlight: an extra-subtle grey band spanning the full canvas (Jason 2026-06-17:
   ~half as dark as before, 0.025 black; HOVER-ONLY — a selected row drops it). Both rails go a
   visible grey to FRAME the band so the light highlight reads as separate from the white card. */
.bline--hl {
  background: rgba(0, 0, 0, 0.025);
  box-shadow: inset 4px 0 0 0 rgba(0, 0, 0, 0.16), inset -4px 0 0 0 rgba(0, 0, 0, 0.16);
}
/* selected row (oxjob #475, Jason 2026-06-17): NO background band (that's hover-only); the row
   reads as selected via bold black rails on both margins + a bold black line number. Declared
   after --hl so the black rails win when a selected row is also hovered (grey band still shows). */
.bline--sel {
  box-shadow: inset 4px 0 0 0 #1a1a1a, inset -4px 0 0 0 #1a1a1a;
}
.bline::before {
  counter-increment: bline;
  content: counter(bline);
  flex: 0 0 auto;
  width: var(--num-w);
  /* center the number against the 26px chip row (no .bline vertical padding now) */
  margin-top: 6px;
  padding-right: 9px;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.32);
  user-select: none;
}
.bline--sel::before { font-weight: 700; color: #1a1a1a; }
.bl-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  /* ONE gap, both axes: column-gap between chips on a row AND row-gap between the
     wrapped rows of this logical line are both --gx (Jason 2026-06-17). */
  gap: var(--gx);
  min-height: 26px;
  /* depth nesting PLUS a one-unit hanging indent: pad an extra unit and pull the
     first brick back by the same unit, so the first visual row starts at the
     depth indent while every WRAPPED row hangs one paren-width further in (lands
     under the bag's first value). Invisible on lines that don't wrap. */
  padding-left: calc((var(--depth, 0) + 1) * var(--indent));
}
.bl-body > :first-child { margin-left: calc(-1 * var(--indent)); }
/* static keyword bricks (where / sort by / return): solid gray, inert */
.kw-chip {
  justify-content: center;
  padding: 0 6px;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
/* .prop-chip / .op-chip / .paren-brick / .not-chip / .conn-chip / .paren-block moved
   into the per-type chip components (OqlFieldChip / OqlConnChip / OqlParenChip /
   OqlBrick / OqlKeywordChip) when the token v-for became <OqlBrick>; #428 Phase B
   removed the last parent-rendered consumers (the draft "filter clause" chrome). Only
   .kw-chip (the inert sort by / return keyword bricks) stays here. (oxjob #467/#428.) */
/* Value-brick styles (.bool-chip / .value-chip / .notpfx) moved to OqlValueChip.vue
   (oxjob #467); the scalar/search text-chip styles live in OqlTextChip.vue. */
/* "+" affordances on the sort / return lines: revealed only while hovering that
   line (oxjob #428 — keep them, just unclutter). App.vue's ghost reset forces btn
   opacity 1, so hide via visibility. */
.hover-reveal { visibility: hidden; }
.bline:hover .hover-reveal { visibility: visible; }
/* Leading "dot" placeholder (oxjob #475): a small GRAY chip (Jason 2026-06-17 — "make it look
   like the other chips with a gray background") the same 28px width as a connector chip / paren
   block on the indent grid, with a centered dot. Sits in the hanging-indent column (it's the
   line's first child, pulled back one --indent unit), so a multi-item group's first child lines
   up under its `and`/`or`-led siblings. Goes black with the rest of the row's chips on select. */
.lead-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  width: 28px;
  min-width: 28px;
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--kw-bg, #ececec);
  color: var(--kw-fg, rgba(0, 0, 0, 0.5));
  font-size: 1.1rem;
  line-height: 1;
  user-select: none;
}
.lead-dot--sel { background: #1a1a1a; color: #fff; }
/* "Delete filter" footer item in the field-chip menu — danger red. */
.filter-delete-item :deep(.v-list-item-title) { color: #b3261e; }
.filter-delete-item :deep(.v-icon) { color: #b3261e; opacity: 0.85; }
.sort-chip { cursor: pointer; background: var(--val-bg) !important; color: var(--val-fg) !important; }
.sort-chip.pending { background: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.return-chip { background: var(--val-bg) !important; color: var(--val-fg) !important; }
.sort-sep { color: rgba(0, 0, 0, 0.4); margin: 0 2px; }
.sort-remove { opacity: 0.4; }
.sort-remove:hover { opacity: 1; }
.add-sort-btn { opacity: 0.55; }
.add-sort-btn:hover { opacity: 1; }
.add-main { text-transform: none; letter-spacing: 0; padding: 0 8px; }
.menu-card { overflow: hidden; }
.builder-foot { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.builder-foot--in-card {
  margin: 14px -16px 0;
  padding: 10px 16px;
  border-top: 1px solid #e0e0e0;
  background: white;
}
.tree-card--embedded { padding-bottom: 0; }
</style>
