<template>
  <!-- A RECURSIVE value tree for ONE property (oxjob #428 iter 20 — Jason; reverses
       iter 6's flatten). Items are value leaves OR nested value sub-groups, one
       conjunction per group, mixing only by nesting — exactly the clause-tree model,
       but inside a single filter's value. This mirrors the server's canonical render:
       `title contains (beaver and (dam or pond))` is ONE row, not distributed.

       Negation is a per-VALUE bit shown as a bold `not(...)` prefix brick:
        - scalar/search: type `not ` at the front (auto-extracted, quote-aware,
          idempotent, front-backspace removes) or toggle via the prefix menu;
        - entity: the brick's click-menu { Negate, View ↗ }.
       Negating a GROUP applies De Morgan in place (flip and↔or, negate each child) —
       the OQO stays in NNF, so the tree and the OQL never diverge.

       Parens wrap a group (always for a nested sub-group; for the row's root group
       only once it holds 2+ items or a sub-clause). Clicking either paren opens the
       group dropdown { Add value, Add clause, Negate, Remove group }. Inequalities
       (`>`,`>=`,…) are single-value: no add, no negate. -->
  <span ref="rootEl" class="vgroup">
    <!-- open paren (a narrow slate keyword mini-brick) + group menu -->
    <v-menu v-if="showParens" location="bottom start" offset="4">
      <template #activator="{ props: mp }">
        <span v-bind="mp" class="vparen">(</span>
      </template>
      <v-card min-width="190" class="menu-card"><v-list density="compact" class="py-0">
        <v-list-item v-for="a in parenActions" :key="a.key" :title="a.title"
          :prepend-icon="a.icon" @click="a.run()" />
      </v-list></v-card>
    </v-menu>

    <template v-for="(it, i) in group.items" :key="it._id">
      <v-chip v-if="i > 0" class="vjoin" size="small" label variant="flat" @click="toggleJoin">{{ group.vjoin }}</v-chip>

      <!-- nested value sub-group: recurse -->
      <BuilderValueGroup v-if="isVGroup(it)" :group="it" :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity" :list-vocab="listVocab" :numeric="numeric"
        :single-value="false" :is-root="false"
        @change="$emit('change')" @remove-group="removeItem(i)" />

      <!-- entity value chip (flat so the bg matches the scalar boxes). Bold
           `not(…)` when negated; click opens { Negate, View ↗ }; × removes. -->
      <v-menu v-else-if="isPicker" location="bottom start" offset="4">
        <template #activator="{ props: mp }">
          <v-chip v-bind="mp" class="value-chip" size="small" label variant="flat" closable
            @click:close.stop="removeItem(i)">
            <span v-if="it.neg" class="notpfx">not(</span>{{ it.label }}<span v-if="it.neg" class="notpfx">)</span>
          </v-chip>
        </template>
        <v-card min-width="160" class="menu-card"><v-list density="compact" class="py-0">
          <v-list-item :title="it.neg ? 'Negated ✓' : 'Negate'" prepend-icon="mdi-not-equal-variant"
            @click="toggleNeg(it)" />
          <v-list-item title="View ↗" prepend-icon="mdi-open-in-new" @click="viewEntity(it)" />
        </v-list></v-card>
      </v-menu>

      <!-- scalar value (inline editable). Numbers are strongly typed; a bold
           `not( … )` wraps the input when negated (the prefix opens a tiny menu). -->
      <span v-else class="val-wrap" :class="{ invalid: isInvalid(it), numeric, negated: it.neg }">
        <v-menu v-if="it.neg" location="bottom start" offset="2">
          <template #activator="{ props: mp }"><span v-bind="mp" class="notpfx clickable">not(</span></template>
          <v-card class="menu-card"><v-list density="compact" class="py-0">
            <v-list-item title="Negated ✓" @click="it.neg = false; $emit('change')" />
          </v-list></v-card>
        </v-menu>
        <input class="val-input" :type="numeric ? 'number' : 'text'" :value="it.value"
          :placeholder="scalarPlaceholder" :inputmode="numeric ? 'numeric' : 'text'"
          step="1" spellcheck="false"
          @input="onScalarInput(it, $event)" @keydown="onScalarKeydown(it, $event)" @blur="onScalarBlur" />
        <span v-if="it.neg" class="notpfx">)</span>
        <v-icon v-if="group.items.length > 1" size="13" class="val-remove" @click="removeItem(i)">mdi-close</v-icon>
      </span>
    </template>

    <span v-if="showParens" class="vparen-close-wrap">
      <v-menu location="bottom start" offset="4">
        <template #activator="{ props: mp }">
          <span v-bind="mp" class="vparen">)</span>
        </template>
        <v-card min-width="190" class="menu-card"><v-list density="compact" class="py-0">
          <v-list-item v-for="a in parenActions" :key="a.key" :title="a.title"
            :prepend-icon="a.icon" @click="a.run()" />
        </v-list></v-card>
      </v-menu>
    </span>

    <!-- add another value (+ icon). Entity = autocomplete picker; scalar = empty
         brick. Hidden for single-value operators (inequalities). -->
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
import {
  makeVLeaf, makeVGroup, isVGroup, vtreeHasValue, deMorganGroup, extractLeadingNot,
} from "@/components/OqlPlayground/oqoTree";
import { getEnumValues } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "BuilderValueGroup" });

