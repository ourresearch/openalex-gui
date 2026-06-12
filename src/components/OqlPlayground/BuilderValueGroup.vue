<template>
  <!-- A FLAT list of values for ONE property, sharing a single conjunction.
       NOTE (iter 6 — Jason): value-level NESTING was intentionally removed. You
       can no longer build `A or (B and C)` inside a single value; values are a
       simple list joined by one shared `and`/`or` (toggling any join flips them
       all). To express nesting, add more filter ROWS and group them — the clause
       tree carries all the structure, so we only ever render values one level deep.
       Once there are 2+ values we wrap them in plain parentheses (no box) to echo
       OQL — a box jolted the row height, so it's just the parens now (iter 9). -->
  <span ref="rootEl" class="vgroup">
    <span v-if="isMulti" class="vparen">(</span>

    <template v-for="(it, i) in group.items" :key="it._id">
      <v-chip v-if="i > 0" class="vjoin" size="small" label variant="flat" @click="toggleJoin">{{ group.vjoin }}</v-chip>

      <!-- entity / enum value chip (flat so the bg matches the scalar boxes —
           the default tonal variant paints a darkening underlay; iter 11) -->
      <v-chip v-if="isPicker" class="value-chip" size="small" label variant="flat" closable
        @click:close="removeItem(i)">{{ it.label }}</v-chip>

      <!-- scalar value (inline editable). Numbers are strongly typed: a real
           number input w/ spinners — one int per brick, no range syntax (a range
           = two filter bricks with different operators; iter 12) -->
      <span v-else class="val-wrap" :class="{ invalid: isInvalid(it), numeric }">
        <input class="val-input" :type="numeric ? 'number' : 'text'" :value="it.value"
          :placeholder="scalarPlaceholder" :inputmode="numeric ? 'numeric' : 'text'"
          step="1" spellcheck="false" @input="onScalarInput(i, $event)" @blur="onScalarBlur" />
        <v-icon v-if="group.items.length > 1" size="13" class="val-remove" @click="removeItem(i)">mdi-close</v-icon>
      </span>
    </template>

    <span v-if="isMulti" class="vparen">)</span>

    <!-- add another value (just a + icon, OUTSIDE the close paren — iter 18;
         the "add group" affordance is gone). Hidden for single-value operators
         (inequalities — `year >= (2016 or 2020)` makes no functional sense). -->
    <v-menu v-if="isPicker && !singleValue" v-model="valueMenu" location="bottom start" offset="4"
      :close-on-content-click="false">
      <template #activator="{ props: mp }">
        <v-btn v-bind="mp" class="add-val-btn" icon size="x-small" variant="text" density="comfortable">
          <v-icon size="16">mdi-plus</v-icon>
          <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
        </v-btn>
      </template>
      <v-card min-width="300" max-width="380" class="menu-card">
        <v-text-field v-model="valueSearch" autofocus density="compact" variant="plain" hide-details
          prepend-inner-icon="mdi-magnify" :placeholder="`Search ${autocompleteEntity || 'values'}`" class="px-2 pt-1" />
        <v-divider />
        <div class="menu-list">
          <v-list density="compact" class="py-0">
            <v-list-item v-if="valueLoading" class="text-center py-3">
              <v-progress-circular indeterminate size="18" width="2" color="grey" />
            </v-list-item>
            <v-list-item v-for="r in valueResults" :key="r.id || r.value" :title="r.display_name || r.value"
              :subtitle="r.hint" @click="addEntityValue(r)" />
            <v-list-item v-if="!valueLoading && !valueResults.length && valueSearch"
              class="text-medium-emphasis text-center py-3">No matches</v-list-item>
          </v-list>
        </div>
      </v-card>
    </v-menu>
    <v-btn v-else-if="!singleValue" class="add-val-btn" icon size="x-small" variant="text" density="comfortable" @click="addValue">
      <v-icon size="16">mdi-plus</v-icon>
      <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
    </v-btn>
  </span>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { debounce } from "lodash";
import { api } from "@/api";
import { makeVLeaf, vtreeHasValue } from "@/components/OqlPlayground/oqoTree";
import { getEnumValues } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "BuilderValueGroup" });

const props = defineProps({
  group: { type: Object, required: true },
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  numeric: { type: Boolean, default: false },
  // inequality operators take exactly one value -> no add-value affordance
  singleValue: { type: Boolean, default: false },
  // accepted for caller compatibility; values are always a single flat list now
  isRoot: { type: Boolean, default: true },
  // Counter bumped by the parent when this value editor should grab focus (the
  // field was just picked) — scalar focuses its input, entity opens its picker.
  autofocus: { type: Number, default: 0 },
});
const emit = defineEmits(["change", "remove", "abandoned"]);

const group = props.group; // shared reactive value-group (stable per :key)
const rootEl = ref(null);

// Picker kinds choose values from a menu: entity = autocomplete search, enum =
// the property's fixed vocabulary (#428 iter 11 — `type is article`, not free text).
const isPicker = computed(() => props.valueKind === "entity" || props.valueKind === "enum");

// Plain parens (no box) show once the user has 2+ values (mirrors OQL `(a or b)`).
const isMulti = computed(() => group.items.length > 1);

