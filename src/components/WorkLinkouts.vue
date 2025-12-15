<template>
  <div v-if="data" class="flex items-center gap-2">
    <Button
      as="a"
      :href="data.primary_location?.landing_page_url"
      target="_blank"
      :variant="data.primary_location?.is_oa ? 'default' : 'secondary'"
    >
      <template v-if="data.primary_location?.source?.display_name === 'PubMed'">
        PubMed
      </template>
      <template v-else-if="data.open_access?.is_oa">
        HTML
      </template>
      <template v-else>
        <Lock class="h-4 w-4 mr-1" />
        HTML
      </template>
      <ExternalLink class="h-3 w-3 ml-1" />
    </Button>

    <Button
      v-if="pdfUrl"
      as="a"
      :href="pdfUrl"
      target="_blank"
    >
      PDF
    </Button>
  </div>
</template>


<script setup>
import { computed } from 'vue';

import { Lock, ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

defineOptions({ name: 'WorkLinkouts' });

const props = defineProps({
  data: Object,
});

const pdfUrl = computed(() => props.data.best_oa_location?.pdf_url);
const isOaAtPublisher = computed(() =>
  props.data.open_access?.is_oa && props.data.open_access?.oa_status !== 'green'
);
</script>