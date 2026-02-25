<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">API Key</h1>

    <SettingsSection title="Your API Key">
      <SettingsRow
        label="API Key"
        description="Use this key to authenticate API requests and get higher rate limits"
      >
        <ApiKeyDisplay v-if="apiKey" :api-key="apiKey" :on-rotate="rotateUserKey" />
        <span v-else class="text-medium-emphasis">—</span>
      </SettingsRow>
    </SettingsSection>

    <div class="mt-6 text-body-2 text-grey-darken-1">
      Learn more about the API in the
      <a href="https://developers.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'MeApiKey' });

useHead({ title: 'API Key' });

const store = useStore();
const apiKey = computed(() => store.state.user.apiKey);

function rotateUserKey() {
  return store.dispatch('user/rotateApiKey');
}
</script>