const focusValue = () => {
  if (isPicker.value) { valueMenu.value = true; return; }
  nextTick(() => {
    const inputs = rootEl.value?.querySelectorAll(".val-input");
    if (inputs && inputs.length) inputs[inputs.length - 1].focus();
  });
};
onMounted(() => { if (props.autofocus) focusValue(); });
watch(() => props.autofocus, (v) => { if (v) focusValue(); });

const scalarPlaceholder = computed(() =>
  props.numeric ? "number" : props.valueKind === "enum" ? "value" : "text"
);
const isInvalid = (it) =>
  props.numeric && it.value !== "" && it.value != null && isNaN(Number(it.value));

// One shared conjunction for the whole list — toggling any join flips them all.
const toggleJoin = () => { group.vjoin = group.vjoin === "and" ? "or" : "and"; emit("change"); };

const onScalarInput = (i, e) => {
  const it = group.items[i];
  it.value = e.target.value;
  it.label = String(e.target.value);
  emit("change");
};
// A filter can't sit there empty (iter 13): leaving the editor with no value
// signals the row to remove itself (the row applies a focus/overlay grace check).
const onScalarBlur = () => {
  if (!vtreeHasValue(group)) emit("abandoned");
};

const addValue = () => { group.items.push(makeVLeaf("")); emit("change"); };
const removeItem = (i) => {
  group.items.splice(i, 1);
  if (!isPicker.value && group.items.length === 0) {
    group.items.push(makeVLeaf("")); // scalar keeps one input box (blur rule applies)
  } else if (isPicker.value && group.items.length === 0) {
    // last value removed -> reopen the picker; closing it w/o choosing abandons
    valueMenu.value = true;
  }
  emit("change");
};

// entity / enum value picker
const valueMenu = ref(false);
const valueSearch = ref("");
const valueResults = ref([]);
const valueLoading = ref(false);
const addEntityValue = (r) => {
  const id = props.valueKind === "enum" ? r.value : (r.short_id || r.id || r.value);
  if (!group.items.some((x) => x.value === id)) {
    group.items.push(makeVLeaf(id, r.display_name || id));
  }
  valueSearch.value = ""; valueResults.value = []; emit("change");
};
const runValueSearch = debounce(async (q) => {
  if (!isPicker.value || !props.autocompleteEntity) { valueResults.value = []; return; }
  valueLoading.value = true;
  try {
    if (props.valueKind === "enum") {
      // fixed vocab: fetch once (cached), filter client-side
      const all = await getEnumValues(props.autocompleteEntity);
      const needle = (q || "").toLowerCase();
      valueResults.value = needle
        ? all.filter((v) => v.display_name.toLowerCase().includes(needle) ||
                            String(v.value).toLowerCase().includes(needle))
        : all;
    } else {
      valueResults.value = (await api.getAutocomplete(props.autocompleteEntity, { q })) || [];
    }
  }
  catch { valueResults.value = []; }
  finally { valueLoading.value = false; }
}, 250);
watch(valueSearch, (q) => { if (isPicker.value) runValueSearch(q); });
watch(valueMenu, (open) => {
  if (open && isPicker.value && !valueResults.value.length) runValueSearch("");
  // picker closed with no values chosen -> the filter is empty, abandon it
  if (!open && isPicker.value && !vtreeHasValue(group)) emit("abandoned");
});
</script>

<style scoped>
/* Colours come from CSS vars on .builder: values = teal, the value-list and/or
   joiner shares the conjunction colour.
   display: contents (iter 18): the values are flex items of the ROW's wrapping
   body, so a long value list wraps mid-list and the wrapped lines share the
   property column's left margin — instead of the whole list dropping to its own
   flush-left block. */
.vgroup { display: contents; }
/* parens = narrow keyword mini-bricks (same slate as "where" — they should read
   as a language feature, not decoration; iter 18) */
.vparen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 5px;
  border-radius: 4px;
  background: var(--kw-bg, #e2e8f0);
  color: var(--kw-fg, #475569);
  font-weight: 600;
}
/* the value-list and/or joiner — a chip (so it matches the value chips' height),
   coloured slate because it's a joining word, not a value. */
.vjoin {
  cursor: pointer;
  text-transform: lowercase;
  color: var(--conn-fg, #475569) !important;
  background: var(--conn-bg, #e2e8f0) !important;
}
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
}
/* demoted in the hierarchy (iter 12): bare + icon, background only on hover
   (Vuetify's text-variant hover overlay provides it) */
.add-val-btn { opacity: 0.55; }
.add-val-btn:hover { opacity: 1; }
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: var(--val-bg, rgba(0, 0, 0, 0.05));
  border: 1px solid var(--val-fg, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  padding: 2px 6px;
}
.val-wrap.invalid { border-color: rgb(211, 47, 47) !important; background: rgba(211, 47, 47, 0.06) !important; }
.val-input {
  border: none; outline: none; background: transparent;
  font-size: 0.85rem; color: var(--val-fg, rgba(0, 0, 0, 0.87));
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
/* typed int brick: room for the native spinners */
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
</style>
