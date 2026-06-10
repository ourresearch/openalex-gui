<template>
  <span class="vgroup" :class="{ nested: !isRoot }">
    <span v-if="!isRoot" class="vparen">(</span>

    <template v-for="(it, i) in group.items" :key="it._id">
      <span v-if="i > 0" class="vjoin" @click="toggleJoin">{{ group.vjoin }}</span>

      <!-- nested value group -->
      <BuilderValueGroup
        v-if="isVGroup(it)"
        :group="it"
        :value-kind="valueKind"
        :autocomplete-entity="autocompleteEntity"
        :numeric="numeric"
        :is-root="false"
        :depth="depth + 1"
        @remove="removeItem(i)"
        @change="$emit('change')"
      />

      <!-- entity value chip -->
      <v-chip v-else-if="valueKind === 'entity'" class="value-chip" size="small" label closable
        @click:close="removeItem(i)">{{ it.label }}</v-chip>

      <!-- scalar value (inline editable) -->
      <span v-else class="val-wrap" :class="{ invalid: isInvalid(it) }">
        <input class="val-input" :value="it.value" :placeholder="scalarPlaceholder"
          :inputmode="numeric ? 'decimal' : 'text'" spellcheck="false" @input="onScalarInput(i, $event)" />
        <v-icon v-if="group.items.length > 1" size="13" class="val-remove" @click="removeItem(i)">mdi-close</v-icon>
      </span>
    </template>

    <!-- adders -->
    <v-menu v-if="valueKind === 'entity'" v-model="valueMenu" location="bottom start" offset="4"
      :close-on-content-click="false">
      <template #activator="{ props: mp }">
        <v-chip v-bind="mp" class="add-chip" label size="small" variant="outlined" prepend-icon="mdi-plus">value</v-chip>
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
    <v-btn v-else class="add-btn" size="x-small" variant="text" prepend-icon="mdi-plus" @click="addValue">value</v-btn>

    <v-btn v-if="depth < MAX_VDEPTH" class="add-btn" size="x-small" variant="text"
      prepend-icon="mdi-plus" @click="addGroup">group</v-btn>

    <span v-if="!isRoot" class="vparen">)</span>
    <v-icon v-if="!isRoot" size="14" class="vgroup-remove" @click="$emit('remove')">mdi-close</v-icon>
  </span>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { debounce } from "lodash";
import { api } from "@/api";
import BuilderValueGroup from "@/components/OqlPlayground/BuilderValueGroup.vue";
import { makeVLeaf, makeVGroup, isVGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderValueGroup" });

const MAX_VDEPTH = 3;

const props = defineProps({
  group: { type: Object, required: true },
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  numeric: { type: Boolean, default: false },
  isRoot: { type: Boolean, default: false },
  depth: { type: Number, default: 0 },
});
const emit = defineEmits(["change", "remove"]);

const group = props.group; // shared reactive value-group (stable per :key)

const scalarPlaceholder = computed(() =>
  props.numeric ? "number" : props.valueKind === "enum" ? "value" : "text"
);
const isInvalid = (it) =>
  props.numeric && it.value !== "" && it.value != null && isNaN(Number(it.value));

const toggleJoin = () => { group.vjoin = group.vjoin === "and" ? "or" : "and"; emit("change"); };

const onScalarInput = (i, e) => {
  const it = group.items[i];
  it.value = e.target.value;
  it.label = String(e.target.value);
  emit("change");
};

const addValue = () => { group.items.push(makeVLeaf("")); emit("change"); };
const addGroup = () => {
  group.items.push(makeVGroup("or", props.valueKind === "entity" ? [] : [makeVLeaf("")]));
  emit("change");
};
const removeItem = (i) => {
  group.items.splice(i, 1);
  if (props.isRoot && props.valueKind !== "entity" && group.items.length === 0) {
    group.items.push(makeVLeaf("")); // scalar root keeps one input
  } else if (!props.isRoot && group.items.length === 0) {
    emit("remove"); // prune emptied nested group from parent
  }
  emit("change");
};

// entity value picker
const valueMenu = ref(false);
const valueSearch = ref("");
const valueResults = ref([]);
const valueLoading = ref(false);
const addEntityValue = (r) => {
  const id = r.short_id || r.id || r.value;
  if (!group.items.some((x) => !isVGroup(x) && x.value === id)) {
    group.items.push(makeVLeaf(id, r.display_name || id));
  }
  valueSearch.value = ""; valueResults.value = []; emit("change");
};
const runValueSearch = debounce(async (q) => {
  if (props.valueKind !== "entity" || !props.autocompleteEntity) { valueResults.value = []; return; }
  valueLoading.value = true;
  try { valueResults.value = (await api.getAutocomplete(props.autocompleteEntity, { q })) || []; }
  catch { valueResults.value = []; }
  finally { valueLoading.value = false; }
}, 250);
watch(valueSearch, (q) => { if (props.valueKind === "entity") runValueSearch(q); });
watch(valueMenu, (open) => { if (open && props.valueKind === "entity" && !valueResults.value.length) runValueSearch(""); });
</script>

<style scoped>
.vgroup { display: inline-flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.vgroup.nested {
  border: 1px dashed rgba(103, 58, 183, 0.4);
  border-radius: 8px;
  padding: 3px 6px;
  background: rgba(103, 58, 183, 0.04);
}
.vparen { color: rgba(103, 58, 183, 0.6); font-weight: 600; }
.vjoin {
  cursor: pointer;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(103, 58, 183);
  background: rgba(103, 58, 183, 0.10);
  border-radius: 4px;
  padding: 1px 5px;
}
.value-chip { background: rgba(103, 58, 183, 0.12) !important; color: rgba(0, 0, 0, 0.87) !important; }
.add-chip { border-style: dashed; cursor: pointer; }
.add-btn { opacity: 0.7; min-width: 0; }
.val-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 2px 6px;
}
.val-wrap.invalid { border-color: rgb(211, 47, 47); background: rgba(211, 47, 47, 0.06); }
.val-input {
  border: none; outline: none; background: transparent;
  font-size: 0.85rem; color: rgba(0, 0, 0, 0.87);
  min-width: 56px; max-width: 360px; field-sizing: content;
}
.val-input::placeholder { color: rgba(0, 0, 0, 0.4); }
.val-remove, .vgroup-remove { cursor: pointer; opacity: 0.5; }
.val-remove:hover, .vgroup-remove:hover { opacity: 1; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
</style>
