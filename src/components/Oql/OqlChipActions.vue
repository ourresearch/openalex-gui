<!--
  OqlChipActions — the builder's CONTEXTUAL TOOLBAR (oxjob #428, 2026-06-17). The chip
  pop-up menus were removed; the action a chip used to offer now appears as buttons up
  here whenever that chip is highlighted. This is the left half of the builder toolbar.

  THREE states, driven by the parent's selection:
    • nothing selected  → a single "Add filter" button (the only builder-level default
      Jason kept; the old Columns/Sort menu buttons were dropped).
    • one chip selected → that chip's actions: an "Edit" button (opens the chip's editor
      — operator / search-field / True-False / and-or chooser, or the date calendar —
      in a popover dropping FROM the Edit button), plus Negate and/or Delete as they
      apply. The text/number "Edit" is the exception: it focuses the chip's in-place
      input (emits `edit-text`) rather than opening a popover.
    • ≥2 chips selected (#472) → the batch actions ("Wrap as subclause" when the set is
      groupable, "Delete values/filters").

  Every button is an <OqlToolbarAction> so it carries the uniform structured tooltip
  (description + keyboard shortcut). PURELY PRESENTATIONAL — it reads the active token
  + the property catalog and emits the SAME intents the chip menus used to, which the
  builder maps onto its v2 edit ops. The `editor-open` model lets the builder open the
  Edit popover from a keyboard shortcut / double-click on the selected chip.

  Props
    activeTok      the single highlighted token (col | vbrick | conn), or null.
    properties     the field catalog (for a search field's siblings).
    selectedCount  size of the #472 multi-selection (0/1 ⇒ single-chip mode).
    canSubclause   whether the multi-selection can wrap into a subclause.
    selectionKind  "filters" | "values" (batch wording).
    hasQuery       is there anything to act on (unused for now; reserved).
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

    <!-- one chip selected: its contextual actions -->
    <template v-else-if="activeTok">
      <!-- EDIT — choosers/calendar drop from this button (text/number focuses inline) -->
      <v-menu v-if="editKind && editKind !== 'text'" v-model="editorProxy"
        location="bottom start" offset="6" :close-on-content-click="editKind !== 'date'">
        <template #activator="{ props: mp }">
          <OqlToolbarAction v-bind="mp" label="Edit" icon="mdi-pencil-outline"
            :desc="editDesc" :shortcut="['enter']" :active="editorProxy" />
        </template>
        <v-card class="menu-card chip-menu" :min-width="editKind === 'date' ? 268 : 180">
          <!-- operator (numeric field): ≥ / = / > -->
          <v-list v-if="editKind === 'operator'" density="compact" class="py-0">
            <v-list-item v-for="o in opChoices" :key="o.key" :active="o.label === activeTok._predicate"
              @click="$emit('change-operator', o)">
              <template #prepend><v-icon size="16" class="mi-icon">mdi-code-equal-variant</v-icon></template>
              <v-list-item-title>{{ o.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- swap search field (title / abstract / full text …) -->
          <v-list v-else-if="editKind === 'searchfield'" density="compact" class="py-0">
            <v-list-item v-for="s in searchSiblings" :key="s.column_id" :active="s.current"
              @click="$emit('change-field', s.column_id)">
              <template #prepend><v-icon size="16" class="mi-icon">mdi-magnify</v-icon></template>
              <v-list-item-title>{{ s.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- boolean: the two value options (true/false, or phrase ⇄ negated phrase) -->
          <v-list v-else-if="editKind === 'bool'" density="compact" class="py-0">
            <v-list-item v-for="(opt, i) in boolOptions" :key="i" @click="opt.act()">
              <template #prepend>
                <v-icon size="16" class="mi-check" :class="{ on: opt.selected }">
                  {{ opt.selected ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                </v-icon>
              </template>
              <v-list-item-title>{{ opt.label }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <!-- connector: and / or -->
          <v-list v-else-if="editKind === 'conn'" density="compact" class="py-0">
            <v-list-item v-for="opt in ['and', 'or']" :key="opt"
              @click="opt !== connJoin && $emit('toggle-join')">
              <template #prepend>
                <v-icon size="16" class="mi-check" :class="{ on: connJoin === opt }">
                  {{ connJoin === opt ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
                </v-icon>
              </template>
              <v-list-item-title>{{ opt }}</v-list-item-title>
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

      <OqlToolbarAction v-if="negatable" :label="activeTok.negated ? 'Un-negate' : 'Negate'"
        icon="mdi-cancel" :desc="negateDesc" @click="$emit('toggle-neg')" />

      <OqlToolbarAction v-if="deletable" icon="mdi-delete-outline" danger
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
import { searchFieldSiblings } from "@/components/OqlPlayground/oqoTree";
import "@/components/Oql/oqlChip.css"; // shared .chip-menu / .mi-* list styles

const props = defineProps({
  activeTok: { type: Object, default: null },
  properties: { type: Object, default: () => ({}) },
  selectedCount: { type: Number, default: 0 },
  canSubclause: { type: Boolean, default: false },
  selectionKind: { type: String, default: "values" },
  hasQuery: { type: Boolean, default: false },
  cmdLabel: { type: String, default: "⌘" },
  editorOpen: { type: Boolean, default: false },
});
const emit = defineEmits([
  "add-filter", "delete", "toggle-neg", "change-operator", "change-field",
  "pick-bool", "pick-date", "toggle-join", "edit-text",
  "wrap-subclause", "delete-selected", "update:editorOpen",
]);

const editorProxy = computed({
  get: () => props.editorOpen,
  set: (v) => emit("update:editorOpen", v),
});

const nounPlural = computed(() => (props.selectionKind === "filters" ? "filters" : "values"));

// ---- classify the active token ---------------------------------------------
const tok = computed(() => props.activeTok);
const isConn = computed(() => tok.value?.t === "conn");
const isCol = computed(() => tok.value?.t === "col");
const isVal = computed(() => tok.value?.t === "vbrick");
const opChoices = computed(() => (isCol.value && tok.value._ops) || []);
const searchSiblings = computed(() =>
  isCol.value ? searchFieldSiblings(props.properties, tok.value._column) : []);
const valKind = computed(() => tok.value?._kind);
const isBoolVal = computed(() => isVal.value && (tok.value._boolPhrase || valKind.value === "boolean"));
const isDateVal = computed(() => isVal.value && valKind.value === "date");
const isEntityVal = computed(() => isVal.value && valKind.value === "entity");
const isTextVal = computed(() => isVal.value && !isBoolVal.value && !isDateVal.value && !isEntityVal.value);

// Which editor the "Edit" button opens (null ⇒ no Edit button: a committed non-numeric,
// non-search field, or an entity value whose re-pick is still deferred).
const editKind = computed(() => {
  if (isConn.value) return "conn";
  if (isCol.value) {
    if (opChoices.value.length) return "operator";
    if (searchSiblings.value.length) return "searchfield";
    return null;
  }
  if (isBoolVal.value) return "bool";
  if (isDateVal.value) return "date";
  if (isTextVal.value) return "text";
  return null; // entity value
});

// Negate applies to text / entity / date values. A boolean's negation is folded into
// its True/False (phrase) options, and structural tokens have none.
const negatable = computed(() => isTextVal.value || isEntityVal.value || isDateVal.value);
// Everything but a connector can be deleted (a connector is purely structural).
const deletable = computed(() => isCol.value || isVal.value);

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

// ---- connector + date helpers ----------------------------------------------
const connJoin = computed(() => (tok.value?.label || tok.value?.text || "and").trim().toLowerCase());
const dateValue = computed(() => {
  const t = tok.value || {};
  return String(t.value != null ? t.value : (t.display != null ? t.display : t.text || "")).trim();
});

// ---- tooltip descriptions --------------------------------------------------
const editDesc = computed(() => {
  switch (editKind.value) {
    case "operator": return "Change the comparison operator.";
    case "searchfield": return "Search a different field (title, abstract, full text).";
    case "bool": return "Choose the value.";
    case "conn": return "Switch this connector between and / or.";
    case "date": return "Pick a date.";
    case "text": return "Edit this value.";
    default: return "Edit.";
  }
});
const negateDesc = computed(() =>
  tok.value?.negated ? "Remove the negation (back to a positive match)."
    : "Negate — match everything EXCEPT this.");
const deleteDesc = computed(() => {
  if (isCol.value) return "Delete this whole filter.";
  return "Delete this value.";
});
</script>

<style scoped>
.chip-actions { display: flex; align-items: center; gap: 2px; }
</style>