const props = defineProps({
  group: { type: Object, required: true },
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  // entity values come from a fixed `/{entity-type}` list (type/country/…) rather
  // than `/autocomplete/{entity}` search (iter 20: both are "entity", no enum kind)
  listVocab: { type: Boolean, default: false },
  numeric: { type: Boolean, default: false },
  // inequality operators take exactly one value -> no add-value, no negate
  singleValue: { type: Boolean, default: false },
  // true = the row's top-level value group (parens only when 2+ items / a sub-clause);
  // false = a nested value sub-group (always parenthesized, owns a "Remove group")
  isRoot: { type: Boolean, default: true },
  autofocus: { type: Number, default: 0 },
});
const emit = defineEmits(["change", "abandoned", "remove-group"]);

const group = props.group; // shared reactive value-group (stable per :key)
const rootEl = ref(null);

// entity kinds (openalex_id + list-vocab) pick from a menu; text/number type inline.
const isPicker = computed(() => props.valueKind === "entity");

// Parens: a nested sub-group is always parenthesized; the row's root group shows
// parens once it holds 2+ items or any sub-clause (a flat single value stays bare).
const hasSubclause = computed(() => group.items.some(isVGroup));
const showParens = computed(() =>
  !props.isRoot || group.items.length > 1 || hasSubclause.value
);

const focusValue = () => {
  if (isPicker.value) { valueMenu.value = true; return; }
  nextTick(() => {
    const inputs = rootEl.value?.querySelectorAll(".val-input");
    if (inputs && inputs.length) inputs[inputs.length - 1].focus();
  });
};
onMounted(() => { if (props.autofocus) focusValue(); });
watch(() => props.autofocus, (v) => { if (v) focusValue(); });

const scalarPlaceholder = computed(() => (props.numeric ? "number" : "text"));
const isInvalid = (it) =>
  props.numeric && it.value !== "" && it.value != null && isNaN(Number(it.value));

// One shared conjunction for the group — toggling any join flips them all.
const toggleJoin = () => { group.vjoin = group.vjoin === "and" ? "or" : "and"; emit("change"); };

// ---- per-group paren dropdown ({ Add value, Add clause, Negate, Remove group }) ----
const parenActions = computed(() => {
  const out = [
    { key: "add", title: "Add value", icon: "mdi-plus", run: triggerAddValue },
    { key: "clause", title: "Add clause", icon: "mdi-plus-box-multiple-outline", run: addClause },
  ];
  if (!props.singleValue) out.push({ key: "neg", title: "Negate", icon: "mdi-not-equal-variant", run: negateGroup });
  out.push({ key: "rm", title: "Remove group", icon: "mdi-delete-outline", run: removeGroup });
  return out;
});
const triggerAddValue = () => { if (isPicker.value) valueMenu.value = true; else addValue(); };
const addClause = () => {
  // a fresh nested sub-group with the opposite conjunction (so it reads as a real
  // sub-clause); seeded with one empty value of this row's kind
  group.items.push(makeVGroup(group.vjoin === "and" ? "or" : "and",
    isPicker.value ? [] : [makeVLeaf("")]));
  emit("change");
};
const negateGroup = () => { deMorganGroup(group); emit("change"); };
const removeGroup = () => { emit("remove-group"); };

