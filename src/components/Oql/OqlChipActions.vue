<!--
  OqlChipActions — the builder's CONTEXTUAL TOOLBAR (oxjob #428, 2026-06-17). The chip
  pop-up menus were removed; the action a chip used to offer now appears as buttons up
  here whenever that chip is highlighted. This is the left half of the builder toolbar.

  FOUR states, driven by the parent's selection:
    • nothing selected  → a single "Add filter" button (the only builder-level default).
    • a logical ROW selected → the row's actions: Insert (a value inside) / Append (a sibling),
      "Operator" (numeric properties only), and Delete. The join (AND/OR) is NOT here — it's a
      menu on the group's own `(` paren chip (oxjob #475). (oxjob #475)
    • one VALUE chip selected → that value's actions: an "Edit" button (bool True/False or the
      date calendar in a popover; text/number focuses the chip's in-place input via `edit-text`;
      an entity re-opens its picker via `edit-entity`), plus Negate and Delete as they apply.
    • ≥2 chips selected (#472) → the batch actions ("Wrap as subclause" when groupable, Delete).

  Every button is an <OqlToolbarAction> carrying the uniform structured tooltip. PURELY
  PRESENTATIONAL — it emits intents the builder maps onto its v2 edit ops. The `editor-open`
  model lets the builder open the value Edit popover programmatically.

  Props
    activeTok      the single highlighted VALUE token (vbrick), or null.
    rowSelection   the selected logical row's toolbar view { kind, opChoices, predicate,
                   canAdd }, or null.
    selectedCount  size of the #472 multi-selection (0/1 ⇒ single-chip mode).
    canSubclause   whether the multi-selection can wrap into a subclause.
    selectionKind  "filters" | "values" (batch wording).
    cmdLabel       "⌘" on mac / "Ctrl" elsewhere (for shortcut keycaps).
    editorOpen     v-model: is the Edit popover open (parent can open it programmatically).
