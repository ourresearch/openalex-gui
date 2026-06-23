<template>
  <!-- The OQL field picker's "All fields" — a categorized tour of the curated
       facet vocabulary for the entity (oxjob #505: converged off the server
       /properties registry onto the same curated `facetConfigs.js` the filter +
       column pickers use, via the shared CategorizedFacetPicker). This kills the
       per-field icons, the display-name duplicates, and the "Other" dumping that
       the raw /properties registry produced. The OQL leaf is still built from the
       server property catalog by the parent (OqlQueryBuilder.pickField), keyed by
       the facet key this dialog emits. -->
  <v-dialog v-model="isOpen" max-width="760" scrollable>
    <v-card class="bg-white">
      <v-card-title class="d-flex align-center pa-4 pb-2">
        <span class="text-h6">All fields</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="isOpen = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <div class="px-4 pb-2">
        <v-text-field v-model="search" placeholder="Search all fields" variant="outlined" density="compact"
          hide-details prepend-inner-icon="mdi-magnify" clearable autofocus />
      </div>
      <v-divider />

      <categorized-facet-picker
        :categories="categories"
        height="60vh"
        empty-text="No matching fields"
      >
        <template #row="{ item }">
          <v-list-item :title="item.label" rounded class="rounded-lg" @click="pick(item.key)" />
        </template>
      </categorized-facet-picker>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { facetsByCategory } from "@/facetConfigUtils";
import filters from "@/filters";
import CategorizedFacetPicker from "@/components/Misc/CategorizedFacetPicker.vue";

defineOptions({ name: "BuilderFieldDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // The OQL entity ("works", "authors", …) whose curated facets to offer.
  entity: { type: String, default: "works" },
});
const emit = defineEmits(["update:modelValue", "select"]);

const isOpen = ref(props.modelValue);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => {
  if (!v) emit("update:modelValue", false);
  if (v) search.value = "";
});

const search = ref("");

// Facets that can be the LHS of an OQL filter leaf, grouped by curated category.
// Same source + shape the filter/column pickers consume; `hideFromPicker` +
// `is_xpac` are already stripped by facetsByCategory / here.
const categories = computed(() =>
  facetsByCategory(props.entity, search.value, ["selectEntity", "boolean", "range", "search"], [])
    .map((cat) => ({
      displayName: cat.displayName,
      icon: cat.icon,
      items: cat.filterConfigs
        .filter((fc) => fc.actions?.includes("filter") && fc.key !== "is_xpac")
        .map((fc) => ({
          key: fc.key,
          label: fc.displayNameVerbatim ? fc.displayName : filters.titleCase(fc.displayName),
        })),
    }))
    .filter((cat) => cat.items.length),
);

const pick = (key) => { emit("select", key); isOpen.value = false; };
</script>
