<template>
  <div class="builder" :style="OQL_ROLE_CSS_VARS" @keydown="onBuilderKeydown">
    <header v-if="showHeader" class="builder-head">
      <h1 class="text-h5">Query builder</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Build a query out of bricks — no syntax to learn.
      </p>
    </header>

    <!-- Line-flow canvas (oxjob #428 iter 22): the builder renders DIRECTLY from
         the server's `oql_render_v2.lines` projection — the SAME line list #463's
         OQL text pane renders — so their line-number gutters match by construction
         (no layout rules re-derived client-side). Each `.bline` is one logical
         line; tokens are interactive bricks keyed back to v2 nodes for editing.
         Incomplete new filters live as local "drafts" appended after the committed
         lines, folding into the query (server re-render) once they have a value. -->
    <v-card variant="outlined" class="tree-card" :class="{ 'tree-card--embedded': embedded }">
      <v-progress-linear v-if="propsLoading" indeterminate color="deep-purple" />
      <div class="builder-lines">
        <div v-for="line in displayLines" :key="line.key" class="bline"
          :class="{ 'row-hover': hoverLine === line.key }" :style="{ '--depth': line.depth }"
          @mouseenter="hoverLine = line.key" @mouseleave="hoverLine = null">
          <div class="bl-body">
            <template v-for="(tok, ti) in line.tokens" :key="ti">
              <!-- ENTITY selector (the `works`/`authors` brick on line 1) -->
              <EntitySelectorButton v-if="tok.t === 'kw' && tok._entity" v-model="getRows" />

              <!-- clause-group `not` chrome (Issue B): clickable — toggles the
                   group's negation off (carries the negated group's id). -->
              <v-chip v-else-if="tok.t === 'kw' && tok.label === 'not' && tok.id" class="not-chip"
                size="small" label variant="flat" @click="onGroupNegate(tok)">not</v-chip>

              <!-- static keyword chrome: `where`, draft `and`/`or` lead-ins -->
              <v-chip v-else-if="tok.t === 'kw'" class="kw-chip" size="small" label variant="flat">{{ tok.text.trim() }}</v-chip>

              <!-- CONNECTOR (and/or) — toggles the owning group's conjunction -->
              <v-chip v-else-if="tok.t === 'conn'" class="conn-chip" size="small" label variant="flat"
                @click="onToggleJoin(tok)">{{ (tok.label || tok.text).trim() }}</v-chip>

              <!-- PAREN — load-bearing block control (Issue B): a grey block you
                   CLICK for the group menu (negate · delete). Both the `(` and `)`
                   carry the group id, so either opens the same menu. Adding a value
                   stays on the inline `+`/picker after the last value. -->
              <v-menu v-else-if="tok.t === 'paren'" location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <span v-bind="mp" class="paren-block">{{ tok.text }}</span>
                </template>
                <v-card min-width="170" class="menu-card">
                  <v-list density="compact" class="py-0">
                    <v-list-item prepend-icon="mdi-not-equal-variant" title="Negate group" @click="onGroupNegate(tok)" />
                    <v-list-item prepend-icon="mdi-close" title="Delete group" @click="onGroupRemove(tok)" />
                  </v-list>
                </v-card>
              </v-menu>

              <!-- COLUMN (field) chip → field picker (popular + search + categorized More) -->
              <template v-else-if="tok.t === 'col'">
                <SelectionMenu
                  :open="openFieldMenuId === tok.id"
                  :all-keys="allFieldKeys"
                  :popular-keys="popularFields"
                  :get-display-name="getFieldDisplayName"
                  :get-icon="getFieldIcon"
                  location="bottom start"
                  :offset="[4, 0]"
                  search-placeholder="Search all fields"
                  custom-more
                  @update:open="(v) => onFieldMenuOpen(tok, v)"
                  @select="(k) => pickField(tok, k)"
                  @more="openFieldDialog(tok)"
                >
                  <template #activator="{ props: mp }">
                    <v-chip v-bind="mp" class="prop-chip" :class="{ unset: !tok._column }" label size="small"
                      :variant="tok._column ? 'flat' : 'outlined'" append-icon="mdi-menu-down">
                      {{ tok._label }}
                    </v-chip>
                  </template>
                </SelectionMenu>
              </template>

              <!-- OPERATOR (relation) chip -->
              <v-menu v-else-if="tok.t === 'op' && tok._ops && tok._ops.length" location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <v-chip v-bind="mp" class="op-chip" label size="small" variant="flat"
                    append-icon="mdi-menu-down">{{ tok.text.trim() }}</v-chip>
                </template>
                <v-card min-width="160" class="menu-card">
                  <v-list density="compact" class="py-0">
                    <v-list-item v-for="o in tok._ops" :key="o.key" :title="o.label" @click="pickOperator(tok, o)" />
                  </v-list>
                </v-card>
              </v-menu>
              <v-chip v-else-if="tok.t === 'op'" class="op-chip op-static" label size="small" variant="flat">{{ tok.text.trim() }}</v-chip>

              <!-- VALUE bricks ----------------------------------------------- -->
              <!-- boolean value: true/false menu -->
              <v-menu v-else-if="tok.t === 'vbrick' && tok._kind === 'boolean'" location="bottom start" offset="4">
                <template #activator="{ props: mp }">
                  <v-chip v-bind="mp" class="bool-chip" label size="small" variant="flat"
                    append-icon="mdi-menu-down">{{ String(tok.value) }}</v-chip>
                </template>
                <v-card min-width="120" class="menu-card">
                  <v-list density="compact" class="py-0">
                    <v-list-item title="true" :active="tok.value === true" @click="pickBool(tok, true)" />
                    <v-list-item title="false" :active="tok.value === false" @click="pickBool(tok, false)" />
                  </v-list>
                </v-card>
              </v-menu>

              <!-- entity value chip: click toggles negation; × removes -->
              <v-chip v-else-if="tok.t === 'vbrick' && tok._kind === 'entity'" class="value-chip"
                :class="{ negated: tok.negated }" size="small" label variant="flat"
                :closable="!tok._sole" @click="onToggleNeg(tok)" @click:close.stop="onRemoveValue(tok)">
                <span v-if="tok.negated" class="notpfx">not&nbsp;</span>{{ tok._entityName || tok.display || tok.text }}
              </v-chip>

              <!-- scalar / search value: inline-editable "text chip" (own component) -->
              <OqlTextChip v-else-if="tok.t === 'vbrick'" :tok="tok"
                @value-input="onValueInput(tok, $event)"
                @value-keydown="onValueKeydown(tok, $event)"
                @value-blur="onValueBlur(tok)"
                @clear-neg="onClearNeg(tok)"
                @remove="onRemoveValue(tok)" />

              <!-- raw passthrough text (rare) -->
              <span v-else-if="tok.t === 'text'" class="paren-brick">{{ tok.text }}</span>

              <!-- explicit add-value affordance (draft clauses): entity → picker, scalar → + -->
              <BuilderAddValue v-else-if="tok.t === 'addvalue'" :value-kind="tok._kind"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @add="onAddValueTo(tok._targetId, tok._draft)" @pick="(p) => onPickEntityValueTo(tok._targetId, p, tok._draft)" />

              <!-- ADD-VALUE affordance, after the last value of a flat committed clause -->
              <BuilderAddValue v-if="tok._showAddValue" :value-kind="tok._kind"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @add="onAddScalarValue(tok)" @pick="(p) => onPickEntityValue(tok, p)" />
            </template>

            <!-- field-picker "More" → categorized field tour (one per builder) -->
            <BuilderFieldDialog v-if="line._hasFieldMenu" v-model="fieldDialogOpen"
              :properties="properties" @select="onFieldDialogSelect" />

            <!-- remove this whole filter row (hover-revealed) -->
            <v-btn v-if="line._removeId" class="row-trash" icon size="x-small" variant="text"
              density="comfortable" @click="removeRow(line._removeId)">
              <v-icon size="14">mdi-delete-outline</v-icon>
              <v-tooltip activator="parent" location="top">Remove this filter</v-tooltip>
            </v-btn>
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
                <v-btn v-bind="mp" class="add-sort-btn" icon size="x-small" variant="text" density="comfortable">
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
                <v-btn v-bind="mp" class="add-sort-btn" icon size="x-small" variant="text" density="comfortable">
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

        <!-- root add line — the main thing to do next -->
        <div class="bline" :style="{ '--depth': 0 }">
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

      <template v-if="embedded">
        <div class="builder-foot builder-foot--in-card">
          <v-chip v-if="validation" size="x-small" :color="validation.valid ? 'green' : 'red'" variant="tonal">{{ statusLabel }}</v-chip>
          <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
          <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
          <span v-if="inlineRun && resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
          <v-spacer />
          <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
        </div>
      </template>
    </v-card>

    <div v-if="!embedded" class="builder-foot">
      <v-chip v-if="validation" size="x-small" :color="validation.valid ? 'green' : 'red'" variant="tonal">{{ statusLabel }}</v-chip>
      <v-progress-circular v-if="rendering" indeterminate size="14" width="2" />
      <span v-if="seedError" class="text-caption text-error">{{ seedError }}</span>
      <span v-if="inlineRun && resultCount != null" class="text-caption">{{ resultCount.toLocaleString() }} results</span>
      <v-spacer />
      <v-btn size="small" variant="flat" color="black" :loading="running" @click="runQuery">{{ runLabel }}</v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { debounce } from "lodash";
