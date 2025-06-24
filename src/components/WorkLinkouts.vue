<template>
  <div v-if="data">
    <v-btn
      rounded
      variant="flat"
      :href="data.primary_location.landing_page_url"
      target="_blank"
      :color="data.primary_location?.is_oa ? 'primary' : 'grey darken-1'"
      class="mr-3"
    >
      <template v-if="data.primary_location?.source?.display_name === 'PubMed'">
        PubMed
      </template>
      <template v-else-if="isOaAtPublisher">
        HTML
      </template>
      <template v-else>
        <v-icon start>mdi-lock</v-icon>
        HTML
      </template>
      <v-icon size="small" class="ml-1">mdi-open-in-new</v-icon>
    </v-btn>

    <!--   PDF anywhere -->
    <v-btn
      rounded
      variant="flat"
      color="primary"
      :href="pdfUrl"
      target="_blank"
      class="mr-3"
      v-if="pdfUrl"
    >
      PDF
    </v-btn>

  </div>
</template>


<script setup>
import { computed } from 'vue';

defineOptions({ name: 'WorkLinkouts' });

const props = defineProps({
  data: Object,
});

const pdfUrl = computed(() => props.data.best_oa_location?.pdf_url);
const isOaAtPublisher = computed(() =>
  props.data.open_access?.is_oa && props.data.open_access?.oa_status !== 'green'
);
</script>