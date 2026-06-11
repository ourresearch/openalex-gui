<template>
  <!-- The field picker's "More" — a categorized tour of every OQL property for
       the entity, grouped by the registry `category` (oxjob #428 iter 10, #441). -->
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

      <div class="d-flex" style="height: 60vh; min-height: 320px;">
        <!-- left rail: category filter -->
        <div class="cat-rail">
          <v-list density="compact" nav class="py-0">
            <v-list-item :active="activeCat === null" prepend-icon="mdi-view-list" title="All fields"
              @click="activeCat = null" />
            <v-list-item v-for="g in groups" :key="g.category" :active="activeCat === g.category"
              :prepend-icon="g.icon" @click="activeCat = g.category">
              <v-list-item-title class="text-capitalize">{{ g.category }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <!-- right: grouped property list -->
        <div class="cat-list">
          <template v-for="g in visibleGroups" :key="g.category">
            <div class="text-overline text-medium-emphasis mt-2 mb-1 pl-3 text-capitalize">{{ g.category }}</div>
            <v-list density="compact" class="py-0">
              <v-list-item v-for="it in g.items" :key="it.name" :title="it.display_name"
                :prepend-icon="g.icon" @click="pick(it.name)" />
            </v-list>
          </template>
          <div v-if="!visibleGroups.length" class="text-medium-emphasis text-center py-8">No matching fields</div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { fieldsByCategory } from "@/components/OqlPlayground/builderFieldMeta";

defineOptions({ name: "BuilderFieldDialog" });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  properties: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["update:modelValue", "select"]);

const isOpen = ref(props.modelValue);
watch(() => props.modelValue, (v) => { isOpen.value = v; });
watch(isOpen, (v) => {
  if (!v) emit("update:modelValue", false);
  if (v) { search.value = ""; activeCat.value = null; }
});

const search = ref("");
const activeCat = ref(null);

const groups = computed(() => fieldsByCategory(props.properties));
const visibleGroups = computed(() => {
  const q = search.value.trim().toLowerCase();
  let gs = groups.value;
  if (activeCat.value) gs = gs.filter((g) => g.category === activeCat.value);
  if (q) {
    gs = gs
      .map((g) => ({ ...g, items: g.items.filter((it) =>
        it.display_name.toLowerCase().includes(q) || it.name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length);
  }
  return gs;
});

const pick = (name) => { emit("select", name); isOpen.value = false; };
</script>

<style scoped>
.cat-rail {
  min-width: 160px;
  max-width: 180px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  overflow-y: auto;
  padding: 8px;
}
.cat-list { flex: 1 1 auto; overflow-y: auto; padding: 4px 8px; }
</style>