import { api } from "@/api";
import EntitySelectorButton from "@/components/EntitySelectorButton.vue";
import OqlTextChip from "@/components/Oql/OqlTextChip.vue";
import SelectionMenu from "@/components/Misc/SelectionMenu.vue";
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
import { fieldKeys, popularFieldKeys, fieldIcon } from "@/components/OqlPlayground/builderFieldMeta";
import { OQL_ROLE_CSS_VARS } from "@/components/Oql/oqlPalette";

defineOptions({ name: "OqlQueryBuilder" });

const props = defineProps({
  oql: { type: String, default: null },
  seedOql: { type: String, default: null },
  entity: { type: String, default: null },
  showHeader: { type: Boolean, default: true },
  inlineRun: { type: Boolean, default: true },
  runLabel: { type: String, default: "Run" },
  embedded: { type: Boolean, default: false },
  standalone: { type: Boolean, default: false },
});
const emit = defineEmits(["run", "update:oql"]);

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

const hoverLine = ref(null);
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
  const tokenColumn = {}, tokenClause = {}, clauseFlat = {}, clauseLastVal = {}, topRowOf = {};
  const sole = {}; // value id -> true when it is the clause's ONLY value (can't ×)
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
      clauseLastVal[c.id] = leaves.length ? leaves[leaves.length - 1].id : null;
      if (leaves.length === 1) sole[leaves[0].id] = true;
    } else { clauseFlat[c.id] = true; clauseLastVal[c.id] = c.id; sole[c.id] = true; }
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
  return { tokenColumn, tokenClause, clauseFlat, clauseLastVal, topRowOf, sole };
});

