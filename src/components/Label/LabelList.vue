<template>
  <div class="label-list">
    <div v-if="labels.length" class="d-flex align-center ga-3 mb-4">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search labels"
        hide-details
        class="search-field"
        @keydown.escape="searchQuery = ''"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="searchQuery" #append-inner>
          <v-btn icon variant="text" size="x-small" @click="searchQuery = ''">
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>
      <v-spacer />
    </div>

    <v-card flat class="rounded-o px-2 pb-4">
      <v-table v-if="filteredLabels.length">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th class="text-right">Entities</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="label in filteredLabels"
            :key="label.id"
            class="label-row"
            @click="goToSerp(label)"
          >
            <td>
              <div class="d-flex flex-column">
                <span class="font-weight-medium">
                  <v-icon color="grey" start size="small">{{ entityIcon(label.entity_type) }}</v-icon>
                  {{ label.display_name }}
                </span>
                <span v-if="label.description" class="label-description text-grey">
                  {{ label.description }}
                </span>
              </div>
            </td>
            <td class="text-grey">{{ label.entity_type }}</td>
            <td class="text-right">{{ label.entity_count ?? 0 }}</td>
            <td class="text-right" @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn icon variant="plain" v-bind="props">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click="goToSerp(label)">
                    <template #prepend>
                      <v-icon size="small">mdi-filter-variant</v-icon>
                    </template>
                    <v-list-item-title>Use as filter</v-list-item-title>
                  </v-list-item>
                  <v-list-item :to="`/labels/${label.id}`">
                    <template #prepend>
                      <v-icon size="small">mdi-share-variant-outline</v-icon>
                    </template>
                    <v-list-item-title>View public page</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="$emit('edit', label)">
                    <template #prepend>
                      <v-icon size="small">mdi-pencil-outline</v-icon>
                    </template>
                    <v-list-item-title>Edit name / description</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="$emit('delete', label)" base-color="error">
                    <template #prepend>
                      <v-icon size="small" color="error">mdi-delete-outline</v-icon>
                    </template>
                    <v-list-item-title>Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div v-else-if="labels.length" class="color-3 d-flex my-12 mx-4 pa-12">
        <div class="text-grey">No labels match your search.</div>
      </div>
      <div v-else class="color-3 d-flex flex-column my-12 mx-4 pa-12">
        <div class="text-grey mb-2">You don't have any labels yet.</div>
        <div class="text-grey text-body-2">
          Labels are named collections of entities you can re-use as filters and share via a public link.
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { entityConfigs } from "@/entityConfigs";

const props = defineProps({
  labels: { type: Array, default: () => [] },
});
defineEmits(["edit", "delete"]);

const router = useRouter();
const searchQuery = ref("");

const filteredLabels = computed(() => {
  const sorted = [...props.labels].sort((a, b) =>
    (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
  );
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter(l =>
    (l.display_name || "").toLowerCase().includes(q) ||
    (l.description || "").toLowerCase().includes(q)
  );
});

function entityIcon(type) {
  return entityConfigs?.[type]?.icon || "mdi-label-outline";
}

function goToSerp(label) {
  router.push(`/${label.entity_type}?filter=label:${label.id}`);
}
</script>

<style lang="scss" scoped>
.label-list {
  .search-field {
    max-width: 320px;
  }
  .label-row {
    cursor: pointer;
  }
  .label-description {
    font-size: 12px;
    margin-top: 2px;
    max-width: 480px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  table {
    border-top: none !important;
  }
}
</style>
