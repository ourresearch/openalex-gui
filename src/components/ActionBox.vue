<template>
  <div class="action-box">
    <!-- Function tabs -->
    <div class="action-tabs">
      <button
        v-for="func in functions"
        :key="func.id"
        class="action-tab"
        :class="{ active: activeFunction.id === func.id }"
        @click="selectFunction(func)"
      >
        <v-icon size="16" class="tab-icon">{{ func.tabIcon }}</v-icon>
        <span>{{ func.label }}</span>
      </button>
    </div>

    <!-- Card with input and description -->
    <div class="action-card">
      <!-- Description area -->
      <div class="action-description">
        <p class="action-description-text">
          {{ activeFunction.description }}
          <a :href="activeFunction.docsUrl" target="_blank" class="action-learn-more">Learn more.</a>
        </p>
      </div>

      <!-- Input area -->
      <div class="action-input-wrapper">
        <v-icon class="input-icon" :color="isFocused ? '#0A0A0A' : '#A1A1AA'">
          {{ activeFunction.icon }}
        </v-icon>
        <input
          ref="inputRef"
          v-model="inputValue"
          type="text"
          class="action-input"
          :placeholder="activeFunction.placeholder"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @keydown.enter="onSubmit"
        />
        <button class="submit-btn" @click="onSubmit">
          <v-icon color="white" size="20">mdi-arrow-right</v-icon>
        </button>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

defineOptions({
  name: 'ActionBox'
});

const props = defineProps({
  autofocus: Boolean
});

const router = useRouter();
const inputRef = ref(null);
const inputValue = ref('');
const isFocused = ref(false);
const activeFunctionId = ref('list');
const hoveredFunction = ref(null);

const functions = [
  {
    id: 'list',
    label: 'List',
    tabIcon: 'mdi-format-list-bulleted',
    icon: 'mdi-magnify',
    placeholder: 'Search works, authors, institutions...',
    tooltip: 'Filter, sort, and group entities. The classic OpenAlex query.',
    description: 'Query entities with filters, sorting, and grouping. Returns paginated results matching your criteria.',
    docsUrl: 'https://docs.openalex.org/api-entities/works'
  },
  {
    id: 'show',
    label: 'Show',
    tabIcon: 'mdi-card-account-details-outline',
    icon: 'mdi-identifier',
    placeholder: 'Enter DOI, ORCID, or OpenAlex ID...',
    tooltip: 'Look up a single entity by its identifier.',
    description: 'Retrieve one entity by DOI, ORCID, ROR, ISSN, or OpenAlex ID. Returns the full record.',
    docsUrl: 'https://docs.openalex.org/api-entities/works/get-a-single-work'
  },
  {
    id: 'discover',
    label: 'Discover',
    tabIcon: 'mdi-creation',
    icon: 'mdi-creation',
    placeholder: 'Describe what you\'re looking for...',
    tooltip: 'Semantic search powered by AI embeddings.',
    description: 'Search by meaning, not just keywords. Uses vector embeddings to find semantically similar works.',
    docsUrl: 'https://docs.openalex.org/api-entities/works/search-works'
  },
  {
    id: 'download',
    label: 'Download',
    tabIcon: 'mdi-download',
    icon: 'mdi-file-pdf-box',
    placeholder: 'Enter DOI or OpenAlex Work ID...',
    tooltip: 'Get the fulltext PDF if available.',
    description: 'Download the fulltext PDF for a work. Redirects to our open-access copy if we have one.',
    docsUrl: 'https://docs.openalex.org/api-entities/works/work-object#open_access'
  }
];

const activeFunction = computed(() =>
  functions.find(f => f.id === activeFunctionId.value)
);

function selectFunction(func) {
  activeFunctionId.value = func.id;
  inputValue.value = '';
  inputRef.value?.focus();
}

function onSubmit() {
  if (!inputValue.value.trim()) return;

  const value = inputValue.value.trim();

  switch (activeFunctionId.value) {
    case 'list':
      // Navigate to search results
      router.push({
        name: 'Serp',
        params: { entityType: 'works' },
        query: { filter: `default.search:${encodeURIComponent(value)}` }
      });
      break;

    case 'show':
      // Navigate to entity page (try to parse the ID)
      handleShowSubmit(value);
      break;

    case 'discover':
      // Navigate to Discover page with query
      router.push({
        name: 'Discover',
        query: { q: value }
      });
      break;

    case 'download':
      // Open PDF download URL
      handleDownloadSubmit(value);
      break;
  }
}