-->
<template>
  <div class="chip-actions">
    <!-- ≥2 selected: batch actions (the old floating batch menu, relocated to the toolbar) -->
    <template v-if="selectedCount >= 2">
      <OqlToolbarAction v-if="canSubclause" label="Wrap as subclause" icon="mdi-select-group"
        :desc="`Group the ${selectedCount} selected ${nounPlural} into a parenthesised subclause.`"
        @click="$emit('wrap-subclause')" />
      <OqlToolbarAction label="Delete" icon="mdi-delete-outline" danger
        :desc="`Delete the ${selectedCount} selected ${nounPlural}.`" :shortcut="['⌫']"
        @click="$emit('delete-selected')" />
    </template>

    <!-- a LOGICAL ROW is selected (oxjob #428): a property / paren / conjunction selected the
         whole filter expression or subclause. Its only edits are the join strategy (and ⇄ or),
         a numeric property's comparison operator, and delete. The property itself can't change. -->
    <template v-else-if="rowSelection">
      <!-- INSERT (primary — oxjob #475). For a normal row: a value inside this clause. For the
           ROOT clause-group: a new filter into the query. Keyboard Enter when the row is selected.
           (Verb/icon refresh, Jason 2026-06-18: "Value" → "Insert".) -->
      <OqlToolbarAction v-if="rowSelection.canAdd" label="Insert" icon="mdi-arrow-expand-vertical"
        :desc="rowSelection.root ? 'Insert a new filter into the query.' : 'Insert another value into this clause.'"
        :shortcut="['enter']" @click="$emit('row-add-value')" />
      <!-- APPEND a sibling after this one (drops onto the next row). Keyboard Cmd/Ctrl+Enter.
           Not for the root group (it's pinned at the top — nothing to append beside). -->
      <OqlToolbarAction v-if="rowSelection.canAdd && !rowSelection.root" label="Append" icon="mdi-arrow-expand-down"
        desc="Append a sibling right after this one." :shortcut="[cmdLabel, 'enter']"
        @click="$emit('row-add-sibling')" />
      <!-- The AND/OR join toggle moved OFF the row (oxjob #475): it now lives on the
           group's own `(` paren chip menu. -->
      <v-menu v-if="rowSelection.opChoices.length" location="bottom start" offset="6">
        <template #activator="{ props: mp }">
          <OqlToolbarAction v-bind="mp" label="Operator" icon="mdi-code-equal-variant"
            desc="Change the comparison operator." />
        </template>
        <v-card class="menu-card chip-menu" min-width="180">
          <v-list density="compact" class="py-0">
            <v-list-item v-for="o in rowSelection.opChoices" :key="o.key" :active="o.label === rowSelection.predicate"
              @click="$emit('row-change-operator', o)">
              <template #prepend><v-icon size="16" class="mi-icon">mdi-code-equal-variant</v-icon></template>
              <v-list-item-title>{{ o.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
      <!-- the root clause-group can't be deleted (it's the query body) — only normal rows. -->
      <OqlToolbarAction v-if="!rowSelection.root" label="Delete" icon="mdi-delete-outline" danger :shortcut="['⌫']"
        :desc="`Delete this ${rowSelection.kind === 'subclause' ? 'subclause' : 'filter'}.`"
        @click="$emit('row-delete')" />
    </template>

    <!-- one VALUE chip selected: its contextual actions (structural selection is the row
         toolbar above; `activeTok` is always a value now — oxjob #475) -->
    <template v-else-if="activeTok">
      <!-- EDIT — bool/date choosers drop from this button (text/number focuses inline) -->
      <v-menu v-if="editKind && editKind !== 'text'" v-model="editorProxy"
        location="bottom start" offset="6" :close-on-content-click="editKind !== 'date'">
        <template #activator="{ props: mp }">
          <OqlToolbarAction v-bind="mp" label="Edit" icon="mdi-pencil-outline"
            :desc="editDesc" :shortcut="['enter']" :active="editorProxy" />
        </template>
        <v-card class="menu-card chip-menu" :min-width="editKind === 'date' ? 268 : 180">
          <!-- boolean: the two value options (true/false, or phrase ⇄ negated phrase) -->
          <v-list v-if="editKind === 'bool'" density="compact" class="py-0">
            <v-list-item v-for="(opt, i) in boolOptions" :key="i" @click="opt.act()">
              <template #prepend>
                <v-icon size="16" class="mi-check" :class="{ on: opt.selected }">
                  {{ opt.selected ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                </v-icon>
              </template>
              <v-list-item-title>{{ opt.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- date: the Linear-style calendar -->
          <OqlDatePicker v-else-if="editKind === 'date'" :value="dateValue"
            @pick="(iso) => { $emit('pick-date', iso); editorProxy = false; }" />
        </v-card>
      </v-menu>
      <!-- text / number: Edit focuses the chip's in-place input (no popover) -->
      <OqlToolbarAction v-else-if="editKind === 'text'" label="Edit" icon="mdi-pencil-outline"
        desc="Edit this value." :shortcut="['enter']" @click="$emit('edit-text')" />
      <!-- entity: Edit opens the entity picker in replace mode (oxjob #428) -->
      <OqlToolbarAction v-else-if="isEntityVal" label="Edit" icon="mdi-pencil-outline"
        desc="Pick a different entity." :shortcut="['enter']" @click="$emit('edit-entity')" />

      <!-- APPEND: add another value right after this one (the chip's Cmd/Ctrl+Enter as a button,
           oxjob #475). Only for multi-value kinds (text/number/entity). (Verb/icon refresh:
           "Sibling" → "Append", a sideways expand since the value lands to the chip's right.) -->
      <OqlToolbarAction v-if="canAddSibling" label="Append" icon="mdi-arrow-expand-right"
        desc="Append a value right after this one." :shortcut="[cmdLabel, 'enter']"
        @click="$emit('add-sibling')" />

      <OqlToolbarAction v-if="negatable" :label="activeTok.negated ? 'Un-negate' : 'Negate'"
        icon="mdi-cancel" :desc="negateDesc" @click="$emit('toggle-neg')" />

      <OqlToolbarAction v-if="deletable" label="Delete" icon="mdi-delete-outline" danger
        :desc="deleteDesc" :shortcut="['⌫']" @click="$emit('delete')" />
    </template>

    <!-- nothing selected: the lone builder-level default -->
    <OqlToolbarAction v-else label="Add filter" icon="mdi-plus"
      desc="Add a new filter to the query." @click="$emit('add-filter')" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import OqlToolbarAction from "@/components/Oql/OqlToolbarAction.vue";
import OqlDatePicker from "@/components/Oql/OqlDatePicker.vue";
import "@/components/Oql/oqlChip.css"; // shared .chip-menu / .mi-* list styles

const props = defineProps({
  // The single highlighted VALUE token (vbrick), or null. Structural selection is the row.
  activeTok: { type: Object, default: null },
  // logical-row selection (oxjob #475): { kind, opChoices, predicate, canAdd } | null. When set
  // (and <2 multi-selected), the toolbar shows the row's Value/Sibling/Operator/Delete actions.
  rowSelection: { type: Object, default: null },
  selectedCount: { type: Number, default: 0 },
  canSubclause: { type: Boolean, default: false },
  selectionKind: { type: String, default: "values" },
  cmdLabel: { type: String, default: "⌘" },
  editorOpen: { type: Boolean, default: false },
});
const emit = defineEmits([
  "add-filter", "delete", "toggle-neg", "add-sibling",
  "pick-bool", "pick-date", "edit-text", "edit-entity",
  "row-change-operator", "row-delete",
  "row-add-value", "row-add-sibling",
  "wrap-subclause", "delete-selected", "update:editorOpen",
]);

const editorProxy = computed({
  get: () => props.editorOpen,
  set: (v) => emit("update:editorOpen", v),
});

const nounPlural = computed(() => (props.selectionKind === "filters" ? "filters" : "values"));

// ---- classify the active VALUE token (activeTok is always a vbrick now) -----
const tok = computed(() => props.activeTok);
const isVal = computed(() => tok.value?.t === "vbrick");
const valKind = computed(() => tok.value?._kind);
const isBoolVal = computed(() => isVal.value && (tok.value._boolPhrase || valKind.value === "boolean"));
const isDateVal = computed(() => isVal.value && valKind.value === "date");
const isEntityVal = computed(() => isVal.value && valKind.value === "entity");
const isTextVal = computed(() => isVal.value && !isBoolVal.value && !isDateVal.value && !isEntityVal.value);

// Which editor the "Edit" button opens (null ⇒ no Edit button — an entity value, whose Edit
// is the separate re-pick button below).
const editKind = computed(() => {
  if (isBoolVal.value) return "bool";
  if (isDateVal.value) return "date";
  if (isTextVal.value) return "text";
  return null; // entity value
});

// Negate applies to text / entity / date values. A boolean's negation is folded into
// its True/False (phrase) options.
const negatable = computed(() => isTextVal.value || isEntityVal.value || isDateVal.value);
// "Sibling" (add another value after this one) only for the multi-value kinds — text/number
// (text chip) and entity — matching the inline "+" chip's gating. (oxjob #475.)
const canAddSibling = computed(() => isTextVal.value || isEntityVal.value);
// Any value can be deleted.
const deletable = computed(() => isVal.value);

// ---- boolean options (mirrors OqlBoolChip) ---------------------------------
const truthy = computed(() => tok.value?.value === true || tok.value?.value === "true");
function phraseForms(text, negated) {
  const t = String(text || "").trim();
  if (negated) {
    const aff = t.replace(/\bnot\s+/i, "").replace(/n['’]t\b/i, "").replace(/\s{2,}/g, " ").trim();
    return { affirmative: aff || t, negative: t };
  }
  let neg;
  if (/^it['’]?s\b/i.test(t)) neg = t.replace(/^(it['’]?s)\b/i, "$1 not");
  else if (/^(is|are|was|were|has|have|does|do)\b/i.test(t)) neg = t.replace(/^(\w+)\b/i, "$1 not");
  else neg = "not " + t;
  return { affirmative: t, negative: neg };
}
const boolOptions = computed(() => {
  if (!isBoolVal.value) return [];
  if (tok.value._boolPhrase) {
    const { affirmative, negative } = phraseForms(tok.value.text, tok.value.negated);
    const neg = !!tok.value.negated;
    return [
      { label: affirmative, selected: !neg, act: () => { if (neg) emit("toggle-neg"); } },
      { label: negative, selected: neg, act: () => { if (!neg) emit("toggle-neg"); } },
    ];
  }
  const v = truthy.value;
  return [
    { label: "True", selected: v, act: () => { if (!v) emit("pick-bool", true); } },
    { label: "False", selected: !v, act: () => { if (v) emit("pick-bool", false); } },
  ];
});

// ---- date helper -----------------------------------------------------------
const dateValue = computed(() => {
  const t = tok.value || {};
  return String(t.value != null ? t.value : (t.display != null ? t.display : t.text || "")).trim();
});

// ---- tooltip descriptions --------------------------------------------------
const editDesc = computed(() => {
  switch (editKind.value) {
    case "bool": return "Choose the value.";
    case "date": return "Pick a date.";
    case "text": return "Edit this value.";
    default: return "Edit.";
  }
});
const negateDesc = computed(() =>
  tok.value?.negated ? "Remove the negation (back to a positive match)."
    : "Negate — match everything EXCEPT this.");
const deleteDesc = computed(() => "Delete this value.");
</script>

<style scoped>
.chip-actions { display: flex; align-items: center; gap: 2px; }
</style>
