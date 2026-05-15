<template>
  <SettingsSection title="OpenAlex Author Profile">
    <!-- Claimed (approved) -->
    <div v-if="user.author_id" class="pa-4">
      <AuthorProfileClaimed :author-id="user.author_id" />
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

    <!-- No claim -->
    <SettingsRow
      v-else
      label="No claimed profile"
      description="This user has not claimed an OpenAlex author profile."
    />
  </SettingsSection>
</template>

<script setup>
import { computed } from 'vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from '@/components/AuthorProfile/AuthorProfileClaimed.vue';

defineOptions({ name: 'UserClaimedProfileSection' });

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const pendingClaim = computed(() => {
  const claim = props.user?.claim;
  return claim && !claim.auto_approved ? claim : null;
});

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
    ? `Submitted ${when}. Under review.`
    : 'Under review.';
});
</script>
