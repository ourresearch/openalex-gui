<template>
  <!-- Derived-works launcher for a collection homepage (oxjob #366). A collection
       is "a set of <type>"; this button leaves the page to the *real* /works SERP
       with the collection pre-applied as a filter value — the "discover with the
       set" half of the manage-here / discover-there boundary.

       Two variants (one skeleton), both driven by the pure `derivedWorksMenu`:
       - works-collection → members ARE works, so the derived action collapses to a
         single "View as full search" → /works?filter=collection:<id>.
       - typed collection (institutions/sources/…) → a dropdown of the works fields
         this collection's type is a valid value of; each → /works?filter=<field>:<id>. -->
  <v-btn
    v-if="menu.isWorksCollection"
    color="primary"
    variant="flat"
    :size="size"
    :to="menu.fullSearchUrl"
  >
    View as full search
    <v-icon end>mdi-arrow-right</v-icon>
  </v-btn>

  <v-menu v-else-if="menu.fields.length" location="bottom start">
    <template #activator="{ props: menuProps }">
      <v-btn color="primary" variant="flat" :size="size" v-bind="menuProps">
        View works by these {{ menu.entityPlural }}
        <v-icon end>mdi-menu-down</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="field in menu.fields"
        :key="field.key"
        :to="field.to"
      >
        <template #prepend>
          <v-icon size="small">mdi-file-document-outline</v-icon>
        </template>
        <v-list-item-title>{{ field.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";
import { derivedWorksMenu } from "@/collectionFilter";

const props = defineProps({
  // Public collection object ({ id, entity_type, ... }) as loaded by CollectionPublic.
  collection: { type: Object, required: true },
  size: { type: String, default: "default" },
});

const menu = computed(() => derivedWorksMenu(props.collection));
</script>
