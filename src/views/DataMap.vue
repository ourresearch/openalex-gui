<template>
  <div>
    <div class="container mx-auto px-4">
      <Card class="min-h-[80vh]">
        <CardHeader>
          <CardTitle class="flex justify-between items-center">
            Data Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TreeMap v-for="entry in schema" :key="entry.entity" :schema="entry" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>


<script setup>
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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