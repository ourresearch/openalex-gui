<template>
  <div v-if="data" class="flex items-center gap-2">
    <!-- HTML Button -->
    <Button
      v-if="data.landing_page_url"
      as="a"
      :href="data.landing_page_url"
      target="_blank"
      :variant="isOpenHtml ? 'default' : 'secondary'"
    >
      <Lock v-if="!isOpenHtml" class="h-4 w-4 mr-1" />
      HTML
      <ExternalLink class="h-3 w-3 ml-1" />
    </Button>

    <!-- PDF Button -->
    <Button
      v-if="data.pdf_url"
      as="a"
      :href="data.pdf_url"
      target="_blank"
      :variant="isOpenPdf ? 'default' : 'secondary'"
    >
      <Lock v-if="!isOpenPdf" class="h-4 w-4 mr-1" />
      PDF
      <ExternalLink class="h-3 w-3 ml-1" />
    </Button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import { Lock, ExternalLink } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

defineOptions({ name: 'LocationLinkouts' });

const props = defineProps({
  data: Object,
});

const isOpenHtml = computed(() => props.data?.is_oa === true);
const isOpenPdf = computed(() => props.data?.is_oa === true && !!props.data?.pdf_url);
</script>
