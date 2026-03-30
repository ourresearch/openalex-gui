<template>
  <div class="author-claimed">
    <div class="author-claimed-header">
      <v-icon color="primary" size="18" class="mr-2">mdi-check-decagram</v-icon>
      <a
        :href="profileUrl"
        target="_blank"
        class="author-claimed-name"
      >
        {{ authorData?.display_name || 'Loading...' }}
        <v-icon size="14" class="ml-1">mdi-open-in-new</v-icon>
      </a>
    </div>

    <div class="author-claimed-help">
      Need to change your claimed profile? Contact
      <a href="mailto:support@openalex.org">support@openalex.org</a>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { urlBase } from '@/apiConfig';

defineOptions({ name: 'AuthorProfileClaimed' });

const props = defineProps({
  authorId: {
    type: String,
    required: true,
  },
});

const authorData = ref(null);

const shortId = computed(() => {
  if (!props.authorId) return '';
  // Extract just the ID part (e.g., A5086928770) from full URL or short form
  const match = props.authorId.match(/[Aa]\d+/);
  return match ? match[0].toUpperCase() : props.authorId;
});

const profileUrl = computed(() => {
  return `https://openalex.org/authors/${shortId.value}`;
});

onMounted(async () => {
  try {
    const resp = await axios.get(`${urlBase.api}/authors/${shortId.value}`);
    authorData.value = resp.data;
  } catch (err) {
    console.error('Failed to fetch claimed author profile:', err);
  }
});
</script>

<style scoped>
.author-claimed-header {
  display: flex;
  align-items: center;
}

.author-claimed-name {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.author-claimed-name:hover {
  text-decoration: underline;
}

.author-claimed-help {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 6px;
  padding-left: 26px;
}

.author-claimed-help a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}

.author-claimed-help a:hover {
  text-decoration: underline;
}
</style>
