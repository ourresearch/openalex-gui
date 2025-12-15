<template>
  <Tooltip>
    <TooltipTrigger asChild>
      <Badge
        @click="toggleXpac"
        :variant="isXpacEnabled ? 'default' : 'outline'"
        class="xpac-chip cursor-pointer mr-2"
      >
        <Check v-if="isXpacEnabled" class="h-3 w-3 mr-1" />
        xpac
      </Badge>
    </TooltipTrigger>
    <TooltipContent class="max-w-[300px]">
      Include 'expansion pack' works. Better coverage (192M new works from DataCite and repositories), but data quality is lower.
    </TooltipContent>
  </Tooltip>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Check } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { url } from '@/url';

defineOptions({ name: 'XpacChip' });

const route = useRoute();
const router = useRouter();

const isXpacEnabled = computed(() => route.query.include_xpac === 'true');

function toggleXpac() {
  const newQuery = { ...route.query };
  
  if (isXpacEnabled.value) {
    // Remove the param
    delete newQuery.include_xpac;
  } else {
    // Add the param
    newQuery.include_xpac = 'true';
  }
  
  url.pushToRoute(router, {
    name: route.name,
    params: route.params,
    query: newQuery,
  });
}
</script>

<style scoped>
.xpac-chip {
  cursor: pointer;
  margin-right: 8px;
}

:deep(.v-overlay__content) {
  max-width: 300px !important;
}
</style>
