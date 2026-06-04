<template>
  <div class="collection-list">
    <div v-if="collections.length" class="d-flex align-center ga-3 mb-4">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search collections"
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
      <v-table v-if="filteredCollections.length">
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
            v-for="collection in filteredCollections"
            :key="collection.id"
            class="collection-row"
            @click="showEntities(collection)"
          >
            <td>
              <div class="d-flex flex-column">
                <span class="font-weight-medium">
                  <v-icon color="grey" start size="small">{{ entityIcon(collection.entity_type) }}</v-icon>
                  {{ collection.display_name }}
                </span>
                <span v-if="collection.description" class="collection-description text-grey">
                  {{ collection.description }}
                </span>
              </div>
            </td>
            <td>
              <v-chip size="small" variant="tonal" label>
                <v-icon start size="x-small">{{ entityIcon(collection.entity_type) }}</v-icon>
                {{ entityPlural(collection.entity_type) }}
              </v-chip>
            </td>
            <td class="text-right">{{ collection.entity_count ?? 0 }}</td>
            <td class="text-right" @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn icon variant="plain" v-bind="menuProps">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <!-- Works-collections: a single membership view (it IS a works search). -->
                  <template v-if="collection.entity_type === 'works'">
                    <v-list-item @click.stop="showEntities(collection)">
                      <template #prepend>
                        <v-icon size="small">mdi-filter-variant</v-icon>
                      </template>
                      <v-list-item-title>Show works in collection</v-list-item-title>
                    </v-list-item>
                  </template>

                  <!-- Typed collections: view the entities themselves… -->
                  <template v-else>
                    <v-list-item @click.stop="showEntities(collection)">
                      <template #prepend>
                        <v-icon size="small">{{ entityIcon(collection.entity_type) }}</v-icon>
                      </template>
                      <v-list-item-title>Show {{ entityPlural(collection.entity_type) }}</v-list-item-title>
                    </v-list-item>

                    <!-- …or apply the collection as a value of a works filter field. -->
                    <template v-if="worksFields(collection.entity_type).length">
                      <v-list-subheader class="text-caption">Show works by</v-list-subheader>
                      <v-list-item
                        v-for="field in worksFields(collection.entity_type)"
                        :key="field.key"
                        @click.stop="showWorksBy(collection, field.key)"
                      >
                        <template #prepend>
                          <v-icon size="small">mdi-file-document-outline</v-icon>
                        </template>
                        <v-list-item-title>{{ cap(field.displayName) }}</v-list-item-title>
                      </v-list-item>
                    </template>
                  </template>

                  <v-divider class="my-1" />

                  <v-list-item :to="`/collections/${collection.id}`" @click.stop>
                    <template #prepend>
                      <v-icon size="small">mdi-share-variant-outline</v-icon>
                    </template>
                    <v-list-item-title>View public page</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click.stop="$emit('edit', collection)">
                    <template #prepend>
                      <v-icon size="small">mdi-pencil-outline</v-icon>
                    </template>
                    <v-list-item-title>Edit name / description</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click.stop="$emit('delete', collection)" base-color="error">
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
      <div v-else-if="collections.length" class="color-3 d-flex my-12 mx-4 pa-12">
        <div class="text-grey">No collections match your search.</div>
      </div>
      <div v-else class="color-3 d-flex flex-column my-12 mx-4 pa-12">
        <div class="text-grey mb-2">You don't have any collections yet.</div>
        <div class="text-grey text-body-2">
          Collections are named sets of entities (works, sources, authors, institutions…)
          you can re-use as search filters and share via a public link.
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { entityConfigs } from "@/entityConfigs";
import { worksFieldsForCollectionType } from "@/collectionFilter";

const props = defineProps({
  collections: { type: Array, default: () => [] },
});
defineEmits(["edit", "delete"]);

const router = useRouter();
const searchQuery = ref("");

const filteredCollections = computed(() => {
  const sorted = [...props.collections].sort((a, b) =>
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
  return entityConfigs?.[type]?.icon || "mdi-folder-outline";
}
function entityPlural(type) {
  return entityConfigs?.[type]?.displayName || type;
}
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function worksFields(type) {
  return worksFieldsForCollectionType(type);
}

// View the collection's own entities on their native SERP via the membership
// (`collection:`) filter. For works-collections this is itself a works search.
function showEntities(collection) {
  router.push(`/${collection.entity_type}?filter=collection:${collection.id}`);
}

// Apply the collection as a value of a works filter field (#350 model): e.g. a
// sources-collection on `primary_location.source.id`.
function showWorksBy(collection, fieldKey) {
  router.push(`/works?filter=${fieldKey}:${collection.id}`);
}
</script>

<style lang="scss" scoped>
.collection-list {
  .search-field {
    max-width: 320px;
  }
  .collection-row {
    cursor: pointer;
  }
  .collection-description {
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