// ---- field picker data ------------------------------------------------------
const allFieldKeys = computed(() => fieldKeys(properties.value));
const popularFields = computed(() => popularFieldKeys(getRows.value, allFieldKeys.value));
const getFieldDisplayName = (k) => properties.value[k]?.display_name || k;
const getFieldIcon = (k) => fieldIcon(getRows.value, k, properties.value);

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
    t._ops = col ? uiOperatorsForProperty(properties.value[col]) : [];
  }
  if (tok.t === "vbrick") {
    const col = tok.column_id || idx.tokenColumn[tok.id];
    const clauseId = idx.tokenClause[tok.id];
    const p = properties.value[col];
    t._column = col;
    t._kind = valueKindForProperty(p);
    t._numeric = t._kind === "number";
    t._autocompleteEntity = autocompleteEntityFor(p);
    t._listVocab = isListVocabEntity(p);
    t._sole = !!idx.sole[tok.id];
    // committed flat clauses get the inline "+ add value" on their last value
    // (one affordance per group — the paren menu handles negate/delete, not add);
    // draft clauses render their own explicit `addvalue` token, so skip it there.
    t._showAddValue = !tok._draft && t._kind !== "boolean"
      && idx.clauseFlat[clauseId] && idx.clauseLastVal[clauseId] === tok.id;
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
const displayLines = computed(() => {
  const out = [];
  const tree = v2.value;
  const lines = (tree && tree.lines) || [];
  const dirCount = (tree && tree.directives || []).length;
  const whereLines = dirCount ? lines.slice(0, lines.length - dirCount) : lines.slice();
  const seenRows = new Set();
  whereLines.forEach((ln) => {
    // a simple entity clause renders its name as a separate `id` segment
    // (`[Harvard University]`) keyed to the clause id — harvest it onto the value
    // chip and drop the bare id token + whitespace-only text segments.
    const names = {};
    ln.tokens.forEach((t) => {
      if (t.t === "id" && /^\[.*\]$/.test((t.text || "").trim()))
        names[t.id] = t.text.trim().replace(/^\[|\]$/g, "");
    });
    const tokens = ln.tokens
      .filter((t) => t.t !== "id" && !(t.t === "text" && !(t.text || "").trim()))
      .map((t) => {
        const e = enrichToken(t);
        if (e.t === "vbrick" && e._kind === "entity")
          e._entityName = e._entityName || names[t.id] || null;
        return e;
      });
    // first line of each top-level row gets the remove-row trash
    let removeId = null;
    for (const tok of ln.tokens) {
      const row = treeIndex.value.topRowOf[tok.id];
      if (row && !seenRows.has(row)) { seenRows.add(row); removeId = row; break; }
    }
    out.push({
      key: `s${ln.n}`, depth: (ln.indent || 0) / 2, tokens,
      _removeId: removeId, _hasFieldMenu: false,
    });
  });
  drafts.value.forEach((d) => out.push(draftLine(d, out)));
  // Explode inline paren groups into indented blocks (each `(` ends a line, its
  // contents indent, each `)` is alone on its own line). The server's char-based
  // `format_oql` keeps short groups on one logical line, which overflows the wide
  // chips and soft-wraps with no structure (stranded `) )`); the builder needs its
  // own block layout. (oxjob #428 Issue B feedback.)
  const exploded = out.flatMap(explodeParens);
  // exactly one BuilderFieldDialog instance (shared) on the last draft/add line
  if (exploded.length) exploded[exploded.length - 1]._hasFieldMenu = true;
  return exploded;
});

// Split one display line into a block when it carries a fully-balanced inline paren
// group; pass through lines the server already exploded (unbalanced paren count) so
// their indentation is untouched. Depth = the line's base depth + paren nesting.
function explodeParens(line) {
  const isP = (t, ch) => t.t === "paren" && (t.text || "").trim() === ch;
  const opens = line.tokens.filter((t) => isP(t, "(")).length;
  const closes = line.tokens.filter((t) => isP(t, ")")).length;
  if (!opens || opens !== closes) return [line];
  const sub = [];
  let buf = [], pd = 0, first = true;
  const flush = (depth) => {
    if (!buf.length) return;
    sub.push({ key: `${line.key}_${sub.length}`, depth, tokens: buf,
      _removeId: first ? line._removeId : null, _hasFieldMenu: false });
    first = false; buf = [];
  };
  for (const tok of line.tokens) {
    if (isP(tok, "(")) { buf.push(tok); flush(line.depth + pd); pd += 1; }
    else if (isP(tok, ")")) { flush(line.depth + pd); pd -= 1; buf.push(tok); flush(line.depth + pd); }
    else buf.push(tok);
  }
  flush(line.depth + pd);
  return sub.length ? sub : [line];
}

function draftLine(d, prior) {
  const hasCommitted = !!(v2.value && v2.value.where);
  const tokens = [];
  tokens.push({ t: "kw", text: hasCommitted || prior.length ? " and " : " where ",
    label: hasCommitted ? "and" : "where" });
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
    // explicit add-value affordance (entity → picker; scalar → +), targeting the
    // draft clause so it works whether there are 0, 1, or many values yet.
    const kind = valueKindForProperty(properties.value[d.column_id]);
    if (kind !== "boolean") {
      tokens.push({ t: "addvalue", _targetId: d.id, _kind: kind,
        _autocompleteEntity: autocompleteEntityFor(properties.value[d.column_id]),
        _listVocab: isListVocabEntity(properties.value[d.column_id]), _draft: true });
    }
  } else if (d.column_id && d.unary) {
    tokens.push(enrichToken({ t: "op", id: d.id, column_id: d.column_id, text: ` ${d.operator} `, _draft: true }));
  }
  return { key: `d${d.id}`, depth: 1, tokens, _removeId: null, _removeDraftId: d.id, _hasFieldMenu: false };
}