const toggleNeg = (it) => { it.neg = !it.neg; emit("change"); };
const viewEntity = (it) => {
  const v = String(it.value);
  // openalex_id values address the entity directly; list-vocab values hang off
  // their type's list page (e.g. types/article, countries/FR)
  const url = /^[A-Za-z]\d+$/.test(v) || /^https?:/.test(v)
    ? (v.startsWith("http") ? v : `https://openalex.org/${v}`)
    : `https://openalex.org/${props.autocompleteEntity || "works"}/${v}`;
  window.open(url, "_blank", "noopener");
};

// ---- scalar / search value editing (with quote-aware leading-`not` extraction) ----
const onScalarInput = (it, e) => {
  const raw = e.target.value;
  if (!props.singleValue) {
    const { neg, text } = extractLeadingNot(raw);
    if (neg) {
      it.neg = true; it.value = text; it.label = text;
      if (e.target.value !== text) e.target.value = text; // drop the typed `not `
      emit("change");
      return;
    }
  }
  it.value = raw;
  it.label = String(raw);
  emit("change");
};
const onScalarKeydown = (it, e) => {
  // front-backspace (cursor at the very start, nothing selected) removes the `not`
  if (e.key === "Backspace" && it.neg &&
      e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
    it.neg = false; e.preventDefault(); emit("change");
  }
};
// A filter can't sit there empty (iter 13): leaving the editor with no value
// signals the row to remove itself (the row applies a focus/overlay grace check).
const onScalarBlur = () => { if (!vtreeHasValue(group)) emit("abandoned"); };

const addValue = () => { group.items.push(makeVLeaf("")); emit("change"); };
const removeItem = (i) => {
  group.items.splice(i, 1);
  if (group.items.length === 0) {
    if (!props.isRoot) { emit("remove-group"); return; } // empty sub-group self-prunes
    if (!isPicker.value) group.items.push(makeVLeaf("")); // scalar keeps one input
    else valueMenu.value = true;                           // entity: reopen the picker
  }
  emit("change");
};

// ---- entity value picker (autocomplete search or fixed list vocab) --------------
const valueMenu = ref(false);
const valueSearch = ref("");
const valueResults = ref([]);
const valueLoading = ref(false);
const addEntityValue = (r) => {
  const id = props.listVocab ? r.value : (r.short_id || r.id || r.value);
  if (!group.items.some((x) => !isVGroup(x) && x.value === id)) {
    group.items.push(makeVLeaf(id, r.display_name || id));
  }
  valueSearch.value = ""; valueResults.value = []; emit("change");
};
const runValueSearch = debounce(async (q) => {
  if (!isPicker.value || !props.autocompleteEntity) { valueResults.value = []; return; }
  valueLoading.value = true;
  try {
    if (props.listVocab) {
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
  if (!open && isPicker.value && props.isRoot && !vtreeHasValue(group)) emit("abandoned");
});
</script>

<style scoped>
/* Colours come from CSS vars on .builder: values = teal, the value-list and/or
   joiner shares the conjunction colour.
   display: contents (iter 18): the values are flex items of the ROW's wrapping
   body, so a long value list wraps mid-list and the wrapped lines share the
   property column's left margin. */
.vgroup { display: contents; }
.vparen-close-wrap { display: contents; }
/* parens = narrow keyword mini-bricks (same slate as "where"); clickable (open
   the group menu) so a subtle pointer cursor (iter 18 + iter 20 menu) */
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
  cursor: pointer;
}
/* the value-list and/or joiner — a chip (matches value-chip height), slate. */
.vjoin {
  cursor: pointer;
  text-transform: lowercase;
  color: var(--conn-fg, #475569) !important;
  background: var(--conn-bg, #e2e8f0) !important;
}
.value-chip {
  background: var(--val-bg, rgba(13, 148, 136, 0.14)) !important;
  color: var(--val-fg, #0f766e) !important;
  cursor: pointer;
}
/* bold not(…) negation prefix/suffix */
.notpfx { font-weight: 700; }
.notpfx.clickable { cursor: pointer; }
.add-val-btn :deep(.v-icon) { opacity: 0.55; }
.add-val-btn:hover :deep(.v-icon) { opacity: 1; }
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
.val-wrap.numeric .val-input { min-width: 72px; }
.val-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover { opacity: 1; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
</style>
