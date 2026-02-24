<template>
  <SettingsSection title="API Access">
    <!-- API Keys -->
    <SettingsRow
      label="API Keys"
      description="Use these keys to authenticate API requests and access your daily budget"
    >
      <div v-if="organization.api_keys && organization.api_keys.length" class="d-flex flex-column align-start ga-2">
        <ApiKeyDisplay 
          v-for="(key, idx) in organization.api_keys" 
          :key="idx" 
          :api-key="key"
        />
      </div>
      <span v-else class="text-medium-emphasis">—</span>
    </SettingsRow>

  </SettingsSection>

  <div class="mt-6 text-body-2 text-grey-darken-1">
    Learn more about the API in the
    <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex documentation</a>.
  </div>
</template>

<script setup>
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineProps({
  organization: {
    type: Object,
    required: true
  }
});
</script>