// ---- rendering (OQO -> server) ----------------------------------------------
// currentOqo folds COMPLETE drafts into the OQO so the OQL string is live while a
// new filter is being typed; on a swap render those drafts are absorbed into the
// returned v2 tree and dropped from the local list.
function currentOqo() {
  const oqo = v2ToOqo({ tree: v2.value, getRows: getRows.value, sortBy: sortBy.value, select: oqoSelect.value });
  // `editing` drafts (a committed clause popped open to add a value) are excluded:
  // they re-render via draftLine, so folding them in too would duplicate the row.
  const extra = drafts.value.filter((d) => edit.draftComplete(d) && !d.editing).map(edit.draftToFilter);
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
    // complete drafts were folded into the OQO above and are now in the tree —
    // drop them. `editing` drafts (a popped-open committed clause) stay local
    // until the user commits (blur clears `editing`), so they survive the swap.
    drafts.value = drafts.value.filter((d) => !edit.draftComplete(d) || d.editing);
  }
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  emit("update:oql", renderedOql.value);
};
const debouncedRender = debounce(() => renderQuery({ swap: false }), 300);

// committed structural edit (toggle / remove / operator): re-render + swap so the
// server-canonical lines reflect it. Draft edits are local + instant; just keep
// the OQL string fresh.
const afterEdit = (tok) => { if (tok && tok._draft) debouncedRender(); else renderQuery({ swap: true }); };

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
  if (kind === "boolean") { debouncedRender(); return; } // shows true/false menu, folds on pick
  if (kind !== "entity") focusValueSoon(d.value.children[0]?.id);
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
    if (tok._draft) { const nid = edit.addValue(v2.value, tok.id, drafts.value); focusValueSoon(nid); }
  }
};
const onValueBlur = (tok) => {
  setTimeout(() => {
    if (document.querySelector(".v-overlay--active")) return;
    if (tok._draft) {
      const d = draftOwning(tok.id);
      if (d && !d.editing && !edit.draftComplete(d) && d.column_id) { drafts.value = drafts.value.filter((x) => x !== d); return; }
      if (d) d.editing = false; // commit: let it fold into the query on the swap
    }
    renderQuery({ swap: true });
  }, 150);
};
const onToggleNeg = (tok) => { edit.toggleNeg(v2.value, tok.id, drafts.value); afterEdit(tok); };
const onClearNeg = (tok) => { edit.toggleNeg(v2.value, tok.id, drafts.value); afterEdit(tok); };
const onRemoveValue = (tok) => { edit.removeNode(v2.value, tok.id, drafts.value); afterEdit(tok); };
const onToggleJoin = (tok) => { edit.toggleJoin(v2.value, tok.id, drafts.value); afterEdit(tok); };

