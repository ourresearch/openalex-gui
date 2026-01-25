<template>
  <router-link
    :to="entityLink"
    class="find-result-item"
  >
    <div class="result-title" v-html="prettyTitle"></div>

    <div class="result-details">
      <span v-if="work.publication_year">{{ work.publication_year }}</span>
      <span v-if="work.publication_year && authorshipsExist"> &middot; </span>
      <work-authors-string v-if="authorshipsExist" :authorships="work.authorships" />
      <span v-if="sourceName"> &middot; </span>
      <span v-if="sourceName" class="font-italic">{{ sourceName }}</span>
    </div>

    <div class="result-actions">
      <span
        v-if="work.cited_by_count"
        class="action-link"
        @click.stop.prevent="viewCitingPapers"
      >
        Cited by {{ formatCount(work.cited_by_count) }}
      </span>

      <a
        v-if="pdfUrl"
        :href="pdfUrl"
        target="_blank"
        class="action-link"
        @click.stop
      >
        PDF
      </a>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import filters from '@/filters';
import * as openalexId from '@/openalexId';
import { createSimpleFilter } from '@/filterConfigs';
import { url } from '@/url';

import WorkAuthorsString from '@/components/WorkAuthorsString.vue';

defineOptions({ name: 'FindResultsItem' });

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
});

const router = useRouter();

// The API returns { score, work } format
const work = computed(() => props.result.work || props.result);

const prettyTitle = computed(() => {
  return filters.prettyTitle(work.value?.display_name || work.value?.title || 'Untitled');
});

const authorshipsExist = computed(() => {
  return work.value?.authorships?.length > 0;
});

const sourceName = computed(() => {
  return work.value?.primary_location?.source?.display_name;
});

const pdfUrl = computed(() => {
  return work.value?.best_oa_location?.pdf_url;
});

const entityLink = computed(() => {
  const id = work.value?.id;
  if (!id) return null;
  const parsed = openalexId.parseId(id);
  if (!parsed) return null;
  return {
    name: 'EntityPage',
    params: { entityType: parsed.entityType, entityId: parsed.shortId },
  };
});

function formatCount(count) {
  return filters.toPrecision(count || 0);
}

function viewCitingPapers() {
  const workId = work.value?.id;
  if (!workId) return;
  const citesFilter = createSimpleFilter('works', 'cites', workId);
  url.pushNewFilters([citesFilter], 'works');
}
</script>

<style lang="scss" scoped>
.find-result-item {
  display: block;
  padding: 12px 16px;
  margin: 0 -16px;
  text-decoration: none !important;
  border-radius: 8px;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #F9FAFB;
  }
}

.result-title {
  font-size: 16px;
  font-weight: 400;
  color: #1A1A1A;
  line-height: 1.4;
  margin-bottom: 4px;
}

.result-details {
  font-size: 14px;
  color: #6B7280;
  line-height: 1.5;
  margin-bottom: 4px;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.action-link {
  font-size: 13px;
  color: #2563EB;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
