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
        <!-- Static chrome (oxjob #475 menus-on-chips pivot): the contextual toolbar is gone —
             a chip's actions live in its own dropdown menu now (OqlChipMenu). What stays here is
             the minimal bootstrap chrome: Add filter (to seed/extend a query) + Clear. -->
        <!-- oxjob #494: no `+` icon on Add filter (it's the empty/first-filter entry point; the
             main way to add is now clicking the gap). -->
        <OqlToolbarAction label="Add filter"
          desc="Add a new filter to the query." @click="addRootFilter" />

        <!-- Clear: empties the whole query. The word "Clear" replaces the old trashcan icon (#494). -->
        <OqlToolbarAction label="Clear" :disabled="!hasQuery"
          desc="Clear the whole query." @click="clearQuery" />

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

      <div ref="linesEl" class="builder-lines" :style="{ '--num-w': gutterW }"
        @mouseleave="clearHover(); clearGap()"
        @mouseover="onAddrHover" @mousemove="onLinesGapMove" @click.capture="onLinesGapClick"
        @dragstart="onLinesDragstart" @dragover="onLinesDragover" @drop.prevent="onLinesDrop">
        <!-- Heavy drop-indicator (oxjob #475): a thick black bar marking where a dragged row
             will land. Positioned at the active slot's gap and indented under the target
             container's depth, so it reads as "this block joins this list, here". -->
        <div v-if="activeSlot" class="drop-indicator"
          :style="{ top: activeSlot.top + 'px', '--ind-depth': activeSlot.depth }" aria-hidden="true" />
        <!-- Vertical drop-indicator (oxjob #475 chip drag): a heavy black bar on a chip's margin
             marking where the dragged value chip(s) will land — between two chips, or at a list's
             start/end. Positioned (left/top/height) from the active chip slot's geometry. -->
        <div v-if="activeValueSlot" class="vdrop-indicator"
          :style="{ left: activeValueSlot.x + 'px', top: activeValueSlot.y + 'px', height: activeValueSlot.h + 'px' }"
          aria-hidden="true" />
        <!-- Click-the-gap insertion marker (oxjob #494): a thin black vertical line spanning the
             gap's flanking chips, with a small black "+"-circle centred in the MIDDLE of the line
             (Jason 2026-06-20). Absolute overlay (never reflows the chips); the whole thing is the
             click target → insert here. Fades in/out so it's not jarring on appear/disappear; the
             hit strip (GAP_R) is wider than the visible line, so it stays easy to land on. -->
        <Transition name="gap-fade">
          <div v-if="activeGapSlot" class="gap-indicator"
            :style="{ left: activeGapSlot.x + 'px', top: activeGapSlot.y + 'px', height: activeGapSlot.h + 'px' }"
            aria-hidden="true">
            <span class="gap-line" aria-hidden="true" />
            <span class="gap-plus"><v-icon size="13">mdi-plus</v-icon></span>
          </div>
        </Transition>
        <!-- The whole row band is clickable (oxjob #475): a click anywhere on a line that maps
             to a logical row selects that row (`onLineClick` reads the precomputed `_selectRow`).
             VALUE chips stopPropagation (they self-select); parens/conjunctions/property are
             inert decorations, so their clicks bubble here. `.stop` keeps the band click off the
             document-level deselect handler (it manages its own selection). -->
        <!-- The query rows. (Transitions/animations were ripped out 2026-06-20, Jason:
             "get the mechanism right before we make it pretty" — the line FLIP + chip
             enter/leave were causing zero-width flashes and stray vertical jumps. The
             stable-key invariant from reconcileIds still holds; a TransitionGroup can be
             reintroduced later once the render is solid.) -->
        <div class="bline-flow">
        <div v-for="(line, lineIdx) in displayLines" :key="line.key" class="bline"
          :class="{ 'bline--hl': isHovered(lineIdx), 'bline--sel': isSelectedLine(lineIdx),
                    'bline--dragging': isDraggingLine(lineIdx), 'bline--disabled': isDimmedLine(lineIdx) }"
          :data-addr="line.addr"
          :style="{ '--depth': line.depth }" tabindex="-1"
          @mouseenter="onLineHover(lineIdx)"
          @click.stop="onLineClick(lineIdx, $event)"
          @dblclick.stop="onLineDblclick(lineIdx, $event)">
          <!-- Row drag handle (oxjob #475, Jason 2026-06-19 review #3): a row can be dragged ONLY
               by grabbing this left-margin handle — the band itself is no longer draggable. Shown
               on row hover; rendered only for lines that map to a draggable node (`_dragNode`).
               Absolutely positioned so it never shifts the row's content. -->
          <span v-if="line._dragNode && !line._selectRow?.root" class="row-grab" draggable="true" aria-hidden="true"
            @click.stop @dragstart="onRowDragstart(line, $event)" @dragend="onRowDragend($event)">
            <v-icon size="12">mdi-drag-vertical</v-icon>
          </span>
          <!-- Structural column grid (oxjob #507): one fixed-width cell per nesting level,
               left→right. A SPACER cell holds a column open so meaning-words align; a
               CONNECTOR cell (`&` for AND, `or` for OR) joins this operand to its predecessor.
               Parens are never drawn — these columns carry the grouping. A connector cell is
               clickable: it flips/edits the join of its group (Phase 3, `onConnCellClick`). -->
          <div v-if="line.cols && line.cols.length" class="bl-cols" aria-hidden="false">
            <template v-for="(cell, ci) in line.cols" :key="ci">
              <span v-if="cell.t === 'conn'" class="bl-conn-cell"
                @click.stop="onConnCellClick(cell, $event)">{{ cell.label === 'and' ? '&' : cell.label }}</span>
              <span v-else class="bl-spacer" aria-hidden="true"></span>
            </template>
          </div>
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
              <!-- Every visible brick is ONE OqlBrick dispatcher. Single-clicking a chip opens
                   its dropdown menu (`@menu` → onChipMenu), anchored at the chip el. Double-click
                   was removed (Jason 2026-06-22) — a value chip's Edit is on Enter / its menu. -->
              <!-- `.bl-tok` (display:contents — no box, no layout perturbation) carries the
                   token's decimal address (#487) so the footer's hover delegation on
                   `.builder-lines` resolves `e.target.closest('[data-addr]')` to THIS token's
                   node (value/field/group), falling back to the line's owner addr on `.bline`
                   for chrome / fused joins. -->
              <span v-if="isBrick(tok)" class="bl-tok" :data-addr="tok.addr">
              <OqlBrick :tok="tok" :ctx="brickCtx"
                :active="isLeaderSelected(tok) || (tok.t === 'vbrick' && tok.id === activeValueId) || (tok.t !== 'vbrick' && isSelected(tok))"
                :edit-open="tok.t === 'vbrick' && tok.id === editTextId"
                :selected="isSelected(tok)" :selection-active="selectionActive"
                @select="onChipSelect($event)"
                @batch-menu="onBatchMenu($event)"
                @select-clear="clearSelection()"
                @set-entity="getRows = $event"
                @negate-group="onGroupNegate(tok)"
                @menu="(el, ev) => onChipMenu(tok, el, ev)"
                @request-edit="onRequestEdit(tok)"
                @select-field="(k) => pickField(tok, k)"
                @open-field-menu="(v) => onFieldMenuOpen(tok, v)"
                @more-fields="openFieldDialog(tok)"
                @delete-filter="deleteFilter(tok)"
                @value-input="onValueInput(tok, $event)"
                @value-keydown="onValueKeydown(tok, $event)"
                @value-blur="onValueBlur(tok)"
                @edit-start="cancelPendingMenuOpen()"
                @add="onChipAdd(tok)"
                @remove="onRemoveValue(tok)" />
              </span>

              <!-- Leading "dot" placeholder (oxjob #475, Jason 2026-06-17): the FIRST child of a
                   multi-item group has no connector, so it would jut out to the left of its
                   `and`/`or`-led siblings. layoutLines prepends this inert dot in the same
                   hanging-indent column a connector occupies, so every sibling aligns. -->
              <span v-else-if="tok.t === 'dot'" class="lead-dot" aria-hidden="true"></span>

              <!-- ENTITY value picker — INVISIBLE (anchorOnly), opened in place from a
                   value chip's "New" / draft creation, so there's no floating "+". One
                   per draft clause (here) and per committed entity clause (below),
                   registered by clause/draft id. NOT a chip → parent-rendered. (#467.) -->
              <BuilderAddValue v-else-if="tok.t === 'addvalue' && tok._kind === 'entity'" anchor-only
                :ref="(el) => registerPicker(tok._targetId, el)"
                :value-kind="tok._kind"
                :anchor-target="`[data-vid='${tok._targetId}_ph']`"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @pick="(p) => onPickEntityValueTo(tok._targetId, p, tok._draft)"
                @abandon="onAbandonValue(tok._targetId)" />

              <!-- One invisible in-place picker PER committed entity value, keyed by
                   the VALUE id (not the clause) — so the trailing "+" add-value chip
                   (or Cmd/Ctrl+Enter) opens a picker anchored right after THAT chip and
                   inserts the new value to its right, including for a value inside a
                   nested group. (#428) Includes the COMMITTED empty-entity PLACEHOLDER (a
                   gap-inserted 2nd value awaiting its pick): it now renders as a `new <type>`
                   placeholder chip but still needs its picker registered under its value id
                   so `openPicker(res.id)` resolves. The DRAFT `_ph` placeholder is excluded by
                   `!tok._draft` (it has its own clause-level picker). (Jason 2026-06-22.) -->
              <BuilderAddValue v-if="tok.t === 'vbrick' && tok._kind === 'entity' && !tok._draft" anchor-only
                :ref="(el) => registerPicker(tok.id, el)"
                :value-kind="tok._kind"
                :anchor-target="`[data-vid='${tok.id}']`"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @pick="(p) => onPickEntityValue(tok, p)"
                @abandon="editingEntityId = null" />
            </template>

            <!-- field-picker "More" → categorized field tour (one per builder) -->
            <BuilderFieldDialog v-if="line._hasFieldMenu" v-model="fieldDialogOpen"
              :entity="getRows" @select="onFieldDialogSelect" />
          </div>
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

      <!-- Ancestor-path breadcrumb (oxjob #487 Part 2): a slim status strip showing the
           humanized ancestor path of the hovered node (selection as a resting fallback,
           else the entity root). Pure display; driven by the `footer` computed —
           bold + black on a selection, "N chips selected" on a multi-selection. -->
      <OqlBuilderFooter v-if="hasQuery" :segments="footer.segments"
        :bold="footer.bold" :count-label="footer.countLabel" />

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

    <!-- CHIP DROPDOWN MENU (oxjob #475 menus-on-chips pivot): a single overlay driven by
         `chipMenu`. Single-clicking any chip opens the menu for that chip here; a cmd-multi
         selection opens the batch (multi-select) menu on cmd release. Custom fixed overlay (NOT
         a coordinate v-menu — those self-dismiss); the document-click handler dismisses it. -->
    <OqlChipMenu v-if="chipMenu" :items="chipMenu.items" :x="chipMenu.x" :y="chipMenu.y"
      :heading="chipMenu.heading" @pick="onChipMenuPick" />

    <!-- DATE value editor (oxjob #475): the calendar relocated off the old toolbar onto a
         chip-anchored overlay, opened from a date value's "Edit" menu item. -->
    <div v-if="dateEditor" class="date-editor-overlay menu-card chip-menu"
      :style="{ left: dateEditor.x + 'px', top: dateEditor.y + 'px' }" @click.stop @mousedown.stop>
      <OqlDatePicker :value="dateEditor.value" @pick="onDateEditorPick" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useStore } from "vuex";
import { useRoute } from "vue-router";
import { debounce } from "lodash";
import { api } from "@/api";
import OqlBrick from "@/components/Oql/OqlBrick.vue";
import OqlChipMenu from "@/components/Oql/OqlChipMenu.vue";
import OqlToolbarAction from "@/components/Oql/OqlToolbarAction.vue";
import OqlDatePicker from "@/components/Oql/OqlDatePicker.vue";
import { filterPropMenu, joinMenu, valueMenu, multiSelectMenu } from "@/components/Oql/chipMenus";
import BuilderFieldDialog from "@/components/OqlPlayground/BuilderFieldDialog.vue";
import BuilderAddValue from "@/components/OqlPlayground/BuilderAddValue.vue";
import AddColumn from "@/components/Results/Table/AddColumn.vue";
import { resolveColumns } from "@/components/Results/Table/columnConfig";
import { useColumnsState } from "@/composables/useColumnsState";
import { useLocalColumns } from "@/composables/useLocalColumns";
import { facetConfigs } from "@/facetConfigs";
import {
  valueKindForProperty, autocompleteEntityFor, isListVocabEntity,
  uiOperatorsForProperty, searchFieldSiblings,
} from "@/components/OqlPlayground/oqoTree";
import { v2ToOqo } from "@/components/OqlPlayground/v2ToOqo";
import * as edit from "@/components/OqlPlayground/v2Edit";
import { layoutLines } from "@/components/Oql/builderLayout";
import { treeToTokens } from "@/components/Oql/treeToTokens";
import { buildAddrIndex, buildAddrById, pathForAddr } from "@/components/Oql/oqlBreadcrumb";
import OqlBuilderFooter from "@/components/Oql/OqlBuilderFooter.vue";
import { reconcileTreeIds } from "@/components/Oql/reconcileIds";
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
// `update:oqo` (oxjob #464 Phase 2c): alongside the OQL string, emit the structured
// OQO we just rendered + this edit's back-button nav intent ('push' | 'replace'), so
// the SERP can drive the canonical query store via POST-OQO instead of round-tripping
// through the URL. The OQL string emit (`update:oql`) stays for the bootstrap / non-
// store path; the host picks which to honor (SerpInputContainer routes OQL mode
// through `update:oqo`, the new-query bootstrap through `update:oql`).
const emit = defineEmits(["run", "update:oql", "update:oqo", "edit-raw"]);

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
const BRICK_TYPES = new Set(["kw", "conn", "paren", "joinkw", "col", "vbrick", "text"]);
// "Multi-value" filter kinds — those whose value list can hold ≥2 values, so they get
// the trailing square "+" add-value chip (oxjob #428; #475 added `number`). Numbers DO
// support a value list (`publication_year is (2020 or 2021)` is valid OQL — verified),
// so per Jason 2026-06-17 ("the + adds year values 2021, 2022") they get it. Booleans
// (true/false) and dates stay single-value, so they never show the chip.
const MULTI_VALUE_KINDS = new Set(["entity", "text", "number"]);

// The DRAG/SELECT compatibility key of a value chip (oxjob #475 chip drag, Jason
// 2026-06-17: "you can only select chips of the same type"). Same kind, AND for entities
// the same ENTITY TYPE — so an author value drags only among author lists, never into an
// institution list (Jason chose "same kind + same entity type"), while text↔any-text and
// number↔any-number are compatible. A column with no matching property falls back to its
// own id (compatible only with itself). Booleans/dates aren't multi-value so never drag.
const chipTypeForColumn = (col) => {
  if (col == null) return null;
  const p = properties.value[col];
  const kind = valueKindForProperty(p);
  if (kind === "entity") return `entity:${(p && p.entity_type) || autocompleteEntityFor(p) || col}`;
  return kind;
};
const chipTypeForValueId = (id) => chipTypeForColumn(treeIndex.value.tokenColumn[id]);
// A committed value chip can be selected/dragged for reorder only if its kind supports a
// value list (entity/text/number) — booleans/dates are single-value.
const valueIsDraggable = (id) => MULTI_VALUE_KINDS.has((chipTypeForValueId(id) || "").split(":")[0]);

// Fold each `op` (predicate) token INTO its same-clause `col` token: the predicate is
// no longer its own brick (Jason 2026-06-15) — non-numeric predicates are fixed and
// just read as part of the property ("keyword is" / "title/abstract contains"), and a
// numeric one ("year ≥") is changed from the property chip's own menu. Copies the op's
// display text + numeric operator options onto the col, then drops the `op` tokens so
// they never render separately. (col + op share the clause id, in both server `lines`
// and draftBodyTokens.) Mutates the col tokens in place; returns the op-less list.
const PRETTY_OP = { ">=": "≥", "<=": "≤" }; // match the operator-menu glyphs (uiOperatorsForProperty)
// The three predicates we OFFER for a numeric/range filter chip, in display order (Jason
// 2026-06-22, #475): ≥ / = / ≤. We deliberately omit strict > / < — the user gets those by
// ±1, and showing five comparisons is clutter. (A strict >/< arriving via OQL still renders +
// round-trips; it just won't be flagged in this list.) The eq predicate's OQL op is `is`.
const NUMERIC_OPS = [
  { op: ">=", label: "≥ greater than or equal to" },
  { op: "is", label: "= equal to" },
  { op: "<=", label: "≤ less than or equal to" },
];
function foldPredicates(tokens) {
  const opById = {};
  tokens.forEach((t) => { if (t.t === "op") opById[t.id] = t; });
  tokens.forEach((t) => {
    if (t.t === "col" && opById[t.id]) {
      const raw = (opById[t.id].text || "").trim();
      t._predicate = PRETTY_OP[raw] || raw;
      t._predicateRaw = raw; // un-prettified op ("≥"→">=") so the menu can flag the active radio
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
    // (oxjob #494: no more inline trailing "+" add-value chip — values are added by clicking the
    // gap in the value list, so `_addChip` / the `addvaluechip` token are gone.)
    // resolved entity name: the server embeds it as `<id> [Display Name]` in the
    // rendered text/display (or carries an entity dict). Prefer the name for the
    // chip; the raw id stays in tok.value for edits.
    if (t._kind === "entity") {
      const m = String(t.display != null ? t.display : t.text || "").match(/\[(.+)\]\s*$/);
      t._entityName = (t.entity && t.entity.display_name) || (m && m[1]) || null;
      // An empty entity value (no resolved name, no value yet) is a not-yet-picked PLACEHOLDER —
      // e.g. a 2nd value gap-inserted into a subclause, an empty vleaf in the committed tree.
      // Render it as the labelled green "new <type>" chip, same as the first-value draft
      // placeholder, instead of a tiny empty chip (Jason 2026-06-22). The explicit `_ph` draft
      // placeholder already carries `_placeholder` + its label, so leave that one as-is.
      if (!t._placeholder && !t._entityName && (t.value === "" || t.value == null)) {
        t._placeholder = true;
        t._placeholderLabel = `new ${((p && (p.display_name || p.name)) || "value").toLowerCase()}`;
      }
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

// Shift every group-span index >= `at` by +1, in place — called before splicing a line into the
// laid-out `out` at index `at`, so the block-highlight `_groupSpan` pairs stay valid. Open/close
// lines share the same span array object, so bump each unique object once. (oxjob #475.)
function bumpGroupSpans(out, at) {
  const seen = new Set();
  for (const ln of out) {
    const s = ln._groupSpan;
    if (!s || seen.has(s)) continue;
    seen.add(s);
    if (s[0] >= at) s[0] += 1;
    if (s[1] >= at) s[1] += 1;
  }
}

const displayLines = computed(() => {
  if (frozenDisplay.value) return frozenDisplay.value;
  const tree = v2.value;
  // Render from the LOCAL tree (`v2.where`), not the server's `tree.lines` (oxjob #490).
  // `treeToTokens` is the client port of the server's `_flat_tokens` — it produces the SAME
  // inline token stream the server would, but from the tree the builder already mutates in
  // place. So an edit shows the SAME frame (no round-trip): no commit flash, no reorder, no
  // per-keystroke display lag. The server round-trip stays only as a BACKGROUND sync (OQL
  // string + validation + canonicalization); display never waits on it. (charter d37.)
  // We still IGNORE any char-based line breaks and re-derive layout CLIENT-SIDE from the paren
  // structure below (leaf value-bags flow as one viewport-wrapping line).
  // Harvest entity-name `id` segments (`[Harvard University]`) across the whole stream, then
  // enrich and drop the bare id + whitespace-only text tokens. (treeToTokens emits no bare
  // `id` tokens — names ride on the vbrick display/entity — so this is now defensive/no-op.)
  const raw = treeToTokens(tree);
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
  // Re-stamp `tok.addr` (oxjob #494 fix). treeToTokens (the #490 render path) drops the `addr`
  // the server used to put on every token, which silently killed the gutter numbers (lineAddr
  // reads owner.addr) AND the hover breadcrumb (data-addr reads tok.addr). Rebuild it from the
  // tree, token-for-token with the server's addressing (buildAddrById). A group's open/close
  // `paren` carries the group addr; a legacy `groupkw`/`comma` is also stamped (dual-tolerance).
  {
    const { clauseAddr, vleafAddr, groupAddr } = buildAddrById(tree && tree.where);
    flat.forEach((t) => {
      let a;
      if (t.t === "vbrick") {
        if (vleafAddr.has(t.id)) a = vleafAddr.get(t.id);                 // factored value brick
        else if (clauseAddr.has(t.id)) a = t._boolPhrase ? clauseAddr.get(t.id) : `${clauseAddr.get(t.id)}.1`; // boolean / simple-clause value
      } else if (t.t === "col" || t.t === "op") {
        a = clauseAddr.get(t.id);
      } else if (t.t === "groupkw" || t.t === "joinkw" || t.t === "paren" || t.t === "comma") {
        a = groupAddr.get(t.id);                                          // FILTER groups only (value groups/root absent → no addr)
      }
      if (a != null) t.addr = a;
    });
  }
  // layoutLines applies the one invariant: each child GROUP on its own line; bare
  // VALUES flow as one (wrapping) line; a group with no child-groups is just that
  // value-line. Every filter ends up on its own line. (Replaces explodeParens +
  // splitClauses.) Then append local draft lines for incomplete new filters.
  // (oxjob #494: the inline trailing "+" add-value chip is gone — values are added by clicking
  // the gap in the value list. No `addvaluechip` token is injected any more.)
  const out = layoutLines(foldPredicates(flat), { key: "s" });
  // Tag each committed line with the one logical row a band-click selects (#475). (The old
  // per-line +/🗑 affordance was removed 2026-06-17 — the add-value "+" chip is now injected
  // inline above; row delete/add live in the toolbar.)
  out.forEach((line) => {
    line._selectRow = rowTargetForLine(line);
    line._dragNode = dragNodeForLine(line);   // the node a band-grab drags, or null (#475)
    // the top-level sibling row this line belongs to (clause / clause-group id), for the
    // same-type DIM (#475): a line dims when its top row holds no same-type value list. Read
    // off any token that maps into the tree (chrome lines — entity/sort/return — map to none).
    line._topRow = null;
    for (const t of (line.tokens || [])) {
      const tr = treeIndex.value.topRowOf[t.id];
      if (tr != null) { line._topRow = tr; break; }
    }
  });
  // (oxjob #494: the combined `[+)]` add+close-paren block is gone — a close paren is a plain
  // `)` again. Adding into a group is done by clicking the gap on either side of the paren.)
  // Incomplete new filters (drafts) belong INSIDE the root all/any block — render each just
  // before its `)` line, indented one level, so a filter inserted via the root `[+)]` sits among
  // its siblings instead of floating after the close paren (Jason 2026-06-18). With no outer block
  // (0–1 committed filters) they append at the end. Splicing shifts group-span indices, so bump.
  const wroot = v2.value && v2.value.where;
  // locate a group node by id within the where-tree (incl. the implicit root) — for #494 gap drafts
  const findGroupNode = (gid) => {
    let res = null;
    const visit = (n) => { if (res || !n) return; if (n.node === "group") { if (n.id === gid) { res = n; return; } n.children.forEach(visit); } };
    if (wroot) visit(wroot);
    return res;
  };
  // first out-line index whose tokens include any id in a node's subtree
  const firstLineOf = (nodeId) => { const sub = subtreeIdSet(nodeId); return out.findIndex((ln) => (ln.tokens || []).some((t) => t.id && sub.has(t.id))); };
  const rootCloseIdx = () => (wroot && wroot.node === "group")
    ? out.findIndex((ln, i) => ln._groupSpan && ln._groupSpan[1] === i && ln.tokens.some((t) => t.t === "paren" && t.id === wroot.id))
    : -1;
  let lastDraftIdx = -1;
  drafts.value.forEach((d) => {
    const dl = draftLine(d, out);
    let at = -1, depth = 1;
    // a click-the-gap FILTER draft (#494) renders AT its anchor gap, not just before root close
    if (d._anchor) {
      const g = findGroupNode(d._anchor.parentId);
      if (g) {
        const sampleId = (g.children.find((c) => firstLineOf(c.id) >= 0) || {}).id;
        if (sampleId != null) depth = out[firstLineOf(sampleId)]?.depth ?? 1;
        if (d._anchor.index < g.children.length) at = firstLineOf(g.children[d._anchor.index].id);
        else {
          at = out.findIndex((ln, i) => ln._groupSpan && ln._groupSpan[1] === i && ln.tokens.some((t) => t.t === "paren" && t.id === g.id));
          if (at < 0 && sampleId != null) { const ls = firstLineOf(g.children[g.children.length - 1].id); at = ls >= 0 ? ls + 1 : -1; }
        }
      }
    }
    if (at < 0) at = rootCloseIdx();
    if (at >= 0) { dl.depth = depth; bumpGroupSpans(out, at); out.splice(at, 0, dl); lastDraftIdx = at; }
    else { out.push(dl); lastDraftIdx = out.length - 1; }
  });
  // A pending scalar value (committed-tree "New", #472) is ALREADY in the local tree (its
  // edit fn — addValueAfter / addValueAtFront / addSiblingValueAfterGroup — inserted the empty
  // vleaf at the right position), so `treeToTokens` renders it directly: an empty value ⇒ an
  // editable input box (OqlTextChip.showInput), in place, no splice needed. The old transient
  // splice would now DOUBLE-render it. `pendingScalar` is kept only for the focus + blur/Enter
  // lifecycle. (oxjob #490 — was splicePendingScalar, removed with the render-from-tree switch.)
  // exactly one BuilderFieldDialog instance (shared) — on the last draft line if any, else last line.
  const menuIdx = lastDraftIdx >= 0 ? lastDraftIdx : out.length - 1;
  if (menuIdx >= 0) out[menuIdx]._hasFieldMenu = true;
  // Gutter = plain line numbers from 1 (oxjob #507 Phase 4 — replaced the #474/#487
  // decimal tree-address scheme). The column-grid layout emits ONE logical line per row
  // (wrapping is purely visual via flex-wrap), so a straight 1..N count is the gutter; a
  // wrapped line's continuation visual rows get no number (the ::before paints once, at the
  // line's first visual row) — exactly the "blank gutter on continuation" rule.
  out.forEach((line, i) => { line.addr = String(i + 1); });
  return out;
});

// The brick stream for ONE draft clause MINUS its lead-in keyword (col · op ·
// values · entity-picker).
function draftBodyTokens(d) {
  const tokens = [];
  tokens.push(enrichToken({ t: "col", id: d.id, column_id: d.column_id, text: d.column, _draft: true }));
  if (d.column_id && !d.unary) {
    tokens.push(enrichToken({ t: "op", id: d.id, column_id: d.column_id, text: ` ${d.operator} `, _draft: true }));
    if (d.value) {
      const kids = d.value.children;
      const vTok = (v) => enrichToken({ t: "vbrick", id: v.id, column_id: d.column_id,
        value: v.value, display: v.display, negated: v.negated, entity: v.entity, _draft: true });
      // A 2+ value series renders inline with an infix `or`/`&` connector between values
      // (no paren glyphs — oxjob #507 drops parens in the builder view). A single value
      // needs no connector.
      if (kids.length > 1) {
        const join = d.value.join || "or";
        kids.forEach((v, i) => {
          if (i) tokens.push({ t: "conn", id: d.value.id, text: ` ${join} `, label: join, _draft: true });
          tokens.push(vTok(v));
        });
      } else {
        kids.forEach((v) => tokens.push(vTok(v)));
      }
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
  // A draft top-level filter renders as a NEW AND operand in the column grid (oxjob
  // #507): a joining draft leads with a `&` connector CELL in the structural column
  // (`cols`), exactly like a committed AND sibling; the truly-first filter of an empty
  // query instead carries the inert `where` keyword inline (it rides the where line).
  const body = draftBodyTokens(d);
  const cols = joining ? [{ t: "conn", text: " and ", label: "and", _col: true }] : [];
  const tokens = joining ? body : [{ t: "kw", text: " where ", label: "where" }, ...body];
  return { key: `d${d.id}`, cols, depth: cols.length, items: tokens.map((tok) => ({ tok })),
    tokens, _groupSpan: null, _removeId: null, _removeDraftId: d.id, _hasFieldMenu: false };
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
// A SECOND sequence, bumped only by SWAP renders, gating the `v2` reseed independently of
// the emit channel (oxjob #475, Jason 2026-06-19 "local tree stability"). The bug: a single
// counter (`commitSeq`) was bumped by EVERY render — including the `swap:false` debounced
// keystroke render — and `if (seq !== commitSeq) return` bailed the WHOLE render, reseed
// included. So when a keystroke render fired right after a commit/swap (e.g. the trailing
// debounce that was scheduled while typing, resolving after Enter), it invalidated the swap
// render's reseed yet — being swap:false — never reseeded `v2` itself. Result: `v2.where`
// stayed mutated-in-place (the new value) while `v2.lines` (what `displayLines` renders from)
// stayed STALE → the new chip vanished / reverted / jumped. Gating the reseed on its own
// `swapSeq` means only a NEWER SWAP render can supersede a swap's reseed; a later keystroke
// render can't strand the tree.
let swapSeq = 0;
// `commit` = does this render represent a positive SUBMIT gesture that should update
// app state (run the query)? (oxjob #464 Phase 2c, Jason 2026-06-18: "nothing about the
// app state should change when I type arm[adillo] — it should require a positive 'yes, I
// am submitting this' gesture: Enter, dropping a dragged chip, clicking add/change.")
//   commit:true  → Enter / blur-to-finish / add-or-remove a chip or filter / drop a
//                  dragged chip / column (return) change / entity change.
//   commit:false → a KEYSTROKE render (debouncedRender, fired per character by
//                  onValueInput) and the initial empty-query seed: keep the chip
//                  display + OQL string fresh locally, but DON'T run anything.
// Defaults to `swap` (every structural commit is a swap render; keystroke renders are
// non-swap), with explicit overrides where the two diverge (column change = non-swap
// but IS a commit; the mount seed = swap but is NOT a user gesture).
// Every swap render is ID-PRESERVING (oxjob #475 smooth drag-drop / animation). The
// builder has a DUAL representation: `v2Edit` mutates the STRUCTURAL tree
// (`where.children`, drives the OQO) but `displayLines` renders from the SERVER's
// precomputed `tree.lines` token stream — so we can't just keep the local tree (the
// display would go stale). Instead we adopt the server's authoritative render but
// `reconcileTreeIds` carries our STABLE pre-edit ids onto it: survivors of the edit keep
// their id (chip DOM reused → no flicker, and a <TransitionGroup> SLIDES them instead of
// teardown/rebuild), new nodes get a fresh minted id. (#464 EXPLORE "…jarring redraw".)
const renderQuery = async ({ swap, commit = swap, nav = swap ? "push" : "replace" }) => {
  if (suppressCommit) return;
  const local = v2.value;            // pre-render local tree (already mutated by the edit op)
  const oqo = currentOqo();
  const seq = ++commitSeq;
  const mySwap = swap ? ++swapSeq : 0;
  rendering.value = true;
  const data = await store.dispatch("oqlBuilder/renderOqo", oqo);
  // Reseed `v2` from the server's authoritative tree if this is the LATEST swap render —
  // gated by `swapSeq`, NOT `commitSeq`, so a later keystroke (swap:false) render can't
  // invalidate it (see the `swapSeq` note above). A newer SWAP render still supersedes us.
  if (swap && data.oql_render_v2 && mySwap === swapSeq) {
    reconcileTreeIds(data.oql_render_v2, local); // carry stable ids onto the server render
    v2.value = data.oql_render_v2;
    // complete drafts were folded into the OQO above and are now in the tree — drop
    // them. `editing` drafts (a popped-open committed flat clause, via popClauseToDraft)
    // stay local until the user commits (blur clears `editing`), so they survive the swap.
    drafts.value = drafts.value.filter((d) => !edit.draftComplete(d) || d.editing);
    // Don't WIPE selection on the background reseed — selection is GUI state the server sync has
    // no business touching (#490). Just prune any ref whose node no longer exists; survivors keep
    // their (id-stable) selection. So selecting a chip then editing elsewhere KEEPS the selection.
    pruneSelectionToLiveTree();
  }
  // The emit channel (renderedOql / update:oql / update:oqo) keeps the LATEST-render-wins
  // guard: only the newest render of any kind updates the displayed OQL + execution channel.
  if (seq !== commitSeq) return;
  rendering.value = false;
  renderedOql.value = data.oql || "";
  oxurl.value = data.oxurl || "";
  validation.value = data.validation || null;
  lastEmittedOql = renderedOql.value;
  // `update:oql` is the LIVE display channel (the side-by-side view-code editor mirrors
  // it as you type) — always emit it.
  emit("update:oql", renderedOql.value);
  // `update:oqo` is the EXECUTION channel: the host runs the query + projects the URL
  // off it. Emit it ONLY for a genuine submit gesture (`commit`) and ONLY when the query
  // is SETTLED — never while a value is mid-edit. An `editing` draft means a committed
  // clause was popped open to add a value (clicking the "+" on `year is 2020` holds the
  // year clause in an editing draft, so currentOqo is transiently the query MINUS it,
  // bare `works`); suppress until the user commits the new value (Enter/blur clears
  // `editing`), so the half-built state never runs.
  if (commit && !drafts.value.some((d) => d.editing)) {
    emit("update:oqo", { oqo, oql: renderedOql.value, nav });
  }
};
// Keystroke render: keep the display fresh, but NOT a submit — never runs the query.
const debouncedRender = debounce(() => renderQuery({ swap: false, commit: false }), 300);

// Any route change (the SERP dice, a shared link, back/forward) means the query
// we're rendering is no longer the one on screen. Invalidate in-flight renders so
// a late-resolving dispatch can't fire a stale `update:oql` for the OLD query —
// which the SERP auto-run would write over the new URL. Covers navigations that
// DON'T change our `:oql` prop (e.g. the random-query dice → /works?filter=…,
// where seedOql stays put until the translate lands). (oxjob #428 dice bug)
watch(() => route.fullPath, () => { ++commitSeq; ++swapSeq; });

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
// ---- chip dropdown menu (oxjob #475 menus-on-chips pivot) --------------------
// The single builder-level overlay (OqlChipMenu). `chipMenu` = { x, y, items, ctx, heading } |
// null. `ctx` carries what onChipMenuPick needs to dispatch the chosen item's `action`. The
// date value editor (relocated off the old toolbar) is a separate small chip-anchored overlay.
const chipMenu = ref(null);
const dateEditor = ref(null);                 // { x, y, value, tok } | null
const selectionActive = computed(() => selectedIds.value.size > 0);
const isSelected = (tok) => selectedIds.value.has(tok.id);
// The clicked LEADER chip (filter-property `col`, `any/all` join, close `)` paren, or a sole
// boolean-phrase value) — { id, t } | null. Clicking a leader selects ONLY that chip (it paints
// black via OqlBrick `:active`); the clause it acts on shows its scope as a grey band + black
// rails (bline--sel), NOT by blacking out every child chip (Jason 2026-06-19 review #3).
const selectedChip = ref(null);
// An `any(`/`all(` open chip (`joinkw`) and its matching close `)` (`paren`) are ONE thing
// (Jason 2026-06-22): they share the group id, and selecting EITHER paints BOTH black. So a
// join/paren leader matches on id alone (its open + close are the only two group chips with
// that id); any other leader still matches on BOTH id AND type.
const GROUP_CHIP_T = (t) => t === "joinkw" || t === "paren";
const isLeaderSelected = (tok) => {
  const s = selectedChip.value;
  if (!s) return false;
  if (s.id === tok.id && s.t === tok.t) return true;
  return s.id === tok.id && GROUP_CHIP_T(s.t) && GROUP_CHIP_T(tok.t);
};

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

// The all/any chip on each group opens its dropdown menu on click; the any/all radios there
// switch the group's join (the double-click toggle was removed — Jason 2026-06-22). It has no
// selected state of its own; it only paints black when its containing row is selected.

// entity value being RE-PICKED (Enter / menu Edit): its picker opens in REPLACE mode, so the
// pick lands ON this value instead of adding a sibling. (oxjob #428.)
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
// The ROOT clause-group target: the whole `works where all (…)` body. Selectable via the entity
// line OR the outer close paren (Jason 2026-06-18). It's pinned at the top, so its only action is
// INSERT a filter — no move/delete/append. `root:true` flags that in the toolbar. null when the
// body isn't a group (a bare single filter has no outer block to select).
const rootGroupTarget = () => {
  const w = v2.value && v2.value.where;
  if (w && w.node === "group") return { groupId: w.id, clauseId: null, withProperty: false, root: true };
  return null;
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
    const w = v2.value && v2.value.where;
    if (w && w.node === "group" && w.id === G) return rootGroupTarget(); // the outer `)` → root clause
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
  // The entity line (`works where all (`) selects the ROOT clause-group — the whole query body
  // (Jason 2026-06-18). Falls through to null when there's no outer block (a bare single filter).
  if (toks.some((t) => t.t === "kw" && t._entity)) return rootGroupTarget();
  const idx = treeIndex.value;
  const col = toks.find((t) => t.t === "col" && !t._draft && idx.tokenClause[t.id]);
  if (col) return rowForToken(col);
  const paren = toks.find((t) => t.t === "paren");
  if (paren) return rowForToken(paren);
  // Loose value chips on a line with NO property and NO paren of its own: this is a VALUES
  // CONTINUATION line — the values are direct members of a value group that spans several
  // lines (e.g. `apple and pear` inside `(apple and pear and (banana or cherry))`). Such a
  // line is NOT a logical unit, so a click selects just the value chips ON the line — never
  // the whole multi-line filter (Jason 2026-06-17, #475). A bare BOOLEAN-PHRASE clause (its
  // vbrick is the clause's SOLE value — no vgroup) IS a complete clause, so it keeps
  // selecting the whole filter. Returns a `{ values: [...] }` target (vs a row target).
  const vbs = toks.filter((t) => t.t === "vbrick" && !t._draft && idx.tokenClause[t.id]);
  if (vbs.length) {
    const loose = vbs.filter((t) => !idx.sole[t.id]);
    if (loose.length) return { values: loose.map((t) => t.id) };
    const cid = idx.tokenClause[vbs[0].id];
    return { groupId: clauseValueGroupId(cid), clauseId: cid, withProperty: true };
  }
  return null;
};
// Commit a row selection (clears any value / multi selection + open editors first). `chip` is
// the clicked leader chip ({id,t}) whose scope this paints — it alone renders black; pass null
// when no single chip owns the selection.
const selectRowTarget = (r, chip = null) => {
  if (!r) return;
  if (selectedIds.value.size) selectedIds.value = new Set();
  selectionAnchorId.value = null;
  lastSingleId.value = null;
  closeChipMenu();
  editorOpen.value = false; editTextId.value = null; editingEntityId.value = null;
  selectedChip.value = chip ? { id: chip.id, t: chip.t } : null;
  selection.value = { kind: "row", ...r };
};
// Menus-on-chips pivot (Jason 2026-06-19): clicking a logical row BAND does NOTHING — there are
// no row-level actions anymore, and the scope highlight is driven by the clicked CHIP (its menu
// handler paints its clause), not by a selectable "row". So a band click just dismisses any open
// menu + clears a lingering selection ("use it or lose it"). Hover still highlights the row.
// Interactive chips (value / paren / field / join) stopPropagation, so this fires only for clicks
// on the band whitespace, an inert connector, the dot placeholder, or the entity/keyword chips.
const onLineClick = (/* lineIdx, ev */) => {
  if (chipMenu.value || dateEditor.value) { closeChipMenu(); closeDateEditor(); }
  if (selection.value || selectionActive.value) clearSelection();
};
// Double-clicking a row band is a NO-OP (double-click was removed, Jason 2026-06-22). Kept as a
// stub so the band's `@dblclick.stop` (which still usefully blocks native text selection on a
// stray double-click) stays intact.
const onLineDblclick = () => {};

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

// ---- same-type chip selection + row dimming (oxjob #475, Jason 2026-06-17) ----
// "You can only select chips of the same type." A value selection — a single value, or a
// #472 multi-set — carries ONE chipType; selecting/dragging a chip of a different type is
// disallowed. To make that visible, the moment a value chip is selected (or a chip drag
// starts) we DIM + DISABLE every filter row that doesn't hold a same-type value list, so the
// only live drop targets are the ones a dragged chip could actually land in.
// `valueDragIds`/`valueDragType` are set while a chip reorder is in flight (below).
const valueDragIds = ref(new Set());
const valueDragType = ref(null);
// An id is a VALUE (vleaf) — not a whole-filter `col` id — when its clause id differs from
// itself (a clause/col id maps to itself in tokenClause). Lets selectionValueType ignore the
// #472 whole-filter selection mode (those aren't value chips → no value-type dimming).
const isValueId = (id) => {
  const cid = treeIndex.value.tokenClause[id];
  return cid != null && cid !== id;
};
const selectionValueType = computed(() => {
  if (selection.value?.kind === "value") return chipTypeForValueId(selection.value.id);
  const ids = [...selectedIds.value];
  if (ids.length && ids.every(isValueId)) return chipTypeForValueId(ids[0]);
  return null;
});
// A multi-select modifier (Cmd/Ctrl for toggle, Shift for range) is currently held down.
// Updated on every key down/up so the dim tracks the live modifier state; reset on window blur
// so a key released while the window is unfocused doesn't leave it stuck on.
const multiSelectKeyHeld = ref(false);
const onModifierKey = (e) => { multiSelectKeyHeld.value = !!(e.metaKey || e.ctrlKey || e.shiftKey); };
const onModifierBlur = () => { multiSelectKeyHeld.value = false; };
// The type driving the dim. We dim incompatible rows ONLY in the two cases where the user is
// committing to a same-type operation (Jason 2026-06-17, #475 follow-up — a plain single chip
// selection must NOT dim, that was too aggressive):
//   • a live chip DRAG (valueDragType — wins; it can start on an unselected chip), or
//   • a multi-select modifier is HELD over a value selection (so the user can see which chips a
//     Cmd/Shift-click could join the current selection). Null ⇒ nothing dims.
const activeValueType = computed(() => {
  if (valueDragType.value) return valueDragType.value;
  if (multiSelectKeyHeld.value) return selectionValueType.value;
  return null;
});
// The TOP-LEVEL sibling rows (clause / clause-group ids) that DON'T contain a value list of
// the active type → their lines dim. A clause is a match when its column's chipType matches
// AND it actually has a value (a value list or a sole value to promote into).
const dimmedTopRows = computed(() => {
  const type = activeValueType.value;
  if (!type) return null;
  const subtreeMatches = (n) => {
    if (!n) return false;
    // a clause is a drop target when it's the same type AND holds a value — either a value
    // list/leaf (`value`) OR a simple clause's scalar (`leaf`, the single-value shape).
    if (n.node === "clause") return (n.value != null || n.leaf != null) && chipTypeForColumn(n.column_id) === type;
    if (n.node === "group") return n.children.some(subtreeMatches);
    return false;
  };
  const w = v2.value && v2.value.where;
  const tops = w ? (w.node === "group" && w.implicit ? w.children : [w]) : [];
  const dim = new Set();
  tops.forEach((c) => { if (!subtreeMatches(c)) dim.add(c.id); });
  return dim;
});
const isDimmedLine = (idx) => {
  const dr = dimmedTopRows.value;
  if (!dr) return false;
  const tr = displayLines.value[idx]?._topRow;
  return tr != null && dr.has(tr);
};

// The value kind of a selected row's clause/group (entity/text/number/boolean/date/…), or
// null for a standalone clause-group of filters (no column). Drives `canAdd` — only
// multi-value kinds (entity/text/number) accept the Value / Sibling add actions, matching
// the inline "+" chips. (oxjob #475.)
const rowGroupKind = (r) => {
  if (!r) return null;
  const idx = treeIndex.value;
  const cid = (r.groupId != null && idx.tokenColumn[r.groupId])
    || (r.clauseId != null && idx.tokenColumn[r.clauseId]) || null;
  return cid ? valueKindForProperty(properties.value[cid]) : null;
};
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
// What the current selection is made of, for the menu's wording ("values" vs "filters"). Keyed
// off CONTENT (every id an expr node, not a value), not groupability — so a non-sibling filter
// set (delete-only, wrap disabled) still reads "filters" (oxjob #475, Jason 2026-06-22).
const selectionKind = computed(() => {
  const ids = [...selectedIds.value];
  return ids.length && ids.every((id) => !isValueId(id)) ? "filters" : "values";
});
// Nothing selected (no single value, no row, no multi-select) → the toolbar's left section is
// just "Add filter", so the clear-query trashcan rides alongside it. (oxjob #475.)

const clearSelection = () => {
  if (selectedIds.value.size) selectedIds.value = new Set();
  selectionAnchorId.value = null;
  lastSingleId.value = null;
  selectedChip.value = null;
  closeChipMenu();
  closeDateEditor();
  clearActive();
};

// ---- unified multi-select across VALUES and whole FILTERS/CLAUSES (oxjob #475, Jason 2026-06-22)
// A selection is HOMOGENEOUS by type: value chips group by value-kind (author vs text — you can't
// mix), and whole expressions (a filter or an any/all subclause) are all one "filter" type; the
// two never mix. A leader chip (filter-property `col`, any/all `joinkw`, close `)`) contributes
// the EXPR-NODE id it represents — the owning clause for a filter / value-group join, the group id
// for a subclause. `groupableFilters`/`removeNodes` already accept those ids (and a mix of a plain
// filter + a sibling subclause), so wrap + delete + Backspace all work once they're in selectedIds.
const selectionTypeOf = (id) => (isValueId(id) ? `v:${chipTypeForValueId(id)}` : "filter");
// The expr-node id a structural leader chip selects as a whole unit, or null when it isn't a
// selectable expression (the implicit ROOT group — the whole query body — can't be multi-selected).
const exprIdForLeader = (tok) => {
  const r = rowForToken(tok.t === "joinkw" ? { t: "paren", id: tok.id } : tok);
  if (!r || r.root) return null;
  return r.clauseId != null ? r.clauseId : r.groupId;   // the clause (a filter) or the subclause group
};
// Toggle one id (a value OR a whole expression) into the multi-selection, enforcing the
// same-type constraint. Seeds an empty set with the last single-selected unit (if type-compatible)
// so "click A, then Cmd-click B" yields {A, B}. Pops the multi menu at ≥2, closes it below.
const toggleSelection = (id, el) => {
  if (id == null) return;
  clearActive();
  selectedChip.value = null;
  const set = new Set(selectedIds.value);
  if (set.size === 0 && lastSingleId.value != null && lastSingleId.value !== id
      && selectionTypeOf(lastSingleId.value) === selectionTypeOf(id)) set.add(lastSingleId.value);
  const curType = set.size ? selectionTypeOf([...set][0]) : null;
  if (set.has(id)) set.delete(id);
  else { if (curType != null && selectionTypeOf(id) !== curType) return; set.add(id); }
  selectionAnchorId.value = id;
  lastSingleId.value = null;
  selectedIds.value = set;
  if (set.size >= 2) openMultiSelectMenu(el); else closeChipMenu();
};

// Every structural node id currently live in the tree (committed where + drafts) — the id
// space selection is allowed to point into. (oxjob #490 identity ownership.)
const liveNodeIds = () => {
  const ids = new Set();
  const walkVal = (v) => { if (!v) return; ids.add(v.id); if (v.node === "vgroup") (v.children || []).forEach(walkVal); };
  const walkExpr = (n) => {
    if (!n) return;
    ids.add(n.id);
    if (n.node === "clause") walkVal(n.value);
    else (n.children || []).forEach(walkExpr);
  };
  if (v2.value && v2.value.where) walkExpr(v2.value.where);
  drafts.value.forEach((d) => { ids.add(d.id); walkVal(d.value); });
  return ids;
};

// PRUNE selection to nodes that still exist — instead of wiping it wholesale on every server
// sync. Selection is pure GUI state; a background commit/render should never drop it (oxjob
// #490). reconcileTreeIds keeps a surviving node's id stable across the reseed, so a selected
// chip stays selected when you edit something ELSE; only a node that genuinely went away
// (deleted, or restructured away by server canonicalization) loses its selection. Once
// canonicalization moves client-side (#496) there's no reseed to prune against at all.
const pruneSelectionToLiveTree = () => {
  const live = liveNodeIds();
  if (selectedIds.value.size) {
    const kept = new Set([...selectedIds.value].filter((id) => live.has(id)));
    if (kept.size !== selectedIds.value.size) selectedIds.value = kept;
  }
  if (selectionAnchorId.value && !live.has(selectionAnchorId.value)) selectionAnchorId.value = null;
  if (lastSingleId.value && !live.has(lastSingleId.value)) lastSingleId.value = null;
  if (selectedChip.value && !live.has(selectedChip.value)) selectedChip.value = null;
  const sel = selection.value;
  if (sel) {
    const id = sel.kind === "value" ? sel.id : (sel.clauseId || sel.groupId);
    if (id && !live.has(id)) clearActive();
  }
};

// A click that touches the selection — emitted ONLY by VALUE chips now (structural chips are
// inert; a band click selects the row via onLineClick). mode "single" (plain click — select
// THIS value + surface its toolbar actions; re-click deselects; also seeds a later Cmd-click
// extension); "toggle" (Cmd/Ctrl); "range" (Shift, from the anchor in document order). Reassign
// a fresh Set so the reactive `.has()`/`.size` reads update.
const onChipSelect = ({ id, mode, el }) => {
  if (mode === "single") {
    // Clicking the SAME value chip whose menu is already open toggles it closed (Jason 2026-06-22).
    const ownerId = `value:${id}`;
    if (menuOpenFor(ownerId)) { closeChipMenu(); return; }
    // A sole BOOLEAN-PHRASE value IS its whole filter — its name+value live on one chip, so it
    // opens the filter-property (boolean) menu (Not / delete) and paints the
    // whole one-chip filter, not a value menu. (oxjob #475.)
    const vt = findValueTok(id);
    if (vt && vt._boolPhrase && treeIndex.value.sole[id]) {
      const cid = treeIndex.value.tokenClause[id];
      const target = { groupId: clauseValueGroupId(cid), clauseId: cid, withProperty: true };
      selectRowTarget(target, vt);
      openMenuAt(el, filterPropMenu({ boolean: true, negated: !!vt.negated }),
        { kind: "filterprop", clauseId: cid, tokId: id }, "", ownerId);
      return;
    }
    lastSingleId.value = id;
    selectedChip.value = null;
    selection.value = { kind: "value", id };
    editorOpen.value = false;
    editTextId.value = null;
    editingEntityId.value = null;
    // open this value chip's dropdown menu, anchored at the chip.
    if (el) openMenuAt(el, valueMenu({ negated: !!vt?.negated, canNegate: vt?._kind !== "boolean" }),
      { kind: "value", tokId: id }, "", ownerId);
    if (selectedIds.value.size) selectedIds.value = new Set(); // single replaces any multi
    selectionAnchorId.value = null;
    return;
  }
  if (!id) return;
  // A sole BOOLEAN-PHRASE chip is a whole FILTER (its name+value share one chip) — a multi gesture
  // on it selects the FILTER (its clause), so it wraps/deletes alongside other filter-property +
  // any/all selections instead of joining a value-bag. (oxjob #475, Jason 2026-06-22.)
  const bvt = findValueTok(id);
  if (bvt && bvt._boolPhrase && treeIndex.value.sole[id]) {
    toggleSelection(treeIndex.value.tokenClause[id], el);
    return;
  }
  // a multi gesture supersedes the single highlight
  clearActive();
  const set = new Set(selectedIds.value);
  // Seed an empty selection with the last plain-clicked chip so "click banana, then Cmd-click
  // cherry" yields {banana, cherry} even though banana wasn't modifier-clicked (Jason). Only seed
  // when type-compatible — a value selection must NOT pull in a filter `lastSingleId` (a structural
  // leader chip now records its expr id there too). (oxjob #475, Jason 2026-06-22.)
  if (set.size === 0 && lastSingleId.value && lastSingleId.value !== id
      && selectionTypeOf(lastSingleId.value) === selectionTypeOf(id)) set.add(lastSingleId.value);
  // SAME-TYPE CONSTRAINT (oxjob #475, Jason 2026-06-17): a selection holds chips of ONE type.
  // The type is fixed by whatever's already selected (or the incoming chip when the set is
  // empty); a chip of a different type can't join it. crossType ⇒ ignore the ADD (a toggle
  // that REMOVES is always fine). Cross-type rows are dimmed/disabled too, so this is mostly a
  // backstop — but it also keeps a Shift-range from sweeping in other-type values in between.
  const curType = set.size ? chipTypeForValueId([...set][0]) : null;
  const incType = isValueId(id) ? chipTypeForValueId(id) : null;
  const crossType = curType != null && incType != null && incType !== curType;
  if (mode === "range") {
    if (crossType) return;
    const rangeType = curType || incType;
    const anchor = selectionAnchorId.value || lastSingleId.value;
    const order = selectableOrder.value;
    const a = order.indexOf(anchor), b = order.indexOf(id);
    if (a >= 0 && b >= 0) {
      const [lo, hi] = a < b ? [a, b] : [b, a];
      // only sweep in SAME-TYPE value chips — skip col ids / other-type values in the span.
      for (let i = lo; i <= hi; i++) {
        const oid = order[i];
        if (isValueId(oid) && chipTypeForValueId(oid) === rangeType) set.add(oid);
      }
    } else set.add(id);
    selectionAnchorId.value = id;
  } else {
    if (set.has(id)) set.delete(id);
    else { if (crossType) return; set.add(id); }
    selectionAnchorId.value = id;
  }
  selectedIds.value = set;
  // Ephemeral: a multi-selection exists ONLY to surface the batch menu. As soon as ≥2 chips
  // are selected, pop the multi-select menu over the just-clicked chip; below 2 close it.
  if (set.size >= 2) openMultiSelectMenu(el);
  else closeChipMenu();
};

// ---- chip dropdown menu open / dispatch (oxjob #475 menus-on-chips pivot) -----
// Anchor coordinates just below `el`. Store COORDINATES (not the element): a DOM node in a
// reactive ref becomes a Vue proxy, mishandled by overlay positioning.
const anchorXY = (el) => {
  const r = el.getBoundingClientRect();
  // No layout box (the anchor span detached because its chip switched into edit mode between the
  // scheduled open and now, or it's display:none) → signal "don't open" rather than paint the
  // menu at screen (0,0), the top-left stray-menu symptom. (oxjob #493 Bug 1.)
  if (!r.width && !r.height) return null;
  return { x: r.left, y: r.bottom + 4 };
};
const closeChipMenu = () => { cancelPendingMenuOpen(); chipMenu.value = null; };
const closeDateEditor = () => { dateEditor.value = null; };

// Single-click opens a chip's dropdown IMMEDIATELY (Jason 2026-06-22: double-click was removed,
// so there's no second click to disambiguate — the old ~220ms debounce just added lag). Nothing
// is deferred anymore, so cancelPendingMenuOpen (still called from a few cleanup paths) is a
// harmless no-op kept to avoid churning those call sites.
let pendingMenuOpen = null;
const cancelPendingMenuOpen = () => {
  if (pendingMenuOpen) { clearTimeout(pendingMenuOpen); pendingMenuOpen = null; }
};
// Open the menu `items` anchored under `el`, carrying `ctx` for the pick dispatcher. `ownerId`
// identifies the chip the menu belongs to, so a click on that SAME chip toggles the menu closed.
const openMenuAt = (el, items, ctx, heading = "", ownerId = null) => {
  if (!el || !el.getBoundingClientRect || !items || !items.length) return;
  const xy = anchorXY(el);
  if (!xy) return;                      // anchor has no layout box → don't paint at (0,0) (#493)
  closeDateEditor();
  chipMenu.value = { x: xy.x, y: xy.y, items, ctx, heading, ownerId };
};
// True when the dropdown is already open FOR this chip — a click on it should toggle it closed
// (Jason 2026-06-22: "clicking a chip whose menu is open closes the menu").
const menuOpenFor = (ownerId) => !!(chipMenu.value && ownerId != null && chipMenu.value.ownerId === ownerId);
// The multi-selection (≥2 chips) menu, anchored on the just-clicked chip.
const openMultiSelectMenu = (el) => {
  cancelPendingMenuOpen();
  const items = multiSelectMenu({ kind: selectionKind.value, canWrap: canSubclause.value });
  const n = selectedIds.value.size;
  openMenuAt(el, items, { kind: "multi" },
    `${n} ${selectionKind.value === "filters" ? "filter" : "value"}${n === 1 ? "" : "s"} selected`);
};
// The value chips' @batch-menu intent (a plain click on an already-multi-selected chip) →
// re-anchor the unified multi-select overlay.
const onBatchMenu = (el) => openMultiSelectMenu(el);

// "all"/"any" for a join chip (mirrors OqlJoinChip's own label logic).
const joinLabelOf = (tok) => {
  const t = (tok.text || "").replace(/\(/g, "").trim().toLowerCase();
  if (t === "all" || t === "any") return t;
  return (tok.label || "and") === "or" ? "any" : "all";
};
// Which join-menu variant a join chip leads: the implicit root group, a value group (leads
// values), or a clause-group subclause (leads whole filters).
const joinVariantOf = (tok) => {
  const w = v2.value && v2.value.where;
  if (w && w.node === "group" && w.id === tok.id) return "root";
  return treeIndex.value.tokenClause[tok.id] != null ? "value" : "clause";
};
// The current join ("all"/"any") of a group, by its id — read off the tree (the infix `(`/`)`
// parens carry no join label of their own, so both of a group's parens resolve it from the
// node). Falls back to a legacy `joinkw` chip's label if one is in the stream (dual-tolerance).
const joinOfGroup = (groupId) => {
  const w = v2.value && v2.value.where;
  let node = null;
  if (w && w.node === "group" && w.id === groupId) node = w;
  else { const hit = edit.locate(v2.value, groupId, drafts.value); node = hit && hit.node; }
  if (node && node.join) return node.join === "or" ? "any" : "all";
  for (const ln of displayLines.value)
    for (const t of (ln.tokens || [])) if (t.t === "joinkw" && t.id === groupId) return joinLabelOf(t);
  return "all";
};
// Resolve the dropdown descriptor (items + dispatch ctx) for a STRUCTURAL chip token.
const chipDescriptorFor = (tok) => {
  if (tok.t === "joinkw") {
    const join = joinLabelOf(tok), variant = joinVariantOf(tok);
    return { items: joinMenu({ join, variant }), ctx: { kind: "join", tokId: tok.id, join, variant } };
  }
  if (tok.t === "col") {
    // Search filters get a scope re-point (title / title-abstract / full text); numeric/range
    // filters get a predicate re-pick (≥ / = / ≤); other fields get neither. (The two are
    // mutually exclusive — a search column is never numeric.)
    const col = treeIndex.value.tokenColumn[tok.id];
    const searchScopes = searchFieldSiblings(properties.value, col);
    // tok._ops (set by foldPredicates) = the field's available non-unary numeric ops; only a
    // true range field carries ≥/≤. Offer the curated three, flag the current one.
    const hasRange = (tok._ops || []).some((o) => o.op === ">=" || o.op === "<=");
    const operators = hasRange
      ? NUMERIC_OPS.filter((o) => (tok._ops || []).some((x) => x.op === o.op))
          .map((o) => ({ ...o, on: o.op === tok._predicateRaw }))
      : [];
    return { items: filterPropMenu({ boolean: false, searchScopes, operators }), ctx: { kind: "filterprop", clauseId: tok.id } };
  }
  if (tok.t === "paren") {
    // A group's `(` and `)` are the SAME unit (Jason 2026-06-22): give them the IDENTICAL join
    // menu and dispatch. The infix parens carry no join label, so read the current join off the
    // tree (joinOfGroup); the variant is keyed on the id, so it works off the paren directly.
    const join = joinOfGroup(tok.id);
    const variant = joinVariantOf(tok);
    return { items: joinMenu({ join, variant }), ctx: { kind: "join", tokId: tok.id, join, variant } };
  }
  return null;
};
// Single-click a structural chip → open its dropdown menu + paint its clause's scope highlight.
// Clicking the SAME chip again (its menu already open) toggles it closed (Jason 2026-06-22).
// Cmd/Ctrl-click instead folds this chip's whole FILTER/CLAUSE into the multi-selection (the
// structural analog of value multi-select, so Cmd-click works on filter-property and any/all
// chips too — Jason 2026-06-22). Cmd-click is the only multi-select gesture (oxjob #501).
const onChipMenu = (tok, el, ev) => {
  const exprId = exprIdForLeader(tok);
  const wantsMulti = !!(ev && (ev.metaKey || ev.ctrlKey));
  if (exprId != null && wantsMulti) {
    toggleSelection(exprId, el);
    return;
  }
  const d = chipDescriptorFor(tok);
  if (!d) return;
  const ownerId = `${tok.t}:${tok.id}`;
  if (menuOpenFor(ownerId)) { closeChipMenu(); clearSelection(); return; }
  const r = rowForToken(tok.t === "joinkw" ? { t: "paren", id: tok.id } : tok);
  if (r) selectRowTarget(r, tok); else clearSelection();
  // Seed a later Cmd-click extension with this leader's expr id (selectRowTarget cleared
  // lastSingleId, so set it after).
  lastSingleId.value = exprId;
  openMenuAt(el, d.items, d.ctx, "", ownerId);
};

// Add a value INTO a clause (its value group, or promote a sole value to a series).
const addValueToClause = (clauseId) => {
  const gid = clauseValueGroupId(clauseId);
  if (gid != null && addValueToGroup(gid)) return;
  const tok = clauseSoleValueTok(clauseId);
  if (tok) onChipAdd(tok);
};
const setJoinTo = (tokId, current, target) => {
  if (current === target) return;
  edit.toggleJoin(v2.value, tokId, drafts.value);
  renderQuery({ swap: true });
};
// Connector-as-unit editing (oxjob #507 Phase 3): clicking a structural connector cell
// (`&`/`or` in the column grid) flips the join of the group it leads. The cell carries
// that group's id (the root group's id for a top-level connector). Canonical OQL groups
// are single-join, so flipping the group join flips every connector in it together —
// e.g. `a and b and c` → `a or b or c`. (A precedence-splitting edit on a SINGLE middle
// connector — `a or b or c`, flip the middle `or`→`and` → `a or (b and c)` — is the
// harder follow-up; flipping the whole group is the predictable rev-1 behavior.)
const onConnCellClick = (cell) => {
  if (!cell || cell.id == null) return;
  edit.toggleJoin(v2.value, cell.id, drafts.value);
  renderQuery({ swap: true });
};
// Open the date calendar overlay for a date value, anchored where its menu was.
const openDateEditor = (tok) => {
  const xy = chipMenu.value ? { x: chipMenu.value.x, y: chipMenu.value.y } : { x: 0, y: 0 };
  const v = String(tok.value != null ? tok.value : (tok.display != null ? tok.display : tok.text || "")).trim();
  closeChipMenu();
  dateEditor.value = { ...xy, value: v, tok };
};
const onDateEditorPick = (iso) => {
  const tok = dateEditor.value?.tok;
  closeDateEditor();
  if (tok) pickDate(tok, iso);
};
// Edit a VALUE by its kind: entity re-picks, date opens the calendar, text/number edits inline.
const editValue = (tok) => {
  if (!tok) return;
  if (tok._kind === "entity") { selection.value = { kind: "value", id: tok.id }; onEditEntity(tok); return; }
  if (tok._kind === "date") { openDateEditor(tok); return; }
  editTextId.value = tok.id;
};

// Run the action of a chosen menu item, using the open menu's ctx for the target node.
const dispatchMenuAction = (item) => {
  const ctx = chipMenu.value?.ctx || {};
  const action = item.action;
  const valTok = () => (ctx.tokId != null ? findValueTok(ctx.tokId) : null);
  switch (action) {
    // ---- value chip --------------------------------------------------------
    case "edit": editValue(valTok()); break;
    case "toggle-neg": { const t = valTok(); if (t) onToggleNeg(t); break; }
    case "delete-value": { const t = valTok(); if (t) onRemoveValue(t); break; }
    // ---- filter-property chip ---------------------------------------------
    // (oxjob #494: "add value" removed — values are added via the click-the-gap affordance)
    case "delete-filter": removeRow(ctx.clauseId); break;
    // re-point a search filter to a different surface (title / title-abstract / full text),
    // keeping the typed values (edit.setColumn re-bases each value's .search suffix).
    case "repoint-search":
      if (ctx.clauseId != null && item.columnId) {
        edit.setColumn(v2.value, ctx.clauseId, item.columnId, drafts.value);
        renderQuery({ swap: true });
      }
      break;
    // change a numeric filter's comparison predicate (≥ / = / ≤), keeping the typed value.
    case "set-operator":
      if (ctx.clauseId != null && item.op) {
        edit.setOperator(v2.value, ctx.clauseId, { op: item.op, unary: false }, drafts.value);
        renderQuery({ swap: true });
      }
      break;
    // ---- join (all/any) chip ----------------------------------------------
    case "set-join-any": setJoinTo(ctx.tokId, ctx.join, "any"); break;
    case "set-join-all": setJoinTo(ctx.tokId, ctx.join, "all"); break;
    // (oxjob #494: join-chip / close-paren "add value"/"add filter"/"insert before-after" removed —
    // adding is done by clicking the gap on either side of the chip / paren.)
    case "clear-query": clearQuery(); break;
    case "delete-clause": removeRow(ctx.groupId != null ? ctx.groupId : ctx.tokId); break;
    // ---- multi-select menu -------------------------------------------------
    case "wrap-subclause": onAddToSubclause(); break;
    case "unselect-all": clearSelection(); break;
    case "delete-selected": onDeleteSelected(); break;
    default: break;
  }
  closeChipMenu();
};
const onChipMenuPick = (item) => dispatchMenuAction(item);

// The selection is ephemeral: a click anywhere that isn't a value chip or the batch menu
// itself dismisses it (the user "uses it or loses it"). Clicks ON a chip are left to the
// chip's own handler (Cmd-extend / re-anchor / clear-and-act); clicks IN the menu run the
// batch action. Also drops a stale anchor when you click into empty space.
const onDocClick = (e) => {
  const t = e.target;
  const onChip = t?.closest?.(".val-chip");
  const onMenu = t?.closest?.(".chip-menu-overlay") || t?.closest?.(".date-editor-overlay");
  // The open chip menu / date editor closes on ANY click outside the menu/editor itself —
  // including the toolbar and other overlays (Jason 2026-06-19: "clicking *anywhere* should
  // close the menu"). Only a click INSIDE the menu/editor (which acts on it) is exempt.
  if (!onMenu) { cancelPendingMenuOpen(); closeChipMenu(); closeDateEditor(); }
  // Selection-clear keeps the softer exemptions: a click on a chip, the toolbar, or another
  // Vuetify overlay (field dialog / entity picker) leaves any live selection intact. (Band
  // clicks `.bline` stopPropagation, so this only fires for clicks OUTSIDE the lines.)
  const onToolbar = t?.closest?.(".builder-toolbar");
  const onOverlay = t?.closest?.(".v-overlay__content");
  if (onChip || onMenu || onToolbar || onOverlay) return;
  // Outside everything: clear any selection too.
  lastSingleId.value = null;
  if (selection.value) clearActive();
  if (selectionActive.value) clearSelection();
};

const onDeleteSelected = () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  closeChipMenu();
  clearSelection();
  edit.removeNodes(v2.value, ids, drafts.value);
  renderQuery({ swap: true });
};

const onAddToSubclause = () => {
  const ids = [...selectedIds.value];
  closeChipMenu();
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
  cancelPendingMenuOpen();
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
// Row-selection toolbar (oxjob #428): "use AND/use OR" toggle, numeric operator chooser,
// and delete-row. All target the currently-selected logical row, not a single chip.
// Delete: a whole filter (property selected) removes the clause; otherwise just the
// selected group (an inner value bag, or a standalone clause group).
const onRowSelectionDelete = () => {
  const r = selectedRow.value; if (!r || r.root) return; // the root clause-group can't be deleted
  removeRow(r.withProperty && r.clauseId != null ? r.clauseId : r.groupId);
};
// The clause's lone value brick (a single-value filter like `year is 2020`), so the row
// "Value" action can promote it to a group (`(2020 or …)`). (oxjob #475.)
const clauseSoleValueTok = (cid) => {
  if (cid == null) return null;
  const idx = treeIndex.value;
  for (const line of displayLines.value)
    for (const t of line.tokens)
      if (t.t === "vbrick" && !t._draft && idx.tokenClause[t.id] === cid) return t;
  return null;
};
// Row "Value" (Enter): add another value INSIDE the selected row's clause — same as the inline
// green "+". A leaf bag adds a value after its last (inside the parens); a block value-group
// adds a member; a single-value filter promotes to a group. (oxjob #475.)
// Insert a value into the value-group `gid`: a block group gains a sibling member; a leaf bag
// adds a value after its last (inside the parens); a single value promotes to a group. Shared by
// the row "Insert" action and the `[+)]` close block. (oxjob #475.)
const addValueToGroup = (gid) => {
  const idx = treeIndex.value;
  if (gid == null || !idx.valueGroupInfo[gid]) return false;
  const { kind, lastChildId } = idx.valueGroupInfo[gid];
  if (idx.valueGroupInfo[lastChildId]) { addSiblingValueToGroup(lastChildId, kind); return true; }
  const tok = findValueTok(lastChildId);
  if (tok) onChipAdd(tok);
  return true;
};
const onRowAddValueInside = () => {
  const r = selectedRow.value; if (!r) return;
  if (r.root) { addRootFilter(); return; } // root clause-group → insert a new top-level filter
  if (addValueToGroup(r.groupId)) return;  // a value group → insert a member
  const tok = clauseSoleValueTok(r.clauseId); // single-value clause → promote to a group
  if (tok) onChipAdd(tok);
};
// Row "Sibling" (Cmd/Ctrl+Enter): add a sibling right after the selected row — a value in the
// group's parent (the value that drops on the next row, outside the parens), or a new top-level
// filter when the row has no enclosing value group. (oxjob #475.)
const onRowAddSibling = () => {
  const r = selectedRow.value; if (!r) return;
  if (r.groupId != null && addSiblingValueToGroup(r.groupId, rowGroupKind(r))) return;
  addRootFilter();
};
// Single-chip toolbar actions — `activeTok` is always a VALUE now (structural selection is the
// row toolbar above). So Delete removes the value; Negate / Edit (bool/date popover, entity
// re-pick, text in-place) act on it.
const onActiveDelete = () => { const t = activeTok.value; if (t) onRemoveValue(t); };
// "Sibling" toolbar button on a selected value chip = the chip's Cmd/Ctrl+Enter (add a value
// right after it). (oxjob #475.)

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
// The field dialog now offers the curated `facetConfigs.js` keys (oxjob #505).
// A handful of curated keys are GUI-side aliases that drifted from the server
// `/properties` key the leaf-builder (pickField → properties[key]) needs; bridge
// them here. Most keys line up 1:1, so this map stays tiny.
const OQL_FIELD_KEY_ALIASES = {
  "primary_location.source.publisher_lineage": "primary_location.source.host_organization_lineage",
  "institutions.is_global_south": "authorships.institutions.is_global_south",
};
const onFieldDialogSelect = (key) => {
  if (fieldDialogTok) pickField(fieldDialogTok, OQL_FIELD_KEY_ALIASES[key] || key);
};

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

// ---- values -----------------------------------------------------------------
const onValueInput = (tok, e) => {
  edit.setValue(v2.value, tok.id, e.target.value, { numeric: tok._numeric }, drafts.value);
  debouncedRender();
};
const onValueKeydown = (tok, e) => {
  if (e.key === "Backspace" && tok.negated && e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    edit.toggleNeg(v2.value, tok.id, drafts.value); e.preventDefault(); afterEdit(tok); return;
  }
  if (e.key !== "Enter") return;
  // Enter = FINISH this value: commit it and land the keyboard on the resulting chip.
  // Cmd/Ctrl+Enter (oxjob #475) = save AND add a sibling chip right after.
  // We settle the post-commit UI state SYNCHRONOUSLY, the instant Enter is pressed — NOT in a
  // server-render callback. With render-from-tree (#490) the value is already committed in the
  // local tree under a STABLE id (`tok.id`, preserved across the background reseed by
  // reconcileTreeIds + the id-keyed v-for), so there's no need to await the round-trip and
  // re-find the chip by text. Doing it sync is what keeps the new chip in ONE state from the
  // millisecond Enter lands instead of bouncing as background renders resolve (Jason 2026-06-20:
  // "whichever state it's in, it should be that state the millisecond I hit Enter and stay there").
  // Both a draft value AND a pending committed value (nested "New", #472) take this path; only the
  // pre-commit cleanup differs (clear the draft's `editing` flag vs. clear pendingScalar).
  const sibling = e.metaKey || e.ctrlKey;
  e.preventDefault();
  if (sibling) e.stopPropagation(); // keep Cmd+Enter off the builder-level run-query shortcut
  const pending = pendingScalar.value && tok.id === pendingScalar.value.id;
  if (tok._draft || pending) {
    if (pending) pendingScalar.value = null;
    else { const d = draftOwning(tok.id); if (d) { d.editing = false; if (!sibling) anchorDraftIfReady(d); } }
    // The new chip is born in its FINAL state right here, synchronously: a plain committed value
    // — NOT focused/selected (so it reads as a normal teal chip the instant Enter lands and stays
    // that way; the `.val-chip:focus` style is the same black as `.selected`, so the old
    // post-round-trip `chip.focus()` made it bounce teal→black→teal as background renders
    // resolved — Jason 2026-06-20). We deliberately do NOT focus it: focus would survive the
    // reseed for a committed-tree "New" (stable id) but NOT for a folded draft (reconcile mints a
    // fresh id), so leaving it unfocused is the one state that's stable on BOTH paths.
    // Cmd/Ctrl+Enter still chains: commit this value + open a fresh sibling box (which focuses the
    // NEW empty input — where you're about to type — not the chip just committed).
    if (sibling) onChipAdd(tok);
    renderQuery({ swap: true });        // background sync only (OQL string / validation / canonicalize)
  } else {
    // A COMMITTED scalar value chip re-edited in place (double-click / toolbar "Edit" → type →
    // Enter — NOT a draft, NOT the transient pendingScalar box). Without this branch the edit was
    // silently lost (oxjob #493 Bug 2): every keystroke writes the tree via onValueInput, but
    // Enter sets `closingViaEnter` in the chip which suppresses the blur-commit, so renderQuery
    // never fired — the server render didn't run, the OQL string mirror + validation went stale,
    // and a not-yet-flushed debounced render could be dropped. Re-assert the value onto its leaf
    // (idempotent for the typed-input path; also covers a programmatic edit that didn't emit
    // `input`), then run the background swap render to commit + sync.
    edit.setValue(v2.value, tok.id, e.target.value, { numeric: tok._numeric }, drafts.value);
    if (sibling) onChipAdd(tok);        // Cmd/Ctrl+Enter still chains a sibling value after it
    renderQuery({ swap: true });
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
      if (d) { d.editing = false; anchorDraftIfReady(d); } // commit: fold into the query on the swap
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
    renderQuery({ swap: true }).finally(() => { frozenDisplay.value = null; });
    return;
  }
  edit.removeNode(v2.value, tok.id, drafts.value);
  afterEdit(tok);
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
const onZoneDragover = (e) => {
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  activeSlot.value = null; // hide the row drop-line while the cursor is over the trash
};
const onZoneDrop = () => {
  zoneHot.value = false;
  const id = chipDrag.draggingId.value;
  const kind = chipDrag.draggingKind.value;
  // Claim the drop so the chip's / row's dragend outside-rect fallback skips it (no double-remove).
  chipDrag.draggingId.value = null;
  if (!id) return;
  // A whole logical ROW dropped on the trash (oxjob #475): remove the node + re-render.
  if (kind === "row") {
    edit.removeNode(v2.value, id, drafts.value);
    clearSelection();
    renderQuery({ swap: true });
    return;
  }
  // A MULTI value-chip drag dropped on the trash (oxjob #475): delete the whole dragged set.
  if (valueDragIds.value.size > 1) {
    const removed = [...valueDragIds.value];
    clearSelection();
    edit.removeNodes(v2.value, removed, drafts.value);
    renderQuery({ swap: true });
    return;
  }
  const tok = findValueTok(id);
  if (tok) onRemoveValue(tok);
  else { edit.removeNode(v2.value, id, drafts.value); renderQuery({ swap: true }); }
};

// ---- drag-to-reorder logical ROWS (oxjob #475) ------------------------------
// Grab any non-chip / non-button part of a row band → drag the whole logical row (and its
// block of wrapped/child lines) to a new position AMONG ITS SIBLINGS, or onto the trash
// zone to delete it. Two kinds, two target sets:
//   • filter (a clause / standalone clause-group): drops between any sibling rows of ANY
//     clause-list — the implicit top-level group OR any parenthesized clause-group
//     (cross-level allowed). Never inside a value list.
//   • value-bag (a nested value vgroup with its own parens): drops between sibling values
//     of any OTHER value list of the SAME value kind. Never into a clause list.
// Drops only ever land BETWEEN two sibling rows — never inside a row, even one that
// line-wraps (the slots are computed strictly at sibling-block boundaries). The move
// mutates the v2 tree (edit.moveNode); the server re-canonicalizes joins / parens / the
// first-sibling dot, so order is all we set. Reuses the native-DnD + useChipDrag +
// delete-zone machinery the value chips use.
const draggingRange = ref(null);  // [minLine, maxLine] of the block being dragged (→ dim it)
const dropSlots = ref([]);        // valid insertion points, computed once at dragstart
const activeSlot = ref(null);     // the slot nearest the cursor (renders the heavy line)
let rowDragId = null;             // id of the node being dragged
// value-CHIP drag slots (oxjob #475) — declared here (before onLinesDragover reads them); the
// handlers + geometry live in the "drag-to-reorder value CHIPS" section below.
const valueDropSlots = ref([]);    // {parentId, index, x, y, h} vertical insertion points
const activeValueSlot = ref(null); // the slot nearest the cursor (renders the vertical bar)

// The tree node a band-grab on this line drags, or null when the line isn't a draggable
// row (the `works where` entity line, a loose-values continuation line, a draft line).
const dragNodeForLine = (line) => {
  const t = line && line._selectRow;
  if (!t || t.values) return null;
  if (t.clauseId != null) return { id: t.clauseId, kind: "filter" };   // a whole filter
  if (t.groupId != null) {
    const isValueGroup = treeIndex.value.tokenClause[t.groupId] != null;
    return { id: t.groupId, kind: isValueGroup ? "valuebag" : "filter" };
  }
  return null;
};

// Every id in a node's subtree (the node + all descendants).
const subtreeIdSet = (nodeId) => {
  const hit = edit.locate(v2.value, nodeId, drafts.value);
  const set = new Set();
  const visit = (n) => {
    if (!n) return;
    set.add(n.id);
    if (n.node === "group") n.children.forEach(visit);
    else if (n.node === "clause" && n.value) visit(n.value);
    else if (n.node === "vgroup") n.children.forEach(visit);
  };
  visit(hit && hit.node);
  return set;
};

// Build the valid drop slots for a drag. Geometry comes from the rendered `.bline` rects
// (the trash overlay is absolute, so it doesn't reflow the lines we're measuring).
const computeRowDrag = (dn) => {
  const lines = displayLines.value;
  const lineIds = lines.map((ln) => new Set((ln.tokens || []).map((t) => t.id).filter(Boolean)));
  const host = linesEl.value;
  const hostTop = host ? host.getBoundingClientRect().top : 0;
  const blineEls = host ? Array.from(host.querySelectorAll(".bline")) : [];
  const topOf = (i) => (blineEls[i] ? blineEls[i].getBoundingClientRect().top - hostTop : 0);
  const botOf = (i) => (blineEls[i] ? blineEls[i].getBoundingClientRect().bottom - hostTop : 0);
  // a node's [minLine, maxLine] span over the display lines
  const spanOf = (nodeId) => {
    const sub = subtreeIdSet(nodeId);
    let lo = -1, hi = -1;
    lines.forEach((ln, i) => {
      for (const id of sub) { if (lineIds[i].has(id)) { if (lo < 0) lo = i; hi = i; return; } }
    });
    return lo < 0 ? null : [lo, hi];
  };
  draggingRange.value = spanOf(dn.id);

  const draggedSub = subtreeIdSet(dn.id);
  const draggedKind = treeIndex.value.valueGroupInfo[dn.id]?.kind; // value-bags only
  // candidate containers: clause-lists (groups) for a filter, same-kind value-lists
  // (vgroups) for a value-bag — never the dragged node itself or anything inside it.
  const containers = [];
  const collect = (n) => {
    if (!n) return;
    if (n.node === "group") {
      if (dn.kind === "filter" && n.id !== dn.id && !draggedSub.has(n.id)) containers.push(n);
      n.children.forEach(collect);
    } else if (n.node === "clause") {
      if (n.value) collect(n.value);
    } else if (n.node === "vgroup") {
      if (dn.kind === "valuebag" && n.id !== dn.id && !draggedSub.has(n.id)
          && treeIndex.value.valueGroupInfo[n.id]?.kind === draggedKind) containers.push(n);
      n.children.forEach(collect);
    }
  };
  collect(v2.value && v2.value.where);

  const slots = [];
  containers.forEach((c) => {
    const kids = c.children
      .map((ch, originalIdx) => ({ ch, originalIdx, span: spanOf(ch.id) }))
      .filter((k) => k.span)
      .sort((a, b) => a.span[0] - b.span[0]);
    if (!kids.length) return;
    const draggedHere = kids.findIndex((k) => k.ch.id === dn.id); // -1 when not this parent
    for (let k = 0; k <= kids.length; k++) {
      // KEEP the slot at the dragged node's own position (k === draggedHere) so the user can drop
      // the row back where they picked it up to CANCEL the drag (Jason 2026-06-19 review #3 — "I
      // should be able to drop it back where I picked it up"). moveNode to the same index is a
      // clean no-op. Only the redundant slot just AFTER the dragged node is skipped.
      if (draggedHere >= 0 && k === draggedHere + 1) continue;
      // the child-array index to insert before (maps back to c.children order)
      const index = k < kids.length ? kids[k].originalIdx : c.children.length;
      // gap pixel (relative to host) + the depth to indent the heavy line under
      let top, depth;
      if (k === 0) { top = topOf(kids[0].span[0]); depth = lines[kids[0].span[0]]?.depth ?? 0; }
      else if (k === kids.length) { top = botOf(kids[k - 1].span[1]); depth = lines[kids[k - 1].span[0]]?.depth ?? 0; }
      else { top = (botOf(kids[k - 1].span[1]) + topOf(kids[k].span[0])) / 2; depth = lines[kids[k].span[0]]?.depth ?? 0; }
      slots.push({ parentId: c.id, index, top, depth });
    }
  });
  dropSlots.value = slots;
};

const onRowDragstart = (line, e) => {
  // The drag source is now the row's left-margin grab handle (`.row-grab`) ONLY — the band itself
  // is no longer draggable (Jason 2026-06-19 review #3). This guard is a belt-and-suspenders bail
  // in case a future interactive child becomes a drag source (value chip / button / input).
  if (e.target.closest(".val-chip, .add-value-chip, button, a, input, .v-btn, .v-input")) return;
  const dn = dragNodeForLine(line);
  if (!dn) return;
  rowDragId = dn.id;
  chipDrag.begin(dn.id, "row");
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", "oql-row"); } catch (_) { /* noop */ }
  }
  computeRowDrag(dn);
};

// While dragging over the lines area, light up the slot nearest the cursor. Handles BOTH a
// ROW drag (horizontal slot, nearest by Y) and a VALUE-CHIP drag (vertical slot between chips,
// nearest by 2D distance since chips wrap). preventDefault is what makes the lines a valid drop
// target — done for whichever drag is live so the cursor shows "move".
const onLinesDragover = (e) => {
  const kind = chipDrag.draggingKind.value;
  if (kind === "value" && valueDropSlots.value.length) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const host = linesEl.value;
    const hostRect = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
    const x = e.clientX - hostRect.left, y = e.clientY - hostRect.top;
    let best = null, bestD = Infinity;
    for (const s of valueDropSlots.value) {
      const d = Math.hypot(s.x - x, (s.y + s.h / 2) - y);
      if (d < bestD) { bestD = d; best = s; }
    }
    activeValueSlot.value = best;
    return;
  }
  if (kind !== "row" || !dropSlots.value.length) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const host = linesEl.value;
  const rel = e.clientY - (host ? host.getBoundingClientRect().top : 0);
  let best = null, bestD = Infinity;
  for (const s of dropSlots.value) {
    const d = Math.abs(s.top - rel);
    if (d < bestD) { bestD = d; best = s; }
  }
  activeSlot.value = best;
};

const onLinesDrop = () => {
  if (chipDrag.draggingKind.value === "value") { onValueDrop(); return; }
  const s = activeSlot.value;
  const id = rowDragId;
  if (!s || !id) { clearRowDrag(); return; }
  // claim the drop so the dragend outside-rect fallback skips it
  chipDrag.draggingId.value = null;
  const before = JSON.stringify(v2.value);   // snapshot for a defensive revert
  const moved = edit.moveNode(v2.value, id, s.parentId, s.index, drafts.value);
  clearRowDrag();
  if (!moved) return;
  clearSelection();
  // the swap render is id-preserving (renderQuery → reconcileTreeIds), so the moved row
  // SLIDES to its new slot instead of snapping. The snapshot revert below is smooth too.
  renderQuery({ swap: true }).then(() => {
    if (validation.value && validation.value.valid === false) {
      v2.value = JSON.parse(before);          // incompatible move slipped the type filter
      renderQuery({ swap: true });
      store.commit("snackbar", "Can’t move there");
    }
    // (no "Row moved" toast — the slide animation makes the move self-evident, Jason 2026-06-18)
  });
};

const clearRowDrag = () => { draggingRange.value = null; dropSlots.value = []; activeSlot.value = null; rowDragId = null; };

// dragend fires whether the drop was consumed, fell on the trash, or was released into empty
// space. Mirror the value chip's forgiving "release fully OUTSIDE the builder → delete" path.
const onRowDragend = (e) => {
  const consumed = chipDrag.draggingId.value == null;
  const root = builderRootEl.value;
  chipDrag.end();
  if (!consumed && root && rowDragId && e && (e.clientX || e.clientY)) {
    const r = root.getBoundingClientRect();
    const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (outside) {
      edit.removeNode(v2.value, rowDragId, drafts.value);
      clearSelection();
      renderQuery({ swap: true });
      store.commit("snackbar", "Row deleted");
    }
  }
  clearRowDrag();
};

// Is this display line part of the block currently being dragged? (→ dim it.)
const isDraggingLine = (lineIdx) =>
  !!draggingRange.value && lineIdx >= draggingRange.value[0] && lineIdx <= draggingRange.value[1];

// ---- drag-to-reorder value CHIPS (oxjob #475, Jason 2026-06-17) --------------
// "You make your selection, then drag the chips." This is the REVERSE of dragging rows: the
// drop target is a VERTICAL line on a chip's margin — between two chips, or at the start/end of
// a value list. You can only carry chips of ONE type, so the only live targets are the
// same-type value lists (other rows are dimmed). The dragged values re-land in the target list
// at the slot, adopting that list's join (conjunction is the list's property, not the chip's).
//
// We hook the drag at the `.builder-lines` container (a value chip's native `dragstart` bubbles
// up to it AFTER the chip's own handler) — so no per-chip plumbing: read the grabbed chip off
// `e.target`, resolve the dragged SET (the whole selection if the chip is in it, else just that
// chip), set the "N values" drag image, and compute the vertical slots. Dragover/drop run on the
// same container (onLinesDragover/onLinesDrop) the row drag uses, routed by `draggingKind`.
// (`valueDropSlots` / `activeValueSlot` are declared up by the row-drag refs.)
const onLinesDragstart = (e) => {
  const chipEl = e.target.closest?.(".val-chip");
  if (!chipEl) return;                       // not a value-chip drag (a row band grab → ignore)
  const id = chipEl.getAttribute("data-vid");
  if (!id || !valueIsDraggable(id)) return;  // booleans/dates etc. don't reorder
  // the dragged set: the whole selection when the grabbed chip is part of it, else just it.
  let ids;
  if (selectedIds.value.has(id)) ids = [...selectedIds.value];
  else if (selection.value?.kind === "value" && selection.value.id === id) ids = [id];
  else ids = [id];
  // all dragged chips must be the same type (the selection already guarantees this; a lone
  // unselected chip is trivially uniform) — fix the drag type for the dim + slot filter.
  valueDragIds.value = new Set(ids);
  valueDragType.value = chipTypeForValueId(id);
  // custom drag image: a solid-black "N values" chip (matches the selected-chip look).
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    const ghost = document.createElement("div");
    ghost.textContent = `${ids.length} value${ids.length === 1 ? "" : "s"}`;
    // self-contained styling — the ghost lives on <body>, outside `.builder`, so it can't
    // inherit the chip CSS vars; match the selected-chip look (solid black) inline.
    ghost.style.cssText = "position:absolute;top:-1000px;left:-1000px;height:26px;display:inline-flex;"
      + "align-items:center;padding:0 10px;border-radius:4px;background:#1a1a1a;color:#fff;"
      + "font-size:0.8125rem;font-weight:600;white-space:nowrap;font-family:inherit;";
    document.body.appendChild(ghost);
    try { e.dataTransfer.setDragImage(ghost, 12, 13); } catch (_) { /* noop */ }
    setTimeout(() => ghost.remove(), 0);
  }
  nextTick(() => computeValueSlots());
};

// Build the vertical drop slots: for every SAME-TYPE value list (each eligible vgroup, plus a
// single-value clause we'd PROMOTE), a slot on the left margin of each chip + one after the
// last. Slots flanking a dragged chip in its OWN list are no-ops, so they're skipped. Geometry
// comes from the rendered chips' rects (data-vid), relative to the lines host.
const computeValueSlots = () => {
  const host = linesEl.value;
  const type = valueDragType.value;
  if (!host || !type) { valueDropSlots.value = []; return; }
  const hostRect = host.getBoundingClientRect();
  const dragged = valueDragIds.value;
  const slots = [];
  const rectOf = (vid) => { const el = host.querySelector(`[data-vid="${vid}"]`); return el ? el.getBoundingClientRect() : null; };
  // emit slots for a list of in-order chips (each {vid, idx} where idx = its position among the
  // PARENT's children). parentId is the move target (a vgroup id, or a clause id to promote).
  const pushList = (parentId, chips, childCount) => {
    chips.forEach((c, k) => {
      const r = rectOf(c.vid);
      if (!r) return;
      const before = chips[k - 1];
      // KEEP the gap on the LEFT margin of a dragged chip so the user can drop the chip back where
      // they picked it up to CANCEL the drag (Jason 2026-06-19 review #3 — "the same should apply
      // for chips"). moveValues back to that slot is a no-op. Only the gap right AFTER a dragged
      // chip is skipped (it would duplicate the next chip's left gap / sit inside the dragged set).
      if (before && dragged.has(before.vid)) return;
      slots.push({ parentId, index: c.idx, x: r.left - hostRect.left - 5, y: r.top - hostRect.top, h: r.height });
    });
    // trailing slot after the last chip (unless the last chip is being dragged).
    const last = chips[chips.length - 1];
    const r = last && rectOf(last.vid);
    if (r && !dragged.has(last.vid)) {
      slots.push({ parentId, index: childCount, x: r.right - hostRect.left + 5, y: r.top - hostRect.top, h: r.height });
    }
  };
  const visitVgroup = (vg) => {
    const chips = [];
    vg.children.forEach((ch, idx) => { if (ch.node === "vleaf") chips.push({ vid: ch.id, idx }); });
    if (chips.length) pushList(vg.id, chips, vg.children.length);
    vg.children.forEach((ch) => { if (ch.node === "vgroup") visitVgroup(ch); });
  };
  const visitClause = (c) => {
    if (chipTypeForColumn(c.column_id) !== type) return;
    if (c.value && c.value.node === "vgroup") visitVgroup(c.value);
    else if (c.value && c.value.node === "vleaf") pushList(c.id, [{ vid: c.value.id, idx: 0 }], 1); // promote-on-drop
    else if (c.leaf) pushList(c.id, [{ vid: c.id, idx: 0 }], 1); // simple clause: chip data-vid === clause id
  };
  const visitExpr = (n) => {
    if (n.node === "clause") visitClause(n);
    else if (n.node === "group") n.children.forEach(visitExpr);
  };
  const w = v2.value && v2.value.where;
  if (w) { (w.node === "group" && w.implicit) ? w.children.forEach(visitExpr) : visitExpr(w); }
  valueDropSlots.value = slots;
};

const onValueDrop = () => {
  const s = activeValueSlot.value;
  const ids = [...valueDragIds.value];
  if (!s || !ids.length) { clearValueDrag(); return; }
  chipDrag.draggingId.value = null;          // claim the drop (skip the dragend delete fallback)
  const before = JSON.stringify(v2.value);
  const moved = edit.moveValues(v2.value, ids, s.parentId, s.index, drafts.value);
  clearValueDrag();
  if (!moved) return;
  clearSelection();
  // id-preserving swap (renderQuery → reconcileTreeIds): moved value chips keep their ids.
  renderQuery({ swap: true }).then(() => {
    if (validation.value && validation.value.valid === false) {
      v2.value = JSON.parse(before);
      renderQuery({ swap: true });
      store.commit("snackbar", "Can’t move there");
    }
    // (no "Value moved" toast — the slide animation makes the move self-evident, Jason 2026-06-18)
  });
};

// A value-chip drag ended. The chip's own onDragend (useChipShortcuts) still owns the
// release-OUTSIDE-the-builder delete; here we just clear the reorder state + the dim. (A drop
// consumed by onValueDrop / onZoneDrop already nulled draggingId, so no double-handling.)
const clearValueDrag = () => { valueDropSlots.value = []; activeValueSlot.value = null; valueDragIds.value = new Set(); valueDragType.value = null; };
watch(chipDragging, (on) => { if (!on) clearValueDrag(); });

// ---- click-the-gap insertion (oxjob #494) -----------------------------------
// Direct-manipulation insert: hovering a GAP (between/around chips, or between/around
// filters) lights a single thick vertical line; clicking it drops a new value or filter
// at exactly that spot and opens its editor. This REPLACES the old menu/inline
// insert-after / add-value / add-filter affordances. The line is an absolute overlay
// (`.gap-indicator`) inside the position:relative `.builder-lines`, so it NEVER reflows
// the chips. Two slot kinds:
//   • value  — between the members of a value-list (a vgroup, or a single-value clause we
//              promote). Geometry from the chip rects (data-vid).  → insertValueAt.
//   • filter — between the children of a group (incl. the implicit root). A new filter is
//              its own stacked line, so the caret sits at the LEFT indent of where it lands
//              (a child's first line, or the group's close line for the end slot). Geometry
//              via the .bline rects + node→line span (same mapping computeRowDrag uses).
// Exclusions fall out of the walk: no slot left of the entity chip (root-start = before the
// first child, after `works where`), and none outside the root (we emit nothing before the
// root open or after the root close).
const gapSlots = ref([]);          // all insertion slots, with geometry
const activeGapSlot = ref(null);   // the single lit slot (cursor inside its hit strip), or null
const CHIP_H = 26;

const computeGapSlots = () => {
  const host = linesEl.value;
  const root = v2.value && v2.value.where;
  // NB: we no longer bail when there's no committed `where` — an empty query (`works`) still
  // gets the after-entity-chip "start a query" insert point (#6, below). Only `host` is required.
  if (!host) { gapSlots.value = []; return; }
  const hostRect = host.getBoundingClientRect();
  const lines = displayLines.value;
  const blineEls = Array.from(host.querySelectorAll(".bline"));
  const lineIds = lines.map((ln) => new Set((ln.tokens || []).map((t) => t.id).filter(Boolean)));
  const topOf = (i) => (blineEls[i] ? blineEls[i].getBoundingClientRect().top - hostRect.top : 0);
  // a node's [minLine, maxLine] span over the display lines (same as computeRowDrag's spanOf)
  const spanOf = (nodeId) => {
    const sub = subtreeIdSet(nodeId);
    // The IMPLICIT root group isn't locatable by id (edit.locate() walks only its CHILDREN),
    // so subtreeIdSet returns ∅ for it — but its own `all(` / `)` tokens DO carry its id on the
    // open + close lines. Seed the set with the node's own id so the root's span (and therefore
    // its inside-start/inside-end filter slots) resolves. A no-op for every locatable node.
    sub.add(nodeId);
    let lo = -1, hi = -1;
    lines.forEach((ln, i) => { for (const id of sub) { if (lineIds[i].has(id)) { if (lo < 0) lo = i; hi = i; return; } } });
    return lo < 0 ? null : [lo, hi];
  };
  // left content-edge (x, host-relative) of a display line = min left of its rendered chips
  const leftOf = (i) => {
    const el = blineEls[i]; if (!el) return 0;
    let min = Infinity;
    el.querySelectorAll(".bl-body *").forEach((c) => { const r = c.getBoundingClientRect(); if (r.width > 0 && r.left - hostRect.left < min) min = r.left - hostRect.left; });
    return min === Infinity ? 0 : min;
  };
  // right content-edge (x, host-relative) of a display line = max right of its rendered chips
  const rightOf = (i) => {
    const el = blineEls[i]; if (!el) return 0;
    let max = -Infinity;
    el.querySelectorAll(".bl-body *").forEach((c) => { const r = c.getBoundingClientRect(); if (r.width > 0 && r.right - hostRect.left > max) max = r.right - hostRect.left; });
    return max === -Infinity ? 0 : max;
  };
  // {x:right, y:top} of the LAST rendered chip token on a bline — the close `)` (or last value) that
  // ends the child. We anchor the after-child gap to it so the `+` sits beside the real close paren,
  // wherever it lands: on the final wrapped row of an inline value-group (`any(...)` inside `all(...)`),
  // or at the right end of a single-row clause. Taking the last `.bl-tok` chip in DOM order is robust
  // to BOTH — and avoids the trap of scanning `.bl-body *` for a "lowest row": a join-chip's inner
  // spans (`jc-kw`/`jc-paren`) render a few px BELOW the real chip row (baseline), so a max-`top` scan
  // mistakes them for a lower row and lands the slot mid-line at the `any(` instead of the `)`.
  // (Jason 2026-06-22: missing `+` after `language is any(…)` / `type is any(…)` close parens.)
  const lastRowRightEdge = (i) => {
    const el = blineEls[i]; if (!el) return null;
    const toks = el.querySelectorAll(".bl-tok");
    for (let k = toks.length - 1; k >= 0; k--) {
      const c = toks[k].firstElementChild || toks[k];
      const r = c.getBoundingClientRect();
      if (r.width > 0) return { x: r.right - hostRect.left, y: r.top - hostRect.top };
    }
    return null;
  };
  // A child's first line may LEAD with a connector/placeholder block: the inert `·` dot on the
  // first member (`.lead-dot`), or the `and`/`or` connector on every later one (`.conn-chip`).
  // The child's left-edge slot (below) puts a `+` to the LEFT of that block; this returns the
  // point just to its RIGHT (between the lead block and the clause body) so a conjunction/dot
  // block is insertable from BOTH sides, like every other block (Jason 2026-06-23). null when
  // the line has no lead block. The first `.lead-dot`/`.conn-chip` in DOM order IS the lead one
  // (it's prepended/leads the line) — an inline value-group `&` on the same line comes after it.
  const leadChipGap = (i) => {
    const el = blineEls[i]; if (!el) return null;
    const lead = el.querySelector(".lead-dot, .conn-chip");
    if (!lead) return null;
    const lr = lead.getBoundingClientRect();
    if (!(lr.width > 0)) return null;
    // left edge of the first chip to the lead's RIGHT on the same visual row → centre the gap there
    let nextLeft = Infinity;
    el.querySelectorAll(".bl-body *").forEach((c) => {
      const r = c.getBoundingClientRect();
      if (r.width > 0 && r.left >= lr.right - 1 && Math.abs(r.top - lr.top) <= ROW_TOL && r.left < nextLeft) nextLeft = r.left;
    });
    const x = (nextLeft === Infinity ? lr.right + EDGE_OFF : (lr.right + nextLeft) / 2) - hostRect.left;
    return { x, y: lr.top - hostRect.top, h: lr.height };
  };
  const elFor = (vid) => host.querySelector(`[data-vid="${CSS.escape(vid)}"]`);
  const rectOf = (vid) => { const el = elFor(vid); return el ? el.getBoundingClientRect() : null; };
  // The rendered rect of the chip in the bl-tok wrapper adjacent to a value chip — used to CENTER
  // the start/end insertion cursor in the real gap (e.g. between the `any(`/`all(` join chip and the
  // first value), not just offset from the value. The bl-tok wrapper is display:contents (zero box),
  // so measure its inner chip element. dir = -1 (left neighbour) / +1 (right neighbour).
  const neighborEdge = (vid, dir) => {
    const el = elFor(vid); if (!el) return null;
    let w = el.closest(".bl-tok") || el;
    while ((w = dir < 0 ? w.previousElementSibling : w.nextElementSibling)) {
      const c = w.firstElementChild || w;
      const r = c.getBoundingClientRect();
      if (r.width > 0) return dir < 0 ? r.right : r.left;
    }
    return null;
  };
  const slots = [];
  const EDGE_OFF = 6;  // nudge an edge marker just outside the block edge, into the gap whitespace
  const ROW_TOL = 6;   // value chips on the same visual row share a `top` within this many px

  // ---- "start a query" slot at the RIGHT EDGE of the entity chip (#6, Jason 2026-06-22) ----
  // Echoing the add-a-second-value affordance: hovering the right edge of the `works` chip gives a
  // "+" to start building. It shows ONLY while there's no explicit root joining clause — i.e. no
  // rendered root `all(`/`any(` chip. That chip renders only when the implicit root group holds 2+
  // filters; an empty query (where=null OR an EMPTY implicit group) and a lone-clause query both
  // render no root join, so the slot shows. With 2+ filters the group's own inside-START slot (just
  // right of `any(`) takes over, so we suppress this one to avoid a duplicate.
  const hasRootGroupChip = !!(root && root.node === "group" && (root.children || []).length >= 2);
  if (!hasRootGroupChip) {
    const ec = host.querySelector(".entity-chip");
    if (ec) {
      const r = ec.getBoundingClientRect();
      if (r.width || r.height)
        slots.push({ kind: "rootfilter", x: r.right - hostRect.left + EDGE_OFF, y: r.top - hostRect.top, h: r.height });
    }
  }

  // ---- VALUE slots: one per gap of every multi-value value-list ----
  const valueKindOf = (col) => (chipTypeForColumn(col) || "").split(":")[0];
  const pushValueList = (parentId, col, chips, childCount) => {
    if (!["entity", "text", "number"].includes(valueKindOf(col))) return; // booleans/dates: single-value
    const rects = chips.map((c) => rectOf(c.vid));
    chips.forEach((c, k) => {
      const r = rects[k]; if (!r) return;
      const prev = k > 0 ? rects[k - 1] : null;
      if (prev && Math.abs(prev.top - r.top) > ROW_TOL) {
        // WRAP: the list flowed onto a new visual row between chip k-1 and k. A single midpoint
        // would land mid-row (chip k-1 is far-right on the row above), so emit TWO cursors with
        // the SAME insert index — one at the START of this (new) row, one at the END of the upper
        // row — so a wrapped chip gets a `+` on BOTH sides (Jason 2026-06-21, #4/#5).
        slots.push({ kind: "value", parentId, index: c.idx, x: r.left - hostRect.left - EDGE_OFF, y: r.top - hostRect.top, h: r.height });
        slots.push({ kind: "value", parentId, index: c.idx, x: prev.right - hostRect.left + EDGE_OFF, y: prev.top - hostRect.top, h: prev.height });
        return;
      }
      // same row (or first chip): centre the cursor in the gap to the chip's LEFT — between the
      // previous value (mid-list) or the left neighbour chip (the join `any(`/`all(` or the
      // property chip) for the first value.
      const leftEdge = prev ? prev.right : neighborEdge(c.vid, -1);
      const x = leftEdge != null ? (leftEdge + r.left) / 2 - hostRect.left : r.left - hostRect.left - 5;
      slots.push({ kind: "value", parentId, index: c.idx, x, y: r.top - hostRect.top, h: r.height });
    });
    const last = chips[chips.length - 1]; const lr = last && rects[chips.length - 1];
    if (lr) {
      // end slot: centre in the gap to the right (before the close `)` when present).
      const rightEdge = neighborEdge(last.vid, 1);
      const x = rightEdge != null ? (lr.right + rightEdge) / 2 - hostRect.left : lr.right - hostRect.left + 5;
      slots.push({ kind: "value", parentId, index: childCount, x, y: lr.top - hostRect.top, h: lr.height });
    }
  };
  const visitVgroup = (vg, col) => {
    // A value-group whose members are themselves value-groups (e.g. `all( any(...), any(...) )`)
    // renders one member per line, like a filter list — so its gaps come from the line SPANS
    // (inside-start after `all(`, between/around each `any(...)`, inside-end before the close `)`),
    // NOT from chip rects. A flat value-group uses the chip-rect cursors above. (Jason 2026-06-21,
    // #2/#3/#6/#7.) A value insert at one of these (insertValueAt on the vgroup) drops a new bare
    // value as a sibling of the sub-groups.
    if (vg.children.some((ch) => ch.node === "vgroup")) pushListSlots(vg, "value");
    else {
      const chips = []; vg.children.forEach((ch, idx) => { if (ch.node === "vleaf") chips.push({ vid: ch.id, idx }); });
      if (chips.length) pushValueList(vg.id, col, chips, vg.children.length);
    }
    vg.children.forEach((ch) => { if (ch.node === "vgroup") visitVgroup(ch, col); });
  };
  const visitClauseValues = (c) => {
    if (c.value && c.value.node === "vgroup") visitVgroup(c.value, c.column_id);
    else if (c.value && c.value.node === "vleaf") pushValueList(c.id, c.column_id, [{ vid: c.value.id, idx: 0 }], 1);
    else if (c.leaf) pushValueList(c.id, c.column_id, [{ vid: c.id, idx: 0 }], 1); // simple clause: chip data-vid === clause id
  };

  // ---- LIST slots: one per gap of a child-list, by line SPAN ----
  // Drives BOTH the filter-list of every group (incl. the implicit root) AND a NESTED value-group
  // (`all( any(...), any(...) )`) whose members render one-per-line. A slot exists at every gap
  // between siblings + both ends of the list, and EACH gap is reachable from BOTH flanking edges
  // (Jason 2026-06-20): the right edge of the block before it AND the left edge of the block after
  // it (or the paren on the open/close end). So every block edge and every paren side gets a `+`.
  // The two edges of one gap carry the SAME insertion index — redundant affordances, exactly what
  // Jason asked for ("both give me the same affordance").
  //
  // Index semantics: slot.index = the position the new member takes among node.children.
  //   left-of-child-k / right-of-open  → index k / 0   (insert BEFORE child k / as first)
  //   right-of-child-k / left-of-close → index k+1 / n (insert AFTER child k / as last)
  // The "right of a child GROUP's close paren" is just that child's right edge (index k+1 in the
  // PARENT) — i.e. a sibling after the whole group — so it falls out for free. The one gap we
  // deliberately DON'T emit is to the right of the ROOT group's own close paren (outside root): we
  // only ever emit child edges, never node's own outer-right, so a 2+-child root gets no "insert
  // outside root" point. (A lone top-level filter has no group wrapper, so this walk doesn't run
  // for it — that path stays the toolbar's Add-filter.)
  const pushListSlots = (node, kind) => {
    const spans = node.children.map((ch) => spanOf(ch.id));
    if (!spans.some(Boolean)) return;
    const gspan = spanOf(node.id);
    // Does this group render PARENS (an open `(` line + a lone `)` close line)? Mirror the renderer:
    // treeToTokens parenthesizes a group iff `node.paren`, so the BARE root (a top-level `a or b`,
    // `paren:false`) has no `(`/`)` lines even though its id spans both child rows — gate on `paren`
    // so we don't anchor inside-START/END to the children's own rows (Jason 2026-06-23). A real
    // nested group has `paren:true` AND a multi-line span.
    const hasParens = !!node.paren && gspan && gspan[0] !== gspan[1];
    // inside-START: just right of the open `(` — so a first member can be inserted even when the
    // open paren ends its line (the join chip is the open line's last chip).
    if (hasParens) slots.push({ kind, parentId: node.id, index: 0, x: rightOf(gspan[0]) + EDGE_OFF, y: topOf(gspan[0]), h: CHIP_H });
    node.children.forEach((ch, k) => {
      const sp = spans[k]; if (!sp) return;
      // LEFT edge of child k's first line → insert BEFORE it. For a child GROUP this is the left
      // side of its all/any block (lit even when the block starts a line).
      slots.push({ kind, parentId: node.id, index: k, x: leftOf(sp[0]) - EDGE_OFF, y: topOf(sp[0]), h: CHIP_H });
      // RIGHT of the line's lead conjunction/dot block → the SAME insert (index k), so the `·`/`and`/`or`
      // block carries a `+` on both sides (Jason 2026-06-23). null for lines with no lead block.
      const lg = leadChipGap(sp[0]);
      if (lg) slots.push({ kind, parentId: node.id, index: k, x: lg.x, y: lg.y, h: lg.h });
      // RIGHT edge of child k's last line → insert AFTER it. For a child GROUP this last line is
      // its close `)`, so this is the "right of the close paren" = a sibling after the group. Use the
      // wrap-aware lowest-row edge so a nested INLINE-wrapped value-group (`any(...)`) lights beside
      // its actual `)` on the final wrapped row, not at the block's top-right.
      const re = lastRowRightEdge(sp[1]) || { x: rightOf(sp[1]), y: topOf(sp[1]) };
      slots.push({ kind, parentId: node.id, index: k + 1, x: re.x + EDGE_OFF, y: re.y, h: CHIP_H });
    });
    // inside-END: just left of the close `)` — so a lone close-paren line lights on its LEFT
    // (append into this list as the last member). Mirrors inside-START.
    if (hasParens) slots.push({ kind, parentId: node.id, index: node.children.length, x: leftOf(gspan[1]) - EDGE_OFF, y: topOf(gspan[1]), h: CHIP_H });
  };

  const visitExpr = (n) => {
    if (!n) return;
    if (n.node === "clause") { visitClauseValues(n); }
    else if (n.node === "group") { pushListSlots(n, "filter"); n.children.forEach(visitExpr); }
  };
  if (root) visitExpr(root);
  gapSlots.value = slots;
};

// The "+"-circle marker is GAP_D px across (Jason 2026-06-20). Its HIT zone is a strip centred on
// the gap: ±radius wide (so it reaches `radius` into each flanking chip — at least as wide as the
// circle) and the FULL height of the flanking chips. Cursor inside a strip → that gap lights;
// outside every strip → nothing (so deep-whitespace clicks still select the row). Keep the geometry
// here so the value-vs-filter seam stays a one-function tweak.
const GAP_D = 22;                 // circle diameter
const GAP_R = GAP_D / 2;          // strip half-width = circle radius
const pickGapAt = (x, y) => {
  let best = null, bestD = Infinity;
  for (const s of gapSlots.value) {
    if (x < s.x - GAP_R || x > s.x + GAP_R) continue;   // within the strip's width
    if (y < s.y || y > s.y + s.h) continue;             // within the flanking chips' vertical span
    const d = Math.abs(s.x - x);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
};

const clearGap = () => { activeGapSlot.value = null; gapSlots.value = []; };

// An insert is already underway when there's an uncommitted draft chip: a positioned filter
// draft (in `drafts`), a pending scalar value box (`pendingScalar`), or an empty entity value
// awaiting its first pick (`gapEntityFillId`). While one is open we suppress the gap marker
// ENTIRELY — you're already inserting here, so offering another insert to the left/right of the
// draft chip makes no sense (Jason 2026-06-20). Finish/commit the draft and the gaps return.
const insertInProgress = computed(() =>
  !!(drafts.value.length || pendingScalar.value || gapEntityFillId.value));

const onLinesGapMove = (e) => {
  if (chipDragging.value || chipMenu.value || insertInProgress.value) { activeGapSlot.value = null; return; }
  if (!gapSlots.value.length) computeGapSlots();
  const hostRect = linesEl.value.getBoundingClientRect();
  // The hit strip intentionally reaches `radius` into the flanking chips, so we DON'T bail on a
  // chip hover — the strip box (above) is the sole gate. A click on a chip's CENTRE never falls in
  // a strip, so its own menu/select still fires (activeGapSlot is null there → onLinesGapClick bails).
  activeGapSlot.value = pickGapAt(e.clientX - hostRect.left, e.clientY - hostRect.top);
};

// A click while a gap is lit (cursor inside the gap's hit strip) inserts there. Capture-phase on
// `.builder-lines` so it pre-empts the row-band select / chip-edge click. Real form controls
// (an open value input) are still left alone.
const onLinesGapClick = (e) => {
  if (!activeGapSlot.value || e.target.closest("input, textarea, .v-input")) return;
  e.stopPropagation();
  doGapInsert(activeGapSlot.value);
};

// Insert at the lit gap, then open the right editor with focus.
const doGapInsert = (slot) => {
  clearSelection();
  // "start a query" slot at the entity chip's right edge (#6): no committed root group to anchor
  // into — just seed a new top-level filter (same as the toolbar's Add filter).
  if (slot.kind === "rootfilter") {
    activeGapSlot.value = null; gapSlots.value = [];
    addRootFilter();
    return;
  }
  if (slot.kind === "value") {
    const col = treeIndex.value.tokenColumn[slot.parentId];
    const kind = (chipTypeForColumn(col) || "").split(":")[0];
    const res = edit.insertValueAt(v2.value, slot.parentId, slot.index, drafts.value);
    activeGapSlot.value = null; gapSlots.value = [];
    if (!res) return;
    if (kind === "entity") {
      // empty entity vleaf → open its in-place picker; onPickEntityValue SETS this empty one
      gapEntityFillId.value = res.id;
      openPicker(res.id);
    } else {
      pendingScalar.value = { id: res.id, columnId: col, kind, numeric: kind === "number", join: res.join };
      focusValueSoon(res.id);
    }
    return;
  }
  // filter: a positioned draft → field picker; folds INTO the tree at the gap (placeDraftInTree).
  const d = edit.makeDraft();
  d._anchor = { parentId: slot.parentId, index: slot.index };
  drafts.value.push(d);
  activeGapSlot.value = null; gapSlots.value = [];
  nextTick(() => { openFieldMenuId.value = d.id; });
};
// the empty entity value awaiting its first pick from a value-gap insert (set in place, #494)
const gapEntityFillId = ref(null);

// recompute slots lazily after any layout change; suppress the line during a drag
watch(displayLines, () => { gapSlots.value = []; activeGapSlot.value = null; });
watch(chipDragging, (on) => { if (on) clearGap(); });

// ---- group negate (group `not` chrome from OqlKeywordChip) ------------------
// Addresses the group by its keyword-token id and re-renders from the server. Whole-
// group DELETE is the row toolbar's Delete (onRowSelectionDelete → removeRow); clause
// CREATION is #472's select-and-wrap. (#428 Phase B dropped the menu paths.)
const onGroupNegate = (tok) => { edit.negateGroup(v2.value, tok.id, drafts.value); renderQuery({ swap: true }); };

// Date value picked from the calendar (oxjob #467). Set the ISO value (a plain string),
// then fold the draft / re-render the committed clause.
const pickDate = (tok, iso) => {
  edit.setValue(v2.value, tok.id, iso, { numeric: false }, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};

const onAddScalarValue = (tok) => {
  if (tok._draft) { const nid = edit.addValueAfter(v2.value, tok.id, drafts.value); focusValueSoon(nid); return; }
  // Committed scalar clause: add the value IN-TREE (Option B, #472) for BOTH flat and nested
  // clauses (unified 2026-06-18). `addValueAfter` promotes a sole leaf to a vgroup or inserts
  // after the clicked value, then a transient box (pendingScalar → spliced into displayLines)
  // holds the empty until the user commits (blur/Enter → swap). Keeping the clause in the tree
  // (vs. the old pop-to-draft) means popping it can't shrink the body to one filter and DROP the
  // outer all/any wrapper — the bug Jason hit clicking "+" on a flat clause. The server can't
  // carry the empty intermediate (v2ToOqo strips it via vFilled), which is why the box is local.
  const nid = edit.addValueAfter(v2.value, tok.id, drafts.value);
  if (!nid) return;
  pendingScalar.value = { id: nid, afterId: tok.id, columnId: tok._column,
    kind: tok._kind, numeric: !!tok._numeric, join: edit.joinOfValue(v2.value, nid, drafts.value) };
  focusValueSoon(nid);
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
  // click-the-gap entity insert (#494): the empty vleaf is ALREADY in place at the gap — SET
  // its value here instead of adding a sibling after it.
  if (gapEntityFillId.value === tok.id) {
    gapEntityFillId.value = null;
    edit.setEntityValue(v2.value, tok.id, value, label, drafts.value);
    pickers.get(tok.id)?.closePicker?.();
    renderQuery({ swap: true });
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

// A draft created by a click-the-gap FILTER insert carries an `_anchor` {parentId,index}. Once
// complete, splice it INTO the tree at that gap (so v2ToOqo serializes it IN POSITION) and drop
// it from the draft list, instead of letting currentOqo append it to the end. Returns true when
// it consumed the draft. (oxjob #494)
const anchorDraftIfReady = (d) => {
  if (!d || !d._anchor || !edit.draftComplete(d)) return false;
  if (!edit.placeDraftInTree(v2.value, d, d._anchor.parentId, d._anchor.index, drafts.value)) return false;
  drafts.value = drafts.value.filter((x) => x !== d);
  return true;
};
// fold a now-complete draft into the query (server re-render swaps the tree)
const foldNow = (d) => { if (!edit.draftComplete(d)) return; anchorDraftIfReady(d); renderQuery({ swap: true }); };

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
const addSiblingValueToGroup = (afterGroupId, kind) => {
  const sib = edit.addSiblingValueAfterGroup(v2.value, afterGroupId, drafts.value);
  if (!sib) return false;
  pendingScalar.value = {
    id: sib.id, afterId: afterGroupId, afterGroup: true,
    columnId: treeIndex.value.tokenColumn[afterGroupId], kind,
    numeric: kind === "number", join: sib.join,
  };
  focusValueSoon(sib.id);
  return true;
};
// Insert a value at the FRONT of the value-group `gid` (the join chip menu's "add value" —
// it inserts at the start, where the user's attention is, #475 D3). A transient box renders
// right after the group's `any(`/`all(` chip and commits on blur/Enter, just like the END "+".
// Scalar kinds only (text/number/date — the common `title has any(apple banana)` case): an
// ENTITY group's empty front value would need the in-place picker, whose "add after" semantics
// fight a transient front box, so entity groups fall back to the END append (caller). Returns
// false when `gid` isn't a multi-value group or is an entity group.
const addValueToGroupFront = (gid) => {
  const info = treeIndex.value.valueGroupInfo[gid];
  if (!info || info.kind === "entity") return false;
  const res = edit.addValueAtFront(v2.value, gid, drafts.value);
  if (!res) return false;
  pendingScalar.value = {
    id: res.id, afterId: gid, atFront: true,
    columnId: treeIndex.value.tokenColumn[gid], kind: info.kind,
    numeric: info.kind === "number", join: res.join,
  };
  focusValueSoon(res.id);
  return true;
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
const clearHover = () => { hoverRange.value = null; hoveredAddr.value = null; };
const isHovered = (idx) => !!hoverRange.value && idx >= hoverRange.value[0] && idx <= hoverRange.value[1];

// ---- ancestor-path footer breadcrumb (oxjob #487) --------------------------
// The dotted address of the node under the cursor (e.g. "2.1.2"), read by event
// delegation off `.builder-lines`: every token wrapper (`.bl-tok`) carries
// `data-addr="tok.addr"`, and each row band (`.bline`) carries its owner addr as a
// fallback for chrome / fused-join hovers. `null` when off all addressed nodes.
const hoveredAddr = ref(null);
function onAddrHover(e) {
  const el = e.target.closest("[data-addr]");
  let addr = el ? el.getAttribute("data-addr") : null;
  if (!addr) {
    // Whitespace on a line whose band carries no address of its own — a draft / chrome line
    // (a solo close-paren line now carries its group's addr on the band, oxjob #475). Fall back
    // to whatever address the line's own tokens carry so the breadcrumb still tracks the row.
    const band = e.target.closest(".bline");
    const tok = band && band.querySelector(".bl-tok[data-addr]");
    addr = tok ? tok.getAttribute("data-addr") : null;
  }
  hoveredAddr.value = addr || null;
}
// The friendly field label for a clause, mirroring the chip's own label (enrichToken
// `_label`): the /properties display name, falling back to the raw column. Used by the
// breadcrumb so its segment labels never drift from the chips. (#487 D4.)
const fieldLabelFor = (columnId, column) => {
  const p = properties.value[columnId];
  return p ? (p.display_name || p.name) : (column || columnId || "field");
};
// addr → segment index over the committed render tree, rebuilt when the query changes.
const addrIndex = computed(() =>
  buildAddrIndex(v2.value && v2.value.where, { entityLabel: getRows.value, fieldLabelFor }));
// Resting target when nothing is hovered (D5): whatever is selected rests in the strip
// — a selected VALUE chip on its own address, a selected ROW on the top line of its
// range — else null → the breadcrumb falls back to the entity root.
const restingAddr = computed(() => {
  if (selection.value?.kind === "value") {
    const t = activeTok.value;
    return t ? (t.addr != null ? t.addr : null) : null;
  }
  const r = selectedRange.value;
  if (!r) return null;
  const ln = displayLines.value[r[0]];
  return ln ? ln.addr : null;
});
// Is there an active selection (a value chip, a multi-select, or a row)? The footer
// treats this as overriding hover entirely (Jason: "selected style overrides
// everything"), so the moment you click a chip the strip is its bold path — no
// dependency on whether the cursor is still parked on the chip.
const hasSelection = computed(() =>
  selectedIds.value.size > 0 || !!selection.value);

// What the footer renders:
//   • SELECTION present → show it, BOLD + black, ignoring hover:
//       2+ value chips → "N values selected"; otherwise the selected node's path.
//   • else HOVER → the hovered node's path, muted (a transient preview).
//   • else → the entity root, muted.
const footer = computed(() => {
  if (hasSelection.value) {
    const n = selectedIds.value.size;
    if (n >= 2)
      return { segments: [], bold: true, countLabel: `${n} values selected` };
    return { segments: pathForAddr(restingAddr.value, addrIndex.value), bold: true, countLabel: null };
  }
  if (hoveredAddr.value != null)
    return { segments: pathForAddr(hoveredAddr.value, addrIndex.value), bold: false, countLabel: null };
  return { segments: pathForAddr(null, addrIndex.value), bold: false, countLabel: null };
});

// Adaptive gutter width (#487, Jason 2026-06-19): the number column HUGS the widest
// address in the current query, so a single-digit query starts tight and the blocks
// only get pushed out as addresses deepen — instead of a fixed wide gutter that looks
// like dead space. We size in `ch`: this custom prop is consumed by `.bline::before`,
// whose own font is the 0.72rem monospace gutter, so `1ch` resolves to the EXACT
// per-character advance — `n` chars fit precisely (paired with `white-space: nowrap`
// so a `1.1` never breaks across two lines). Plus an 8px gap to the blocks. The
// drop-indicator reads the same prop and is given the same font so its `ch` matches.
const gutterW = computed(() => {
  let chars = 1;
  for (const l of displayLines.value) if (l.addr) chars = Math.max(chars, l.addr.length);
  return `calc(${chars} * 1ch + 8px)`;
});

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
// Changing the return columns is a positive gesture (clicking a column on/off) → it IS
// a commit (run the query with the new projection), but it's tuning, not a new query →
// `replace` (don't push a history entry). Non-swap render, explicit commit. (#464 2c)
watch(columnKeys, () => renderQuery({ swap: false, commit: true, nav: "replace" }));

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
  else renderQuery({ swap: true, commit: false }); // older API w/o v2: derive from the OQO (seed, not a gesture)
};

// ---- keydown / run ----------------------------------------------------------
// Selection-aware delete / clear must work from ANYWHERE, not only when focus sits inside the
// builder div (chips aren't focusable, so after a click focus parks on <body>, outside the div's
// @keydown — which is why Backspace did nothing on a multi-selection). This window-level listener
// removes the live selection on Backspace/Delete and clears it on Escape, whenever the user isn't
// typing in a field. (Jason 2026-06-22: "when I multi-select I should ALWAYS be able to hit
// Backspace and delete it all.") A focused value chip handles its own ⌫ and stops propagation, so
// it never reaches here; in-builder focus is handled by onBuilderKeydown first, and these ops are
// idempotent (they clear the selection), so a double-fire is a harmless no-op.
const onWindowKeydown = (e) => {
  const tag = (e.target?.tagName || "").toLowerCase();
  const inField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
  if (inField) return;
  if (e.key === "Escape" && (selection.value || selectionActive.value)) { clearSelection(); return; }
  if (e.key === "Backspace" || e.key === "Delete") {
    if (selectedRow.value) { e.preventDefault(); onRowSelectionDelete(); return; }
    if (activeTok.value) { e.preventDefault(); onActiveDelete(); return; }
    if (selectionActive.value) { e.preventDefault(); onDeleteSelected(); return; }
  }
};
const onBuilderKeydown = (e) => {
  const tag = (e.target?.tagName || "").toLowerCase();
  const inField = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
  // A selected ROW (oxjob #475): Enter adds a value INSIDE the clause; Cmd/Ctrl+Enter adds a
  // SIBLING. These take precedence over the global run-query shortcut while a row is selected.
  // (Value-chip Enter/Cmd+Enter are handled by the chip itself, which holds focus + stops the
  // event, so they never reach here.)
  if (!inField && selectedRow.value && e.key === "Enter") {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) onRowAddSibling(); else onRowAddValueInside();
    return;
  }
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); runQuery(); return; }
  // Escape dismisses any live selection (a row, a single value, or a #472 multi-set).
  if (e.key === "Escape" && (selection.value || selectionActive.value)) { clearSelection(); return; }
  // Backspace/Delete removes the highlighted node — a row, a single value, or the #472 multi-set
  // (oxjob #475) — but NOT while typing in a value input (that Backspace edits text). A focused
  // value chip handles its own ⌫ + stops propagation, so this is the fallback for unfocused cases.
  if (!inField && (e.key === "Backspace" || e.key === "Delete")) {
    if (selectedRow.value) { e.preventDefault(); onRowSelectionDelete(); return; }
    if (activeTok.value) { e.preventDefault(); onActiveDelete(); return; }
    if (selectionActive.value) { e.preventDefault(); onDeleteSelected(); return; }
  }
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
  // Track the multi-select modifier (Cmd/Ctrl/Shift) so the same-type dim shows only while a
  // multi-select gesture is being made — not on a plain single selection (#475 follow-up).
  window.addEventListener("keydown", onModifierKey);
  window.addEventListener("keyup", onModifierKey);
  window.addEventListener("blur", onModifierBlur);
  window.addEventListener("keydown", onWindowKeydown);
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
  renderQuery({ swap: true, commit: false }); // seed the (empty) starting query → populate v2 (not a user gesture, don't run)
});

onBeforeUnmount(() => {
  if (copiedTimer) { clearTimeout(copiedTimer); copiedTimer = null; }
  cancelPendingMenuOpen();
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("keydown", onModifierKey);
  window.removeEventListener("keyup", onModifierKey);
  window.removeEventListener("blur", onModifierBlur);
  window.removeEventListener("keydown", onWindowKeydown);
});

defineExpose({ rebuildFromOql: async (oql) => {
  const data = await store.dispatch("oqlBuilder/seedFromOql", String(oql));
  if (data.oqo) { seedError.value = null; await rebuildFromOqo(data); }
  else { seedError.value = data.error; }
} });
</script>

<style scoped>
/* DATE value editor (oxjob #475): the calendar relocated off the old toolbar onto a fixed
   chip-anchored overlay (viewport coords). Mirrors the chip menu's shell. */
.date-editor-overlay { position: fixed; z-index: 2400; background: #fff; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }
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
  /* Structural-chip width (Jason 2026-06-23): the AND/OR connector, the spacer (lead) chip,
     and BOTH parens all share ONE width so they read as a uniform column, and THE indent unit
     equals that same width so each nesting level steps in by exactly one chip and a line's lead
     chip lands directly under its parent's opener. One var drives all of it. */
  --chip-w: 28px;
  --paren-w: var(--chip-w);   /* open/close paren = the shared chip width */
  --indent: var(--chip-w);    /* one indent step = one chip width */
  --brick-fs: 0.8125rem;
  position: relative; /* positioning context for the drag-to-delete overlay */
}
.builder :deep(.v-chip.v-chip--size-small) { font-size: var(--brick-fs); font-family: "JetBrains Mono", monospace; }
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
/* position:relative anchors the drop-indicator; the bottom padding gives the "drop below the
   last row" gap room to be reached + show its heavy line (oxjob #475, Jason 2026-06-17). */
.builder-lines { display: flex; flex-direction: column; gap: var(--gx); position: relative; padding-bottom: 18px; }
/* The query rows live in their own flex column (same gap) as the sort/return/add lines.
   (The row FLIP/enter/leave transitions were ripped out 2026-06-20 — see template note.) */
.bline-flow { display: flex; flex-direction: column; gap: var(--gx); }
/* Heavy drop-indicator (oxjob #475): a thick black bar in the gap where a dragged row lands,
   indented under the target list's depth (aligned to the line-number gutter + nesting). */
.drop-indicator {
  position: absolute;
  /* `--num-w` is sized in `ch` (the gutter's mono digit); match the font here so this
     element's `ch` resolves the same and the bar lines up with the content start. */
  font: 0.72rem "JetBrains Mono", monospace;
  left: calc(var(--num-w) + var(--ind-depth, 0) * var(--indent));
  right: 0;
  height: 3px;
  margin-top: -1.5px;       /* center the bar on the gap */
  background: #1a1a1a;
  border-radius: 2px;
  z-index: 5;
  pointer-events: none;     /* never intercept the drop — the lines area owns it */
}
/* Vertical drop-indicator (oxjob #475 chip drag, Jason 2026-06-17): a heavy black VERTICAL
   bar marking the gap BETWEEN two chips (or before the first / after the last) where the
   dragged value chip(s) will land — the "reverse" of the row drop-indicator's horizontal bar.
   Positioned (left/top/height) inline from the active chip slot's geometry. */
.vdrop-indicator {
  position: absolute;
  width: 3px;
  margin-left: -1.5px;      /* center the bar on the chip margin */
  background: #1a1a1a;
  border-radius: 2px;
  z-index: 5;
  pointer-events: none;
}
/* Click-the-gap insertion marker (oxjob #494, Jason 2026-06-20 redesign): a thin black vertical
   LINE spanning the flanking chips' height, with a small black "+"-circle centred in the MIDDLE
   of that line. Absolute overlay → never reflows the chips. The container is positioned at the
   gap's (x, top) with the flanking-chip height; `translateX(-50%)` centres it on the gap. The
   host's capture-phase click does the insert; the circle/line are the visible target. */
.gap-indicator {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  align-items: center;        /* circle sits in the MIDDLE of the line */
  justify-content: center;
  z-index: 6;
  cursor: pointer;
}
/* the vertical line: spans the full flanking-chip height, centred under the circle */
.gap-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #1a1a1a;
  border-radius: 1px;
}
/* the "+"-circle: small (smaller than the old 22px), painted over the line's midpoint */
.gap-plus {
  position: relative;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1a1a1a;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.gap-plus :deep(.v-icon) { color: #fff; }
/* subtle fade so the marker doesn't pop/vanish jarringly as the cursor crosses gaps */
.gap-fade-enter-active,
.gap-fade-leave-active { transition: opacity 0.12s ease; }
.gap-fade-enter-from,
.gap-fade-leave-to { opacity: 0; }
/* Row drag handle (oxjob #475, Jason 2026-06-19 review #3): the ONLY way to start a row drag.
   Lives in the far-left margin, revealed on row hover; absolutely positioned so it never shifts
   the row. The band itself shows no grab/pointer cursor anymore (clicking it is a no-op). */
.row-grab {
  position: absolute;
  /* Sit inside the left bleed with a real LEFT margin off the row's left border/rail (Jason
     2026-06-20): the rail is at the bline's padding-box left (the -16px bleed edge), so `left`
     is measured from there. `left: 4px` floats the handle 4px in from that border; the narrower
     width keeps a small gap to the line-number gutter (which starts at the content edge). */
  left: 4px;
  top: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  height: 20px;
  color: rgba(0, 0, 0, 0.26);
  cursor: grab;
  visibility: hidden;
  z-index: 4;
}
.bline:hover .row-grab { visibility: visible; }
.row-grab:hover { color: rgba(0, 0, 0, 0.6); }
.row-grab:active { cursor: grabbing; }
/* the block being dragged dims so the user sees what's moving (the heavy line shows where) */
.bline--dragging { opacity: 0.4; }
/* DISABLED row (oxjob #475, Jason 2026-06-17): the moment a value chip is selected (or a chip
   drag starts), every filter row that holds no SAME-TYPE value list is dimmed + made inert —
   you can't select or drop into a row of a different type, so it reads as off-limits. */
.bline--disabled { opacity: 0.32; pointer-events: none; }
.bline {
  display: flex;
  align-items: flex-start;
  /* positioning context for the absolutely-placed left-margin drag handle (#475) */
  position: relative;
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
/* The band whitespace / inert marks (parens, conjunctions, property, dot) are NOT clickable
   anymore (menus-on-chips pivot — a band click is a no-op), so they show the default cursor, not
   a pointer (Jason 2026-06-19 review #3). The `.bl-body` content keeps its own cursors (value
   chips = pointer, inputs = text); the left-margin drag handle shows grab. */
/* The band is programmatically focused on row-select (so Enter/Cmd+Enter shortcuts reach the
   builder, #475) — focus is invisible; the black rails already mark the selected row. */
.bline:focus, .bline:focus-visible { outline: none; }
/* hover block-highlight: an extra-subtle grey band spanning the full canvas (Jason 2026-06-17:
   ~half as dark as before, 0.025 black; HOVER-ONLY — a selected row drops it). Both rails go a
   visible grey to FRAME the band so the light highlight reads as separate from the white card. */
.bline--hl {
  background: rgba(0, 0, 0, 0.025);
  box-shadow: inset 4px 0 0 0 rgba(0, 0, 0, 0.16), inset -4px 0 0 0 rgba(0, 0, 0, 0.16);
}
/* selected-scope row (oxjob #475, Jason 2026-06-19 review #3): clicking a leader chip selects
   only that chip; the clause it acts on shows its "blast radius" here — the SAME light-grey band
   as hover PLUS bold black rails on both margins + a bold black line number. (Earlier the band was
   hover-only; Jason now wants the grey fill on selection too so the scope reads at a glance.)
   Declared after --hl so the black rails win when a selected row is also hovered. */
.bline--sel {
  background: rgba(0, 0, 0, 0.025);
  box-shadow: inset 4px 0 0 0 #1a1a1a, inset -4px 0 0 0 #1a1a1a;
}
/* The gutter number is each row's REAL decimal address (#474/#487), not a dumb
   sequential counter: `content: attr(data-addr)` reads the `data-addr` the v-for
   binds from `lineAddr(line)`. A solo close-paren line carries the address of the
   line that OPENED its group (oxjob #475, `fillTerminatorAddrs`), so the numbering
   counts up into nested blocks and back down as each `)` closes — the root `)` reads
   `0`. A chrome / draft line still carries no `data-addr`, so its number is blank —
   but the ::before box keeps its fixed width, so every row's content stays aligned. */
.bline::before {
  content: attr(data-addr);
  flex: 0 0 auto;
  /* `--num-w` is set adaptively per query on `.builder-lines` (gutterW): the column
     hugs the widest address + an 8px gap, so the gap is the padding below. border-box
     keeps the padding inside the computed width. */
  box-sizing: border-box;
  width: var(--num-w);
  /* never let a multi-part address (`1.1`) wrap across two lines — the width is the
     exact `n * 1ch`, so nowrap guarantees it stays on one row. */
  white-space: nowrap;
  /* center the number against the 26px chip row (no .bline vertical padding now) */
  margin-top: 6px;
  padding-right: 8px;
  /* LEFT-aligned (Jason 2026-06-20): the leading integer (and so the first dot) line up
     down the gutter — `1`, `1.2`, `1.2.1` all start at the same column — instead of the
     ragged look right-alignment gives (where only the last digit aligns). */
  text-align: left;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.32);
  user-select: none;
}
.bline--sel::before { font-weight: 700; color: #1a1a1a; }
/* Token wrapper for the footer's address delegation (#487): display:contents so it
   generates NO box — the chip inside stays the direct flex child of `.bl-body`, leaving
   the spacing/wrap/indent layout untouched, while `closest('[data-addr]')` still finds
   the wrapper's `data-addr`. */
.bl-tok { display: contents; }
.bl-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  /* Monospace EVERYTHING (Jason 2026-06-19) — the whole query reads as code; every brick
     (value / field / keyword / op) inherits this unless it sets its own (the join/paren chips
     already do). Overrides the earlier bold-sans-keyword decision. */
  font-family: "JetBrains Mono", monospace;
  /* ONE gap, both axes: column-gap between chips on a row AND row-gap between the
     wrapped rows of this logical line are both --gx (Jason 2026-06-17). */
  gap: var(--gx);
  min-height: 26px;
  /* Hanging indent for wrapped long lines (oxjob #507 Phase 4): nesting is now carried by
     the explicit `.bl-cols` column grid (not depth padding), so `.bl-body` only handles
     line WRAP — it pads two units and pulls the first brick back two units, so the first
     visual row starts flush after the columns while every WRAPPED continuation row hangs in
     by a 2-unit WHITE indent (no spacer chip — pure whitespace, distinct from a semantic
     column). Invisible on lines that don't wrap. */
  padding-left: calc(2 * var(--indent));
}
/* Hanging-indent pull-back: tuck the FIRST brick back two units so the line starts flush
   (only wrapped rows hang further in). The #487 footer-hover wrapper `.bl-tok` is
   `display:contents` (no box → margins ignored on it), so when it's the first child the
   pull-back must land on the chip INSIDE it, not the wrapper. */
.bl-body > :first-child,
.bl-body > .bl-tok:first-child > :first-child { margin-left: calc(-2 * var(--indent)); }
/* The structural column grid (oxjob #507): a fixed run of cells left of `.bl-body`, one
   per nesting level. Each cell is exactly one --chip-w wide so terms align down the page. */
.bl-cols {
  display: flex;
  align-items: center;
  gap: var(--gx);
  flex: 0 0 auto;
  margin-right: var(--gx);
}
/* A SPACER cell — a blank flat-grey chip that holds a column open so the first operand of
   a group aligns under its `&`/`or`-led siblings (Jason 2026-06-23, "flat gray chip,
   nothing on it"). Goes black with the row's chips on select. */
.bl-spacer {
  display: inline-flex;
  box-sizing: border-box;
  height: 26px;
  width: var(--chip-w, 28px);
  min-width: var(--chip-w, 28px);
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--kw-bg, #ececec);
  user-select: none;
}
/* A CONNECTOR cell — the `&` (AND) / `or` (OR) glyph that joins one operand to the previous,
   on the shared column width so it aligns under spacers in the same column. Clickable: flips
   the join of the group it leads (onConnCellClick). */
.bl-conn-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  width: var(--chip-w, 28px);
  min-width: var(--chip-w, 28px);
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--kw-bg, #ececec);
  color: rgba(0, 0, 0, 0.55);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs);
  cursor: pointer;
  user-select: none;
}
.bl-conn-cell:hover { background: rgba(0, 0, 0, 0.12); color: rgba(0, 0, 0, 0.8); }
.bline--sel .bl-spacer, .bline--sel .bl-conn-cell { background: #1a1a1a; color: #fff; }
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
/* Leading "spacer" placeholder (oxjob #475 / Jason 2026-06-23 — "flat gray chip, nothing on it"):
   a blank GRAY chip the shared `--chip-w` wide (= the connector / paren blocks AND the indent
   step). Sits in the hanging-indent column (it's the line's first child, pulled back one --indent
   unit), so a multi-item group's first child lines up under its `and`/`or`-led siblings. Goes
   black with the rest of the row's chips on select. */
.lead-dot {
  display: inline-flex;
  box-sizing: border-box;
  height: 26px;
  width: var(--chip-w, 28px);
  min-width: var(--chip-w, 28px);
  flex: 0 0 auto;
  border-radius: 4px;
  background: var(--kw-bg, #ececec);
  user-select: none;
}
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
