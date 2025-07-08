<template>
  <div class="color-2">
    <v-container>
      <v-card style="min-height: 80vh;">
        <v-card-title class="d-flex justify-space-between align-center">
          Data Map
        </v-card-title>

        <TreeMap v-for="entry in schema" :key="entry.entity" :schema="entry" />

      </v-card>
    </v-container>
  </div>
</template>


<script setup>

import TreeMap from '@/components/DataMap/TreeMap.vue';

const schema = [
  {
    entity: "works",
    divisions: [
      "type",
      "language",
      "open_access.is_oa",
      "open_access.any_repository_has_fulltext",
      "authorships.institutions.is_global_south",
    ]
  },
  {
    entity: "authors",
    divisions: [
      'last_known_institutions.country_code',
      'has_orcid',
    ],
  },
  {
    entity: "institutions",
    divisions: [
      "type",
      "country_code",
    ],
  },
  {
    entity: "sources",
    divisions: [
      "type",
      "is_oa",
      "is_in_doaj",
    ],
  },
  {
    entity: "publishers",
    divisions: [
      "country_codes",
    ],
  },
  {
    entity: "funders",
    divisions: [
      "country_code",
    ],
  },
];
</script>