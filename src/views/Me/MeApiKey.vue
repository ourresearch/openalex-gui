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
        <ApiKeyDisplay
          v-if="apiKey"
          :api-key="apiKey"
          :on-rotate="rotateUserKey"
          :retired-key="retiredApiKey"
          :on-expire-now="expireRetiredKey"
        />
        <span v-else class="text-medium-emphasis">—</span>
      </SettingsRow>
    </SettingsSection>

    <!-- The key an AI agent asked for on this account (oxjob #1697): separate from yours, for API calls only, and
         it shares your daily budget. We show its ending, never the key: only the agent holds it. -->
    <SettingsSection v-if="agentKey" title="Key an AI assistant asked for" class="mt-6">
      <SettingsRow
        label="Assistant's key"
        :description="agentKeyDescription"
      >
        <div class="d-flex align-center flex-wrap ga-3">
          <span class="font-weight-medium" style="font-family: monospace;">…{{ agentKey.key_hint }}</span>
          <v-chip size="small" variant="tonal" :color="agentKeyStatus.color">{{ agentKeyStatus.label }}</v-chip>
          <template v-if="agentKey.status !== 'revoked'">
            <v-btn v-if="!confirmingRevoke" size="small" variant="text" color="error" @click="confirmingRevoke = true">
              Revoke
            </v-btn>
            <template v-else>
              <span class="text-body-2">Its requests will start failing.</span>
              <v-btn size="small" variant="flat" color="error" :loading="revoking" @click="revokeAgentKey">Revoke</v-btn>
              <v-btn size="small" variant="text" @click="confirmingRevoke = false">Cancel</v-btn>
            </template>
          </template>
        </div>
        <div v-if="revokeError" class="text-body-2 text-error mt-2">{{ revokeError }}</div>
      </SettingsRow>
    </SettingsSection>

    <div class="mt-6 text-body-2 text-grey-darken-1">
      Learn more about the API in the
      <a href="https://developers.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'MeApiKey' });

useHead({ title: 'API Key' });

const store = useStore();
const apiKey = computed(() => store.state.user.apiKey);
const retiredApiKey = computed(() => store.state.user.retiredApiKey);
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

const agentKey = computed(() => store.state.user.agentApiKey);
const agentKeyStatus = computed(() => ({
  active: { label: 'Active', color: 'success' },
  pending_activation: { label: 'Waiting for activation', color: 'warning' },
  revoked: { label: 'Revoked', color: 'grey' },
}[agentKey.value?.status] || { label: agentKey.value?.status || '', color: 'grey' }));
const agentKeyDescription = computed(() => {
  const who = agentKey.value?.agent ? agentKey.value.agent : 'An AI assistant';
  const when = formatDate(agentKey.value?.requested_at);
  return `${who} asked for this key on ${when}. It reads data from the API with your daily budget; it can't sign in to openalex.org.`;
});
const confirmingRevoke = ref(false);
const revoking = ref(false);
const revokeError = ref('');

async function revokeAgentKey() {
  revoking.value = true;
  revokeError.value = '';
  try {
    await store.dispatch('user/revokeAgentApiKey');
    confirmingRevoke.value = false;
  } catch (e) {
    revokeError.value = e?.response?.data?.message || "Couldn't revoke the key. Please try again.";
  } finally {
    revoking.value = false;
  }
}

function rotateUserKey(grace) {
  return store.dispatch('user/rotateApiKey', grace);
}

function expireRetiredKey() {
  return store.dispatch('user/expireRetiredApiKey');
}
</script>