function handleShowSubmit(value) {
  // Try to detect what kind of ID this is
  const lowerValue = value.toLowerCase();

  if (lowerValue.startsWith('10.')) {
    // DOI
    router.push({ path: `/works/https://doi.org/${value}` });
  } else if (lowerValue.startsWith('https://doi.org/')) {
    router.push({ path: `/works/${value}` });
  } else if (lowerValue.startsWith('w') && /^w\d+$/i.test(lowerValue)) {
    // OpenAlex Work ID
    router.push({ path: `/works/${lowerValue.toUpperCase()}` });
  } else if (lowerValue.startsWith('a') && /^a\d+$/i.test(lowerValue)) {
    // OpenAlex Author ID
    router.push({ path: `/authors/${lowerValue.toUpperCase()}` });
  } else if (lowerValue.startsWith('i') && /^i\d+$/i.test(lowerValue)) {
    // OpenAlex Institution ID
    router.push({ path: `/institutions/${lowerValue.toUpperCase()}` });
  } else if (lowerValue.startsWith('s') && /^s\d+$/i.test(lowerValue)) {
    // OpenAlex Source ID
    router.push({ path: `/sources/${lowerValue.toUpperCase()}` });
  } else if (lowerValue.includes('orcid.org') || /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value)) {
    // ORCID
    const orcid = value.replace('https://orcid.org/', '');
    router.push({ path: `/authors/https://orcid.org/${orcid}` });
  } else {
    // Try as OpenAlex ID with full URL
    if (value.startsWith('https://openalex.org/')) {
      const path = value.replace('https://openalex.org/', '');
      router.push({ path: `/${path}` });
    } else {
      // Default: try as work ID
      router.push({ path: `/works/${value}` });
    }
  }
}

function handleDownloadSubmit(value) {
  // Extract work ID and open PDF URL
  let workId = value;

  if (value.toLowerCase().startsWith('10.')) {
    // DOI - need to look up the work first, for now just redirect to entity page
    router.push({ path: `/works/https://doi.org/${value}` });
    return;
  }

  if (value.startsWith('https://doi.org/')) {
    router.push({ path: `/works/${value}` });
    return;
  }

  // OpenAlex Work ID
  if (/^w\d+$/i.test(value)) {
    workId = value.toUpperCase();
  }

  // Open the PDF download URL directly
  window.open(`https://api.openalex.org/works/${workId}/pdf`, '_blank');
}
</script>


<style lang="scss" scoped>
.action-box {
  width: 100%;
  max-width: 600px;
}

// Floating pill tabs
.action-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.action-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  background: transparent;
  color: #71717A;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  .tab-icon {
    opacity: 0.5;
  }

  &:hover {
    background: #F4F4F5;
    color: #52525B;
  }

  &.active {
    background: #F4F4F5;
    color: #0A0A0A;

    .tab-icon {
      opacity: 1;
      color: #0A0A0A;
    }
  }
}

// Main card
.action-card {
  background: #fff;
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

// Description area
.action-description {
  margin-bottom: 16px;
}

.action-description-text {
  margin: 0;
  font-size: 14px;
  color: #52525B;
  line-height: 1.5;
}

.action-learn-more {
  color: #71717A;
  text-decoration: none;
  transition: color 0.15s ease;

  &:hover {
    color: #0A0A0A;
    text-decoration: underline;
  }
}

// Input area
.action-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #FAFAFA;
  border: 1px solid #E4E4E7;
  border-radius: 8px;

  &:focus-within {
    border-color: #0A0A0A;
    background: #fff;
  }
}

.input-icon {
  flex-shrink: 0;
}

.action-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #0A0A0A;
  background: transparent;

  &::placeholder {
    color: #A1A1AA;
  }
}

.submit-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #0A0A0A;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;

  &:hover {
    background: #27272A;
  }
}

// Responsive
@media (max-width: 600px) {
  .action-tabs {
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .action-tab {
    padding: 6px 12px;
    font-size: 13px;
  }

  .action-card {
    padding: 16px;
  }
}
</style>
