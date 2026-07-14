<template>
  <div ref="builderRootEl" class="builder" :style="V2_ROLE_CSS_VARS" @keydown="onBuilderKeydown">
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
             top-left. Clicking it picks the entity the query runs over; the canvas below is
             a pure list of filters. #595 round 2 (Jason): the verb sits ON THE TOOLBAR as
             plain text — the button contains only the entity ("works (core) ⌄"), so the
             clickable thing is exactly the thing you're choosing. Round 3: "search" → "get"
             ("get works where …", matching the canvas's leading "where"). -->
        <!-- #523 round 5: always opt into the corpus selector so the works entry always offers the
             two "works (core)" / "works (all)" rows; the selector only shows the corpus in its label
             when the subject IS works. -->
        <span class="tb-search-label">get</span>
        <EntitySelectorButton class="tb-entity" :model-value="getRows"
          :corpus="corpus"
          @update:model-value="getRows = $event" @update:corpus="corpus = $event" />
        <!-- round 12 (Jason): the "where" lives up HERE now — "get works (core) where…"
             reads as one monospace phrase; the canvas's first row leads with a blank box. -->
        <span class="tb-where-label">where&#8230;</span>

        <!-- (#575 round 8, Jason: the toolbar "filter-plus" icon is gone — adding a filter now
             lives entirely on the canvas: the trailing "and…" button, the empty-state "Add a
             filter" button, and the ghost `or`/`&` per-row controls.) -->
        <v-spacer />

        <!-- (#575 filter-OR experiment concluded 2026-07-10: the spanning "either … or"
             block won; the layout toggle and the losing candidates were stripped.) -->

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

      <div ref="linesEl" class="builder-lines" :style="{ '--num-w': gutterW, '--field-w': fieldColW, '--pred-w': predColW }"
        @mouseleave="clearHover()"
        @mouseover="onAddrHover"
        @dragstart="onLinesDragstart" @dragover="onLinesDragover" @drop.prevent="onLinesDrop">
        <!-- Vertical drop-indicator (oxjob #475 chip drag): a heavy black bar on a chip's margin
             marking where the dragged value chip(s) will land — between two chips, or at a list's
             start/end. Positioned (left/top/height) from the active chip slot's geometry. -->
        <div v-if="activeValueSlot" class="vdrop-indicator"
          :style="{ left: activeValueSlot.x + 'px', top: activeValueSlot.y + 'px', height: activeValueSlot.h + 'px' }"
          aria-hidden="true" />
        <!-- Horizontal drop-indicator for ROW drag (#595 round 2): a bar on the boundary
             between two top-level rows where the dragged row will land. -->
        <div v-if="activeRowSlot" class="rowdrop-indicator"
          :style="{ top: activeRowSlot.y + 'px' }" aria-hidden="true" />
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
        <!-- Round 20 (Jason): FAMILY hover — hovering a PARENT line highlights its whole
             family (the parent via plain :hover, the descendants via .bline--famhov,
             computed from the hovered line's key + the _level sequence). -->
        <div v-for="(line, lineIdx) in displayLines" :key="line.key" class="bline"
          :class="{ 'bline--sel': isSelectedLine(lineIdx), 'bline--disabled': isDimmedLine(lineIdx), 'bline--sub': !!line._level, 'bline--num1': !line._level, 'bline--famhov': famHovKeys.has(line.key) }"
          :data-addr="line.addr"
          :style="lineStyle(line)" tabindex="-1"
          @mouseenter="hoverLineKey = line.key" @mouseleave="hoverLineKey = null"
          @click.stop="onLineClick(lineIdx, $event)"
          @dblclick.stop="onLineDblclick(lineIdx, $event)">
          <!-- (#595 round 4, Jason: the row DELETE trash moved from the left gutter to the END
               of the line — see the button after .bl-body below — freeing the left lane so the
               line numbers can sit at the results-list checkbox column.) -->
          <!-- (#595 round 2, Jason: the per-row hover ghost `or…` overlay was stripped —
               "busy and confusing". Filter-OR creation now lives ONLY on the trailing
               add-filter line's `or…` button, which targets the LAST top-level row.) -->
          <!-- (#575 round 2: the ghost `&` add-AND-clause control moved from a floating
               bottom-edge button into the line-TAIL controls, after the ghost `or` — see
               OqlLineTailControls. Jason: the boundary spot felt squeezed.) -->
          <!-- Filter-scope LEADING chip (#523 round 2): every top-level filter row starts with a
               conjunction — the `→` arrow on the first row, a pale-PEACH `&` on each subsequent
               filter row (peach = filter scope, vs the periwinkle value-scope connectors). It's a
               sibling of `.bl-field`/`.bl-body` (not a token), so it never enters the
               selection/drag/plus model. A row with no `_lead` (value-continuation rows) renders
               an EMPTY spacer so the lead column stays uniform under the #575 table layout. -->
          <!-- #595: an or-disjunct DRAFT row (trailing `or…` clicked) leads with `or` — the
               draft is joining the row above as a disjunct, not AND-ing a new filter. -->
          <!-- #595 round 2 (Jason): an `and` lead chip on a committed top-level row is a
               DRAG HANDLE — grab it to move the row up/down (vertical reorder only). The
               first row's `the` stays put; drafts/continuation rows have no handle. -->
          <!-- V2 leads. TOP-LEVEL rows: the full-width lead chip ('where' / 'and').
               CHILD rows (round 2, Jason): a predicate-column-width chip ('and' / 'or' /
               blank) indented to where the parent header line's content ends — disjunct
               leads land in the parent grid's PREDICATE column, value-arm leads in the
               VALUE column, so the whole outline stays on one grid. Scope colours the
               chip: filter = peach, value = periwinkle. -->
          <!-- Round 10 (Jason): the top-level gutter is a REAL cell now (.bl-num1 — the
               ::before pseudo couldn't take drag handlers): [remove ×][digits]. The ×
               sits in its own icon-size lane LEFT of the digits (the gutter grew by
               --trash-w to make room); it's an mdi-close in the numbers' light peach,
               not a trashcan ("less ink"). The DIGITS are the row's drag handle —
               grab them to move the row (see onNumDragstart; the lead-chip handle is
               gone). Disjunct lines delete ONE alternative (removeDisjunct), arm
               lines ONE value arm (round 8), other lines the whole row. -->
          <span v-if="!line._level" class="bl-num1"><button v-if="canDeleteLine(line)" type="button" class="row-trash row-trash--num"
              aria-label="remove" title="remove"
              @click.stop="onLineTrash(line)" @mousedown.stop @dblclick.stop><v-icon size="12">mdi-close</v-icon></button><span
              class="bl-num1-digits" :class="{ 'num-grab': !!lineDragFor(line) }"
              :draggable="lineDragFor(line) ? 'true' : undefined"
              @dragstart="onNumDragstart(line, $event)" @dragend="onNumDragend"
              aria-hidden="true">{{ line.addr }}</span></span>
          <span v-if="!line._level" class="bl-lead" :class="{ 'bl-lead--the': line._lead === 'arrow', 'bl-lead--spacer': !line._lead }"
            aria-hidden="true">{{ leadWord(line) }}</span>
          <!-- Round 6 (Jason): NO arrows anywhere — a subclause line leads with a WORD
               chip: the parent's predicate on the first value-AND arm ("has network",
               round 5), "has" on the first either-disjunct (round 6), "and"/"or" on the
               rest. Round 4: the line's decimal address moved OUT of the left gutter to
               sit immediately left of the lead chip (right-aligned under the parent's
               field-name chip) — .bl-num2 IS the indent cell: its width is the old
               lead2Style margin-left (same JS-computed global-grid expr; it stays at
               --brick-fs so the ch units in fieldColW/predColW resolve exactly as the
               cells they were measured against — the inner span shrinks the digits to
               gutter size). -->
          <template v-else>
            <span class="bl-num2" :style="num2Style(line)"><button v-if="canDeleteLine(line)" type="button" class="row-trash row-trash--num"
                aria-label="remove" title="remove"
                @click.stop="onLineTrash(line)" @mousedown.stop @dblclick.stop><v-icon size="12">mdi-close</v-icon></button><span
                :class="{ 'num-grab': !!lineDragFor(line) }"
                :draggable="lineDragFor(line) ? 'true' : undefined"
                @dragstart="onNumDragstart(line, $event)" @dragend="onNumDragend"
                aria-hidden="true">{{ line.addr }}</span></span>
            <span class="bl-lead2" :class="{ 'bl-lead2--val': line._leadScope === 'value' && line._lead, 'bl-lead2--spacer': !line._lead, 'bl-lead2--end': line._leadEnd, 'bl-spike': line._spikeLead }"
              :style="lead2Style(line)" aria-hidden="true">{{ leadWord(line) }}</span>
          </template>

          <!-- V2 group-header chip: "either" (or "all of") on the group's own line, the
               subclauses indented underneath. On a top-level header the chip FILLS the
               shared field column (round 2, Jason: "col 2 of lines 1 and 2 should share
               a column") — a ghost predicate-width spacer keeps its right edge at the
               field|predicate boundary, exactly like a field chip. -->
          <template v-if="line._head">
            <div v-if="!line._level" class="bl-field bl-field--head">
              <span class="bl-headchip bl-headchip--fill" aria-hidden="true">{{ line._head }}</span>
              <!-- Rounds 3–6 (Jason): the header line ends with the TURN-MARKER chip —
                   blank, top-right corner maximally rounded (round 6 dropped the SVG
                   elbow) — showing the AND-flow turning down into the subclauses. It
                   sits where the ghost predicate spacer sat (the child lead column), so
                   it lines up over the first subclause's lead-word chip below. -->
              <span v-if="line._tail" class="bl-tail" :style="tailStyle" aria-hidden="true"></span>
              <span v-else class="bl-slot-ghost" aria-hidden="true"></span>
            </div>
            <template v-else>
              <span class="bl-headchip" aria-hidden="true">{{ line._head }}</span>
              <span v-if="line._tail" class="bl-tail bl-tail--gap" :style="tailStyle" aria-hidden="true"></span>
            </template>
            <!-- Round 9 (Jason): hover shows "N subclauses" (italic, peach) right after
                 the turn chip — left-aligned over the subclause content below. -->
            <span v-if="line._subCount" class="bl-subcount" aria-hidden="true">{{ line._subCount }} subclause{{ line._subCount === 1 ? '' : 's' }}:</span>
            <span class="bl-headfill" aria-hidden="true"></span>
          </template>

          <!-- (V2: the #575/#595 or-group mini-table block is GONE — an OR of whole
               filters renders as an "either" header line + one indented, numbered line
               per disjunct, via builderLayoutV2.) -->

          <!-- FIELD cell (#575 two-column table): the shared-width field column. Holds the
               folded field(+op) chip on a filter row, or the row's lone `&` connector on a
               value-continuation row (right-aligned at the field|value boundary via
               `bl-field--conn`, so sibling AND-arms' VALUES align at one shared x-edge).
               Same OqlBrick dispatch + event set as the value cell — keep the two in sync. -->
          <!-- (Round 20, Jason: the ↳ wrap-marker tiles are gone "for now" — the
               .bl-field--marked binding + its background-image rule were removed.) -->
          <div v-if="!line._head && !line._noField" class="bl-field" :class="{ 'bl-field--conn': line._fieldConn }">
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
                  @make-subclause="onMakeSubclause(tok)"
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
            <!-- Slot PREDICATE chip (#575 round 4, Jason — replaces the round-3 `→`): the
                 field's folded predicate ("has" / "is" / "≥") renders HERE, between the field
                 chip and its values — `[title/abstract][has][foo][or][bar]` — semantic ink in
                 the slot the AND-arm `and` chips share, so the column stacks. `→` only as the
                 fallback for the rare predicate-less clause (bare row-subject chips). Inert
                 decoration (not a token); the predicate stays editable via the field chip's
                 menu (numeric operators). -->
            <!-- EDITABLE numeric predicate (#575 round 8, Jason): a range field's operator can be
                 switched, so the slot is DARKER + clickable and opens an operator menu. Equality
                 shows the `=` glyph (the fixed slot shows the folded `is`). -->
            <!-- Round 9 (Jason): the predicate word is back ON the header row (round-5
                 swap undone) — on a value-AND header (_slotTail) the pred chip itself
                 doubles as the turn marker via the max-rounded top-right corner
                 (.bl-slot-pred--turn). The numeric operator menu works again too. -->
            <v-menu v-if="line._predEdit" location="bottom start" offset="2">
              <template #activator="{ props: mp }">
                <button type="button" class="bl-slot-pred bl-slot-pred--edit" :class="{ 'bl-slot-pred--turn': line._slotTail, 'bl-spike': line._spikePred }" v-bind="mp"
                  title="change operator" @click.stop @mousedown.stop @dblclick.stop>{{ line._slotPred === 'is' ? '=' : (line._slotPred || 'is') }}</button>
              </template>
              <v-card min-width="180" class="menu-card">
                <v-list density="compact" class="py-0">
                  <v-list-item v-for="o in line._predEdit.ops" :key="o.key"
                    :title="o.menuLabel" @click="onPickOperator(line._predEdit.clauseId, o)" />
                </v-list>
              </v-card>
            </v-menu>
            <!-- FIXED predicate ("has"/"is"/"≥" …) — inert decoration. -->
            <span v-else-if="!line._fieldConn && line._fieldToks && line._fieldToks.length"
              class="bl-slot-pred" :class="{ 'bl-slot-pred--turn': line._slotTail, 'bl-spike': line._spikePred }" aria-hidden="true">{{ line._slotPred || '→' }}</span>
          </div>
          <div v-if="!line._head" class="bl-body">
            <!-- Round 9 (Jason): hover shows "N subclauses" on a value-AND header —
                 first body element, so it sits at the value column, over the arm
                 content below (the body ::before pull-back puts row 1 at the true
                 column). -->
            <span v-if="line._subCount" class="bl-subcount" aria-hidden="true">{{ line._subCount }} subclause{{ line._subCount === 1 ? '' : 's' }}:</span>
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
                  @make-subclause="onMakeSubclause(tok)"
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
                :slug-values="tok._slugValues"
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
                :external-search="typeOnQuery"
                :autocomplete-entity="tok._autocompleteEntity" :list-vocab="tok._listVocab"
                :slug-values="tok._slugValues"
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

        <!-- Permanent "add filter" affordance (#575 round 8, Jason): the last line.
             With COMMITTED filters present it's an explicit "and" button (orange text, peach
             on hover; #595 round 4 dropped the `…` — consistent with the end-of-row ghost
             buttons) — the down-axis "add another AND-ed filter" invitation. With NO filters
             yet the line renders like a filter row (#595 round 4, Jason: unify the no-filter
             state): the `where` lead chip + a filtername-style "select filter" chip; clicking
             it opens a normal filter-name draft. While ANY draft is open the line HIDES
             entirely (#595 round 6, Jason — was round 5's first-draft-only rule): the user
             is already doing what the button beckons, so a dimmed leftover line below the
             draft just competes for attention. Clicking `and` reads as the button MORPHING
             into the draft row (same line count); the line returns on fold/cancel. -->
        <!-- V2 round 2 (Jason): the trailing `or` button is GONE — filter-OR creation
             lives in the draft field menu's "Either…" option now. And the `and` button
             regains its ellipsis: `and…` reads clearer about what a click does. -->
        <div v-if="!hasOpenDraft" class="bline bline--addfilter"
          :data-addr="nextAddr"
          @click.stop="addRootFilter()" :title="hasCommittedWhere ? 'add another filter' : 'add a filter'">
          <button v-if="hasCommittedWhere" type="button" class="add-and-btn"
            @click.stop="addRootFilter()">&amp;&#8230;</button>
          <template v-if="!hasCommittedWhere">
            <!-- round 12: blank lead box (the "where" moved to the toolbar) -->
            <span class="bl-lead bl-lead--the" aria-hidden="true"></span>
            <button type="button" class="select-filter-btn" @click.stop="addRootFilter()">select filter</button>
          </template>
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

        <!-- (Round 23, Jason: the `return` columns line is GONE — no column affordances
             in the Advanced builder. Which columns come back is driven entirely by the
             results table's own column controls now; the OQL `return` clause still
             round-trips through the shared column state, it just isn't editable here.) -->

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
                <!-- (Round 23: "Add return columns" removed — columns are the table's job now.) -->
              </v-list>
            </v-menu>
          </div>
        </div>
      </div><!-- /.builder-lines -->

      <!-- Ancestor-path breadcrumb (oxjob #487 Part 2): a slim status strip showing the
           humanized ancestor path of the hovered node (selection as a resting fallback,
           else the entity root). Pure display; driven by the `footer` computed —
           bold + black on a selection, "N chips selected" on a multi-selection. -->
      <!-- Round 10 (Jason): breadcrumbs OFF — "the structure makes it clear enough now".
           Commented out (not deleted) in case we want them back; the `footer` computed
           + hover tracking stay wired (a computed no one reads costs nothing). -->
      <!-- <OqlBuilderFooter v-if="hasQuery" :segments="footer.segments"
        :bold="footer.bold" :count-label="footer.countLabel" /> -->

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
import { resolveColumns } from "@/components/Results/Table/columnConfig";
import { useColumnsState } from "@/composables/useColumnsState";
import { useLocalColumns } from "@/composables/useLocalColumns";
import { facetConfigs } from "@/facetConfigs";
import {
  valueKindForProperty, autocompleteEntityFor, isListVocabEntity, isSlugAutocompleteEntity,
  uiOperatorsForProperty,
} from "@/components/OqlPlayground/oqoTree";
import { v2ToOqo } from "@/components/OqlPlayground/v2ToOqo";
import * as edit from "@/components/OqlPlayground/v2Edit";
import { layoutLines, splitLineCells, isEmptyVbrick } from "@/components/Oql/builderLayoutV2";
import { parseValueExpr } from "@/components/Oql/valueExpr";
import { parseNumericExpr } from "@/components/Oql/numericExpr";
import { treeToTokens } from "@/components/Oql/treeToTokens";
import { buildAddrIndex, buildAddrById, pathForAddr } from "@/components/Oql/oqlBreadcrumb";
// Round 10: breadcrumbs commented out (see the template) — restore this import with them.
// import OqlBuilderFooter from "@/components/Oql/OqlBuilderFooter.vue";
import { reconcileTreeIds } from "@/components/Oql/reconcileIds";
import { oqlForUrl } from "@/oqlSerialize";
import { fieldKeys, popularFieldKeys, fieldIcon, fieldDisplayName } from "@/components/OqlPlayground/builderFieldMeta";
import { OQL_ROLE_CSS_VARS } from "@/components/Oql/oqlPalette";
import { useChipDrag } from "@/components/Oql/useChipDrag";

defineOptions({ name: "OqlQueryBuilderV2" });

// V2 palette — MONOCHROME (round 11 "keep to black/white/grey"; round 13 stepped the
// black structure chips down to dark grey; round 14: ONE CHIP COLOUR — structure and
// values share the same grey, and the structure/value boundary is marked by the
// .bl-spike nub + the terminal value chip's pill-round right edge instead of tone):
//   every chip                                                   light grey #ececec
//   ink on the canvas (numbers, subcount, ×, ghosts)             grey/black (CSS below)
// Selection no longer recolours chips: the -sel vars equal the base, and a selected
// value chip gets a BLACK BORDER instead (the :deep rules near .bl-body). V1/the
// text editor keep the coloured palette — this map only reskins the V2 builder.
const V2_INK = "#1a1a1a";
// One chip colour. r18 (Jason): the dark A/B variant is DEAD ("i hate it now") and
// the grey steps down to opacity .1. NB the fill is the OPAQUE equivalent of
// rgba(1,1,1,.1)-on-white (#e6e6e6, hover .2 = #cccccc) rather than a real rgba:
// the ↳ wrap-marker tiles paint UNDER row-1's chips (the chips covering them IS
// the only-show-on-wrapped-rows mechanism), so a translucent fill lets them show
// through — that was r17's "arrows superimposed on every line" bug.
const V2_CHIP_BG = "#e6e6e6";
const V2_CHIP_BG_HOV = "#cccccc";
const V2_ROLE_CSS_VARS = {
  ...OQL_ROLE_CSS_VARS,
  "--prop-fg": V2_INK, "--prop-bg": V2_CHIP_BG, "--prop-bg-hov": V2_CHIP_BG_HOV,
  "--prop-fg-sel": V2_INK, "--prop-bg-sel": V2_CHIP_BG,
  "--conn-fg": V2_INK, "--conn-bg": V2_CHIP_BG, "--conn-bg-hov": V2_CHIP_BG_HOV,
  "--conn-fg-sel": V2_INK, "--conn-bg-sel": V2_CHIP_BG,
  "--rel-fg": V2_INK, "--rel-bg": V2_CHIP_BG,
  "--val-fg": V2_INK, "--val-bg": V2_CHIP_BG, "--val-bg-hov": V2_CHIP_BG_HOV,
  "--val-fg-sel": V2_INK, "--val-bg-sel": V2_CHIP_BG,
  "--vconn-fg": V2_INK, "--vconn-bg": V2_CHIP_BG, "--vconn-bg-hov": V2_CHIP_BG_HOV,
  "--vconn-fg-sel": V2_INK, "--vconn-bg-sel": V2_CHIP_BG,
};

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

// EDITABLE numeric predicate (#575 round 8, Jason): a range field's operator (=/≥/≤/>/<) can be
// switched from a menu on the predicate slot chip (which renders darker + clickable). Fixed
// predicates ("has"/"is"/boolean) are inert. Menu labels are friendly; the slot keeps the glyph.
const NUM_OP_ORDER = ["is", ">=", "<=", ">", "<"];
const NUMERIC_OP_LABELS = {
  is: "=  equals", ">=": "≥  at least", "<=": "≤  at most",
  ">": ">  greater than", "<": "<  less than",
};
// The editable-predicate context for a filter row, or null when the predicate is fixed. Numeric
// (range) clauses only: returns { clauseId, ops:[{op, unary, key, menuLabel}] }. Row-subject
// verbs (cites/…) and non-numeric fields never edit.
const predEditForLine = (line) => {
  if (line._fieldConn) return null;
  return predEditForFieldToks(line._fieldToks || []);
};
// Factored to take a bare field-token list so an or-group's DISJUNCT sub-rows (which have
// their own fieldToks, not a line-level _fieldToks) get the same editable predicate (#595).
const predEditForFieldToks = (fieldToks) => {
  const col = fieldToks.find((t) => t.t === "col");
  if (!col) return null;
  const key = treeIndex.value.tokenColumn[col.id] || col.column_id || col._column;
  if (!key || ROW_SUBJECT_COLUMNS.has(key)) return null;
  const p = properties.value[key];
  if (valueKindForProperty(p) !== "number") return null;
  const ops = uiOperatorsForProperty(p)
    .filter((o) => !o.unary && o.op !== "in collection" && o.op !== "has")
    .map((o) => ({ ...o, menuLabel: NUMERIC_OP_LABELS[o.op] || o.label }))
    .sort((a, b) => NUM_OP_ORDER.indexOf(a.op) - NUM_OP_ORDER.indexOf(b.op));
  if (ops.length < 2) return null;
  return { clauseId: col.id, ops };
};

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
  // V2: the draft field menu offers "and either" — start an OR subclause that gets
  // ANDed to the filter list instead of a plain filter.
  subclauseOption: true,
}));

// The green "new <type>" placeholder-chip label for a not-yet-picked value of property `p`.
const placeholderLabelFor = (p) =>
  `new ${((p && (p.display_name || p.name)) || "value").toLowerCase()}`;

// ---- enrich a raw token with edit metadata ---------------------------------
// Short display aliases for field-chip labels (#575 round 5) — see enrichToken.
// "title and abstract" (round 12, Jason): the SAME logical field has two catalog
// spellings — `title_and_abstract.search` says "title/abstract" but the `.exact`
// surface (which a clause silently re-routes to when a quoted/wildcard value joins
// it, e.g. after a drag-reorder) says "title and abstract". The builder must ALWAYS
// show "title/abs", so both spellings alias.
const FIELD_LABEL_ALIASES = { "title/abstract": "title/abs", "title and abstract": "title/abs" };

function enrichToken(tok) {
  const t = { ...tok };
  const idx = treeIndex.value;
  if (tok.t === "kw" && tok.id && tok.id === getRows.value) t._entity = true;
  if (tok.t === "col") {
    const col = tok.column_id || idx.tokenColumn[tok.id];
    t._column = col;
    const p = properties.value[col];
    t._label = p ? (p.display_name || p.name) : (tok.text ? tok.text.trim() : "select field");
    // #575 round 5 (Jason): short DISPLAY aliases for the field chips. All field chips share
    // one width (the longest sets --field-w), so a frequent long name taxes every row —
    // "title/abstract" → "title/abs" (a real server input alias: `title/abs has x` parses;
    // the canonical OQL string still says title/abstract). Display-only — column_id, the
    // picker menu, and the OQL text pane are untouched.
    t._label = FIELD_LABEL_ALIASES[t._label] || t._label;
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
    t._slugValues = isSlugAutocompleteEntity(p); // keywords: autocomplete + bare-slug values (r20)
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
// Any COMMITTED where-clause in the tree (drafts don't count). Gates the trailing
// add-filter line's `and`/`or` buttons (#595 round 5, Jason: while the FIRST filter is
// still a draft there's nothing to AND onto — the line hides instead of showing a dead
// dimmed `and`).
const hasCommittedWhere = computed(() => !!(v2.value && v2.value.where));


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
    // Round 8 (Jason): a value-AND HEADER line (turn-marker chip, values live on the
    // arm lines) gets NO ghost `or` — you can't OR a value onto an AND-of-values
    // clause. Hover shows only the trash.
    if (line._slotTail) line._plus = null;
    line._predEdit = predEditForLine(line);   // editable numeric operator menu, or null (#575 r8)
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
  // V2: no or-group mini-table — a group's header line ("either") resolves its
  // deleteId to the whole group via rowNodeForLine on its paren token; disjunct
  // lines carry `_disjunctDel` from the layout (per-alternative trash).
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
    let at = -1;
    // An OR-DISJUNCT draft (trailing `or…`) renders as an indented `or`-led line under
    // its target. V2 conversion (the #595 r5 idea, outline-style): a PLAIN-clause target
    // grows a synthetic "either" header line and its own lines demote one level, so the
    // draft state already looks like the folded group; a target that IS a group just
    // takes the draft as its next child line.
    if (d._orTarget) {
      const sub = subtreeIdSet(d._orTarget);
      let fi = -1, ti = -1;
      out.forEach((l, i) => {
        if ((l.tokens || []).some((t) => t.id && sub.has(t.id))) { if (fi < 0) fi = i; ti = i; }
      });
      if (ti >= 0) {
        if (out[fi]._head) {
          // already an either-group: the draft joins as the new last child line
          dl._level = (out[fi]._level || 0) + 1;
          at = ti + 1;
        } else {
          const lvl = out[fi]._level || 0;
          const headLn = { key: (out[fi].key || "g") + ":ehead", cols: [], depth: 0,
            _indent: 0, _level: lvl, _lead: out[fi]._lead, _leadScope: "filter",
            _head: "either", _noField: true, items: [], tokens: [], _fieldToks: [],
            _valueToks: [], _fieldConn: false, _slotPred: null, _fieldCh: 0, _predCh: 0,
            _hasFieldMenu: false, _menu: null, _selectRow: out[fi]._selectRow || null,
            _tail: "filter" };
          for (let i = fi; i <= ti; i++) out[i]._level = (out[i]._level || 0) + 1;
          out[fi]._lead = "blank";
          out[fi]._indKind = "pred";
          out.splice(fi, 0, headLn);
          dl._level = lvl + 1;
          at = ti + 2;
        }
        dl._lead = "or";
        dl._leadScope = "filter";
        dl._indKind = "pred";
        // share the group's mini field-column width so the draft's cells align
        // with the committed disjuncts above it
        let gch = 0, pch = 0;
        for (let i = fi; i <= ti + 1 && i < out.length; i++) {
          gch = Math.max(gch, out[i]._fieldCh || 0); pch = Math.max(pch, out[i]._predCh || 0);
        }
        if (gch) { dl._fieldCh = gch; dl._predCh = pch || 2; }
      }
    }
    // a click-the-gap FILTER draft (#494) renders AT its anchor gap; an unanchored draft appends.
    else if (d._anchor) {
      const g = findGroupNode(d._anchor.parentId);
      if (g) {
        if (d._anchor.index < g.children.length) at = firstLineOf(g.children[d._anchor.index].id);
        else { const ls = firstLineOf(g.children[g.children.length - 1].id); at = ls >= 0 ? ls + 1 : -1; }
      }
    }
    // A NEW-SUBCLAUSE draft (the "and either" field-menu option, V2): render a synthetic
    // "either" header line at the top level with the draft as its first (blank-led) child,
    // so the outline shows the subclause the fold will create.
    if (d._thenOr && !d.editing && !d._orTarget) {
      const headLn = { key: `d${d.id}:ehead`, cols: [], depth: 0, _indent: 0, _level: 0,
        _lead: out.length ? "and" : "arrow", _leadScope: "filter", _head: "either",
        _noField: true, items: [], tokens: [], _fieldToks: [], _valueToks: [],
        _fieldConn: false, _slotPred: null, _fieldCh: 0, _predCh: 0,
        _hasFieldMenu: false, _menu: null, _tail: "filter" };
      out.push(headLn);
      dl._level = 1;
      dl._lead = "blank";
      dl._indKind = "pred";
      out.push(dl);
      lastDraftIdx = out.length - 1;
      return;
    }
    // Lead chip on a NEW-filter draft row: `where` when it's the very first row (empty
    // query), else `and` — the draft aligns under the lead column. In-place field-edit
    // drafts (`d.editing`) keep their prior no-lead behaviour; or-disjunct drafts got
    // their `or` lead above.
    if (!d.editing && !d._orTarget) dl._lead = out.length ? "and" : "arrow";
    if (at >= 0) { out.splice(at, 0, dl); lastDraftIdx = at; }
    else { out.push(dl); lastDraftIdx = out.length - 1; }
  });
  // A pending scalar value (committed-tree "New", #472) is ALREADY in the local tree (its
  // edit fn — addValueAfter / addValueAtFront / addSiblingValueAfterGroup — inserted the empty
  // vleaf at the right position), so `treeToTokens` renders it directly: an empty value ⇒ an
  // editable input box (OqlTextChip.showInput), in place, no splice needed. The old transient
  // splice would now DOUBLE-render it. `pendingScalar` is kept only for the focus + blur/Enter
  // lifecycle. (oxjob #490 — was splicePendingScalar, removed with the render-from-tree switch.)
  // exactly one BuilderFieldDialog instance (shared) — on the last draft line if any, else the
  // last NON-group line (an or-group line's template branch doesn't mount the dialog — #575
  // filter-OR 'block' mode).
  let menuIdx = lastDraftIdx;
  if (menuIdx < 0) for (let i = out.length - 1; i >= 0; i--) if (!out[i]._head) { menuIdx = i; break; }
  if (menuIdx >= 0) out[menuIdx]._hasFieldMenu = true;
  // Gutter = DECIMAL outline addresses over the top-level AND tree (V2, Jason
  // 2026-07-11 — brings back the #474/#487 decimal scheme, re-keyed to the outline):
  // level-0 lines count 1, 2, 3 …; each subclause line numbers under its parent
  // (1.1, 1.2, 2.1.1 …). Derived purely from the flattened `_level` sequence — a
  // counter per level, deeper counters reset whenever a shallower line appears.
  const counters = [];
  out.forEach((line) => {
    const L = line._level || 0;
    counters.length = L + 1;
    counters[L] = (counters[L] || 0) + 1;
    line.addr = counters.map((c) => c || 1).join(".");
  });
  // Round 8 (Jason): the LAST subclause line in its column ends the pipe — its lead
  // chip turns from south to east (max-rounded bottom-left corner, .bl-lead2--end).
  // "Last in its column" = no later line at the SAME level before one at a shallower
  // level (deeper lines — the line's own children — don't extend the column).
  // Computed after draft splicing so an open or-draft (the true last line) takes the
  // rounding from the committed line above it.
  out.forEach((line, i) => {
    const L = line._level || 0;
    if (!L || !line._lead) return;
    for (let j = i + 1; j < out.length; j++) {
      const lj = out[j]._level || 0;
      if (lj < L) break;
      if (lj === L) return;
    }
    line._leadEnd = true;
  });
  // Round 9 (Jason): hovering a group HEADER line shows an italic peach "N subclauses"
  // at the end of the line. Count = this header's DIRECT children (level L+1 lines
  // until one at level <= L) — computed post-splice so open drafts count too.
  out.forEach((line, i) => {
    if (!(line._tail || line._slotTail)) return;
    const L = line._level || 0;
    let n = 0;
    for (let j = i + 1; j < out.length; j++) {
      const lj = out[j]._level || 0;
      if (lj <= L) break;
      if (lj === L + 1) n += 1;
    }
    line._subCount = n;
  });
  // Round 16 (Jason, final spike semantics): the spike says "everything after this
  // is leaf chips — no more AND/blank/predicate chips". So AT MOST ONE spike per
  // logical line, on the LAST structural chip, and only when a value actually
  // follows it on that line: the pred when the line has a field run, else the
  // sub-line lead (arm lines, where the and/blank sits right before the leaf).
  // Header lines (no values) and top-level leads (a field always follows) never spike.
  out.forEach((line) => {
    const hasVals = !line._head
      && (line._valueToks || []).some((t) => BRICK_TYPES.has(t.t) || t.t === "textblock");
    line._spikePred = hasVals && !!(line._fieldToks || []).length && !line._fieldConn;
    line._spikeLead = hasVals && !line._spikePred && line._lead != null && !!line._level;
  });
  return out;
});

// The next free gutter number — the trailing "and" line's address. Counts group
// sub-rows (a group line spans several numbered rows), so it can't just be
// displayLines.length + 1 (#575). The EMPTY state reads "1" (#595 round 4 — the
// where + "select filter" line is row 1 of the query it invites).
const nextAddr = computed(() => {
  // the next TOP-LEVEL integer: only level-0 lines count toward the AND list.
  let n = 0;
  for (const l of displayLines.value) if (!l._level) n += 1;
  return String(n + 1);
});

// Per-line style (V2): the indent level for the outline, plus the per-sibling-group
// field/pred column widths a group's clause lines share (0 = inherit the global).
const lineStyle = (line) => {
  const st = { "--depth": line.depth, "--level": line._level || 0 };
  if (line._fieldCh) {
    st["--field-w"] = `calc(${line._fieldCh}ch + 24px)`;
    st["--pred-w"] = `calc(${line._predCh || 2}ch + 10px)`;
  }
  return st;
};

// The lead chip's word. 'blank' is the deliberate empty head chip (V2 — the group
// head word is gone; a blank placeholder marks the first subclause line).
// Round 12 (Jason): the first row's "where" is GONE too — a blank box, like the
// first-subclause leads ("where…" moved up to the toolbar, after the entity).
// Round 14 (Jason): TOP-LEVEL "and" leads read "&" to save space (the lead column
// narrowed to one chip width with it); subclause and/or leads keep their words.
const leadWord = (line) => {
  if (line._lead === "blank" || line._lead === "arrow" || !line._lead) return "";
  if (line._lead === "and" && !line._level) return "&";
  return line._lead;
};

// Child-line lead chip geometry (V2 round 2, Jason): the chip is PREDICATE-column
// width and indents to where the parent header line's content ends —
//   'pred'  (group disjuncts): the parent grid's predicate column, i.e. right after
//           the field-column "either";
//   'value' (value-AND arms): the value column, i.e. right after the field+predicate.
// Computed HERE (not via the --field-w/--pred-w vars) because disjunct lines
// OVERRIDE those vars for their own mini-cells (lineStyle) — the indent must read
// the GLOBAL grid. The ch units in fieldColW/predColW resolve at the chip (mono at
// --brick-fs), matching the cells they were measured for. _indCh/_indPx add the
// intermediate group grids for deeper nesting.
const lead2Indent = (line) => {
  const fw = fieldColW.value || "0px";
  const pw = predColW.value;
  const parts = ["var(--lead-w)", "var(--gx)", fw, "var(--gx)"];
  if (line._indKind === "value") { parts.push(pw, "var(--gx)"); } // (unused since round 4 — arms are 'pred' now)
  let expr = parts.join(" + ");
  if (line._indCh) expr += ` + ${line._indCh}ch`;
  if (line._indPx) expr += ` + ${line._indPx}px`;
  // r21/r23: the parent's boundary chip (pred / turn pred / either-head tail) is
  // inset 13px from its cell edge now (the full-height spike's whitespace) — child
  // leads follow it left. (r23: 5→13 with the bigger spike.)
  return `calc(${expr} - 13px)`;
};
// Round 4 (Jason): the indent space left of the lead chip is no longer a margin —
// it's the .bl-num2 number cell (the line's decimal address, right-aligned against
// the lead chip). Same width expr, so the chip lands exactly where it used to.
const lead2Style = () => ({ "--lead2-w": predColW.value });
const num2Style = (line) => ({ width: lead2Indent(line) });

// ---- V2 turn-marker chip (rounds 3–6, Jason) ---------------------------------
// A group HEADER line ends with a TURN-MARKER chip showing the AND-flow turning 90°
// down into the subclause lines. Rounds 3–5 drew SVG elbows/forks in these chips;
// round 6 removed ALL on-chip lines and arrows — the marker is now pure chip SHAPE:
// a blank chip whose TOP-RIGHT corner is maximally rounded (13px = half the 26px
// chip height, a quarter-circle; other corners keep the standard 4px). See .bl-tail.
// The first subclause line beneath it leads with a WORD instead of an arrow: the
// parent's predicate on value-AND arms ("has network", round 5), the word "has" on
// either-disjuncts (round 6).
// The either-head tail chip is CHILD-LEAD-COLUMN width — the GLOBAL predColW, same
// as the lead chips below it (whose --lead2-w lead2Style sets from predColW), never
// the mini --pred-w a nested line's lineStyle may override. ch resolves at the chip
// (mono at --brick-fs), same as everywhere else. (A value-AND header has no tail
// chip since round 9 — its predicate chip carries the turn corner, .bl-slot-pred--turn.)
const tailStyle = computed(() => ({ minWidth: predColW.value }));

// The brick stream for ONE draft clause MINUS its lead-in keyword (col · op ·
// values · entity-picker).
function draftBodyTokens(d) {
  const tokens = [];
  // `_orDraft`/`_thenOr` gate the field-menu's "and either" footer option (V2): it
  // only makes sense on a plain new-filter draft, not one already inside a subclause.
  tokens.push(enrichToken({ t: "col", id: d.id, column_id: d.column_id, text: d.column, _draft: true,
    _orDraft: d._orTarget != null, _thenOr: !!d._thenOr }));
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
        _listVocab: isListVocabEntity(p), _slugValues: isSlugAutocompleteEntity(p), _draft: true });
    }
  } else if (d.column_id && d.unary) {
    tokens.push(enrichToken({ t: "op", id: d.id, column_id: d.column_id, text: ` ${d.operator} `, _draft: true }));
  }
  // fold the predicate into the draft's field chip too, so a half-built filter reads
  // the same as a committed one ("keyword is …") instead of a separate op brick.
  return foldPredicates(tokens);
}

function draftLine(d) {
  // V2: EVERY draft renders as a plain filter ROW — its draft field chip in the field
  // column, the rest in the value cell. An or-disjunct draft gets its `or` lead +
  // indent level from the displayLines splice (the mini-table geometry is gone).
  const body = draftBodyTokens(d);
  const cells = splitLineCells(body);
  return { key: `d${d.id}`, cols: [], depth: 0, _indent: 0, _level: 0,
    items: body.map((tok) => ({ tok })),
    tokens: body, _fieldToks: cells.fieldToks, _valueToks: cells.valueToks,
    _fieldConn: cells.fieldConn, _slotPred: cells.slotPred || null, _hasFieldMenu: false };
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
  // An OR-DISJUNCT draft (#595 ghost `or…`) folds INTO its target's row as an or-group —
  // appending it at the root would read (and, on a commit render, RUN) as an AND. Root
  // children ↔ filter_rows map 1:1 (v2FilterRows) — guarded by a length check since
  // incomplete nodes null out of the rows (and a root-OR body collapses to one row);
  // when the mapping doesn't hold, fall back to the plain append (display-only drift,
  // the real fold via orDraftOntoRow is still correct).
  const extra = [];
  for (const d of drafts.value) {
    if (!edit.draftComplete(d) || d.editing) continue;
    const f = edit.draftToFilter(d);
    if (d._orTarget != null) {
      const w = v2.value && v2.value.where;
      const kids = w ? (w.node === "group" && w.implicit ? w.children : [w]) : [];
      const i = kids.findIndex((c) => c.id === d._orTarget);
      const rows = oqo.filter_rows || [];
      if (i >= 0 && rows.length === kids.length && rows[i]) {
        rows[i] = rows[i].join === "or" && Array.isArray(rows[i].filters)
          ? { ...rows[i], filters: [...rows[i].filters, f] }
          : { join: "or", filters: [rows[i], f] };
        continue;
      }
    }
    extra.push(f);
  }
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
    // "and either" chain (V2): a `_thenOr` draft that just folded (as a plain clause)
    // immediately gets an OR-disjunct draft opened on it — the group materializes when
    // the second alternative commits (edit.orDraftOntoRow), so no one-child group ever
    // round-trips through the server's canonicalizer. Checked HERE (not foldNow)
    // because several commit paths fold a draft via this swap render.
    const foldedThenOr = drafts.value.some((d) => d._thenOr && edit.draftComplete(d) && !d.editing);
    // complete drafts were folded into the OQO above and are now in the tree — drop
    // them. `editing` drafts (a popped-open committed flat clause, via popClauseToDraft)
    // stay local until the user commits (blur clears `editing`), so they survive the swap.
    drafts.value = drafts.value.filter((d) => !edit.draftComplete(d) || d.editing);
    if (foldedThenOr) nextTick(() => {
      if (lastRowOrTarget.value != null) addOrDraftFor(lastRowOrTarget.value);
    });
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
    // Round 20 (Jason): chips are NOT selectable anymore — a single click goes straight
    // to EDIT/draft mode (text/number: the in-place input; entity: the re-pick picker;
    // date: the calendar) — the same routing as Enter/double-click. A sole boolean-
    // phrase chip has nothing to edit (booleans toggle on click in OqlBoolChip; a
    // phrase chip's only actions are the row × / typing `not`), so it's a no-op.
    // (The r11-era "click paints a selection ring" model is gone; Cmd/Shift multi-
    // select below is kept — it feeds batch-delete / wrap-as-subclause, not selection.)
    const vt = findValueTok(id);
    if (!vt || (vt._boolPhrase && treeIndex.value.sole[id])) return;
    lastSingleId.value = id;
    if (selectedIds.value.size) selectedIds.value = new Set();
    selectionAnchorId.value = null;
    editValue(vt);
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
  // Round 11 (Jason): filtername chips are NOT selectable — a plain click on a locked
  // field chip does nothing ("there's nothing we would select them for"; deletes live on
  // the ×, moves on the line number). Round 20 extends that to EVERY structural chip
  // (paren/join leaders): chips are never selectable — a plain structural click is a
  // no-op. Cmd-multi above is kept — it feeds the wrap-as-subclause / batch-delete
  // power path, not chip selection.
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
  // r22: no selection set on entity edit — chips are never "selected" (the r20 model);
  // the old {kind:'value'} assignment painted the black ring and was never cleared on
  // abandon (Jason's "selected-state atavism"). editingEntityId alone drives the re-pick.
  if (tok._kind === "entity") { onEditEntity(tok); return; }
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

// Change a committed numeric filter's operator from the predicate-slot menu (#575 round 8,
// Jason). setOperator rewrites the clause's op (factored → on the clause; simple → on its leaf);
// a swap re-render repaints the slot glyph. `unary` ops (none in the numeric set today) would
// drop the value — kept for parity with the shared setOperator contract.
const onPickOperator = (clauseId, o) => {
  if (clauseId == null || !o) return;
  clearSelection();
  edit.setOperator(v2.value, clauseId, { op: o.op, unary: !!o.unary }, drafts.value);
  renderQuery({ swap: true });
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
  // Round 10 (Jason): NO per-keystroke server render — typing a text value used to fire
  // debouncedRender() here (a renderOqo API call per pause). The chip display renders
  // from the LOCAL tree (#490) so it never needed the round-trip; the OQL string /
  // validation refresh on the commit render when the draft is submitted.
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
  // Enter on a BUILD box (a brand-new draft filter or a transient pendingScalar box) is
  // "commit & done" (#595 round 4, Jason — early user testing: users type `foo or bar` in one
  // box rather than chaining Enter-per-term, and this matches the entity path where a pick
  // just ends the flow). The #523 Phase-4 term-chaining (Enter → fresh OR box, ⇧Enter → fresh
  // AND row) is GONE; more terms come from the typed boolean expression (decomposeValue) or
  // the explicit ghost `or` / `and` row controls.
  const cmd = e.metaKey || e.ctrlKey;
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
    else if (owningDraft) { owningDraft.editing = false; anchorDraftIfReady(owningDraft); }
    // 2) DONE — fold the draft (anchored/or-target drafts placed above; the rest fold via
    //    currentOqo on the swap) and run the search. Mirrors the blur-commit path.
    renderQuery({ swap: true });
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

// ---- line drag-to-reorder via the LINE NUMBERS (round 10, Jason) --------------
// The drag handle is the line's number (grab cursor on hover) — the round-2 lead-`and`-
// chip handle is gone. EVERY committed line drags, including the first and last:
//   • a TOP-LEVEL row (plain filter, value-AND clause, or a whole either-group) —
//     filter scope;
//   • an either-DISJUNCT line — filter scope: it can drop at any root boundary, into
//     another either-group, or back out to the root;
//   • a value-ARM line — value scope: it can only reorder WITHIN its own value block.
// Scope rules ride the slot list (filterLineSlots/valueLineSlots below): a filter drag
// offers root boundaries + every either-group's internal boundaries (a GROUP node only
// offers root ones — nesting a group in a group is outside the round-7 landscape cap);
// a value drag offers only its own block's boundaries. The drop target is a HORIZONTAL
// bar on the nearest boundary. Reuses moveNode/moveValues + applyMoveWithRevert (the
// server re-canonicalizes joins/leads on the swap render; an invalid result reverts).
const lineDrag = ref(null);        // { id, kind: 'filter'|'value', isGroup, parentId } | null
const rowDropSlots = ref([]);      // { parentId, index, y } — insertion boundaries
const activeRowSlot = ref(null);   // slot nearest the cursor → the horizontal bar

// The drag identity of a line's number handle, or null when the line doesn't drag
// (chrome / draft / loose-continuation lines).
const lineDragFor = (line) => {
  if (!line) return null;
  if (!line._level) {
    // top-level row: its root-child node (clause or group). Excludes drafts (their
    // _topRow is the draft id, never a root child) and chrome lines (_topRow null).
    const w = v2.value && v2.value.where;
    if (!w || w.node !== "group" || !w.implicit || line._topRow == null) return null;
    const node = w.children.find((c) => c.id === line._topRow);
    if (!node) return null;
    return { id: node.id, kind: "filter", isGroup: node.node === "group" };
  }
  if (line._disjunctDel) return { id: line._disjunctDel, kind: "filter", isGroup: false };
  if (line._armDel) {
    const clauseId = treeIndex.value.tokenClause[line._armDel];
    const vg = clauseId != null ? treeIndex.value.clauseTopVgroup[clauseId] : null;
    if (vg == null) return null;
    return { id: line._armDel, kind: "value", parentId: vg, clauseId };
  }
  return null;
};

// `.bline-flow > .bline` ↔ displayLines are 1:1 in order (the addfilter/sort lines are
// SIBLINGS of .bline-flow, not children).
const lineEls = () => Array.from(linesEl.value.querySelectorAll(".bline-flow > .bline"));

// FILTER-scope slots: every root-children boundary (before each top-level row's first
// line + after the last row's last line), plus — for CLAUSE drags — every either-group's
// internal boundaries (before each disjunct's first line + after the group's last line).
// Slots flanking the dragged line are kept: dropping back where you picked up cancels.
const filterLineSlots = (drag) => {
  const lines = displayLines.value;
  const els = lineEls();
  const w = v2.value && v2.value.where;
  const slots = [];
  const draggedSub = subtreeIdSet(drag.id);
  const top = (el) => el.getBoundingClientRect().top - dragHostRect.top;
  const bottom = (el) => el.getBoundingClientRect().bottom - dragHostRect.top;
  if (w && w.node === "group" && w.implicit) {
    let prevTop = null, lastEl = null, count = 0;
    lines.forEach((ln, i) => {
      if (!ln._topRow || !els[i]) return;
      if (!w.children.some((c) => c.id === ln._topRow)) return; // draft rows don't bound
      if (ln._topRow !== prevTop) {
        slots.push({ parentId: w.id, index: count, y: top(els[i]) - 1 });
        prevTop = ln._topRow; count += 1;
      }
      lastEl = els[i];
    });
    if (lastEl) slots.push({ parentId: w.id, index: count, y: bottom(lastEl) + 1 });
  }
  if (!drag.isGroup) {
    lines.forEach((ln, i) => {
      if (ln._head !== "either" || !els[i]) return;
      // the group's node id rides the header's open-paren token; the root-OR header has
      // no tokens — its group IS the (non-implicit) where root.
      const gid = (ln.tokens && ln.tokens[0] && ln.tokens[0].id != null) ? ln.tokens[0].id
        : ((w && !w.implicit && w.node === "group") ? w.id : null);
      if (gid == null || draggedSub.has(gid)) return;
      const L = ln._level || 0;
      let k = 0, lastEl = null;
      for (let j = i + 1; j < lines.length; j++) {
        const lj = lines[j]._level || 0;
        if (lj <= L) break;
        if (!els[j]) continue;
        if (lj === L + 1) { slots.push({ parentId: gid, index: k, y: top(els[j]) - 1 }); k += 1; }
        lastEl = els[j];
      }
      if (lastEl && k) slots.push({ parentId: gid, index: k, y: bottom(lastEl) + 1 });
    });
  }
  return slots;
};

// VALUE-scope slots: only the dragged arm's own value block — one slot before each
// sibling arm line + one after the last. Arm lines ↔ the AND vgroup's children 1:1 in
// order (renderClause walks the operands in order), so the k-th arm line is index k.
const valueLineSlots = (drag) => {
  const lines = displayLines.value;
  const els = lineEls();
  const slots = [];
  const top = (el) => el.getBoundingClientRect().top - dragHostRect.top;
  const bottom = (el) => el.getBoundingClientRect().bottom - dragHostRect.top;
  let k = 0, lastEl = null;
  lines.forEach((ln, i) => {
    if (!ln._armDel || !els[i]) return;
    if (treeIndex.value.tokenClause[ln._armDel] !== drag.clauseId) return;
    slots.push({ parentId: drag.parentId, index: k, y: top(els[i]) - 1 });
    k += 1; lastEl = els[i];
  });
  if (lastEl) slots.push({ parentId: drag.parentId, index: k, y: bottom(lastEl) + 1 });
  return slots;
};

const onNumDragstart = (line, e) => {
  const drag = lineDragFor(line);
  const host = linesEl.value;
  if (!drag || !host) return;
  clearSelection();
  lineDrag.value = drag;
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "row"); }
  dragHostRect = host.getBoundingClientRect();
  rowDropSlots.value = drag.kind === "value" ? valueLineSlots(drag) : filterLineSlots(drag);
};
const onNumDragend = () => {
  lineDrag.value = null; rowDropSlots.value = []; activeRowSlot.value = null; dragHostRect = null;
};
const onRowDragover = (e) => {
  if (!rowDropSlots.value.length) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  const y = e.clientY - (dragHostRect ? dragHostRect.top : 0);
  let best = null, bestD = Infinity;
  for (const s of rowDropSlots.value) {
    const d = Math.abs(s.y - y);
    if (d < bestD) { bestD = d; best = s; }
  }
  activeRowSlot.value = best;
};
const onRowDrop = () => {
  const s = activeRowSlot.value, drag = lineDrag.value;
  onNumDragend(); // clear drag state before the swap render
  if (!s || !drag) return;
  applyMoveWithRevert(() => {
    if (drag.kind === "value") {
      // an arm root is a vgroup (`(foo or bar)`) or a lone vleaf (`baz`) — moveNode
      // handles the former, moveValues the latter (vleaf moves are chip-level there).
      const hit = edit.locate(v2.value, drag.id, drafts.value);
      if (hit && hit.node && hit.node.node === "vleaf")
        return edit.moveValues(v2.value, [drag.id], s.parentId, s.index, drafts.value);
    }
    return edit.moveNode(v2.value, drag.id, s.parentId, s.index, drafts.value);
  });
};

// While dragging value chips over the lines area, light up the slot nearest the cursor
// (vertical slot between chips, nearest by 2D distance since chips wrap). preventDefault is
// what makes the lines a valid drop target — so the cursor shows "move".
// Row drags (the lead `and` handle) route to their own slot logic first.
const onLinesDragover = (e) => {
  if (lineDrag.value) { onRowDragover(e); return; }
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
  if (lineDrag.value) { onRowDrop(); return; }
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
// AND-joined value row (`A and foo` + right → `A and (foo or _)`, which appendAdjacentValue
// nests by precedence). AND = down, reached via the separate add-row `&` button. So this never
// adds an AND term. On a header line it prepends an OR value to the front of the field's bag.
// #575 round 8 (Jason): use appendAdjacentValue (END of the row's OR-group), not
// addAdjacentValue (right after the last PLAIN value) — the draft now lands after any
// value-block AND sub-groups too, so the new chip appears at the very end and single/multi
// value chips can freely intermingle.
const onPlusAuto = (ctx) => {
  if (!ctx) return;
  if (hasOpenDraft.value) return; // drafts are a singleton (#561)
  clearSelection();
  const join = "or";
  const res = ctx.mode === "header"
    ? edit.prependBagValue(v2.value, ctx.clauseId, join, drafts.value)
    : edit.appendAdjacentValue(v2.value, ctx.valueId, join, drafts.value);
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

// ---- left-gutter delete (trash) button (#575 round 8) -----------------------
// Each committed line carries `_menu` ({ clauseId, canAndClause, deleteId }) from displayLines.
// `deleteId` drives the trash button (delete the node this row represents); `clauseId` +
// `canAndClause` drive the bottom-edge ghost `&` (add an AND value row). (#575 round 8: the
// kebab menu — and its "Add filter" next-sibling insert — was replaced by the trash button;
// adding filters lives on the canvas's "and…" / "Add a filter" buttons.)
const onMenuDeleteLine = (line) => {
  const id = line && line._menu && line._menu.deleteId;
  if (id != null) removeRow(id);
};

// (#595 round 4: the #523 Phase-4 Enter/⇧Enter term-chaining — `addTermAfter` +
// `commitDraftLocally` — was removed. Enter on a build box is "commit & done" now; more
// terms come from typing a boolean expression or the ghost `or` / `and` row controls.)

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
  // r22: a v-menu close's abandon arrives ASYNC — clicking chip B while chip A's menu
  // is closing lands A's abandon AFTER B's edit began, and an unconditional null here
  // wiped B's editingEntityId mid-open (the picker then fell back to its legacy
  // search-box mode — Jason's "sometimes a menu with a search field"). Only clear our own.
  if (editingEntityId.value === tok.id) editingEntityId.value = null;
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
  if (!d || !edit.draftComplete(d)) return false;
  // an or-disjunct draft (#595 ghost `or…`): wrap the target clause into an or-group (or
  // append to the existing group) and place the draft as the new last disjunct.
  if (d._orTarget != null) {
    if (!edit.orDraftOntoRow(v2.value, d._orTarget, d, drafts.value)) return false;
    drafts.value = drafts.value.filter((x) => x !== d);
    return true;
  }
  if (!d._anchor) return false;
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

// The node the trailing `or…` button ORs onto (#595 round 2): the LAST top-level row,
// when it's a plain committed clause (→ wrap into an either/or group) or already a flat
// or-group (→ append a disjunct). Null otherwise (empty query, AND-subclause last row) —
// the button hides. Interim scope (Jason): only the LAST row can take a filter-OR.
const lastRowOrTarget = computed(() => {
  const w = v2.value && v2.value.where;
  if (!w) return null;
  const last = (w.node === "group" && w.implicit)
    ? w.children[w.children.length - 1]
    : w;
  if (!last || last.draft) return null;
  if (last.node === "clause") return last.id;
  if (last.node === "group" && last.join === "or") return last.id;
  return null;
});

// Trailing `or…` (#595): OR a new filter onto the top-level row `targetId` (a plain clause →
// it becomes an either/or group; an existing group → a new last disjunct). Opens a normal
// draft (field picker first) rendered as an `or`-led row under the target; the fold runs
// through anchorDraftIfReady → edit.orDraftOntoRow. Abandoning the draft never touches
// the tree — the wrap only happens at fold time.
const addOrDraftFor = (targetId) => {
  if (targetId == null || hasOpenDraft.value) return;
  clearSelection();
  const d = edit.makeDraft();
  d._orTarget = targetId;
  drafts.value.push(d);
  nextTick(() => { openFieldMenuId.value = d.id; });
};

// "and either" (V2, Jason 2026-07-11): the field-menu option that turns the open
// new-filter draft into a SUBCLAUSE creation — a group of OR-ed filters ANDed to the
// filter list. The draft is flagged and the field menu reopens: the user now picks the
// subclause's FIRST alternative; foldNow's `_thenOr` chain opens the second (or-draft)
// the moment it commits.
const onMakeSubclause = (tok) => {
  const d = draftById(tok.id);
  if (!d || d._orTarget != null) return;
  d._thenOr = true;
  nextTick(() => { openFieldMenuId.value = d.id; });
};

// Per-disjunct delete (#595): remove ONE alternative from an either/or group; deleting
// down to one disjunct dissolves the group back into a plain filter row (removeDisjunct).
const removeDisjunctRow = (clauseId) => {
  if (clauseId == null) return;
  clearSelection();
  edit.removeDisjunct(v2.value, clauseId, drafts.value);
  renderQuery({ swap: true });
};

// Delete ONE value arm of a value-AND clause (round 8): remove the arm's root value
// node; the render round-trip dissolves the AND (and the subclause lines) when a
// single arm remains.
const removeArmRow = (armId) => {
  if (armId == null) return;
  clearSelection();
  edit.removeNode(v2.value, armId, drafts.value);
  renderQuery({ swap: true });
};

// The per-line trash (round 9: it sits before the line NUMBER now — gutter lane on
// top-level lines, inside .bl-num2 on subclause lines).
const canDeleteLine = (line) => !!(line._disjunctDel || line._armDel || (line._menu && line._menu.deleteId));
const onLineTrash = (line) => {
  if (line._disjunctDel) removeDisjunctRow(line._disjunctDel);
  else if (line._armDel) removeArmRow(line._armDel);
  else onMenuDeleteLine(line);
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

// ---- FAMILY hover (round 20, Jason) ------------------------------------------
// Hovering a PARENT line highlights its whole family: the hovered line itself via
// plain CSS :hover, its DESCENDANTS via .bline--famhov. A descendant = the run of
// lines immediately after the hovered one with a deeper _level (the same walk the
// decimal numbering uses). Leaf lines have no run → no extra work. Cheap enough
// per line-crossing: one findIndex + a short scan over displayLines.
const hoverLineKey = ref(null);
const EMPTY_KEY_SET = new Set();
const famHovKeys = computed(() => {
  const k = hoverLineKey.value;
  if (k == null) return EMPTY_KEY_SET;
  const lines = displayLines.value;
  const i = lines.findIndex((l) => l.key === k);
  if (i < 0) return EMPTY_KEY_SET;
  const lvl = lines[i]._level || 0;
  const out = new Set();
  for (let j = i + 1; j < lines.length && (lines[j]._level || 0) > lvl; j++) out.add(lines[j].key);
  return out;
});

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
// (Round 10: the breadcrumb strip is commented out in the template; this computed is
// lazy — unread, it never evaluates — and stays wired for a cheap re-enable.)
// eslint-disable-next-line no-unused-vars
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
// so a `1.1` never breaks across two lines). Plus the number cell's own padding —
// 10px left / 20px right (#595 r5/r6, Jason) — since border-box keeps it inside the
// width. The drop-indicator reads the same prop and is given the same font so its
// `ch` matches.
const gutterW = computed(() => {
  let chars = 1;
  for (const l of displayLines.value) {
    // Round 4: subclause addresses moved inline (.bl-num2) — only TOP-LEVEL
    // addresses live in the gutter now, so only they size it.
    if (l.addr && !l._level) chars = Math.max(chars, l.addr.length);
  }
  // +46px = the gutter cell's paddings: 10px lane + 28px remove-× lane (round 10;
  // round 11 widened it 10px for breathing room) on the left, 8px on the right.
  return `calc(${chars} * 1ch + 46px)`;
});

// Shared FIELD-column width (#575 two-column table) — the gutterW trick: hug the widest
// field chip this query renders. MUST measure exactly what OqlFieldChip renders: chipLabel =
// `tok._label` (the property's display_name via enrichToken — NOT tok.text, which
// under-measured "display name" and made the value cell overlap the chip; Jason round 2).
// Since round 4 the predicate lives in the SLOT chip, so the field chip is the bare label.
// Field chips are mono at --brick-fs with 2×10px padding (.prop-chip-leaf); +24px covers
// padding/border. Chips are RIGHT-aligned in the cell, so residual over-measure becomes
// slack on the invisible LEFT side — the right boundary stays flush. Capped so a
// pathological field name degrades to overflow instead of eating the value column. Null
// (unset) when no line has a field (.bl-field then falls back to the bare connector slot).
const fieldColW = computed(() => {
  // #595 round 5 (Jason): an UNSET draft (no field picked yet) must NOT move the column —
  // opening a draft used to count as "select field" (12ch), widening every committed
  // field chip and jerking all the columns right. The unset draft chip now FILLS whatever
  // column the committed fields set (the SelectionMenu-wrapper display:contents fix + a
  // min-width:0 input). Only when there are NO committed fields at all (the first-ever
  // draft) does the draft size the column, at its own rendered content — the "field"
  // input placeholder (5ch).
  let chars = 0, draftFloor = 0;
  for (const l of displayLines.value) {
    // V2: only TOP-LEVEL lines size the global field column — subclause lines carry
    // their own per-sibling-group widths (line._fieldCh, see lineStyle). A top-level
    // group HEADER's word ("either" / "all of") fills the field column, so it
    // participates in the width (matters when the query is a bare root-OR).
    if (l._head && !l._level) { chars = Math.max(chars, String(l._head).length); continue; }
    const toks = l._fieldToks || [];
    if (!toks.length || l._fieldConn || l._level) continue;
    let w = 0, unset = false;
    for (const t of toks) {
      if (t._draft && !t._column) { unset = true; continue; }
      w += (((t._label || t.text || "").trim()) || "select field").length;
    }
    if (unset && !w) { draftFloor = Math.max(draftFloor, 5); continue; }
    chars = Math.max(chars, w);
  }
  if (!chars) chars = draftFloor;
  return chars ? `calc(${Math.min(chars, 36)}ch + 24px)` : null;
});

// Shared SLOT-column width (#575 round 4): the connector slot between field and values
// holds the predicate chip ("has"/"is"/"≥") on field rows and the `and` conn chip on
// AND-arm rows — size the column to the query's widest occupant ("and" = 3ch floor) so
// every slot chip is flush. +10px = the pred chip's 2×4px padding + a hair of slack; the
// conn chip has no padding and stretches to min-width. Falls back to --chip-w when unset.
const predColW = computed(() => {
  let chars = 3; // "and"
  for (const l of displayLines.value)
    if (l._slotPred && !l._level) chars = Math.max(chars, String(l._slotPred).trim().length);
  return `calc(${Math.min(chars, 14)}ch + 10px)`;
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
// Round 23 (Jason): the builder no longer EDITS the return columns (the `return`
// line + "Add return columns" menu item are gone — that's the results table's job).
// The column STATE stays wired: it still renders the OQL `return` clause (buildReturn
// below), feeds `hasQuery`, resets on clear, and stays in sync with the table's own
// column picker via useColumnsState.
const { columnKeys, defaultColumnKeys, setColumns } =
  props.standalone ? useLocalColumns(getRows) : useColumnsState(getRows);
const columnsAreDefault = computed(() => JSON.stringify(columnKeys.value) === JSON.stringify(defaultColumnKeys.value));
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
     #575 round 4: bumped 26px → 34px so the connector chips fit a THREE-LETTER WORD —
     the `and`/`or`/predicate chips show words now, no more `&` glyph (Jason). */
  --chip-w: 34px;
  /* Lead-column width. Round 16 (Jason): just big enough for the one-char "&" —
     1ch + the chip's side padding. The trailing "&…" button needs two chars and
     simply OVERFLOWS into the next column (visible only on its rare hover). */
  --lead-w: calc(1ch + 10px);
  /* The line-number cell's LEFT padding (#595 r4-r6, Jason: number padding = 10px
     left / 20px right) — puts the numbers at (roughly) the results checkbox column.
     Carried by .bline::before / .bl-orrow::before padding-left and the row-drag bar. */
  --lane-w: 10px;
  /* Round 10 (Jason): an icon-size lane LEFT of the gutter digits, home of the hover
     remove-× — the gutter cell grew by this much so the × has its own column.
     Round 11: +10px breathing room between the × and the digits (18px icon + 10px gap). */
  --trash-w: 28px;
  --paren-w: var(--chip-w);   /* open/close paren = the shared chip width */
  --indent: var(--chip-w);    /* one indent step = one chip width */
  --brick-fs: 0.8125rem;
  /* Round 20 (Jason): ONE ink for all canvas numbering — line numbers (gutter,
     inline, chrome ::before) AND the hover "N subclauses:" phrase read this pair,
     so they can never drift apart again. */
  --num-ink: #1a1a1a;
  --num-op: 0.3;
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
/* "search" as plain toolbar text (#595 round 2, Jason): the verb belongs to the toolbar,
   not the button — only the entity is the choice, so only the entity is the control.
   Type matches the entity button's quiet toolbar look. */
/* Round 12 (Jason): the toolbar phrase is MONOSPACE now — "get works (core) where…" —
   with the entity name bold; "where…" trails the entity selector (the canvas's leading
   "where" chip became a blank box). */
/* round 14 (Jason): the whole toolbar phrase is BLACK — no grey text. */
.tb-search-label {
  padding: 0 2px 0 6px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.875rem;
  color: #1a1a1a;
  user-select: none;
}
.tb-where-label {
  padding: 0 2px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.875rem;
  color: #1a1a1a;
  user-select: none;
}
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
  color: #1a1a1a !important; /* round 14: all-black toolbar */
  /* round 12 (Jason): monospace + BOLD entity name — the toolbar phrase
     "get works (core) where…" reads as the query's first line */
  font-family: "JetBrains Mono", monospace !important;
  font-weight: 700;
  letter-spacing: 0;
  border-radius: 6px;
  box-shadow: none;
  padding: 0 6px;
}
.builder-toolbar :deep(.entity-chip:hover) { background: rgba(0, 0, 0, 0.06) !important; }
/* round 14: the affix + caret go black with the rest; the caret hugs the entity
   name — as though it were the next monospace character. */
.builder-toolbar :deep(.entity-affix) { color: #1a1a1a; }
.builder-toolbar :deep(.entity-chip .v-chip__append) { color: #1a1a1a; margin-inline-start: 0; margin-left: -2px; }
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
/* Horizontal drop-indicator for ROW drag (#595 round 2): the vdrop bar rotated — marks the
   between-rows boundary where the dragged row will land. Spans the content lane (past the
   left whitespace lane to the card edge). */
.rowdrop-indicator {
  position: absolute;
  left: var(--lane-w, 10px);
  right: 0;
  height: 3px;
  margin-top: -1.5px;       /* center the bar on the row boundary */
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
  width: var(--lead-w, var(--chip-w, 26px));
  min-width: var(--lead-w, var(--chip-w, 26px));
  margin-right: var(--gx);
  margin-top: 0;
  border-radius: 4px;
  background: var(--conn-bg, #fdf6f0);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
}
/* #575 round 8 (Jason): the leading `→` arrow is replaced by the word "the" ("the title has
   foo") — a natural-language flow marker matching the "and" on subsequent rows. Same peach
   lead metrics; no size bump (it's a word now, not a glyph). Rendered in normal (non-italic)
   type, same as "and" (Jason, 2026-07-09) — .bl-lead--the stays as a styling hook. */
/* (Round 10: the lead-`and`-chip drag handle (#595 r2) is gone — rows drag by their
   LINE NUMBER now, `.num-grab` below.) */
/* on a selected row the lead chip darkens with the rest of the row's chips. */
.bline--sel .bl-lead { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* #575: a row with no lead (value-continuation rows) keeps an EMPTY transparent spacer in the
   lead column so the field column starts at one shared x on every row. Placed after the --sel
   rule so a selected continuation row's spacer stays transparent too. */
.bl-lead.bl-lead--spacer, .bline--sel .bl-lead.bl-lead--spacer { background: transparent; }
/* ---- V2 outline additions (2026-07-11; geometry reworked round 2) ------------
   CHILD-line lead chip ('and' / 'or' / blank): PREDICATE-column width, indented via
   lead2Style to where the parent header's content ends, so the outline shares one
   grid with the top-level rows. Scope colour: filter = peach, value = periwinkle.
   A BLANK lead is a real chip (visible fill, no text) — the head-word placeholder. */
.bl-lead2 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  min-width: var(--lead2-w, var(--chip-w, 26px));
  padding: 0 4px;
  border-radius: 4px;
  margin-right: var(--gx);
  background: var(--conn-bg, #fae1d1);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
}
.bl-lead2--val { background: var(--vconn-bg, #dbe7ff); color: var(--vconn-fg, #1f6feb); }
/* round 8 (Jason): the LAST and/or chip in a subclause column finishes the pipe —
   it turns from south to east: max-rounded bottom-left corner (13px = half the
   26px chip, mirroring the header turn-marker's top-right). */
.bl-lead2--end { border-bottom-left-radius: 13px; }
/* round 9 (Jason): the inline value `or` connector is natural-width — it never
   column-aligns (unlike the pred-column and/or lead chips), so no --chip-w floor. */
.bl-body :deep(.val-chip.conn-chip) { width: auto; min-width: 0; padding: 0 6px; }
/* ---- round 11 (Jason): monochrome + selection rework -------------------------
   1. Ghost or/and buttons (OqlLineTailControls): grey ink + grey hover fill — the
      family-colour vars they read are chip bg/fg pairs now (--conn-fg is WHITE),
      so they need explicit canvas-ink colours here.
   2. Locked filtername chips are INERT — not selectable, nothing to click for:
      default cursor, no hover tint (the draft picker/type-on chips keep theirs).
   3. Selecting a value chip = a BLACK BORDER (inset ring, no layout shift); the
      background stays the resting grey (-sel vars equal the base). Excludes the
      inert conn chips, which never read as selected. Covers .selected,
      .multi-selected, and :focus — every path oqlChip.css used to paint black. */
.builder-lines :deep(.line-plus) { color: #1a1a1a; margin-left: 0; }
/* Round 20 (Jason): the row-hover reveal shows the EOL ghost buttons at FULL black
   (the component's 0.55 fade read as grey ink); button-hover fill = the CHIPS' own
   background var — one var (--val-bg = the V2 chip grey) so they can't drift. The
   .line-and variants are spelled out to out-specify the component's own scoped
   `.line-plus.line-and:hover` peach rule. */
.builder-lines :deep(.bline:hover .line-plus) { opacity: 1; }
.builder-lines :deep(.line-plus:hover),
.builder-lines :deep(.line-plus.line-and:hover) { color: #1a1a1a; background: var(--val-bg, #ececec); }
.builder-lines :deep(.line-plus.line-and) { color: #1a1a1a; }
/* round 11 (Jason: "margins around value OR chips are inconsistent — left too wide"):
   the only measured asymmetry was the GHOST or (4px left gap = its 2px margin-left on
   top of the tail unit's 2px flex gap, vs the committed ors' uniform 2px) — margin
   zeroed above so every or sits at the one --gx rhythm. */
.bl-field :deep(.prop-chip-leaf:not(.prop-typeon)) { cursor: default; }
.bl-field :deep(.prop-chip-leaf:not(.prop-typeon):hover) { background: var(--prop-bg, #1a1a1a); }
/* r22 (Jason): the ring paints ONLY for Cmd-multi — the .selected and :focus
   variants are gone (chips are never selected since r20; the :focus ring lingered
   on any clicked chip and read as a phantom "selected" state). */
.builder-lines :deep(.val-chip.multi-selected:not(.conn-chip)),
.builder-lines :deep(.val-chip.multi-selected:not(.conn-chip):hover) {
  box-shadow: inset 0 0 0 1.5px #1a1a1a;
}
/* round 9 (Jason): hover a group-header line → "N subclauses:" after the turn chip.
   Round 10: styled like the line numbers (peach at half-opacity, NO italics, trailing
   colon in the template), and inset as though it were a chip in the value column —
   the 10px padding matches a value chip's own text inset, so the phrase's left edge
   lines up with the value text above (e.g. "climate"). */
.bl-subcount {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  height: 26px;
  padding: 0 10px;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  /* r20 (Jason): ALWAYS the line numbers' exact ink — shared --num-ink/--num-op,
     so the two can't drift (they had: numbers went to 0.3 in r19, this stayed 0.5). */
  color: var(--num-ink);
  opacity: 0;
  pointer-events: none;
  user-select: none;
}
.bline:hover .bl-subcount { opacity: var(--num-op); }
.bline--sel .bl-lead2 { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
.bline--sel .bl-lead2--val { background: var(--vconn-bg-sel, #1f6feb); color: var(--vconn-fg-sel, #fff); }
/* ---- V2 turn-marker chip (rounds 3–6, Jason) ----------------------------------
   The chip ending a group header line, saying "the flow turns 90° down here".
   Round 6: no more on-chip SVG lines/arrows — the marker is the chip's SHAPE: a
   blank chip whose TOP-RIGHT corner is maximally rounded (13px = half the 26px
   height, a quarter-circle) while the other corners keep the standard 4px. */
.bl-tail {
  display: inline-flex;
  box-sizing: border-box;
  flex: 0 0 auto;
  /* r21/r23: the same right-inset every boundary chip carries now (spike rule /
     --turn rule) — ALL structural cell content shares one right edge, and the
     child-line indent (lead2Indent's −13px) lands on it for every parent kind.
     (r23: 5→13 with the full-height spike.) */
  margin-right: 13px;
  height: 26px;
  border-radius: 4px 13px 4px 4px;
  background: var(--conn-bg, #fae1d1);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace; /* ch in the inline minWidth resolves here */
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
}
/* nested (level ≥1) either-head: the tail follows the natural-width head chip */
.bl-tail--gap { margin-left: var(--gx); }
/* round 9: on a value-AND header the predicate chip ITSELF is the turn marker —
   same max-rounded top-right corner as .bl-tail. */
.bl-slot-pred--turn { border-top-right-radius: 13px !important; }
.bline--sel .bl-tail { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* Round 4 (Jason): a SUBCLAUSE line's decimal address sits inline, immediately left
   of its lead chip (right-aligned under the parent's field-name chip) — .bl-num2 IS
   the line's indent cell (width = the old lead2 margin-left expr, set inline by
   num2Style). The OUTER span stays at --brick-fs mono so the ch units in that width
   resolve exactly like the chip cells they were measured against (the round-2
   gotcha); the INNER span shrinks the digits to the gutter's size/colour. */
.bl-num2 {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  padding-right: 8px;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  white-space: nowrap;
  user-select: none;
}
/* Numbers: grey ink at half-opacity (round 11 — the round-5 peach went with the
   monochrome pass), full text size (was 0.72rem; the outer cell is already mono at
   --brick-fs, so the inner span just inherits). */
.bl-num2 > span { color: var(--num-ink); opacity: var(--num-op); } /* r20: shared --num-ink/--num-op */
.bline--sel .bl-num2 > span { font-weight: 700; color: var(--num-ink); opacity: 1; }
/* …and the gutter cell goes BLANK on those lines (the ::before box keeps its --num-w
   width so every row's content shares one origin). Doubled class = out-specify the
   later `.bline::before { content: attr(data-addr) }` rule. */
.bline.bline--sub::before { content: ""; }
/* group-header chip ("either" / "all of"). On a top-level header it FILLS the shared
   field column (the field-chip fill recipe: right-aligned label, ghost predicate
   spacer holding the field|predicate boundary). Nested headers stay natural-width. */
.bl-headchip {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  padding: 0 10px;
  border-radius: 4px;
  background: var(--conn-bg, #fae1d1);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
}
.bl-headchip--fill { flex: 1 1 auto; justify-content: flex-end; }
.bl-slot-ghost { flex: 0 0 auto; min-width: var(--pred-w, var(--chip-w)); height: 26px; }
.bl-headfill { flex: 1 1 auto; }
.bline--sel .bl-headchip { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* DRAFT field input (V2 round 2, Jason): the type-on chip left-aligns while you
   type — the committed chips' right-alignment is right for reading, wrong for a
   text box (the caret hugging the right edge is confusing). */
.bl-field :deep(.prop-typeon) { flex: 1 1 auto; justify-content: flex-start; }
.bl-field :deep(.prop-typeon .typeon-input) { text-align: left; }
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
  width: calc(var(--field-w, 0px) + var(--pred-w, var(--chip-w)) + var(--gx));
  min-width: calc(var(--field-w, 0px) + var(--pred-w, var(--chip-w)) + var(--gx));
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  justify-content: flex-end;
  gap: var(--gx);
  margin-right: var(--gx);
  min-height: 26px;
  /* stretch to the FULL line height (the .bline is align-items:flex-start, so opt in here):
     the wrap-marker tile below repeats down the whole wrapped line (#575 round 6). */
  align-self: stretch;
  align-content: flex-start;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs);
}
/* (Round 20, Jason: the r19 ↳ line-continuation marker is REMOVED "for now" — the
   .bl-field--marked tile rule + its class binding are gone. If it comes back, the
   mechanism was: field cell stretches full line height, 26×28 tiles repeat-y
   right-aligned under the pred chip, row 1's OPAQUE pred covers tile 1 — which is
   why chips must stay opaque; see the r18 gotcha.) */
/* Round 21 (Jason): the #575-r5 FILL rule is RESTORED — every committed field chip
   fills the full field column ("column 2 chips must fill column 2"; r20 briefly made
   them natural-width, misreading the round-20 report — the real bug was the 5px
   right-edge spill fixed at .bl-slot-pred--turn below). Label right-aligned inside,
   hugging its predicate; the unset type-on draft keeps its own fill rule above. */
.bl-field :deep(.prop-chip-leaf:not(.prop-typeon)) { flex: 1 1 auto; justify-content: flex-end; }
.bl-field :deep(.bl-tok > div) { display: contents; }
.bl-field :deep(.prop-chip) { flex: 1 1 auto; justify-content: flex-end; }
/* a filter row's connector slot holds the inert PREDICATE chip (#575 round 4 — was the
   round-3 `→`): peach, and sized to the shared slot column (--pred-w = the query's widest
   predicate, min one chip) so it stacks with the `and` conn chips on the AND-arm rows. */
.bl-slot-pred {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  min-width: var(--pred-w, var(--chip-w));
  padding: 0 4px;
  border-radius: 4px;
  background: var(--conn-bg, #fdf6f0);
  color: var(--conn-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  user-select: none;
  pointer-events: none;
}
/* darken with the rest of the row's chips on selection (same as .bl-lead). */
.bline--sel .bl-slot-pred { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* EDITABLE numeric predicate (#575 round 8, Jason): the operator (=/≥/≤/>/<) can be changed
   from a menu, so this slot reads as ACTIONABLE — the darker `--prop-bg` peach of the other
   interactive chips (field chips), vs the light `--conn-bg` of the inert predicate above.
   Exactly two chip background weights: light = non-interactive, dark = interactive (Jason,
   2026-07-09 — replaced round 8's third ad-hoc #f2ccae shade). Solid orange on hover/open. */
.bl-slot-pred--edit {
  pointer-events: auto;
  cursor: pointer;
  border: none;
  font-weight: 700;
  background: var(--prop-bg, #fae1d1);
}
.bl-slot-pred--edit:hover,
.bl-slot-pred--edit[aria-expanded="true"] { background: var(--prop-bg-hov, #dcdcdc); color: var(--prop-fg, #1a1a1a); }
/* ---- round 14 (Jason): one chip colour — the structure/value boundary is SHAPE ----
   SPIKE: a right-pointing arrow off the chip immediately left of the line's first
   value chip (predicates, value-arm and/blank leads, the either-head turn chips).
   Round 23 (Jason): the spike is now as tall as the WHOLE chip — the chip becomes a
   five-sided "one way" street sign (rounded-rect left, two edges meeting at a 90°
   point on the right). Full-height 26px means the ::after triangle is 13px on each
   half (26px tall) and 13px wide (a right angle at the tip). The right corners of the
   chip square off so the triangle base meets flush. Same fill as the chip; the wider
   13px boundary inset (below) keeps the whole arrow in the field→value gutter, so the
   VALUE column doesn't move (the field cell is fixed-width — the inset only slides the
   field+pred group left within it). */
.bl-spike {
  position: relative;
  /* squared right side — the triangle base is the chip's right edge */
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
/* r16/r23: the spiked chip carries its own whitespace (the r14/15 uniform column
   shifts are undone — Jason: sub-lines play by gridless value-chip rules, inconsistent
   gutters between line families are fine). Lead spikes push their margin; the pred
   spike insets from its right-aligned cell edge so the 13px arrow lands in the cell
   gap ahead of the value chip. (r14: 5px nub → r23: 13px full-height point.) */
.bl-lead2.bl-spike { margin-right: calc(var(--gx) + 13px); }
.bl-slot-pred.bl-spike { margin-right: 13px; }
/* Round 21 (Jason: "title/abs spills past column 2's right edge"): a value-AND
   HEADER's turn pred has no spike, so its right-aligned cell content sat right of
   every spiked row's — the header's FIELD chip broke the shared right edge (visible
   only when >1 subclauses, since that's when the header line exists). Give the
   unspiked turn pred the SAME inset as the spiked preds so every field cell's content
   right-aligns identically. (r23: bumped 5→13 with the full-height spike; spiked turn
   preds carry it via the rule above; builderLayoutV2's arm `_indPx` subtracts the same
   13 to keep arms on the pred column.) */
.bl-slot-pred--turn:not(.bl-spike) { margin-right: 13px; }
/* (r18: the r17 dark-variant CSS is gone with the toggle) */
.bl-spike::after {
  content: "";
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 13px solid transparent;
  border-bottom: 13px solid transparent;
  border-left: 13px solid var(--conn-bg, #ececec);
}
/* (r19: the r14 leaf-pill right edge is gone — "not working for me"; terminal value
   chips wear the standard 4px corners like every other chip.) */
.bline--sel .bl-slot-pred--edit { background: var(--conn-bg-sel, #b25d06); color: var(--conn-fg-sel, #fff); }
/* the continuation `and` conn chip fills the same slot column width, so the two stay flush. */
.bl-field--conn :deep(.conn-chip) { width: auto; min-width: var(--pred-w, var(--chip-w)); }
/* (V2: the #575/#595 or-group mini-table CSS is gone — groups render as plain
   indented outline lines.) */
/* (#575 round 2: the ghost `&` moved into OqlLineTailControls, after the ghost `or`.) */
/* Permanent "add filter" affordance line (#575 round 8, Jason): the always-present trailing
   line, now an explicit button instead of the cryptic `…` ellipsis. */
.bline--addfilter { cursor: pointer; }
/* (#595 round 6: the dimmed `.bline--addfilter-off` open-draft state is gone — the line
   now HIDES entirely while any draft is open, v-if in the template.) */
/* "and…" — the trailing add-another-filter button. Round 10 (Jason): it acts and looks
   like the END-OF-LINE ghost `and` buttons (OqlLineTailControls .line-and), with one
   exception — it's permanently in the "line is hovered" state (faint peach text at
   0.55; hovering its line changes nothing). Its own hover goes solid like the ghosts
   (opacity 1 + peach fill). Width = the lead column (--lead-w), text centered, so it
   sits flush with the `where`/`and` lead chips above it (was a bit too wide). */
.add-and-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 26px;
  width: auto;               /* r16: "&…" is 2ch — overflow the 1ch lead column */
  min-width: var(--lead-w, 34px);
  padding: 0 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #1a1a1a;
  opacity: 1; /* r20 (Jason): EOL buttons read BLACK — the 0.55 fade looked grey */
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  font-weight: 400;
  cursor: pointer;
  transition: background 0.1s ease;
}
.add-and-btn:hover { background: var(--val-bg, #ececec); } /* the chips' own bg var (r20) */
/* (V2 round 2: the trailing `or` button + its CSS are gone — filter-OR creation
   lives in the field menu's "Either…" option.) */
/* "select filter" — the empty-state call to action (#595 round 4, Jason: the no-filter
   state renders like a filter row — `where` lead + this filtername-style chip in the spot
   the draft field chip will take). Same recipe as the field chips (.prop-chip-leaf,
   oqlChip.css): peach fill, darker peach on hover. Clicking opens a normal draft. */
.select-filter-btn {
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  background: var(--prop-bg, #fae1d1);
  color: var(--prop-fg, #b25d06);
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  white-space: nowrap;
  cursor: pointer;
}
.select-filter-btn:hover { background: var(--prop-bg-hov, rgba(0, 0, 0, 0.16)); }
/* The trailing controls travel as ONE no-wrap unit (#523 round 6, Jason): the last chip + the `or`
   button + the line-menu chevron must never wrap onto a line by themselves. For a BRICK tail the
   controls (OqlLineTailControls) live inside the chip's `.bl-tok`, switched here from
   `display:contents` to an inline-flex no-wrap box so the chip + controls are a single flex item.
   #523 round 9: the selector MUST be `.bl-tok.bl-tok--tail` (2 classes) — the round-6 single-class
   `.bl-tok--tail` was DEFEATED by the later `.bl-tok { display: contents }` rule (equal specificity,
   later source wins), so `display:contents` quietly stuck and the controls stayed loose + wrapped
   alone. The extra class makes inline-flex win regardless of source order. */
.bl-tok.bl-tok--tail { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: var(--gx); }
/* END-OF-LINE DELETE trash button (#595 round 4, Jason — moved from the left gutter, which
   the line numbers now own). A flex tail item after the (flex-grow) value cell, so it sits
   at the line's far right — same spot as the per-disjunct trash on either/or sub-rows.
   Revealed on row hover; reddens on its own hover to read as a delete. */
.row-trash {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 22px;
  margin-top: 2px;
  margin-left: 4px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  /* round 10 (Jason): the remove control is an × — same colour + half-opacity as the
     digits beside it (round 11: grey ink, monochrome). Hover goes full black (the red
     was off-palette). */
  color: #1a1a1a;
  opacity: 0.5;
  cursor: pointer;
  visibility: hidden;
}
.bline:hover .row-trash { visibility: visible; }
.row-trash:hover { opacity: 1; background: rgba(0, 0, 0, 0.07); }
/* round 12 (Jason): smaller × — the template's size prop has never applied here
   (App.vue's global `.v-icon { font-size: 18px !important }` house rule wins over
   the inline style), so out-specify it. */
.row-trash :deep(.v-icon) { font-size: 12px !important; width: 12px !important; height: 12px !important; }
/* Round 9 (Jason): the remove-× sits immediately BEFORE the line number. Round 10:
   top-level lines park it in the .bl-num1 cell's own × lane (rule above); sub lines
   keep it inline in the .bl-num2 cell, right before the digits (round 11: 12px gap,
   matching the top-level lane's +10px breathing room). */
.row-trash--num {
  width: 18px;
  height: 20px;
  margin: 0 12px 0 0;
}
/* (#595 round 2: the per-row hover ghost `or…` overlay was removed — Jason: busy and
   confusing. Filter-OR creation lives on the trailing add-filter line's .add-or-btn.) */
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
     the card edges. #595 round 4-6 (Jason): the roomy 40px left lane is gone — the trash that
     lived there moved to the line's end, and the number cell (::before) carries its own
     10px-left/20px-right padding, putting the numbers at (roughly) the results checkbox
     column. The left-margin RAILS were removed (#507): hover/selection read from the
     background band alone. */
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 0;
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
/* Round 20 (Jason): FAMILY hover — hovering a PARENT line highlights its descendants
   too (hover line 3 → 3, 3.1, 3.2 all banded). The parent keeps the pure-CSS :hover
   above; descendants get .bline--famhov from the builder (hoverLineKey + the _level
   walk in famHovKeys). Same band as :hover so the family reads as ONE hover. */
.bline-flow > .bline--famhov:not(.bline--sel) {
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
     hugs the widest address + a 20px gap (#595 r5), so the gap is the padding below. border-box
     keeps the padding inside the computed width. */
  box-sizing: border-box;
  width: var(--num-w);
  /* never let a multi-part address (`1.1`) wrap across two lines — the width is the
     exact `n * 1ch`, so nowrap guarantees it stays on one row. */
  white-space: nowrap;
  /* center the number against the 26px chip row: fixed line-height instead of the
     old 6px top-margin (r17 — at 13px type the margin sat the addfilter line's
     number ~3px low vs its "&…" button; committed lines center via .bl-num1). */
  margin-top: 0;
  line-height: 26px;
  /* the number's breathing room: 10px left (#595) + the round-10 remove-× lane;
     right gap tightened 20px → 8px (round 5, Jason) to match the inline .bl-num2
     numbers' distance from their chip. gutterW's +36px = these paddings. */
  padding-left: calc(var(--lane-w, 10px) + var(--trash-w, 18px));
  padding-right: 8px;
  /* LEFT-aligned (Jason 2026-06-20): the leading integer (and so the first dot) line up
     down the gutter — `1`, `1.2`, `1.2.1` all start at the same column — instead of the
     ragged look right-alignment gives (where only the last digit aligns). */
  text-align: left;
  font-family: "JetBrains Mono", monospace;
  /* round 11 (Jason): full text size + grey ink (was 0.72rem peach); half-opacity (r9) */
  font-size: var(--brick-fs, 0.8125rem);
  color: var(--num-ink); /* r20: shared --num-ink/--num-op */
  opacity: var(--num-op);
  user-select: none;
}
.bline--sel::before { font-weight: 700; color: var(--num-ink); opacity: 1; }
/* Round 10: TOP-LEVEL query lines carry a REAL gutter cell (.bl-num1 — the ::before
   pseudo can't take drag handlers), so their ::before hides entirely. Chrome lines
   (sort / return / the trailing add-filter) keep the pseudo cell + its number. The
   real cell mirrors the pseudo's geometry: [--lane-w pad][remove-× lane][digits]. */
.bline.bline--num1::before { display: none; }
.bl-num1 {
  box-sizing: border-box;
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  width: var(--num-w);
  height: 26px;
  padding-left: calc(var(--lane-w, 10px) + var(--trash-w, 18px));
  padding-right: 8px;
  white-space: nowrap;
  font-family: "JetBrains Mono", monospace;
  /* round 11 (Jason): numbers at the same size as the rest of the text; grey ink */
  font-size: var(--brick-fs, 0.8125rem);
  color: var(--num-ink); /* r20: shared --num-ink/--num-op */
  user-select: none;
}
/* the × pins to its own lane so the digits' x never moves (the button is v-if'd) */
.bl-num1 > .row-trash--num { position: absolute; left: var(--lane-w, 10px); top: 3px; margin: 0; }
/* digits sit at a fixed x (the × lane is always reserved, hover or not) */
.bl-num1-digits { display: inline-block; opacity: var(--num-op); }
.bline--sel .bl-num1-digits { font-weight: 700; color: var(--num-ink); opacity: 1; }
/* the line-number drag handle (round 10): grab cursor on the digits */
.num-grab { cursor: grab; }
.num-grab:active { cursor: grabbing; }
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
  /* (#575 r6 removed the wrapped-row hanging indent; round 5 2026-07-13 brought it
     BACK, one predicate-block deep — see the padding-left/::before/--marked rules
     near .bl-tail above. The ↳ marker paints in that indent zone now, not on the
     field cell.) */
}
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
/* "+" affordances on the sort line: revealed only while hovering that line
   (oxjob #428 — keep them, just unclutter). App.vue's ghost reset forces btn
   opacity 1, so hide via visibility. (round 23: the return line is gone.) */
.hover-reveal { visibility: hidden; }
.bline:hover .hover-reveal { visibility: visible; }
.sort-chip { cursor: pointer; background: var(--val-bg) !important; color: var(--val-fg) !important; }
.sort-chip.pending { background: transparent !important; color: rgba(0, 0, 0, 0.55) !important; }
/* (round 23: .return-chip removed with the return-columns line.) */
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
