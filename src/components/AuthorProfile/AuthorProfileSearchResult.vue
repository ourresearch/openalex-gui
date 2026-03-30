<template>
  <div
    class="author-result"
    :class="{ 'author-result--selected': selected }"
    @click="$emit('select')"
  >
    <div class="author-result-main">
      <div class="author-result-name">
        {{ author.display_name }}
      </div>
      <div class="author-result-meta">
        <span class="author-result-works">
          <v-icon size="14" class="mr-1">mdi-file-document-outline</v-icon>
          {{ author.works_count?.toLocaleString() || 0 }} works
        </span>
        <span v-if="author.cited_by_count" class="author-result-citations">
          <v-icon size="14" class="mr-1">mdi-format-quote-close</v-icon>
          {{ author.cited_by_count?.toLocaleString() }} citations
        </span>
      </div>

      <!-- Last known institution -->
      <div v-if="lastInstitution" class="author-result-detail">
        <v-icon size="14" class="mr-1">mdi-domain</v-icon>
        {{ lastInstitution }}
      </div>

      <!-- All affiliations -->
      <div v-if="affiliationsList.length > 0" class="author-result-detail">
        <v-icon size="14" class="mr-1">mdi-map-marker-outline</v-icon>
        <span class="author-result-affiliations">{{ affiliationsList.join(' · ') }}</span>
      </div>

      <!-- Top topics -->
      <div v-if="topTopics.length > 0" class="author-result-topics">
        <v-chip
          v-for="topic in topTopics"
          :key="topic.id"
          size="x-small"
          variant="tonal"
          class="mr-1 mb-1"
        >
          {{ topic.display_name }}
        </v-chip>
      </div>

      <!-- ORCID if available -->
      <div v-if="author.orcid" class="author-result-detail author-result-orcid">
        <v-icon size="14" class="mr-1">mdi-identifier</v-icon>
        ORCID: {{ formatOrcid(author.orcid) }}
      </div>
    </div>

    <div class="author-result-action">
      <v-icon v-if="selected" color="primary" size="20">mdi-check-circle</v-icon>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({ name: 'AuthorProfileSearchResult' });

const props = defineProps({
  author: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select']);

const lastInstitution = computed(() => {
  const institutions = props.author.last_known_institutions;
  if (!institutions || institutions.length === 0) return null;
  return institutions.map(i => i.display_name).join(', ');
});

const affiliationsList = computed(() => {
  const affiliations = props.author.affiliations;
  if (!affiliations || affiliations.length === 0) return [];
  return affiliations
    .map(a => a.institution?.display_name)
    .filter(Boolean)
    .slice(0, 5);
});

const topTopics = computed(() => {
  const topics = props.author.topics;
  if (!topics || topics.length === 0) return [];
  return topics.slice(0, 3);
});

function formatOrcid(orcid) {
  if (!orcid) return '';
  return orcid.replace('https://orcid.org/', '');
}
</script>

<style scoped>
.author-result {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid #E5E5E5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  background: #FFFFFF;
}

.author-result:hover {
  border-color: #D0D0D0;
  background: #FAFAFA;
}

.author-result--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.04);
}

.author-result-main {
  flex: 1;
  min-width: 0;
}

.author-result-name {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1.3;
}

.author-result-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
  font-size: 13px;
  color: #6B6B6B;
}

.author-result-works,
.author-result-citations {
  display: flex;
  align-items: center;
}

.author-result-detail {
  display: flex;
  align-items: center;
  margin-top: 6px;
  font-size: 13px;
  color: #6B6B6B;
}

.author-result-affiliations {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author-result-topics {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
}

.author-result-orcid {
  font-size: 12px;
  color: #9CA3AF;
}

.author-result-action {
  flex-shrink: 0;
  padding-top: 2px;
  padding-left: 12px;
}
</style>