// ---- paren-block group controls (Issue B) ----------------------------------
// All address the group by its paren-token id and re-render from the server.
const onGroupNegate = (tok) => { edit.negateGroup(v2.value, tok.id, drafts.value); renderQuery({ swap: true }); };
const onGroupRemove = (tok) => { edit.removeNode(v2.value, tok.id, drafts.value); renderQuery({ swap: true }); };
const pickBool = (tok, val) => {
  edit.setBool(v2.value, tok.id, val, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};

const onAddScalarValue = (tok) => {
  if (tok._draft) { const nid = edit.addValue(v2.value, tok.id, drafts.value); focusValueSoon(nid); return; }
  // committed scalar clause: pop it (and all its values) into an editing draft so
  // the new empty value box renders — the server `lines` can't carry an empty
  // intermediate. Folds back canonically on blur (onValueBlur clears `editing`).
  const clauseId = treeIndex.value.tokenClause[tok.id] || tok.id;
  const p = properties.value[tok._column];
  const res = edit.popClauseToDraft(v2.value, clauseId, drafts.value,
    { column: p?.display_name || p?.name || tok._column, kind: tok._kind });
  if (res) { renderQuery({ swap: true }); focusValueSoon(res.newId); }
};
const onPickEntityValue = (tok, { value, label }) => {
  const nid = edit.addValue(v2.value, tok.id, drafts.value);
  if (nid) edit.setEntityValue(v2.value, nid, value, label, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};
// add-value affordance addressed by CLAUSE id (draft pickers with 0+ values)
const onAddValueTo = (clauseId, isDraft) => {
  const nid = edit.addValue(v2.value, clauseId, drafts.value);
  if (isDraft) focusValueSoon(nid); else renderQuery({ swap: false });
};
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

// ---- add filter -------------------------------------------------------------
const addRootFilter = () => {
  const d = edit.makeDraft();
  drafts.value.push(d);
  nextTick(() => { openFieldMenuId.value = d.id; });
};

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
  const data = await store.dispatch("oqlBuilder/seedFromOql", incoming);
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
});

