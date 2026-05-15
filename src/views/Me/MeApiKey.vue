<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">API Key</h1>

    <v-alert
      v-if="activeBoost"
      type="success"
      variant="tonal"
      class="mb-4"
      icon="mdi-rocket-launch-outline"
    >
      <div class="font-weight-medium">
        Your daily cost cap is raised to ${{ boostUsd }}/day by
        <strong>{{ activeBoost.org_name }}</strong>.
      </div>
      <div class="text-caption text-medium-emphasis mt-1">
        Active since {{ formatDate(activeBoost.assigned_at) }}.
        Only an owner at {{ activeBoost.org_name }} can revoke it.
      </div>
    </v-alert>

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
const activeBoost = computed(() => store.state.user.activeBoost);
const boostUsd = computed(() => {
  const credits = activeBoost.value?.boosted_api_max_per_day;
  return credits ? (credits * 0.0001).toFixed(0) : '25';
});

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '';
  }
}

function rotateUserKey() {
  return store.dispatch('user/rotateApiKey');
}
</script>
