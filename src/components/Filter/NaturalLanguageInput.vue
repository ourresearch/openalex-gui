<template>
  <div class="natural-language-input">
    <v-card variant="outlined" class="bg-white pa-3">
      <v-textarea
        v-model="inputText"
        :error="!!errorMessage"
        :error-messages="errorMessage"
        variant="outlined"
        rows="3"
        auto-grow
        placeholder="Describe what you're looking for in plain English, e.g. 'papers about climate change from Harvard in the last 5 years'"
        class="nl-textarea"
        hide-details="auto"
        @keydown="handleKeydown"
      />
      <div class="d-flex justify-end mt-2 ga-2">
        <v-btn
          color="primary"
          @click="submitQuery"
          :loading="isLoading"
          :disabled="!inputText.trim()"
        >
          Search
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { api } from '@/api';

const router = useRouter();
const store = useStore();

const inputText = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleKeydown = (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (inputText.value.trim()) submitQuery();
  }
};

const submitQuery = async () => {
  if (!inputText.value.trim()) return;

  errorMessage.value = '';
  isLoading.value = true;

  try {
    const response = await api.getNaturalLanguageQuery(inputText.value);

    if (!response.validation?.valid) {
      errorMessage.value = response.validation?.errors?.[0]?.message || 'Query validation failed';
      return;
    }

    const urlData = response.url;
    const oqo = response.oqo;
    
    if (urlData || oqo) {
      // Determine entity type from OQO
      const entityType = oqo?.get_rows || 'works';
      
      // Build new route
      const newQuery = {};
      if (urlData?.filter) newQuery.filter = urlData.filter;
      if (urlData?.sort) newQuery.sort = urlData.sort;
      if (urlData?.sample) newQuery.sample = String(urlData.sample);

      // Switch to filters view after successful query
      store.commit('setOqlViewMode', 'filters');

      await router.push({
        name: 'Serp',
        params: { entityType },
        query: newQuery,
      });
    } else {
      errorMessage.value = 'Could not generate a valid query';
    }
  } catch (e) {
    // Handle 400 errors with msg field
    if (e.response?.status === 400 && e.response?.data?.msg) {
      errorMessage.value = e.response.data.msg;
    } else {
      errorMessage.value = e.message || 'Failed to process natural language query';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.natural-language-input {
  width: 100%;
}

.nl-textarea {
  font-size: 14px;
}
</style>