// ---- seed from a parse payload ---------------------------------------------
const rebuildFromOqo = async (data) => {
  const oqo = data.oqo;
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
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runQuery(); }
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

defineExpose({ rebuildFromOql: async (oql) => {
  const data = await store.dispatch("oqlBuilder/seedFromOql", String(oql));
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
} });
</script>

<style scoped>
/* Line-flow canvas (oxjob #428): every visual line is a `.bline`
     [line number ::before]  [.bl-body — indented by --depth, content wraps]
   Role colours (--kw-*, --conn-*, --prop-*, --rel-*, --val-*) are bound via
   :style from oqlPalette.js — the single source shared with the #357 text
   editor's syntax highlighting. Don't reintroduce hex values here. */
.builder {
  max-width: 900px;
  --gx: 4px;
  --num-w: 30px;
  --indent: 22px;
  --brick-fs: 0.8125rem;
}
.builder :deep(.v-chip.v-chip--size-small) { font-size: var(--brick-fs); }
.builder-head { margin-bottom: 18px; }
.tree-card { padding: 14px 16px; background: white; }
.builder-lines { counter-reset: bline; }
.bline {
  display: flex;
  align-items: flex-start;
  padding: 1px 0;
}
.bline::before {
  counter-increment: bline;
  content: counter(bline);
  flex: 0 0 auto;
  width: var(--num-w);
  margin-top: 7px;
  padding-right: 9px;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.32);
  user-select: none;
}
.bl-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gx);
  row-gap: 4px;
  min-height: 30px;
  padding-left: calc(var(--depth, 0) * var(--indent));
}
/* static keyword bricks (where / sort by / return): solid gray, inert */
.kw-chip {
  justify-content: center;
  padding: 0 6px;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
/* connector (and/or) — slate, toggles the join */
.conn-chip {
  cursor: pointer;
  justify-content: center;
  padding: 0 6px;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* structural parens — muted, inert */
.paren-brick {
  color: rgba(0, 0, 0, 0.55);
  font-family: "JetBrains Mono", monospace;
  padding: 0 1px;
}
/* clause-group `not` chrome — bold dark-green, clickable (toggles negation off) */
.not-chip {
  cursor: pointer;
  justify-content: center;
  padding: 0 6px;
  font-weight: 700;
  color: var(--val-fg, #0f766e) !important;
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  text-transform: lowercase;
}
/* paren block (Issue B): a grey clickable block — click for the group-action menu */
.paren-block {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-width: 20px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.07);
  color: rgba(0, 0, 0, 0.6);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  line-height: 1.2;
}
.paren-block:hover { background: rgba(0, 0, 0, 0.13); color: rgba(0, 0, 0, 0.85); }
.prop-chip { cursor: pointer; }
.prop-chip:not(.unset) { background-color: var(--prop-bg) !important; color: var(--prop-fg) !important; }
.prop-chip.unset { background-color: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
.op-chip { cursor: pointer; color: var(--rel-fg) !important; background: var(--rel-bg) !important; }
.op-chip.op-static { cursor: default; }
.bool-chip { cursor: pointer; background: var(--val-bg, #ccfbf1) !important; color: var(--val-fg, #0f766e) !important; }
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
  cursor: pointer;
}
/* `not` prefix — also used by the entity value chip above, so it stays here.
   The scalar/search "text chip" styles (.notpfx.clickable / .val-leaf / .val-wrap
   / .val-input / .val-remove) moved to OqlTextChip.vue. */
.notpfx { font-weight: 700; color: var(--val-fg, #14625c); }
/* hover-revealed remove-row trash (App.vue's ghost reset forces btn opacity 1, so
   hide via visibility + dim the inner icon). */
.row-trash { visibility: hidden; }
.bline.row-hover .row-trash { visibility: visible; }
.row-trash :deep(.v-icon) { opacity: 0.45; }
.row-trash:hover :deep(.v-icon) { opacity: 1; }
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
