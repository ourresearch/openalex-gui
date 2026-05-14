<template>
  <SettingsSection v-if="authorCurationEnabled" title="OpenAlex Author Profile">
    <!-- Already claimed (approved) -->
    <div v-if="userAuthorId" class="pa-4">
      <AuthorProfileClaimed :author-id="userAuthorId" />
    </div>

    <!-- Pending claim (submitted, not yet approved) -->
    <SettingsRow
      v-else-if="pendingClaim"
      label="Pending claim"
      :description="pendingClaimDescription"
    >
      <a
        :href="pendingClaimUrl"
        target="_blank"
        rel="noopener"
        class="settings-action text-decoration-none"
      >
        View profile
      </a>
    </SettingsRow>

    <!-- No claim — direct user to claim from the author page itself. -->
    <SettingsRow
      v-else
      label="Claim your profile"
      description="Open your author page and click the 'Claim profile' button."
    />
  </SettingsSection>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from './AuthorProfileClaimed.vue';

defineOptions({ name: 'AuthorProfileSection' });

const store = useStore();

const authorCurationEnabled = computed(() => !!store.getters.featureFlags?.author_curation);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const pendingClaim = computed(() => store.getters['user/pendingClaim']);

const pendingClaimUrl = computed(() => {
  if (!pendingClaim.value?.author_id) return '#';
  const shortId = pendingClaim.value.author_id.replace('https://openalex.org/', '');
  return `https://openalex.org/${shortId}`;
});

const pendingClaimDescription = computed(() => {
  const when = pendingClaim.value?.submitted_at
    ? new Date(pendingClaim.value.submitted_at).toLocaleDateString()
    : '';
  return when
    ? `Submitted ${when}. Under review — we'll email you when it's resolved.`
    : "Under review — we'll email you when it's resolved.";
});
</script>
