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
      <!-- Toolbar (oxjob #428): the builder's chrome lives here instead of a footer.
           Narrow, quiet text buttons; "edit raw" hands authoring off to the host's
           view-code dialog, the rest act on the query in place. -->
      <div v-if="showToolbar" class="builder-toolbar">
        <!-- Subject-entity selector (oxjob #507): moved OUT of the canvas into the toolbar's
             top-left. Reads "search works ⌄" / "search authors ⌄" — clicking it picks the
             entity the query runs over. The canvas below is now a pure list of filters. Reuses
             the shared EntitySelectorButton in controlled mode (caret shown; "search" prefix). -->
        <!-- #523 round 5: always opt into the corpus selector so the works entry always offers the
             two "works (core)" / "works (all)" rows; the selector only shows the corpus in its label
             when the subject IS works. -->
        <EntitySelectorButton class="tb-entity" :model-value="getRows" prefix="search"
          :corpus="corpus"
          @update:model-value="getRows = $event" @update:corpus="corpus = $event" />
        <span class="tb-sep" aria-hidden="true"></span>

        <!-- Static chrome: the minimal bootstrap controls — Add filter (left) + Clear
             (far right, #507). Add filter is the "filter with plus" icon (Jason 2026-06-24). -->
        <!-- Disabled while a draft chip is open anywhere — drafts are a singleton (#561). -->
        <v-btn size="small" variant="text" icon :disabled="hasOpenDraft"
          @click="addRootFilter()">
          <v-icon color="grey-darken-1">mdi-filter-plus-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Add filter</v-tooltip>
        </v-btn>

        <v-spacer />

        <!-- EDITOR controls (right, icon buttons + native tooltips): copy · clear.
             Edit-code (`</>`) and Settings (gear) icons removed per Jason 2026-06-24 (#507).
             Use the app-standard icon-button recipe (matches SerpRightToolbar /
             GroupBySidebar): `icon variant="text" size="small"` + a
             `grey-darken-1` v-icon, no custom sizing — so they don't read heavier
             or bigger than icon buttons elsewhere. -->
        <v-btn size="small" variant="text" icon
          :color="copied ? 'success' : undefined" @click="copyOql">
          <v-icon :color="copied ? undefined : 'grey-darken-1'">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
          <v-tooltip activator="parent" location="bottom">{{ copied ? 'Copied' : 'Copy' }}</v-tooltip>
        </v-btn>

        <!-- Clear: empties the whole query. Moved to the FAR RIGHT as a trashcan icon
             (was the word "Clear" on the left, #494 → icon on the right, Jason 2026-06-24 #507). -->
        <v-btn size="small" variant="text" icon
          :disabled="!hasQuery" @click="clearQuery">
          <v-icon color="grey-darken-1">mdi-trash-can-outline</v-icon>
          <v-tooltip activator="parent" location="bottom">Clear</v-tooltip>
        </v-btn>
      </div>

      <div ref="linesEl" class="builder-lines" :style="{ '--num-w': gutterW, '--field-w': fieldColW }"
        @mouseleave="clearHover()"
        @mouseover="onAddrHover"
        @dragstart="onLinesDragstart" @dragover="onLinesDragover" @drop.prevent="onLinesDrop">
        <!-- Vertical drop-indicator (oxjob #475 chip drag): a heavy black bar on a chip's margin
             marking where the dragged value chip(s) will land — between two chips, or at a list's
             start/end. Positioned (left/top/height) from the active chip slot's geometry. -->
        <div v-if="activeValueSlot" class="vdrop-indicator"
          :style="{ left: activeValueSlot.x + 'px', top: activeValueSlot.y + 'px', height: activeValueSlot.h + 'px' }"
          aria-hidden="true" />
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
          :class="{ 'bline--sel': isSelectedLine(lineIdx), 'bline--disabled': isDimmedLine(lineIdx) }"
          :data-addr="line.addr"
          :style="{ '--depth': line.depth }" tabindex="-1"
          @click.stop="onLineClick(lineIdx, $event)"
          @dblclick.stop="onLineDblclick(lineIdx, $event)">
          <!-- Left-gutter kebab menu (#523 round 10, Notion-inspired): replaces the row drag
               handle (row drag-to-reorder removed — Jason 2026-07-07). Hover the row → a kebab
               appears in the left margin; its menu holds the structural row actions that used to
               live in the end-of-line dropdown (also removed this round — Kyle found a menu at
               the line's end confusing; in-line edits happen at the end of the line, structural
               ones at its start). Absolutely positioned so it never shifts the row's content. -->
          <v-menu v-if="line._menu" location="bottom start" offset="2">
            <template #activator="{ props: mp }">
              <button type="button" class="row-kebab" v-bind="mp" aria-label="line actions"
                @click.stop @mousedown.stop @dblclick.stop>
                <v-icon size="16">mdi-dots-vertical</v-icon>
              </button>
            </template>
            <v-card min-width="190" class="menu-card">
              <v-list density="compact" class="py-0">
                <!-- (#575: the interim "AND clause" item moved to the bottom-edge ghost `&`
                     below — the down-axis home the #523 locked spec wanted; ⇧Enter still works.) -->
                <v-list-item :disabled="hasOpenDraft" prepend-icon="mdi-filter-plus" title="Add filter"
                  @click="onMenuAndFilter(line)" />
                <v-divider />
                <v-list-item prepend-icon="mdi-delete-outline" title="Delete line"
                  :disabled="!line._menu.deleteId" @click="onMenuDeleteLine(line)" />
              </v-list>
            </v-card>
          </v-menu>
          <!-- (#575 round 2: the ghost `&` add-AND-clause control moved from a floating
               bottom-edge button into the line-TAIL controls, after the ghost `or` — see
               OqlLineTailControls. Jason: the boundary spot felt squeezed.) -->
          <!-- Filter-scope LEADING chip (#523 round 2): every top-level filter row starts with a
               conjunction — the `→` arrow on the first row, a pale-PEACH `&` on each subsequent
               filter row (peach = filter scope, vs the periwinkle value-scope connectors). It's a
               sibling of `.bl-field`/`.bl-body` (not a token), so it never enters the
               selection/drag/plus model. A row with no `_lead` (value-continuation rows) renders
               an EMPTY spacer so the lead column stays uniform under the #575 table layout. -->
          <span class="bl-lead" :class="{ 'bl-lead--arrow': line._lead === 'arrow', 'bl-lead--spacer': !line._lead }" aria-hidden="true">{{ line._lead === 'arrow' ? '→' : (line._lead ? '&' : '') }}</span>
          <!-- FIELD cell (#575 two-column table): the shared-width field column. Holds the
               folded field(+op) chip on a filter row, or the row's lone `&` connector on a
               value-continuation row (right-aligned at the field|value boundary via
               `bl-field--conn`, so sibling AND-arms' VALUES align at one shared x-edge).
               Same OqlBrick dispatch + event set as the value cell — keep the two in sync. -->
          <div class="bl-field" :class="{ 'bl-field--conn': line._fieldConn }">
            <template v-for="(tok, ti) in (line._fieldToks || [])" :key="tok.t === 'vbrick' && tok.id ? tok.id : 'f' + ti">
              <span v-if="isBrick(tok)" class="bl-tok" :data-addr="tok.addr">
                <OqlBrick :tok="tok" :ctx="brickCtx"
                  :active="isLeaderSelected(tok) || (tok.t === 'vbrick' && tok.id === activeValueId) || (tok.t !== 'vbrick' && isSelected(tok))"
                  :edit-open="tok.t === 'vbrick' && (tok.id === editTextId || tok.id === editingEntityId)"
                  :selected="isSelected(tok)" :selection-active="selectionActive"
                  @select="onChipSelect($event)"
                  @select-clear="clearSelection()"
                  @set-entity="getRows = $event"
                  @negate-group="onGroupNegate(tok)"
                  @menu="(el, ev) => onChipMenu(tok, el, ev)"
                  @request-edit="onRequestEdit(tok)"
                  @select-field="(k) => pickField(tok, OQL_FIELD_KEY_ALIASES[k] || k)"
                  @open-field-menu="(v) => onFieldMenuOpen(tok, v)"
                  @more-fields="openFieldDialog(tok)"
                  @delete-filter="deleteFilter(tok)"
                  @value-input="onValueInput(tok, $event)"
                  @value-keydown="onValueKeydown(tok, $event)"
                  @value-blur="onValueBlur(tok)"
                  @add="onChipAdd(tok)"
                  @toggle="onBoolToggle(tok)"
                  @query-input="(q) => onTypeOnInput(tok, q)"
                  @query-keydown="(e) => onTypeOnKeydown(tok, e)"
                  @remove="onRemoveValue(tok)" />
              </span>
            </template>
          </div>
          <div class="bl-body">
            <!-- key VALUE bricks by their stable token id (so #467's per-chip UI
                 state — open menu / inline-edit — follows the value when a negate
                 reorders tokens), everything else by index. NB: can't use a bare
                 `tok.id` — conn/paren/col/op tokens share a group/clause id, which
                 would collide; only vbrick ids are unique. (oxjob #428 / #467.) -->
            <!-- #575: the value cell iterates `_valueToks` (the field cell above owns the
                 leading field/continuation-conn run); `_tailIdx` indexes into THIS list. -->
            <template v-for="(tok, ti) in line._valueToks" :key="tok.t === 'vbrick' && tok.id ? tok.id : ti">
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
              <span v-if="isBrick(tok)" class="bl-tok"
                :class="{ 'bl-tok--tail': line._tailBrick && ti === line._tailIdx }"
                :data-addr="tok.addr">
              <OqlBrick :tok="tok" :ctx="brickCtx"
                :active="isLeaderSelected(tok) || (tok.t === 'vbrick' && tok.id === activeValueId) || (tok.t !== 'vbrick' && isSelected(tok))"
                :edit-open="tok.t === 'vbrick' && (tok.id === editTextId || tok.id === editingEntityId)"
                :selected="isSelected(tok)" :selection-active="selectionActive"
                @select="onChipSelect($event)"
                @select-clear="clearSelection()"
                @set-entity="getRows = $event"
                @negate-group="onGroupNegate(tok)"
                @menu="(el, ev) => onChipMenu(tok, el, ev)"
                @request-edit="onRequestEdit(tok)"
                @select-field="(k) => pickField(tok, OQL_FIELD_KEY_ALIASES[k] || k)"
                @open-field-menu="(v) => onFieldMenuOpen(tok, v)"
                @more-fields="openFieldDialog(tok)"
                @delete-filter="deleteFilter(tok)"
                @value-input="onValueInput(tok, $event)"
                @value-keydown="onValueKeydown(tok, $event)"
                @value-blur="onValueBlur(tok)"
                @add="onChipAdd(tok)"
                @toggle="onBoolToggle(tok)"
                @query-input="(q) => onTypeOnInput(tok, q)"
                @query-keydown="(e) => onTypeOnKeydown(tok, e)"
                @remove="onRemoveValue(tok)" />
              <!-- TRAILING CONTROLS bound to the last brick (#523 round 6): rendered INSIDE this
                   `.bl-tok--tail` (inline-flex, no-wrap) so the chip + `or` button can never
                   wrap apart. The after-loop mount below is the text-block-tail fallback. -->
              <OqlLineTailControls v-if="line._tailBrick && ti === line._tailIdx" :line="line"
                :has-open-draft="hasOpenDraft" :and-ghost="!!line._andGhost"
                @plus="onPlusAuto(line._plus)"
                @and="addAndRowForClause(line._menu && line._menu.clauseId)" />
              </span>

              <!-- TEXT-BLOCK chip (#523 round 2): an in-column AND sub-group (`(nicotine & vaping)`,
                   possibly nested) rendered as ONE chip with the language features (parens, `&`,
                   `or`, `not`) BOLD. Double-click edits the whole thing as raw text; on commit it
                   re-parses (a pure-OR list unpacks back into blocks, anything else stays a block). -->
              <OqlTextBlockChip v-else-if="tok.t === 'textblock'" :tok="tok"
                @commit="(text) => onTextBlockCommit(tok, text)" />

              <!-- (#575: the `addplus` chip for OR-of-filters rows is gone — filter-scope OR
                   is gated to the OQL tab by representableShape.) -->

              <!-- ENTITY value picker — INVISIBLE (anchorOnly), opened in place from a
                   value chip's "New" / draft creation, so there's no floating "+". One
                   per draft clause (here) and per committed entity clause (below),
                   registered by clause/draft id. NOT a chip → parent-rendered. (#467.) -->
              <BuilderAddValue v-else-if="tok.t === 'addvalue' && tok._kind === 'entity'" anchor-only
                :ref="(el) => registerPicker(tok._targetId, el)"
                :value-kind="tok._kind"
                :anchor-target="`[data-vid='${tok._targetId}_ph']`"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                :external-search="typeOnQuery"
                @pick="(p) => onPickEntityValueTo(tok._targetId, p, tok._draft)"
                @set-negate="(neg) => onDraftSetNegate(tok._targetId, neg)"
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
                :value-kind="tok._kind" :negated="tok.negated"
                :anchor-target="`[data-vid='${tok.id}']`"
                :external-search="tok._placeholder || tok.id === editingEntityId ? typeOnQuery : null"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                @pick="(p) => onPickEntityValue(tok, p)"
                @set-negate="(neg) => onEntitySetNegate(tok, neg)"
                @abandon="onAbandonEntityValue(tok)" />
            </template>

            <!-- field-picker "More" → categorized field tour (one per builder) -->
            <BuilderFieldDialog v-if="line._hasFieldMenu" v-model="fieldDialogOpen"
              :entity="getRows" @select="onFieldDialogSelect" />

            <!-- Per-line insert affordance (oxjob #507 rev; #523 round 3: now an `[or]` BLOCK, not a
                 `+` icon). A line that can take synonyms (entity/text/number) shows a single ghost
                 connector chip on hover — the line's OWN conjunction (`or`, or `&` if the line is
                 AND-joined) — so it reads as "drop another term here". Click adds the term; no menu.
                 New top-level filters come from the toolbar's "Add filter". -->
            <!-- Trailing controls (the ghost `or` button). When the line's last visible chip is
                 a BRICK they render INSIDE that chip's `.bl-tok--tail` (above) so the two stay
                 one no-wrap unit (#523 round 6); this after-loop mount is the FALLBACK for a
                 text-block tail. -->
            <OqlLineTailControls v-if="!line._tailBrick" :line="line"
              :has-open-draft="hasOpenDraft" :and-ghost="!!line._andGhost"
              @plus="onPlusAuto(line._plus)"
              @and="addAndRowForClause(line._menu && line._menu.clauseId)" />
          </div>
        </div>
        </div>

        <!-- Permanent "add filter" affordance (#523 round 5): ALWAYS the last line, so there is one
             blank line below the last filter — the gap helps separate query rows. It doubles as the
             primary "add a filter" control. #523 round 7 (Jason): the `&` lead chip + the separate
             "..." button are collapsed into ONE quiet, bold real ellipsis `…` sitting in the lead
             slot (where the `&` used to be). With NO filters yet it leads with a `→` arrow instead
             (it's the very first row — "start here"). The whole row is the click target. -->
        <div class="bline bline--addfilter" :class="{ 'bline--addfilter-off': hasOpenDraft }"
          :data-addr="String(displayLines.length + 1)"
          @click.stop="addRootFilter()" title="add filter">
          <span class="bl-lead bl-lead--ghost"
            :class="{ 'bl-lead--arrow': !displayLines.length, 'bl-lead--addfilter': displayLines.length }"
            aria-hidden="true">{{ displayLines.length ? '…' : '→' }}</span>
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
                <v-list-item prepend-icon="mdi-plus" title="Add a filter" @click="addRootFilter()" />
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
      <OqlBuilderFoot v-if="embedded && showFoot" in-card
        :validation="validation" :status-label="statusLabel" :rendering="rendering"
        :seed-error="seedError" :result-count="inlineRun ? resultCount : null"
        :running="running" :run-label="runLabel" @run="runQuery">
        <!-- Host-injected foot actions (e.g. the #463 "view code" button), placed
             next to Run. The builder renders whatever the host passes and knows
             nothing about it — it is NOT part of this component's behaviour. -->
        <template #foot-actions><slot name="foot-actions" :oql="renderedOql" /></template>
      </OqlBuilderFoot>
    </v-card>

    <!-- non-embedded (playground): foot sits below the card, as before -->
    <OqlBuilderFoot v-if="!embedded && showFoot"
      :validation="validation" :status-label="statusLabel" :rendering="rendering"
      :seed-error="seedError" :result-count="inlineRun ? resultCount : null"
      :running="running" :run-label="runLabel" @run="runQuery">
      <template #foot-actions><slot name="foot-actions" :oql="renderedOql" /></template>
    </OqlBuilderFoot>

    <!-- DATE value editor (oxjob #475): the calendar on a fixed chip-anchored overlay,
         opened by a date value's Edit gesture (double-click / Enter). -->
    <div v-if="dateEditor" class="date-editor-overlay menu-card"
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
import OqlTextBlockChip from "@/components/Oql/OqlTextBlockChip.vue";
import OqlLineTailControls from "@/components/Oql/OqlLineTailControls.vue";
import OqlBuilderFoot from "@/components/Oql/OqlBuilderFoot.vue";
import EntitySelectorButton from "@/components/EntitySelectorButton.vue";
import OqlDatePicker from "@/components/Oql/OqlDatePicker.vue";
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
import { layoutLines, splitLineCells, isEmptyVbrick } from "@/components/Oql/builderLayout";
import { parseValueExpr } from "@/components/Oql/valueExpr";
import { parseNumericExpr } from "@/components/Oql/numericExpr";
import { treeToTokens } from "@/components/Oql/treeToTokens";
import { buildAddrIndex, buildAddrById, pathForAddr } from "@/components/Oql/oqlBreadcrumb";
import OqlBuilderFooter from "@/components/Oql/OqlBuilderFooter.vue";
import { reconcileTreeIds } from "@/components/Oql/reconcileIds";
import { oqlForUrl } from "@/oqlSerialize";
import { fieldKeys, popularFieldKeys, fieldIcon, fieldDisplayName } from "@/components/OqlPlayground/builderFieldMeta";
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
const emit = defineEmits(["run", "update:oql", "update:oqo"]);

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
// Corpus selector (oxjob #481): `core` (default, curated) or `all` (core + expansion).
// Rides into the OQO via v2ToOqo → the server renders `works (all corpora) where …`; the
// builder never reaches `expansion`-alone (that's a basic/text-mode concern). Seeded from
// the loaded query's OQO in rebuildFromOqo; a change re-runs the query (watch below).
const corpus = ref("core");
const v2 = ref(null);
const drafts = ref([]);
const sortBy = ref([]);
let suppressCommit = false;

const properties = computed(() => store.getters["oqlBuilder/propsFor"](getRows.value) || {});

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
  const tokenColumn = {}, tokenClause = {}, topRowOf = {};
  const sole = {}; // value id -> true when it is the clause's ONLY value (can't ×)
  // clause id -> the id of the clause's OVERALL last value in document order (the deepest
  // last-child across its whole value tree). The "new filter" filter-plus must appear ONCE
  // per filter — on the filter's visually-LAST value line. (Jason 2026-06-24 #507.)
  const clauseLast = {};
  // clause id -> the id of its OUTERMOST value vgroup (null/absent for a single-valued
  // clause). O(1) replacement for the per-line edit.locate scans clauseValueGroupId used
  // to do on every displayLines recompute (per-keystroke hot path).
  const clauseTopVgroup = {};
  // vgroup id -> { kind, lastChildId }. Every value group (at any nesting level) records its
  // own kind + last child, so displayLines can put a "+" before that group's CLOSE paren (add
  // a sibling member to the group). — Jason 2026-06-17.
  const valueGroupInfo = {};
  const walkClause = (c, top) => {
    tokenColumn[c.id] = c.column_id; tokenClause[c.id] = c.id; topRowOf[c.id] = top;
    if (c.value) {
      const leaves = [];
      const gather = (val) => {
        tokenColumn[val.id] = c.column_id; tokenClause[val.id] = c.id; topRowOf[val.id] = top;
        if (val.node === "vgroup") val.children.forEach(gather);
        else leaves.push(val);
      };
      gather(c.value);
      if (c.value.node === "vgroup") clauseTopVgroup[c.id] = c.value.id;
      if (leaves.length === 1) sole[leaves[0].id] = true;
      // `gather` pushes leaves in document order, so the last one is the clause's terminal value.
      if (leaves.length) clauseLast[c.id] = leaves[leaves.length - 1].id;
      // Record every value group's kind + last child → close-paren "+" (add a sibling member).
      const kind = valueKindForProperty(properties.value[c.column_id]);
      const walkVgroup = (vg) => {
        if (!vg || vg.node !== "vgroup" || !vg.children.length) return;
        valueGroupInfo[vg.id] = { kind, lastChildId: vg.children[vg.children.length - 1].id };
        vg.children.forEach(walkVgroup);
      };
      walkVgroup(c.value);
    } else { sole[c.id] = true; clauseLast[c.id] = c.id; }
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
  return { tokenColumn, tokenClause, topRowOf, sole, clauseLast, clauseTopVgroup, valueGroupInfo };
});

// ---- field picker data ------------------------------------------------------
// The inline field-chip menu (SelectionMenu) now offers the SAME curated facet
// vocabulary the "All fields" dialog does — keyed by entity, not the raw /properties
// surface (oxjob #505 follow-up). Keys are facet keys; the alias bridge on select
// (OQL_FIELD_KEY_ALIASES, below) resolves them to the server /properties key the
// leaf-builder needs — identical to the dialog's select path.
const allFieldKeys = computed(() => fieldKeys(getRows.value));
const popularFields = computed(() => popularFieldKeys(getRows.value, allFieldKeys.value));
const getFieldDisplayName = (k) => fieldDisplayName(getRows.value, k);
const getFieldIcon = (k) => fieldIcon(getRows.value, k);

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
// The bare value KIND of a column (entity/text/number/boolean/date/…) — chipTypeForColumn
// minus the entity-type suffix. The single spelling of the `.split(":")[0]` idiom.
const kindForColumn = (col) => (chipTypeForColumn(col) || "").split(":")[0];
// A committed value chip can be selected/dragged for reorder only if its kind supports a
// value list (entity/text/number) — booleans/dates are single-value.
const valueIsDraggable = (id) => MULTI_VALUE_KINDS.has(kindForColumn(treeIndex.value.tokenColumn[id]));

// Fold each `op` (predicate) token INTO its same-clause `col` token: the predicate is
// no longer its own brick (Jason 2026-06-15) — non-numeric predicates are fixed and
// just read as part of the property ("keyword is" / "title/abstract contains"), and a
// numeric one ("year ≥") is changed from the property chip's own menu. Copies the op's
// display text + numeric operator options onto the col, then drops the `op` tokens so
// they never render separately. (col + op share the clause id, in both server `lines`
// and draftBodyTokens.) Mutates the col tokens in place; returns the op-less list.
const PRETTY_OP = { ">=": "≥", "<=": "≤" }; // match the operator-menu glyphs (uiOperatorsForProperty)
// Row-subject verb clauses (oxjob #557): `it cites (…)` / `it's cited by (…)` /
// `it's related to (…)`. The chip label (catalog display_name) IS the verb, so
// folding the op would read "cites cites" — these chips stay BARE (design:
// chips are `cites` / `cited by`; the pronoun is OQL-text syntax only). Keep in
// lockstep with the server's oql_lang._ROW_SUBJECT_RENDER.
const ROW_SUBJECT_COLUMNS = new Set(["referenced_works", "cited_by", "related_to"]);
function foldPredicates(tokens) {
  const opById = {};
  tokens.forEach((t) => { if (t.t === "op") opById[t.id] = t; });
  tokens.forEach((t) => {
    if (t.t === "col" && opById[t.id]) {
      if (ROW_SUBJECT_COLUMNS.has(t.column_id || t._column)) return; // bare chip
      const raw = (opById[t.id].text || "").trim();
      t._predicate = PRETTY_OP[raw] || raw;
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

// The green "new <type>" placeholder-chip label for a not-yet-picked value of property `p`.
const placeholderLabelFor = (p) =>
  `new ${((p && (p.display_name || p.name)) || "value").toLowerCase()}`;

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
      // (#554) `value: null` WITH display text is the null sentinel (`unknown`)
      // — a real chip, not an unpicked placeholder; only a truly blank value
      // (empty string, or null with nothing to show) gets the placeholder.
      // isEmptyVbrick (builderLayout) is the one spelling of that predicate.
      if (!t._entityName && isEmptyVbrick(t)) {
        t._placeholder = true;
        t._placeholderLabel = placeholderLabelFor(p);
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
// (The #507 collapse/disclosure machinery — collapsedGroups, the column-grid arrows, the
// `[join ×N]` summary chip — was removed 2026-07-05: layoutLines' #523 indent model emits
// neither `cols` cells nor `summary` tokens, so none of it could render.)
// A scalar/search "New" inside a NESTED ( ) group adds an empty vleaf to the COMMITTED
// tree (Option B, #472) — not a flattening draft. The empty can't survive a server
// round-trip (v2ToOqo strips it via vFilled), so until the user commits we render a
// transient box for it locally, spliced into displayLines right after the clicked chip.
// { id, afterId, columnId, kind, numeric, join }. Cleared on blur/Enter (then we
// round-trip: a typed value comes back as a real chip; an empty one is stripped).
const pendingScalar = ref(null);
// An empty ENTITY value awaiting its first pick (the entity counterpart of pendingScalar):
// set when a new empty entity vleaf is added (per-line `+` menu AND/OR, #507) and its
// in-place picker is opened; onPickEntityValue SETS this empty one rather than appending.
const gapEntityFillId = ref(null);
// DRAFTS ARE A SINGLETON (oxjob #561): while ANY draft chip is open — a new-filter draft,
// a transient scalar box, or an empty entity gap awaiting its pick — every "create another
// draft" affordance is inert. Two half-built chips at once confused users (Jason QA 2026-07-05).
// Guarded at the handler level (addRootFilter / onPlusAuto / addAndRowForClause /
// onAddScalarValue / addSiblingValueToGroup / onChipAdd) so keyboard chords hit the same
// wall as clicks. Edits of committed values (editingEntityId / editTextId) don't count —
// they're not drafts.
const hasOpenDraft = computed(() =>
  drafts.value.length > 0 || !!pendingScalar.value || gapEntityFillId.value != null);

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
  // `paren` carries the group addr.
  {
    const { clauseAddr, vleafAddr, groupAddr } = buildAddrById(tree && tree.where);
    flat.forEach((t) => {
      let a;
      if (t.t === "vbrick") {
        if (vleafAddr.has(t.id)) a = vleafAddr.get(t.id);                 // factored value brick
        else if (clauseAddr.has(t.id)) a = t._boolPhrase ? clauseAddr.get(t.id) : `${clauseAddr.get(t.id)}.1`; // boolean / simple-clause value
      } else if (t.t === "col" || t.t === "op") {
        a = clauseAddr.get(t.id);
      } else if (t.t === "paren") {
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
  const out = layoutLines(foldPredicates(flat), {
    key: "s",
    rootId: tree && tree.where && tree.where.id,
    editingId: pendingScalar.value && pendingScalar.value.id, // keep a merged AND sub-group expanded while editing (#523 Phase 4)
  });
  // Tag each committed line with the one logical row a band-click selects (#475). (The old
  // per-line +/🗑 affordance was removed 2026-06-17 — the add-value "+" chip is now injected
  // inline above; row delete/add live in the toolbar.)
  const tIdx = treeIndex.value;
  out.forEach((line) => {
    line._selectRow = rowTargetForLine(line);
    line._rowNode = rowNodeForLine(line);     // the node this row represents (delete target), or null
    line._plus = plusContextForLine(line);    // the per-line "+" insert context, or null (#507)
    // Left-gutter kebab context (#523 round 4 as the end-of-line dropdown; moved to the kebab in
    // round 10): clauseId = the owning filter (for "AND clause"); deleteId = the node this row
    // deletes ("delete line"); canAndClause = the filter's value can take another AND-ed value
    // group (multi-valuable kind: entity/text/number).
    let _clauseId = null;
    for (const t of (line.tokens || [])) { const c = tIdx.tokenClause[t.id]; if (c != null) { _clauseId = c; break; } }
    const _colId = _clauseId != null ? tIdx.tokenColumn[_clauseId] : null;
    line._menu = {
      clauseId: _clauseId,
      canAndClause: _colId != null && MULTI_VALUE_KINDS.has(kindForColumn(_colId)),
      deleteId: line._rowNode && line._rowNode.id,
    };
    // The LAST VISIBLE chip on the line (#523 round 6): the trailing `or` button must travel
    // as ONE no-wrap unit WITH this chip, so neither can wrap onto a line by itself. When that
    // chip is a brick (the overwhelming case, incl. every value chip) we render the controls
    // INSIDE its `.bl-tok` (made inline-flex/no-wrap, `bl-tok--tail`). For a text-block tail we
    // fall back to the after-loop controls. #575: indexes into `_valueToks` (the value cell —
    // the field cell can never host the tail).
    line._tailIdx = -1; line._tailBrick = false;
    for (let i = (line._valueToks || []).length - 1; i >= 0; i--) {
      const tt = line._valueToks[i].t;
      if (tt === "textblock" || BRICK_TYPES.has(tt)) { line._tailIdx = i; line._tailBrick = BRICK_TYPES.has(tt); break; }
    }
    // the top-level sibling row this line belongs to (clause / clause-group id), for the
    // same-type DIM (#475): a line dims when its top row holds no same-type value list. Read
    // off any token that maps into the tree (chrome lines — entity/sort/return — map to none).
    line._topRow = null;
    for (const t of (line.tokens || [])) {
      const tr = treeIndex.value.topRowOf[t.id];
      if (tr != null) { line._topRow = tr; break; }
    }
  });
  // Bottom-edge ghost `&` (#575 — the down-axis "add AND clause" control): marks the LAST
  // row of each filter whose value can take another AND-ed group. The button floats on the
  // boundary below that row (no furniture line). Runs before the draft splice — an open
  // draft disables the ghost anyway (hasOpenDraft), so a spliced draft row can't misplace it.
  for (let i = 0; i < out.length; i++) {
    const m = out[i]._menu;
    out[i]._andGhost = !!(m && m.canAndClause && m.clauseId != null
      && (i === out.length - 1 || !out[i + 1]._menu || out[i + 1]._menu.clauseId !== m.clauseId));
  }
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
  let lastDraftIdx = -1;
  drafts.value.forEach((d) => {
    const dl = draftLine(d);
    let at = -1, depth = 1;
    // a click-the-gap FILTER draft (#494) renders AT its anchor gap; an unanchored draft appends.
    if (d._anchor) {
      const g = findGroupNode(d._anchor.parentId);
      if (g) {
        const sampleId = (g.children.find((c) => firstLineOf(c.id) >= 0) || {}).id;
        if (sampleId != null) depth = out[firstLineOf(sampleId)]?.depth ?? 1;
        if (d._anchor.index < g.children.length) at = firstLineOf(g.children[d._anchor.index].id);
        else if (sampleId != null) { const ls = firstLineOf(g.children[g.children.length - 1].id); at = ls >= 0 ? ls + 1 : -1; }
      }
    }
    // Lead chip on a NEW-filter draft row (#523 round 6): the `→` arrow when it's the very first
    // row (empty query), else a pale-peach `&` — so the draft aligns under the lead column instead
    // of jumping flush-left (the bottom "add filter" `&` stays put when clicked). Only new-filter
    // drafts get it; an in-place field-edit draft (`d.editing`) keeps its prior no-lead behaviour.
    if (!d.editing) dl._lead = out.length ? "and" : "arrow";
    if (at >= 0) { dl.depth = depth; out.splice(at, 0, dl); lastDraftIdx = at; }
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
  // The ADD-ROW furniture line carries no content (just the faint `&` add buttons), so it gets
  // NO gutter number and doesn't consume one — it reads as belonging to the filter above, not as a
  // numbered query row (#523 round 3). Its blank ::before keeps the column width, so alignment holds.
  let lineNo = 0;
  out.forEach((line) => { line.addr = String(++lineNo); });
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
        value: v.value, display: v.display, negated: v.negated, entity: v.entity, _draft: true,
        // literal typed text awaiting surface routing — no `stemmed` re-derive (#560 bug 2)
        _rawInput: !!v._rawInput });
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
      // `v.value === null` is the null sentinel (`unknown`, #554) — a real value;
      // only "" is a blank box (matches vFilled in v2ToOqo).
      const hasValue = !!(d.value && d.value.children
        && d.value.children.some((v) => v.value !== ""));
      if (!hasValue) {
        // `negated` mirrors the picker's NOT-first toggle (#561): checking "not" on a
        // valueless draft shows the `not` prefix on the placeholder chip immediately —
        // the real negation rides the eventual pick's payload (applyEntityNegate).
        tokens.push(enrichToken({ t: "vbrick", id: `${d.id}_ph`, column_id: d.column_id,
          value: "", kind: "entity", _draft: true, _placeholder: true, negated: !!d._negNext,
          _pickerId: d.id, // the type-on input forwards its keydowns to this picker (#561)
          _placeholderLabel: placeholderLabelFor(p) }));
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

function draftLine(d) {
  // A draft top-level filter renders as a plain new filter ROW: its draft field chip
  // in the field column, the rest in the value cell (#575 splitLineCells — a draft row
  // gets a field cell like any committed filter). No `where` chrome.
  const body = draftBodyTokens(d);
  const cells = splitLineCells(body);
  return { key: `d${d.id}`, cols: [], depth: 0, _indent: 0, items: body.map((tok) => ({ tok })),
    tokens: body, _fieldToks: cells.fieldToks, _valueToks: cells.valueToks,
    _fieldConn: cells.fieldConn, _hasFieldMenu: false };
}

// ---- rendering (OQO -> server) ----------------------------------------------
// currentOqo folds COMPLETE drafts into the OQO so the OQL string is live while a
// new filter is being typed; on a swap render those drafts are absorbed into the
// returned v2 tree and dropped from the local list.
function currentOqo() {
  // corpus only applies to works (#523 round 5) — never tag a non-works query with a corpus.
  const oqo = v2ToOqo({ tree: v2.value, getRows: getRows.value, corpus: getRows.value === "works" ? corpus.value : "core", sortBy: sortBy.value, select: oqoSelect.value });
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
// The date value editor (relocated off the old toolbar) is a small chip-anchored overlay.
const dateEditor = ref(null);                 // { x, y, value, tok } | null
const selectionActive = computed(() => selectedIds.value.size > 0);
const isSelected = (tok) => selectedIds.value.has(tok.id);
// The clicked LEADER chip (filter-property `col`, close `)` paren, or a sole boolean-phrase
// value) — { id, t } | null. Clicking a leader selects ONLY that chip (it paints black via
// OqlBrick `:active`); the clause it acts on shows its scope as a grey band + black rails
// (bline--sel), NOT by blacking out every child chip (Jason 2026-06-19 review #3). A group's
// open `(` and close `)` are ONE thing (Jason 2026-06-22) — they share the group id AND the
// `paren` type, so the id+type match below already paints both.
const selectedChip = ref(null);
const isLeaderSelected = (tok) => {
  const s = selectedChip.value;
  return !!s && s.id === tok.id && s.t === tok.t;
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
// committing swap renumbers ids, so we clear on swap. `editTextId` kicks a text value
// into in-place edit (by value id).
const selection = ref(null);
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
  selection.value = null; editTextId.value = null;
  editingEntityId.value = null;
};

// The id of the value vgroup directly under a clause (its OUTERMOST value group / top-level
// and-or join target), or null when the clause is single-valued (`leaf`, no vgroup).
// O(1) off treeIndex — this runs per line inside displayLines (per-keystroke hot path),
// where the old full-tree edit.locate scan was O(lines × treeSize).
const clauseValueGroupId = (cid) => treeIndex.value.clauseTopVgroup[cid] ?? null;
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
  editTextId.value = null; editingEntityId.value = null;
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
  if (dateEditor.value) closeDateEditor();
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

// ("Wrap as subclause" — the #472 canGroupValues/canGroupFilters batch action — was removed
// 2026-07-05: its only entry point was the dead chip-dropdown menu. The v2Edit wrap helpers
// remain, tested, if a live gesture wants it back.)
const clearSelection = () => {
  if (selectedIds.value.size) selectedIds.value = new Set();
  selectionAnchorId.value = null;
  lastSingleId.value = null;
  selectedChip.value = null;
  closeDateEditor();
  clearActive();
};

// ---- unified multi-select across VALUES and whole FILTERS/CLAUSES (oxjob #475, Jason 2026-06-22)
// A selection is HOMOGENEOUS by type: value chips group by value-kind (author vs text — you can't
// mix), and whole expressions (a filter or an any/all subclause) are all one "filter" type; the
// two never mix. A leader chip (filter-property `col`, close `)`) contributes the EXPR-NODE id
// it represents — the owning clause for a filter, the group id for a subclause.
// `removeNodes` already accepts those ids (and a mix of a plain filter + a sibling
// subclause), so delete + Backspace work once they're in selectedIds.
const selectionTypeOf = (id) => (isValueId(id) ? `v:${chipTypeForValueId(id)}` : "filter");
// The expr-node id a structural leader chip selects as a whole unit, or null when it isn't a
// selectable expression (the implicit ROOT group — the whole query body — can't be multi-selected).
const exprIdForLeader = (tok) => {
  const r = rowForToken(tok);
  if (!r || r.root) return null;
  return r.clauseId != null ? r.clauseId : r.groupId;   // the clause (a filter) or the subclause group
};
// Toggle one id (a value OR a whole expression) into the multi-selection, enforcing the
// same-type constraint. Seeds an empty set with the last single-selected unit (if type-compatible)
// so "click A, then Cmd-click B" yields {A, B}. Pops the multi menu at ≥2, closes it below.
const toggleSelection = (id) => {
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
  // no batch popup menu (#507); ⌫ deletes the set.
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
const onChipSelect = ({ id, mode }) => {
  if (mode === "single") {
    // NO chip menus anymore (Jason 2026-06-24, #507): a single click just SELECTS the value
    // (paints it black). Re-clicking the already-selected value toggles it OFF. Deletion is ⌫
    // or drag-to-tray; negation is typing `not`; editing is double-click. No popup.
    const vt = findValueTok(id);
    // A sole BOOLEAN-PHRASE value IS its whole filter — select the whole one-chip filter (row).
    if (vt && vt._boolPhrase && treeIndex.value.sole[id]) {
      const cid = treeIndex.value.tokenClause[id];
      if (selectedChip.value && selectedChip.value.id === id) { clearSelection(); return; } // re-click → off
      selectRowTarget({ groupId: clauseValueGroupId(cid), clauseId: cid, withProperty: true }, vt);
      return;
    }
    // re-click the already-selected value → deselect.
    if (selection.value?.kind === "value" && selection.value.id === id) { clearActive(); return; }
    lastSingleId.value = id;
    selectedChip.value = null;
    selection.value = { kind: "value", id };
    editTextId.value = null;
    editingEntityId.value = null;
    if (selectedIds.value.size) selectedIds.value = new Set(); // single replaces any multi
    selectionAnchorId.value = null;
    return;
  }
  if (!id) return;
  // A sole BOOLEAN-PHRASE chip is a whole FILTER (its name+value share one chip) — a multi gesture
  // on it selects the FILTER (its clause), so it deletes alongside other filter-property
  // selections instead of joining a value-bag. (oxjob #475, Jason 2026-06-22.)
  const bvt = findValueTok(id);
  if (bvt && bvt._boolPhrase && treeIndex.value.sole[id]) {
    toggleSelection(treeIndex.value.tokenClause[id]);
    return;
  }
  // A plain Cmd/Ctrl TOGGLE is exactly toggleSelection (one same-type policy — it seeds from
  // lastSingleId and enforces the homogeneous-selection constraint in one place).
  if (mode !== "range") { toggleSelection(id); return; }
  // RANGE (Shift): sweep same-type value chips between the anchor and the clicked chip.
  clearActive();
  const set = new Set(selectedIds.value);
  // Seed an empty selection with the last plain-clicked chip so "click banana, then Shift-click
  // cherry" yields the span even though banana wasn't modifier-clicked (Jason). Only seed
  // when type-compatible — a value selection must NOT pull in a filter `lastSingleId` (a structural
  // leader chip now records its expr id there too). (oxjob #475, Jason 2026-06-22.)
  if (set.size === 0 && lastSingleId.value && lastSingleId.value !== id
      && selectionTypeOf(lastSingleId.value) === selectionTypeOf(id)) set.add(lastSingleId.value);
  // SAME-TYPE CONSTRAINT (oxjob #475, Jason 2026-06-17): a selection holds chips of ONE type;
  // the range never sweeps in other-type values in between.
  const curType = set.size ? chipTypeForValueId([...set][0]) : null;
  const incType = isValueId(id) ? chipTypeForValueId(id) : null;
  if (curType != null && incType != null && incType !== curType) return;
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
  selectedIds.value = set;
  // Multi-select still highlights the set (⌫ deletes it via the window keydown listener); there
  // is no batch popup menu anymore (Jason 2026-06-24, #507 — no chip menus).
};

const closeDateEditor = () => { dateEditor.value = null; };

// Single-click a structural chip → select its clause's scope. Clicking the SAME chip again
// deselects (Jason 2026-06-22). Cmd/Ctrl-click instead folds this chip's whole FILTER/CLAUSE
// into the multi-selection (the structural analog of value multi-select — Jason 2026-06-22).
// Cmd-click is the only multi-select gesture (oxjob #501). ("Menu" is historical: the #475
// menus-on-chips pivot was undone in #507 — the `@menu` intent now just means "leader click".)
const onChipMenu = (tok, el, ev) => {
  const exprId = exprIdForLeader(tok);
  const wantsMulti = !!(ev && (ev.metaKey || ev.ctrlKey));
  if (exprId != null && wantsMulti) {
    toggleSelection(exprId);
    return;
  }
  // NO menus (Jason 2026-06-24, #507): clicking a committed structural chip (a locked field)
  // just SELECTS its whole filter row (black); re-clicking the same chip deselects. The filter
  // is deletable via ⌫ / drag. (Search-scope / operator change was the menu's job — dropped.)
  if (selectedChip.value && selectedChip.value.id === tok.id && selectedChip.value.t === tok.t) {
    clearSelection();
    return;
  }
  const r = rowForToken(tok);
  if (r) selectRowTarget(r, tok); else clearSelection();
  // Seed a later Cmd-click extension with this leader's expr id (selectRowTarget cleared it).
  lastSingleId.value = exprId;
};

// Open the date calendar overlay for a date value, anchored just below the chip.
const openDateEditor = (tok) => {
  const el = document.querySelector(`[data-vid="${tok.id}"]`);
  const r = el && el.getBoundingClientRect();
  // No layout box → don't paint at screen (0,0) — same guard as the old menu anchor (#493).
  const xy = r && (r.width || r.height) ? { x: r.left, y: r.bottom + 4 } : { x: 0, y: 0 };
  const v = String(tok.value != null ? tok.value : (tok.display != null ? tok.display : tok.text || "")).trim();
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

// The selection is ephemeral: a click anywhere that isn't a value chip dismisses it (the user
// "uses it or loses it"). Clicks ON a chip are left to the chip's own handler (Cmd-extend /
// re-anchor / clear-and-act). Also drops a stale anchor when you click into empty space.
const onDocClick = (e) => {
  const t = e.target;
  const onChip = t?.closest?.(".val-chip");
  // The date editor closes on ANY click outside the editor itself (Jason 2026-06-19:
  // "clicking *anywhere* should close the menu").
  const onDateOverlay = t?.closest?.(".date-editor-overlay");
  if (!onDateOverlay) closeDateEditor();
  // Selection-clear keeps the softer exemptions: a click on a chip, the toolbar, or another
  // Vuetify overlay (field dialog / entity picker) leaves any live selection intact. (Band
  // clicks `.bline` stopPropagation, so this only fires for clicks OUTSIDE the lines.)
  const onToolbar = t?.closest?.(".builder-toolbar");
  const onOverlay = t?.closest?.(".v-overlay__content");
  if (onChip || onDateOverlay || onToolbar || onOverlay) return;
  // Outside everything: clear the WHOLE selection. Must use clearSelection (not clearActive) —
  // clearActive leaves `selectedChip` set, so a row-selected leader chip (e.g. a committed field)
  // stayed painted black after clicking away even though its row highlight cleared (#507 selection
  // bug, Jason 2026-06-24). clearSelection wipes selectedChip / selectedIds / selection together.
  lastSingleId.value = null;
  if (selection.value || selectionActive.value || selectedChip.value) clearSelection();
};

const onDeleteSelected = () => {
  const ids = [...selectedIds.value];
  if (!ids.length) return;
  clearSelection();
  edit.removeNodes(v2.value, ids, drafts.value);
  renderQuery({ swap: true });
};

// A `request-edit` from a VALUE chip (double-click / Enter) routes by kind to the WORKING editor
// (`editValue` is the single router):
//   • entity value → re-pick the entity (open its picker in replace mode).
//   • date         → open the anchored calendar overlay.
//   • text/number  → edit in place (set editTextId, which flips OqlTextChip into its input).
const onRequestEdit = (tok) => {
  selection.value = { kind: "value", id: tok.id };
  if (selectedIds.value.size) selectedIds.value = new Set();
  editValue(tok);
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
  // Numeric/range filters show ONLY `is` (oxjob #527): the predicate (≥/=/≤/range) is no
  // longer picked from a menu — the user types it into the value chip and numericExpr parses
  // it. So a numeric draft always starts at equality; ops[0] for a range field would be `>=`.
  const first = kind === "number" ? { op: "is", unary: false } : (ops[0] || { op: "is", unary: false });
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
  // booleans fold immediately (default true) so they render as `<name> is true`
  // from the outset; click the true/false brick to flip it. (oxjob #363.)
  if (kind === "boolean") { foldNow(d); return; }
  // entity: open the (invisible) picker in place and focus the type-on-chip input (#561 —
  // the query is typed on the placeholder chip); scalar: focus the empty value box.
  if (kind === "entity") { openPicker(d.id); focusValueSoon(`${d.id}_ph`); }
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
// COMMIT a typed text value, parsing a leading `not ` into REAL negation (#523 round 3 — typing
// `not foo` is the only way to negate a text chip; it must store value=`foo` + negated, NOT the
// literal phrase `"not foo"`). A quoted `"not foo"` is one verbatim word → stays positive. Boolean
// EXPRESSIONS (`a or b`, nested) are handled earlier by decomposeValue; this is the single-value
// path, so we only special-case the single leading-`not` leaf and otherwise fall back to setValue
// (which routes the search surface). Entity/date/boolean never reach this text path.
const setTypedValue = (tok, raw) => {
  const ast = (tok._kind !== "entity" && tok._kind !== "date" && tok._kind !== "boolean")
    ? parseValueExpr(raw) : null;
  if (ast && ast.t === "leaf" && ast.negated) {
    edit.setValue(v2.value, tok.id, ast.value, { numeric: tok._numeric }, drafts.value);
    edit.setNeg(v2.value, tok.id, true, drafts.value);
    return;
  }
  edit.setValue(v2.value, tok.id, raw, { numeric: tok._numeric }, drafts.value);
};
// Re-parse a leading `not ` out of a value ALREADY in the tree (the blur path: onValueInput wrote
// the raw `not foo` on each keystroke, and a blur-commit doesn't go through setTypedValue). No-op
// for anything that isn't a single leading-`not` text leaf, so it's safe to run on every blur.
const reparseStoredNegation = (id, numeric) => {
  const hit = edit.locate(v2.value, id, drafts.value);
  if (!hit) return;
  const cur = hit.kind === "vleaf" ? hit.node.value
    : (hit.kind === "clause" && hit.node.leaf ? hit.node.leaf.value : null);
  if (typeof cur !== "string") return;
  const ast = parseValueExpr(cur);
  if (ast && ast.t === "leaf" && ast.negated) {
    edit.setValue(v2.value, id, ast.value, { numeric }, drafts.value);
    edit.setNeg(v2.value, id, true, drafts.value);
  }
};
// The current value of a chip ALREADY in the tree / draft (onValueInput wrote each keystroke).
// Used by the blur path, which doesn't receive the input value.
const readChipValue = (id) => {
  const hit = edit.locate(v2.value, id, drafts.value);
  if (!hit) return null;
  if (hit.kind === "vleaf") return hit.node.value;
  if (hit.kind === "clause" && hit.node.leaf) return hit.node.leaf.value;
  return null;
};
// Numeric value-expression commit (oxjob #527): parse a numeric chip's typed text into 1+
// comparison filters (equality / inequality / range -> TWO filters / value list) and apply
// them. A new-filter DRAFT stores the pre-built OQO on `_numericFilter` (folded by
// draftToFilter); a committed clause mutates in the tree (spawning AND-sibling rows for a
// range). Returns true when it handled the commit; false (non-numeric / unparseable) so the
// caller falls back to the normal setValue path. The trailing server render canonicalizes.
const commitNumericExpr = (tok, raw) => {
  if (!tok._numeric) return false;
  const parsed = parseNumericExpr(raw);
  if (!parsed) return false;
  const draft = tok._draft ? draftOwning(tok.id) : null;
  if (draft) {
    draft._numericFilter = edit.numericFiltersToOqo(parsed.filters, draft.column_id);
    draft.editing = false;
    return true;
  }
  return edit.applyNumericExpr(v2.value, clauseOf(tok), parsed.filters, drafts.value);
};
const onValueKeydown = (tok, e) => {
  if (e.key === "Backspace" && tok.negated && e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    edit.toggleNeg(v2.value, tok.id, drafts.value); e.preventDefault(); afterEdit(tok); return;
  }
  // Backspace in an EMPTY draft / pending value box cancels it (oxjob #507): removes the
  // just-created chip and folds the draft away. Guarded to a truly-empty input with the caret
  // at the start so it never fights normal mid-text deletion.
  if (e.key === "Backspace" && e.target.value === "" && e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    const pending = !!(pendingScalar.value && pendingScalar.value.id === tok.id);
    const draft = tok._draft ? draftOwning(tok.id) : null;
    if (pending || draft) { e.preventDefault(); cancelEmptyValue(tok, draft, pending); return; }
  }
  if (e.key !== "Enter") return;
  // KEYBOARD TERM-CHAINING (oxjob #523 Phase 4): while BUILDING a value (a brand-new draft filter
  // or a transient pendingScalar box), Enter and ⇧Enter both "commit this value + open a fresh
  // empty term", differing only in the axis — OR = right, AND = down (the builder's two screen
  // axes). Hint shown by the chip: `↵ or · ⇧↵ and`.
  //   • Enter        → a new OR term on the SAME row   (apple ↵ banana → apple or banana)
  //   • ⇧Enter       → a new AND value-row             (banana ⇧↵ pie  → (apple or banana) and pie)
  //   • Cmd/Ctrl+Enter → also an OR term (kept from #475's "add sibling")
  // This CHANGES plain Enter from pre-#523 "commit & done" to "commit & keep adding ORs"; you
  // FINISH by clicking away / ⌫ on the empty trailing box (which drops it, vFilled). A COMMITTED
  // chip re-edited in place (double-click) keeps the old "Enter = save & done" (the else branch).
  const cmd = e.metaKey || e.ctrlKey;
  const newRow = e.shiftKey && !cmd; // ⇧Enter → AND row
  e.preventDefault();
  e.stopPropagation(); // Enter now performs a builder action — keep it off the run-query shortcut
  // Value-chip decomposition (oxjob #507 Phases 5 + 6): if the typed text is a boolean
  // expression (`a or b or c`, `a and b`, or a parenthesized `(a or b) and c`), split it
  // into the matching value tree in place of the single literal value. Only for typed
  // values (entity/date/boolean never reach this inline-text Enter path). decomposeValue
  // is a no-op (returns false) for a single plain value, so we fall back to setValue.
  const canDecompose = tok._kind !== "entity" && tok._kind !== "date" && tok._kind !== "boolean";
  // Resolve the owning draft BEFORE decomposeValue mutates the tree — decomposition
  // replaces this value's vleaf (its id disappears), so a post-mutation draftOwning(tok.id)
  // would miss it.
  const owningDraft = tok._draft ? draftOwning(tok.id) : null;
  // Numeric chips (oxjob #527) parse a numeric expression FIRST — equality / inequality /
  // range (-> TWO filters) / value list. When handled it's a complete commit (no term-chaining),
  // so it's treated like a decomposition below. Non-numeric / unparseable returns false and we
  // fall through to the boolean decomposition + setValue path.
  const numericHandled = commitNumericExpr(tok, e.target.value);
  const decomposed = !numericHandled && canDecompose &&
    edit.decomposeValue(v2.value, tok.id, e.target.value, { numeric: tok._numeric }, drafts.value);
  const finalCommit = numericHandled || decomposed; // a self-contained value commit, not a term to chain
  const pending = pendingScalar.value && tok.id === pendingScalar.value.id;
  if (tok._draft || pending) {
    // 1) COMMIT the current value onto its leaf (idempotent for the typed path; covers a
    //    programmatic edit that didn't emit `input`). setTypedValue parses a leading `not `
    //    into real negation (#523). Clear the transient/edit flags.
    if (!finalCommit) setTypedValue(tok, e.target.value);
    if (pending) pendingScalar.value = null;
    else if (owningDraft) owningDraft.editing = false;
    // 2) A DECOMPOSED / numeric-parsed value is already a complete commit — chaining a term
    //    after the (now-replaced) token id is meaningless, so just background-sync and stop.
    if (finalCommit) { renderQuery({ swap: true }); return; }
    // 3) OPEN a fresh term (OR same-row / AND new-row) and focus it. NO *swap* render: the
    //    canonicalizing round-trip STRIPS empty values (vFilled, #507), so the new box would
    //    vanish — it renders from the local tree and survives.
    addTermAfter(tok, newRow ? "and" : "or", owningDraft);
    // 4) RUN THE SEARCH NOW (Jason 2026-06-28): the term we just committed IS part of the query,
    //    so results must update immediately — the old behaviour deferred execution to blur, so
    //    pressing Enter on a draft value committed the chip but never re-ran the search. A
    //    swap:false COMMIT render fires the execution channel (update:oqo) WITHOUT the tree-reseed
    //    that would strip the fresh empty term box. The committed value folded into the OQO above
    //    (the draft is complete + non-editing now); the empty new box contributes nothing (vFilled
    //    strips it), so the query that runs is exactly the settled one.
    renderQuery({ swap: false, commit: true });
    return;
  }
  {
    const sibling = cmd;
    const addedEmptySibling = sibling && !finalCommit;
    // A COMMITTED scalar value chip re-edited in place (double-click / toolbar "Edit" → type →
    // Enter — NOT a draft, NOT the transient pendingScalar box). Without this branch the edit was
    // silently lost (oxjob #493 Bug 2): every keystroke writes the tree via onValueInput, but
    // Enter sets `closingViaEnter` in the chip which suppresses the blur-commit, so renderQuery
    // never fired — the server render didn't run, the OQL string mirror + validation went stale,
    // and a not-yet-flushed debounced render could be dropped. Re-assert the value onto its leaf
    // (idempotent for the typed-input path; also covers a programmatic edit that didn't emit
    // `input`), then run the background swap render to commit + sync.
    if (!finalCommit) setTypedValue(tok, e.target.value); // parses a leading `not ` into negation (#523); numeric (#527) already applied
    if (addedEmptySibling) onChipAdd(tok);             // Cmd/Ctrl+Enter chains a fresh empty sibling box
    if (!addedEmptySibling) renderQuery({ swap: true });// swap would strip the empty sibling (#507) — skip it then
  }
};
// Pending blur-commit timers, cancelled on unmount (see onBeforeUnmount).
const blurTimers = new Set();
const onValueBlur = (tok) => {
  editTextId.value = null; // the in-place edit ended; don't re-trigger on the next render
  const timer = setTimeout(() => {
    blurTimers.delete(timer);
    if (document.querySelector(".v-overlay--active")) return;
    // pending committed value (nested "New", #472): clear the transient box and let the
    // swap render canonicalize — a typed value comes back as a real chip in the nested
    // group; an empty one is stripped by v2ToOqo (vFilled) and vanishes on the swap.
    if (pendingScalar.value && tok.id === pendingScalar.value.id) pendingScalar.value = null;
    // Numeric expression commit on click-away (oxjob #527) — BEFORE the draft fold, so a range
    // sets the draft's `_numericFilter` (making it complete) and folds to TWO rows. onValueInput
    // wrote the raw text per keystroke, so read it back from the tree/draft.
    const numericHandled = commitNumericExpr(tok, readChipValue(tok.id));
    if (tok._draft) {
      const d = draftOwning(tok.id);
      if (d && !d.editing && !edit.draftComplete(d) && d.column_id) { drafts.value = drafts.value.filter((x) => x !== d); return; }
      if (d) { d.editing = false; anchorDraftIfReady(d); } // commit: fold into the query on the swap
    }
    // Commit a leading `not ` typed into a text box on BLUR (the Enter path uses setTypedValue;
    // a click-away commits the raw value onValueInput wrote, so re-parse it here). #523 round 3.
    if (!numericHandled && tok._kind !== "entity" && tok._kind !== "date" && tok._kind !== "boolean")
      reparseStoredNegation(tok.id, tok._numeric);
    renderQuery({ swap: true });
  }, 150);
  blurTimers.add(timer);
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
};
const onZoneDrop = () => {
  zoneHot.value = false;
  const id = chipDrag.draggingId.value;
  // Claim the drop so the chip's dragend outside-rect fallback skips it (no double-remove).
  chipDrag.draggingId.value = null;
  if (!id) return;
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

// value-CHIP drag slots (oxjob #475) — declared here (before onLinesDragover reads them); the
// handlers + geometry live in the "drag-to-reorder value CHIPS" section below.
const valueDropSlots = ref([]);    // {parentId, index, x, y, h} vertical insertion points
const activeValueSlot = ref(null); // the slot nearest the cursor (renders the vertical bar)
let dragHostRect = null;           // lines-host rect, frozen at dragstart (dragover runs ~60Hz)

// The tree node this line REPRESENTS — the kebab menu's "Delete line" target — or null when
// the line isn't a deletable row (a loose-values continuation line, a draft line). A committed
// filter `col` on the line → the WHOLE filter — derived from the line's OWN tokens (not
// `_selectRow`), so the FIRST filter resolves even though it now rides the `works where` line
// and `_selectRow` reports that line as the root group (#507 Phase 4). Falls back to the
// select-row target for value-bag lines; never the root or a loose-values line. (Was the
// row-drag node until #523 round 10 removed row drag-to-reorder.)
const rowNodeForLine = (line) => {
  const toks = (line && line.tokens) || [];
  const idx = treeIndex.value;
  const col = toks.find((t) => t.t === "col" && !t._draft && idx.tokenClause[t.id]);
  if (col) return { id: col.id, kind: "filter" };   // a whole filter (incl. its value bag)
  const t = line && line._selectRow;
  if (!t || t.values || t.root) return null;
  if (t.clauseId != null) return { id: t.clauseId, kind: "filter" };
  if (t.groupId != null) {
    const isValueGroup = idx.tokenClause[t.groupId] != null;
    return { id: t.groupId, kind: isValueGroup ? "valuebag" : "filter" };
  }
  return null;
};

// The per-line "+" insert context (oxjob #507), or null for lines that get no "+"
// (chrome / draft / loose continuation with no clause). Keys off the line's OWN tokens:
//   - mode "value"  : the line ends in a real value → AND/OR land adjacent to it + New filter.
//                     `canAndOr` is true only for multi-valuable kinds (entity/text/number).
//   - mode "header" : a field + op with the value bag stacked BELOW (no value on this line) →
//                     AND/OR PREPEND to the front of the field's bag + New filter.
//   - mode "filter" : a boolean/unary/date single-value line (no AND/OR) → just New filter.
const plusContextForLine = (line) => {
  const idx = treeIndex.value;
  const toks = (line && line.tokens) || [];
  const multi = (kind) => MULTI_VALUE_KINDS.has(kind);
  const vbs = toks.filter((t) => t.t === "vbrick" && !t._draft && !t._placeholder && idx.tokenClause[t.id] != null);
  const lastV = vbs[vbs.length - 1];
  if (lastV) {
    const columnId = idx.tokenColumn[lastV.id];
    const kind = kindForColumn(columnId);
    // TERMINAL value = the filter's OVERALL last value (idx.clauseLast). Only the terminal value
    // also offers "new filter" alongside its and/or, so a nested multi-bag filter shows the
    // filter-plus once, on its last line (Jason 2026-06-24, #507 bug: was line 7, should be 34).
    const clauseId = idx.tokenClause[lastV.id];
    return { mode: "value", valueId: lastV.id, clauseId, columnId, kind,
      canAndOr: multi(kind), terminal: idx.clauseLast[clauseId] === lastV.id };
  }
  const col = toks.find((t) => t.t === "col" && !t._draft && idx.tokenClause[t.id] != null);
  if (col) {
    const columnId = idx.tokenColumn[col.id];
    const kind = kindForColumn(columnId);
    if (clauseValueGroupId(col.id))
      return { mode: "header", clauseId: col.id, columnId, kind, canAndOr: multi(kind) };
    return { mode: "filter", clauseId: col.id, columnId, kind, canAndOr: false };
  }
  // a clause reached only via a phrase brick (boolean/unary) → just New filter
  const anyTok = toks.find((t) => !t._draft && idx.tokenClause[t.id] != null);
  if (anyTok) return { mode: "filter", clauseId: idx.tokenClause[anyTok.id], columnId: idx.tokenColumn[anyTok.id], kind: null, canAndOr: false };
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

// (Row drag-to-reorder — the grab handle, drop slots, and heavy horizontal drop-indicator —
// was removed in #523 round 10; the left-gutter kebab replaced the handle. Value-CHIP drag
// below is unaffected and remains the only drag in the builder.)

// While dragging value chips over the lines area, light up the slot nearest the cursor
// (vertical slot between chips, nearest by 2D distance since chips wrap). preventDefault is
// what makes the lines a valid drop target — so the cursor shows "move".
const onLinesDragover = (e) => {
  if (chipDrag.draggingKind.value !== "value" || !valueDropSlots.value.length) return;
  const hostRect = dragHostRect || { left: 0, top: 0 };
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const x = e.clientX - hostRect.left, y = e.clientY - hostRect.top;
  let best = null, bestD = Infinity;
  for (const s of valueDropSlots.value) {
    const d = Math.hypot(s.x - x, (s.y + s.h / 2) - y);
    if (d < bestD) { bestD = d; best = s; }
  }
  activeValueSlot.value = best;
};

// Apply a drag-drop tree mutation with a defensive revert: snapshot the tree, run the move,
// and if the server marks the result invalid put the snapshot back + toast. The swap render
// is id-preserving (renderQuery → reconcileTreeIds), so the moved node SLIDES to its new slot
// instead of snapping, and the revert is smooth too. (No "moved" toast — the slide animation
// makes the move self-evident, Jason 2026-06-18.)
const applyMoveWithRevert = (mutate) => {
  const before = JSON.stringify(v2.value);
  if (!mutate()) return;
  clearSelection();
  renderQuery({ swap: true }).then(() => {
    if (validation.value && validation.value.valid === false) {
      v2.value = JSON.parse(before);          // incompatible move slipped the type filter
      renderQuery({ swap: true });
      store.commit("snackbar", "Can’t move there");
    }
  });
};

const onLinesDrop = () => {
  if (chipDrag.draggingKind.value === "value") onValueDrop();
};

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
// same container (onLinesDragover/onLinesDrop), routed by `draggingKind`.
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
  dragHostRect = hostRect; // frozen for the drag's duration — onLinesDragover runs at ~60Hz
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
  clearValueDrag();
  applyMoveWithRevert(() => edit.moveValues(v2.value, ids, s.parentId, s.index, drafts.value));
};

// A value-chip drag ended. The chip's own onDragend (useChipShortcuts) still owns the
// release-OUTSIDE-the-builder delete; here we just clear the reorder state + the dim. (A drop
// consumed by onValueDrop / onZoneDrop already nulled draggingId, so no double-handling.)
const clearValueDrag = () => { valueDropSlots.value = []; activeValueSlot.value = null; valueDragIds.value = new Set(); valueDragType.value = null; dragHostRect = null; };
watch(chipDragging, (on) => { if (!on) clearValueDrag(); });

// ---- per-line "+" insert affordance (oxjob #507, rev — Jason 2026-06-25) -----------------
// Each line that can take synonyms shows, on hover, ONE ghost "+" at its end (no menu):
//   • "+"   → add a term joined by the line's OWN (dominant) conjunction — OR by default,
//            AND if the line is already AND-joined. Same conjunction stays flat (OR inline,
//            AND a new operand line). This is exactly "select the last chip + Cmd+Enter".
// (A second "opposite-conjunction" arrow button was tried and removed — Jason 2026-06-25.)
// New TOP-LEVEL filters come from the toolbar's "Add filter" now — not a per-line affordance.
// All inserts are LOCAL tree edits (addAdjacentValue / prependBagValue) — same-instant render
// as every other builder edit, no server round-trip. The hover reveal is pure CSS
// (OqlLineTailControls) — no per-line hover state.

// Open the right editor on a freshly-inserted empty value: an entity opens its in-place
// picker (which SETS the empty vleaf on pick); a scalar drops a focused value box. `res` is
// { id, join } from addAdjacentValue / prependBagValue.
const openNewValueEditor = (res, columnId, kind) => {
  if (!res) return;
  // entity: the gap placeholder is a type-on-chip input (#561) — focus it so typing starts.
  if (kind === "entity") { gapEntityFillId.value = res.id; openPicker(res.id); focusValueSoon(res.id); }
  else { pendingScalar.value = { id: res.id, columnId, kind, numeric: kind === "number", join: res.join }; focusValueSoon(res.id); }
};

// The end-of-line insert is ALWAYS an `or` term (#523 round 3, Jason): OR = the rightward axis
// in the 2D model, so adding to the right of a row extends that row's OR-group — even on an
// AND-joined value row (`A and foo` + right → `A and (foo or _)`, which addAdjacentValue nests by
// precedence). AND = down, reached via the separate add-row `&` button. So this never adds an AND
// term. On a header line it prepends an OR value to the front of the field's bag.
const onPlusAuto = (ctx) => {
  if (!ctx) return;
  if (hasOpenDraft.value) return; // drafts are a singleton (#561)
  clearSelection();
  const join = "or";
  const res = ctx.mode === "header"
    ? edit.prependBagValue(v2.value, ctx.clauseId, join, drafts.value)
    : edit.addAdjacentValue(v2.value, ctx.valueId, join, drafts.value);
  openNewValueEditor(res, ctx.columnId, ctx.kind);
};

// (#575: onAddPlus — the persistent add-value "+" for OR-of-filters rows — was removed with
// the addplus token; filter-scope OR is gated to the OQL tab by representableShape.)

// AND=down: append a new AND value-row to the clause's WHOLE value (`(apple or banana)` →
// `((apple or banana) and _)`) and open a focused box on the new empty value. Forces a NEW ROW
// (AND) rather than the line's dominant join. The empty row value is local until typed. (#523
// Phase 4; #575: reached from the bottom-edge ghost `&` — the down-axis control.)
const addAndRowForClause = (clauseId) => {
  if (clauseId == null) return;
  if (hasOpenDraft.value) return; // drafts are a singleton (#561)
  clearSelection();
  const res = edit.addAndRow(v2.value, clauseId, drafts.value);
  if (!res) return;
  const columnId = treeIndex.value.tokenColumn[clauseId];
  openNewValueEditor(res, columnId, kindForColumn(columnId));
};

// ---- left-gutter kebab menu (#523 round 10) ---------------------------------
// Each line carries `_menu` ({ clauseId, canAndClause, deleteId }) computed in displayLines.
//   Add filter  → a brand-new filter, AND-ed in as the next sibling (addRootFilter + anchor)
//   Delete line → remove the node this row represents (removeRow)
// (#575: the interim "AND clause" item moved to the bottom-edge ghost `&`; canAndClause now
// drives that ghost's visibility.)
// AND filter inserts as the NEXT SIBLING beneath the line whose menu was used (#523 round 6 — was
// `addRootFilter()`, which appended at the very bottom). The new draft carries an `_anchor` so once
// completed it splices into the root group right after this line's top-level filter.
const onMenuAndFilter = (line) => { addRootFilter(anchorAfterTopRow(line && line._topRow)); };
// {parentId, index} to splice a new filter immediately AFTER the top-level filter `topId` among its
// root-group siblings. Returns null when there's no root GROUP (a single-filter query is a bare
// clause) — the draft then appends at the end, which already IS the next sibling.
const anchorAfterTopRow = (topId) => {
  const root = v2.value && v2.value.where;
  if (topId == null || !root || root.node !== "group") return null;
  const i = root.children.findIndex((c) => c.id === topId);
  return i < 0 ? null : { parentId: root.id, index: i + 1 };
};
const onMenuDeleteLine = (line) => {
  const id = line && line._menu && line._menu.deleteId;
  if (id != null) removeRow(id);
};

// Promote a complete toolbar DRAFT into the committed tree IN PLACE (no server round-trip),
// preserving its clause id + value subtree (edit.placeDraftInTree). Returns the committed clause
// id, or null if it couldn't place (caller falls back). Used by ⇧Enter when adding an AND row to a
// brand-new filter: the draft render path can't show AND-nesting, so we commit first and let the
// full committed layout render the rows. (#523 Phase 4.)
const commitDraftLocally = (d) => {
  if (!d || !edit.draftComplete(d)) return null;
  const root = v2.value && v2.value.where;
  if (!root || root.node !== "group") return null; // no implicit root group → fall back to OR
  if (!edit.placeDraftInTree(v2.value, d, root.id, root.children.length, drafts.value)) return null;
  drafts.value = drafts.value.filter((x) => x !== d);
  return d.id;
};

// Open a fresh empty term after the just-committed value `tok`, joined by `join` (the Enter/⇧Enter
// keyboard chords, #523 Phase 4). "or" = a new OR term on the SAME row; "and" = a new AND value-row.
// Focuses the new box; NO swap render (the round-trip strips the empty value, #507). `owningDraft`
// is the draft that owns `tok`, or null for a committed/pending value.
const addTermAfter = (tok, join, owningDraft) => {
  clearSelection();
  // DRAFT (brand-new filter): keep editing locally. OR adds a flat sibling the draft path renders
  // directly (no pendingScalar). AND needs nesting the draft can't render → commit the draft into
  // the tree first, then add the AND row on the committed clause.
  if (owningDraft) {
    if (join === "and") {
      const clauseId = commitDraftLocally(owningDraft);
      if (clauseId != null) {
        const res = edit.addAndRow(v2.value, clauseId, drafts.value);
        openNewValueEditor(res, treeIndex.value.tokenColumn[clauseId], tok._kind);
        return;
      }
      // fall through to an OR term when the draft couldn't be committed locally (e.g. no root group)
    }
    const nid = edit.addValueAfter(v2.value, tok.id, drafts.value);
    focusValueSoon(nid);
    return;
  }
  // COMMITTED / PENDING value: OR = an adjacent value; AND = a new row across the whole clause.
  // Both are transient empties (openNewValueEditor → picker / focused box) until typed.
  let res;
  if (join === "and") {
    const clauseId = treeIndex.value.tokenClause[tok.id];
    res = clauseId != null
      ? edit.addAndRow(v2.value, clauseId, drafts.value)
      : edit.addAdjacentValue(v2.value, tok.id, "or", drafts.value);
  } else {
    res = edit.addAdjacentValue(v2.value, tok.id, "or", drafts.value);
  }
  openNewValueEditor(res, treeIndex.value.tokenColumn[tok.id] || tok._column, tok._kind);
};

// Commit a text-block chip's raw-text edit (#523 round 2): replace the whole vgroup subtree
// with the parse of the typed expression. A pure-OR list unpacks into separate blocks; anything
// else (AND / nested parens) stays a text block — the swap render re-canonicalizes either way.
const onTextBlockCommit = (tok, text) => {
  if (text != null && String(text).trim() === (tok.text || "").trim()) return; // no-op edit
  clearSelection();
  edit.setValueExpr(v2.value, tok._vgroupId, text, {}, drafts.value);
  renderQuery({ swap: true });
};

// ---- group negate (group `not` chrome from OqlKeywordChip) ------------------
// Addresses the group by its keyword-token id and re-renders from the server. Whole-
// group DELETE is the row toolbar's Delete (onRowSelectionDelete → removeRow); clause
// CREATION is #472's select-and-wrap. (#428 Phase B dropped the menu paths.)
const onGroupNegate = (tok) => { edit.negateGroup(v2.value, tok.id, drafts.value); renderQuery({ swap: true }); };

// Boolean chip click → toggle (oxjob #507, Jason 2026-06-25). A true/false value flips its
// value (`is true` ⇄ `is false`); a boolean PHRASE ("it's open access") has no displayed value,
// so it toggles negation (affirmative ⇄ negated phrasing). Both render through the swap.
const onBoolToggle = (tok) => {
  if (tok._boolPhrase) {
    edit.toggleNeg(v2.value, tok.id, drafts.value);
  } else {
    const cur = tok.value === true || tok.value === "true";
    edit.setBool(v2.value, tok.id, !cur, drafts.value);
  }
  renderQuery({ swap: true });
};

// Date value picked from the calendar (oxjob #467). Set the ISO value (a plain string),
// then fold the draft / re-render the committed clause.
const pickDate = (tok, iso) => {
  edit.setValue(v2.value, tok.id, iso, { numeric: false }, drafts.value);
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};

// Cancel an empty draft / pending value box (oxjob #507, Backspace-on-empty). A PENDING
// sibling box (`pendingScalar`) removes just its empty vleaf — the swap render canonicalizes
// the now-singleton group back to the original value. A DRAFT clause's value box drops the
// whole draft (the half-built new filter is abandoned).
const cancelEmptyValue = (tok, draft, pending) => {
  if (pending) {
    pendingScalar.value = null;
    edit.removeNodes(v2.value, [tok.id], drafts.value);
    renderQuery({ swap: true });
    return;
  }
  if (draft) drafts.value = drafts.value.filter((x) => x !== draft);
};

const onAddScalarValue = (tok) => {
  if (tok._draft) { const nid = edit.addValueAfter(v2.value, tok.id, drafts.value); focusValueSoon(nid); return; }
  if (hasOpenDraft.value) return; // drafts are a singleton (#561)
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
const onPickEntityValue = (tok, { value, label, negate }) => {
  // RE-PICK (oxjob #428): double-click / Enter / toolbar Edit opened this value's picker in
  // replace mode (editingEntityId) — set the new entity ON this value instead of adding a
  // sibling.
  if (editingEntityId.value === tok.id) {
    editingEntityId.value = null;
    edit.setEntityValue(v2.value, tok.id, value, label, drafts.value);
    applyEntityNegate(tok.id, negate);
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
    applyEntityNegate(tok.id, negate);
    pickers.get(tok.id)?.closePicker?.();
    renderQuery({ swap: true });
    return;
  }
  const nid = edit.addValueAfter(v2.value, tok.id, drafts.value);
  if (nid) { edit.setEntityValue(v2.value, nid, value, label, drafts.value); applyEntityNegate(nid, negate); }
  const d = tok._draft ? draftOwning(tok.id) : null;
  if (d) foldNow(d); else renderQuery({ swap: true });
};
// Apply the entity picker's "not" footer (oxjob #507): SET the just-set value's negation to the
// checkbox state. setNeg (not toggleNeg) so it's idempotent — a live in-edit toggle (onEntitySetNegate)
// may have already negated this node, and re-picking a value preserves the node's negated flag; a
// blind toggle would double-flip it. (#523 round 3.)
const applyEntityNegate = (id, negate) => { if (id != null) edit.setNeg(v2.value, id, !!negate, drafts.value); };
// The entity picker's "not" footer toggled WHILE editing a committed value (double-click → picker
// open → check "not", no re-pick): negate the value immediately so the checkbox actually does
// something (#523 round 3 — previously the footer only modified the NEXT pick, so checking it on an
// already-placed value was a no-op). Guarded so it only fires on a real state change.
const onEntitySetNegate = (tok, neg) => {
  // NOT-first on a valueless gap placeholder (#561): just flag the empty vleaf locally so the
  // chip shows the `not` prefix — no render (a swap would strip the empty value via vFilled),
  // no submit. The negation state also rides the eventual pick payload (applyEntityNegate).
  if (tok._placeholder) { edit.setNeg(v2.value, tok.id, !!neg, drafts.value); return; }
  if (!!tok.negated !== !!neg) onToggleNeg(tok);
};
// NOT-first on a DRAFT clause's valueless placeholder (#561): the picker's "not" footer was
// toggled before any value was picked. Mirror it onto the draft so draftBodyTokens renders the
// `not` prefix on the placeholder chip; nothing submits until a value is also picked (the
// negate then rides the pick payload as before).
const onDraftSetNegate = (clauseId, neg) => {
  const d = draftById(clauseId);
  if (d) d._negNext = !!neg;
};
// Re-pick a committed entity value (double-click / Enter / toolbar Edit): open its in-place
// picker in REPLACE mode. The picker is registered under the value id; on pick,
// onPickEntityValue sees editingEntityId === tok.id and sets the value rather than adding.
const onEditEntity = (tok) => {
  if (!tok || tok._kind !== "entity" || tok._draft) return;
  editingEntityId.value = tok.id;
  openPicker(tok.id);
};
// Committed entity value picker closed WITHOUT picking (blur / click-away). Two cases (#523 round 6):
//   - a freshly-added EMPTY gap-fill value (the end-of-line `or` / add-value created an empty entity
//     placeholder, e.g. `new type`) → REMOVE it so it disappears on blur, matching the scalar box
//     (a typed scalar box's empty vleaf is stripped on the swap; an entity placeholder needs an
//     explicit remove since nothing else clears it). `gapEntityFillId` flags exactly that value.
//   - a re-pick of an EXISTING value (editingEntityId) → just close; the value stays.
const onAbandonEntityValue = (tok) => {
  editingEntityId.value = null;
  if (gapEntityFillId.value === tok.id) {
    gapEntityFillId.value = null;
    edit.removeNode(v2.value, tok.id, drafts.value);
    renderQuery({ swap: true });
  }
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
const onPickEntityValueTo = (clauseId, { value, label, negate }, isDraft) => {
  const nid = edit.addValue(v2.value, clauseId, drafts.value);
  if (nid) { edit.setEntityValue(v2.value, nid, value, label, drafts.value); applyEntityNegate(nid, negate); }
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
const openPicker = (id) => { typeOnQuery.value = ""; nextTick(() => pickers.get(id)?.openPicker()); };

// TYPE-ON-CHIP entity autocomplete (oxjob #561): the query is typed directly on the
// placeholder chip's input; this ref feeds every picker's `external-search` (only one can be
// open — drafts are a singleton). Arrow/Enter keydowns are forwarded to the open picker's
// remote-nav methods; Escape (or Backspace on an empty input) closes it, which fires the
// picker's `abandon` and runs the normal draft/gap cleanup.
const typeOnQuery = ref("");
const onTypeOnInput = (tok, q) => {
  typeOnQuery.value = q;
};
const onTypeOnKeydown = (tok, e) => {
  const p = pickers.get(tok._pickerId != null ? tok._pickerId : tok.id);
  if (!p) return;
  // stopPropagation everywhere: the input IS the picker menu's activator element, and a
  // bubbling Enter/Space/ArrowDown would hit Vuetify's activator keyboard handling and
  // re-toggle the menu we just acted on.
  if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); p.moveHl?.(1); }
  else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); p.moveHl?.(-1); }
  else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); p.pickHl?.(); }
  else if (e.key === "Escape" || (e.key === "Backspace" && !e.target.value)) {
    e.preventDefault(); e.stopPropagation(); p.closePicker?.();
  }
  else if (e.key === " ") e.stopPropagation();
};
const clauseOf = (tok) => treeIndex.value.tokenClause[tok.id] || tok.id;

// the value chip's "New": entity → open its picker in place; scalar → a fresh
// editable value box (onAddScalarValue pops the clause to a focused draft box).
const onChipAdd = (tok) => {
  if (!tok._draft && hasOpenDraft.value) return; // drafts are a singleton (#561)
  // Cmd/Ctrl+Enter on a SELECTED chip spawns a fresh sibling draft and moves focus there —
  // so the original chip must lose its selection (it's no longer the active target). Clearing
  // here is harmless for the trailing "+" add-value path too (nothing is selected). (#507 bug.)
  clearSelection();
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
  if (hasOpenDraft.value) return false; // drafts are a singleton (#561)
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
// ---- add filter -------------------------------------------------------------
// A new flat top-level filter (toolbar "Add Filter", per-line "+", field-chip Cmd+Enter).
// Clause CREATION is #472's select-and-wrap, not a menu — there's no "add clause" path.
const addRootFilter = (anchor = null) => {
  if (hasOpenDraft.value) return; // drafts are a singleton (#561)
  const d = edit.makeDraft();
  // an optional {parentId, index} positions the completed draft IN PLACE (next-sibling insert from
  // the line menu, #523 round 6); without it the draft appends at the end (toolbar / bottom button).
  if (anchor) d._anchor = anchor;
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

// ---- hover ------------------------------------------------------------------
// The per-line hover highlight + the line-tail control reveal are pure CSS now
// (`.bline:hover` — cleanup 2026-07-05; the old `hoveredLineIdx` ref invalidated the
// whole builder render on every line-crossing). Only the breadcrumb's hovered-addr
// tracking below stays in JS.
const clearHover = () => { hoveredAddr.value = null; };

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

// Shared FIELD-column width (#575 two-column table) — the gutterW trick: hug the widest
// field chip this query renders. MUST measure exactly what OqlFieldChip renders: chipLabel =
// `tok._label + ' ' + tok._predicate`. NOT tok.text — `_label` is the property's
// display_name (enrichToken), which can differ from the token text; measuring text
// under-measured "display name" and the value cell OVERLAPPED the chip (Jason round 2).
// Field chips are mono at --brick-fs with 2×10px padding (.prop-chip-leaf); +24px covers
// padding/border. Chips are RIGHT-aligned in the cell, so residual over-measure becomes
// slack on the invisible LEFT side — the right boundary stays flush. Capped so a
// pathological field name degrades to overflow instead of eating the value column. Null
// (unset) when no line has a field (.bl-field then falls back to the bare connector slot).
const fieldColW = computed(() => {
  let chars = 0;
  for (const l of displayLines.value) {
    const toks = l._fieldToks || [];
    if (!toks.length || l._fieldConn) continue;
    let w = 0;
    for (const t of toks) {
      const base = ((t._label || t.text || "").trim()) || "select field";
      const pred = ((t._predicate || "")).trim();
      w += base.length + (pred ? pred.length + 1 : 0);
    }
    chars = Math.max(chars, w);
  }
  return chars ? `calc(${Math.min(chars, 36)}ch + 24px)` : null;
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

// Corpus change (oxjob #481): re-run the query with the new corpus. No loadProperties —
// corpus doesn't change the field catalog, only which corpus the query runs against.
watch(corpus, () => {
  if (suppressCommit) return;
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
  corpus.value = oqo.corpus || "core"; // seed corpus from the loaded query (#481)
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
const isFieldTarget = (e) => {
  const tag = (e.target?.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || !!e.target?.isContentEditable;
};
// The shared selection-key dispatch: Escape dismisses any live selection; Backspace/Delete
// removes the highlighted node — a row, a single value, or the #472 multi-set. Called from
// BOTH handlers below; the ops are idempotent, so a double-fire is a harmless no-op.
const handleSelectionKey = (e) => {
  if (e.key === "Escape" && (selection.value || selectionActive.value)) { clearSelection(); return; }
  if (e.key === "Backspace" || e.key === "Delete") {
    if (selectedRow.value) { e.preventDefault(); onRowSelectionDelete(); return; }
    if (activeTok.value) { e.preventDefault(); onActiveDelete(); return; }
    if (selectionActive.value) { e.preventDefault(); onDeleteSelected(); }
  }
};
const onWindowKeydown = (e) => {
  if (isFieldTarget(e)) return;
  handleSelectionKey(e);
};
const onBuilderKeydown = (e) => {
  const inField = isFieldTarget(e);
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
  // Escape works even from a field; ⌫/Delete only outside one (there it edits text). A focused
  // value chip handles its own ⌫ + stops propagation, so this is the fallback for unfocused cases.
  if (e.key === "Escape" || !inField) handleSelectionKey(e);
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
  // Don't let a trailing keystroke debounce / blur-commit timer fire a render (a wasted
  // network round-trip + state writes) on a dead component — the builder is mounted and
  // unmounted repeatedly by its hosts.
  debouncedRender.cancel();
  blurTimers.forEach(clearTimeout);
  blurTimers.clear();
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
/* DATE value editor (oxjob #475): the calendar on a fixed chip-anchored overlay
   (viewport coords). */
.date-editor-overlay { position: fixed; z-index: 2400; background: #fff; border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.16), 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden; }

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
     chip lands directly under its parent's opener. One var drives all of it.
     26px = a PERFECT SQUARE against the 26px brick height (Jason 2026-06-24, #507): the
     `&`/`or` connector and the `→` arrow cells read as exact squares. */
  --chip-w: 26px;
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
/* Subject-entity selector (oxjob #507): the leading control. A thin divider sets it
   apart from the action buttons that follow. */
.tb-entity { margin-right: 2px; }
/* The entity selector is NOT a chip (Jason 2026-06-24, #507): it's the toolbar's primary
   control and lives in the toolbar "environment", not on the chip canvas, so it reads as a
   plain Linear-style toolbar button — NO colour fill, NO monospace, just quiet text + caret
   with a subtle hover. We override the shared `.entity-chip` look (peach fill, --prop vars)
   and the builder's `.v-chip--size-small` monospace rule, both of which carry weight here. */
/* NB: `class="tb-entity"` lands on EntitySelectorButton's OUTER <div>, not the inner v-chip, so
   target the `.entity-chip` directly. `font-family` needs !important to beat the builder's
   `.v-chip--size-small { monospace }` (3-class) rule; the !important bg/color beat the chip's own
   `.entity-chip { ... !important }` on specificity (2 classes vs 1). */
.builder-toolbar :deep(.entity-chip) {
  background: transparent !important;
  color: rgba(0, 0, 0, 0.72) !important;
  font-family: inherit !important;
  font-weight: 500;
  letter-spacing: 0;
  border-radius: 6px;
  box-shadow: none;
  padding: 0 6px;
}
.builder-toolbar :deep(.entity-chip:hover) { background: rgba(0, 0, 0, 0.06) !important; }
/* the caret + "search" prefix ride along in the same quiet ink (no peach affix tint). */
.builder-toolbar :deep(.entity-affix) { color: rgba(0, 0, 0, 0.5); }
.builder-toolbar :deep(.entity-chip .v-chip__append) { color: rgba(0, 0, 0, 0.5); margin-inline-start: 2px; }
.tb-sep {
  width: 1px;
  align-self: stretch;
  margin: 3px 6px;
  background: rgba(0, 0, 0, 0.12);
}
/* editor controls (copy · clear) use the stock icon-button recipe — no overrides —
   so they match icon buttons elsewhere in the app. */
/* Lines stack with the SAME uniform gap (--gx) between them as between chips —
   the column gap here is the between-line vertical whitespace (Jason 2026-06-17). */
/* position:relative anchors the vdrop-indicator; the bottom padding keeps a breathing gap
   below the last row (oxjob #475, Jason 2026-06-17). */
.builder-lines { display: flex; flex-direction: column; gap: var(--gx); position: relative; padding-bottom: 18px; }
/* The query rows live in their own flex column (same gap) as the sort/return/add lines.
   (The row FLIP/enter/leave transitions were ripped out 2026-06-20 — see template note.) */
.bline-flow { display: flex; flex-direction: column; gap: var(--gx); }
/* (#523 round 5: the empty-state hint was dropped — the permanent ghost "add filter" affordance
   below the rows is now the empty-state CTA, leading with a `→` arrow when there are no filters.) */
/* Vertical drop-indicator (oxjob #475 chip drag, Jason 2026-06-17): a heavy black VERTICAL
   bar marking the gap BETWEEN two chips (or before the first / after the last) where the
   dragged value chip(s) will land. Positioned (left/top/height) inline from the active chip
   slot's geometry. */
.vdrop-indicator {
  position: absolute;
  width: 3px;
  margin-left: -1.5px;      /* center the bar on the chip margin */
  background: #1a1a1a;
  border-radius: 2px;
  z-index: 5;
  pointer-events: none;
}
/* (The line-tail `or` button styles live in OqlLineTailControls.vue. The `.add-plus`
   OR-of-filters chip was removed in #575 — filter-scope OR gates to the OQL tab.) */
/* Leading filter-scope chip (#523 round 2): the `→` arrow (first filter row) or pale-PEACH `&`
   (subsequent filter rows). Same square metrics + indent column as the connectors/parens so all
   filter rows align down the page. Peach = filter scope (vs periwinkle value connectors). Inert
   (decorative space-filler this round). Sits left of `.bl-body`, after the gutter. */
.bl-lead {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  width: var(--chip-w, 26px);
  min-width: var(--chip-w, 26px);
  margin-right: var(--gx);
  margin-top: 0;
  border-radius: 4px;
  background: var(--conn-bg, #f9ebe2);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
}
/* the arrow is a touch larger + lighter so it reads as a flow marker, not a glyph to act on. */
.bl-lead--arrow { font-size: 1rem; }
/* on a selected row the lead chip darkens with the rest of the row's chips. */
.bline--sel .bl-lead { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* #575: a row with no lead (value-continuation rows) keeps an EMPTY transparent spacer in the
   lead column so the field column starts at one shared x on every row. Placed after the --sel
   rule so a selected continuation row's spacer stays transparent too. */
.bl-lead.bl-lead--spacer, .bline--sel .bl-lead.bl-lead--spacer { background: transparent; }
/* FIELD-column cell (#575 two-column table; round 2 geometry): fixed shared width so every
   VALUE cell starts at one shared x-edge. The cell = the field column (--field-w, computed
   per render from the widest field chip, the gutterW trick) PLUS a one-chip CONNECTOR SLOT
   on its right edge. Content is RIGHT-aligned: a filter row's field chip ends exactly one
   --gx before the slot (padding-right keeps the slot empty), and a value-continuation row's
   `&` connector sits IN the slot — so the field chip's right edge and the `&` chips align,
   and the field-chip→first-value margin is the same constant (chip + 2 gaps) on every row
   (Jason round 2: the measured-width slack made that margin inconsistent; right-alignment
   pushes any remaining measurement slack to the invisible left side). Mono at --brick-fs so
   the ch-based --field-w measures true. */
.bl-field {
  flex: 0 0 auto;
  box-sizing: border-box;
  width: calc(var(--field-w, 0px) + var(--chip-w) + var(--gx));
  min-width: calc(var(--field-w, 0px) + var(--chip-w) + var(--gx));
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: var(--gx);
  margin-right: var(--gx);
  min-height: 26px;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs);
}
/* a filter row keeps the connector slot EMPTY: its content stops one chip + gap short. */
.bl-field:not(.bl-field--conn) { padding-right: calc(var(--chip-w) + var(--gx)); }
/* (#575 round 2: the ghost `&` moved into OqlLineTailControls, after the ghost `or`.) */
/* Permanent "add filter" affordance line (#523 round 5): the always-present trailing line. Ghost
   peach — the `&`/`→` lead chip + the "add filter" label sit transparent at rest and fill peach
   when the row is hovered, reading as a quiet but permanent invitation to add another filter. */
.bline--addfilter { cursor: pointer; }
/* Inert while a draft chip is open — drafts are a singleton (#561). */
.bline--addfilter-off { cursor: default; opacity: 0.4; pointer-events: none; }
.bl-lead.bl-lead--ghost { background: transparent; }
/* The add-filter affordance is now a single bold real ellipsis `…` in the lead slot (#523 round 7):
   the `&` chip + separate "..." button collapsed into one glyph. Muted grey + bold at rest so it
   reads as a quiet "more" without fighting the query; warms to peach when the row is hovered. */
.bl-lead.bl-lead--addfilter { color: var(--bl-muted, #6b7280); font-weight: 700; }
.bline--addfilter:hover .bl-lead--ghost { background: var(--conn-bg, #f9ebe2); }
.bline--addfilter:hover .bl-lead--addfilter { color: var(--conn-fg, #b25d06); }
/* The trailing controls travel as ONE no-wrap unit (#523 round 6, Jason): the last chip + the `or`
   button + the line-menu chevron must never wrap onto a line by themselves. For a BRICK tail the
   controls (OqlLineTailControls) live inside the chip's `.bl-tok`, switched here from
   `display:contents` to an inline-flex no-wrap box so the chip + controls are a single flex item.
   #523 round 9: the selector MUST be `.bl-tok.bl-tok--tail` (2 classes) — the round-6 single-class
   `.bl-tok--tail` was DEFEATED by the later `.bl-tok { display: contents }` rule (equal specificity,
   later source wins), so `display:contents` quietly stuck and the controls stayed loose + wrapped
   alone. The extra class makes inline-flex win regardless of source order. */
.bl-tok.bl-tok--tail { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: var(--gx); }
/* Left-gutter kebab (#523 round 10, Notion-inspired — replaced the #475 row drag handle).
   Lives in the far-left margin, revealed on row hover (and pinned visible while its menu is
   open, via aria-expanded); absolutely positioned so it never shifts the row. */
.row-kebab {
  position: absolute;
  /* Sits in the roomy left whitespace lane (the bline's 40px padding-left, measured from the
     -16px bleed edge): `left: 16px` floats it in from the card's content edge, leaving a
     clear gap to the line-number gutter that follows. */
  left: 16px;
  top: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(0, 0, 0, 0.38);
  cursor: pointer;
  visibility: hidden;
  z-index: 4;
}
.bline:hover .row-kebab,
.row-kebab[aria-expanded="true"] { visibility: visible; }
.row-kebab:hover,
.row-kebab[aria-expanded="true"] { color: rgba(0, 0, 0, 0.75); background: var(--bl-hover-bg, #eceff3); }
/* DISABLED row (oxjob #475, Jason 2026-06-17): the moment a value chip is selected (or a chip
   drag starts), every filter row that holds no SAME-TYPE value list is dimmed + made inert —
   you can't select or drop into a row of a different type, so it reads as off-limits. */
.bline--disabled { opacity: 0.32; pointer-events: none; }
.bline {
  display: flex;
  align-items: flex-start;
  /* positioning context for the absolutely-placed left-margin kebab (#523 round 10) */
  position: relative;
  border-radius: 0;
  /* Full-card-width bleed on EVERY line: equal +/- margin so the hover/selection band reaches
     the card edges. The left padding reserves a roomy WHITESPACE LANE for the kebab
     (#507, Jason 2026-06-23: "plenty of white space on that left margin") — the line-number
     gutter + content start after it. The left-margin RAILS were removed (#507): hover/selection
     now read from the background band alone. */
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 40px;
  padding-right: 16px;
}
/* The band whitespace / inert marks (parens, conjunctions, property, dot) are NOT clickable
   anymore (menus-on-chips pivot — a band click is a no-op), so they show the default cursor, not
   a pointer (Jason 2026-06-19 review #3). The `.bl-body` content keeps its own cursors (value
   chips = pointer, inputs = text); the left-margin kebab shows pointer. */
/* The band is programmatically focused on row-select (so Enter/Cmd+Enter shortcuts reach the
   builder, #475) — focus is invisible; the black rails already mark the selected row. */
.bline:focus, .bline:focus-visible { outline: none; }
/* hover block-highlight: an extra-subtle grey band spanning the full canvas (Jason 2026-06-17:
   ~half as dark as before, 0.025 black; HOVER-ONLY — the :not(--sel) keeps the darker selected
   band winning when a selected row is hovered). Pure CSS — no per-line hover state (the old
   `hoveredLineIdx` ref re-rendered the whole builder on every line-crossing). Scoped to
   `.bline-flow` so the sort/return/add-filter chrome lines don't pick up a band they never had. */
.bline-flow > .bline:hover:not(.bline--sel) {
  background: rgba(0, 0, 0, 0.025);
}
/* selected-scope row (oxjob #475, Jason 2026-06-19 review #3): clicking a leader chip selects
   only that chip; the clause it acts on shows its "blast radius" here — the SAME light-grey band
   as hover PLUS a bold black line number. (Earlier the band was hover-only; Jason now wants the
   grey fill on selection too so the scope reads at a glance.) */
.bline--sel {
  background: rgba(0, 0, 0, 0.045);
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
  /* HANGING indent (#523 round 2; simplified in #575 — the old `--vind` value-continuation
     indent is gone, the field COLUMN aligns AND-arms now): pad 2 chip-widths and pull the
     first brick back 2 (below), so the FIRST visual row starts flush at the value column's
     x-edge while every WRAPPED continuation visual row hangs in by 2 chip-widths — making a
     long, wrapped logical line read as one line. */
  padding-left: calc(2 * var(--chip-w));
  /* Line-continuation marker on WRAPPED rows (#523 round 5, Jason): a very-light-gray hooked
     arrow (↳) at the left of every WRAPPED visual row of a long logical line (NOT in the
     line-number gutter). Pure CSS, no per-row hooks: a repeat-y SVG tiled one-per-row (26px chip +
     2px gap = 28px pitch). On the FIRST visual row the opaque chips (which start flush-left, pulled
     back over this zone) paint over the arrow, so it shows ONLY where a row actually wraps.
     #523 round 6 (Jason): the tile is a full CHIP-WIDTH square with the arrow CENTERED in it,
     parked in the chip slot immediately left of the wrapped content (one --gx gap to the first
     wrapped chip) — same internal centering + inter-chip spacing as a real `&`/`or` chip. #575:
     the slot x is constant now (value content always starts at the value column). */
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='26'%20height='28'%20viewBox='0%200%2026%2028'%3E%3Cpath%20d='M10%209V16H16M14%2013.5L16.5%2016L14%2018.5'%20fill='none'%20stroke='%23d4d4d4'%20stroke-width='1.4'%20stroke-linecap='round'%20stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: repeat-y;
  background-position: calc(var(--chip-w) - var(--gx)) 0;
  background-size: var(--chip-w) 28px;
}
/* Hanging-indent pull-back: tuck the FIRST brick (the lead value chip / periwinkle `&`) back
   the 2-chip hang so the first visual row sits at the value-indent; only WRAPPED rows hang
   further in. The #487 footer-hover wrapper `.bl-tok` is `display:contents` (no box → margins
   ignored on it), so when it's the first child the pull-back lands on the chip INSIDE it. */
.bl-body > :first-child,
.bl-body > .bl-tok:not(.bl-tok--tail):first-child > :first-child { margin-left: calc(-2 * var(--chip-w)); }
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
