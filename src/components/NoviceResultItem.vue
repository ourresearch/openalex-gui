<template>
  <div class="novice-result-item">
    <div class="d-flex align-start">
      <!-- Left: title + meta + citations -->
      <div class="flex-grow-1" style="min-width: 0;">
        <router-link
          :to="filters.entityZoomLink(result.id)"
          class="result-title novice-link text-body-1 font-weight-medium text-decoration-none"
          v-html="filters.prettyTitle(result.display_name || 'Untitled')"
        />

        <div class="result-meta mt-1">
          <span v-if="result.publication_year">{{ result.publication_year }}</span>
          <template v-if="result.authorships?.length">
            <span> · </span>
            <work-authors-string :authorships="result.authorships" />
          </template>
          <template v-if="result.primary_location?.source?.display_name">
            <span> · </span>
            <span class="font-italic">{{ result.primary_location.source.display_name }}</span>
          </template>
        </div>

        <div v-if="result.cited_by_count > 0" class="result-citations mt-1 text-medium-emphasis">
          <v-icon size="14" class="mr-1">mdi-format-quote-close</v-icon>
          <span class="text-body-2">{{ filters.toPrecision(result.cited_by_count) }}</span>
        </div>
      </div>

      <!-- Right: PDF link -->
      <div v-if="result.best_oa_location?.pdf_url" class="ml-3 flex-shrink-0">
        <v-tooltip location="top">
          <template v-slot:activator="{ props: tooltipProps }">
            <a
              v-bind="tooltipProps"
              :href="result.best_oa_location.pdf_url"
              target="_blank"
              rel="noopener"
              class="pdf-link novice-link text-decoration-none"
              @click.stop
            >
              PDF
            </a>
          </template>
          {{ pdfHostname }}
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import filters from '@/filters';
import WorkAuthorsString from '@/components/WorkAuthorsString.vue';

defineOptions({ name: 'NoviceResultItem' });

const props = defineProps({
  result: Object,
});

const pdfHostname = computed(() => {
  try {
    return new URL(props.result.best_oa_location?.pdf_url).hostname;
  } catch {
    return '';
  }
});
</script>

<style scoped>
.novice-result-item {
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.novice-result-item:last-child {
  border-bottom: none;
}

.result-title {
  display: block;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.87);
}

.result-title:hover {
  text-decoration: underline;
}

.result-meta {
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.87);
}

.pdf-link {
  display: inline-block;
  padding: 4px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  transition: background-color 0.15s;
}

.pdf-link:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
