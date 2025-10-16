<template>
  <div v-if="data">
    <!-- HTML Button -->
    <v-btn
      rounded
      variant="flat"
      :href="data.landing_page_url"
      target="_blank"
      :color="isOpenHtml ? 'primary' : 'grey darken-1'"
      class="mr-3"
      v-if="data.landing_page_url"
    >
      <template v-if="!isOpenHtml">
        <v-icon start>mdi-lock</v-icon>
      </template>
      HTML
      <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
    </v-btn>

    <!-- PDF Button -->
    <v-btn
      rounded
      variant="flat"
      :href="data.pdf_url"
      target="_blank"
      :color="isOpenPdf ? 'primary' : 'grey darken-1'"
      class="mr-3"
      v-if="data.pdf_url"
    >
      <template v-if="!isOpenPdf">
        <v-icon start>mdi-lock</v-icon>
      </template>
      PDF
      <v-icon size="x-small" class="ml-1">mdi-open-in-new</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'LocationLinkouts' });

const props = defineProps({
  data: Object,
});

// Determine if HTML button should be open (primary color)
// If location.is_oa == true, then the html button is always open
const isOpenHtml = computed(() => props.data?.is_oa === true);

// Determine if PDF button should be open (primary color)
// If location.is_oa == true and there's a pdf URL given, it's also open
const isOpenPdf = computed(() => props.data?.is_oa === true && !!props.data?.pdf_url);
</script>
