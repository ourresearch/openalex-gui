<template>
  <!-- The add-a-value affordance for a value group (oxjob #428 iter 20): an entity
       autocomplete/list picker, or a bare `+` for scalar values. Hidden for
       single-value (inequality) operators. Used by BOTH the inline and the
       SubclauseBox (block) layouts. Controlled `open` so the group's paren-menu
       "Add value" can pop the picker. -->
  <v-menu v-if="isPicker" v-model="open" location="bottom start" offset="4" :close-on-content-click="false">
    <template #activator="{ props: mp }">
      <v-btn v-bind="mp" class="add-val-btn" icon size="x-small" variant="text" density="comfortable">
        <v-icon size="16">mdi-plus</v-icon>
        <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
      </v-btn>
    </template>
    <v-card min-width="300" max-width="380" class="menu-card">
      <v-text-field v-model="search" autofocus density="compact" variant="plain" hide-details
        prepend-inner-icon="mdi-magnify" :placeholder="`Search ${autocompleteEntity || 'values'}`" class="px-2 pt-1" />
      <v-divider />
      <div class="menu-list">
        <v-list density="compact" class="py-0">
          <v-list-item v-if="loading" class="text-center py-3">
            <v-progress-circular indeterminate size="18" width="2" color="grey" />
          </v-list-item>
          <v-list-item v-for="r in results" :key="r.id || r.value" :title="r.display_name || r.value"
            :subtitle="r.hint" @click="pick(r)" />
          <v-list-item v-if="!loading && !results.length && search"
            class="text-medium-emphasis text-center py-3">No matches</v-list-item>
        </v-list>
      </div>
    </v-card>
  </v-menu>
  <v-btn v-else class="add-val-btn" icon size="x-small" variant="text" density="comfortable" @click="$emit('add')">
    <v-icon size="16">mdi-plus</v-icon>
    <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
  </v-btn>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { debounce } from "lodash";
import { api } from "@/api";
import { getEnumValues } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "BuilderAddValue" });

const props = defineProps({
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  listVocab: { type: Boolean, default: false },
});
const emit = defineEmits(["add", "pick", "abandon"]);

const isPicker = computed(() => props.valueKind === "entity");
const open = ref(false);
const search = ref("");
const results = ref([]);
const loading = ref(false);

const pick = (r) => {
  const id = props.listVocab ? r.value : (r.short_id || r.id || r.value);
  emit("pick", { value: id, label: r.display_name || id });
  search.value = ""; results.value = [];
};

const run = debounce(async (q) => {
  if (!isPicker.value || !props.autocompleteEntity) { results.value = []; return; }
  loading.value = true;
  try {
    if (props.listVocab) {
      const all = await getEnumValues(props.autocompleteEntity);
      const needle = (q || "").toLowerCase();
      results.value = needle
        ? all.filter((v) => v.display_name.toLowerCase().includes(needle) ||
                            String(v.value).toLowerCase().includes(needle))
        : all;
    } else {
      results.value = (await api.getAutocomplete(props.autocompleteEntity, { q })) || [];
    }
  } catch { results.value = []; }
  finally { loading.value = false; }
}, 250);

watch(search, (q) => { if (isPicker.value) run(q); });
watch(open, (o) => {
  if (o && isPicker.value && !results.value.length) run("");
  if (!o) emit("abandon");
});

// let the parent pop the picker (from the paren menu's "Add value")
defineExpose({ openPicker: () => { open.value = true; } });
</script>

<style scoped>
/* demoted in the hierarchy: bare + icon, dimmed via the inner icon (App.vue's
   ghost-variant reset forces button opacity to 1 !important) */
.add-val-btn :deep(.v-icon) { opacity: 0.55; }
.add-val-btn:hover :deep(.v-icon) { opacity: 1; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
</style>
