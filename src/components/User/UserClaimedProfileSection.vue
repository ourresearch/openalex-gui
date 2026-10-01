<template>
  <SettingsSection title="OpenAlex Author Profile">
    <!-- Claimed (approved) -->
    <div v-if="user.author_id" class="pa-4">
      <AuthorProfileClaimed :author-id="user.author_id" />
    </div>

    <!-- Unresolved claim: being checked, sent back, or closed by staff (#1466) -->
    <SettingsRow
      v-else-if="pendingClaim"
      :label="pendingClaimLabel"
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

    <!-- Linked ORCID iD (#1475) -->
    <SettingsRow
      label="ORCID"
      :description="user.verified_orcid ? 'Linked by signing in to ORCID.' : 'Not linked.'"
    >
      <a
        v-if="user.verified_orcid"
        :href="`https://orcid.org/${user.verified_orcid}`"
        target="_blank"
        rel="noopener"
        class="d-inline-flex align-center text-decoration-none"
        style="font-size: 13px;"
      >
        <OrcidIcon :size="16" class="mr-1" />https://orcid.org/{{ user.verified_orcid }}
      </a>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { computed } from 'vue';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from '@/components/AuthorProfile/AuthorProfileClaimed.vue';
import OrcidIcon from '@/components/Orcid/OrcidIcon.vue';

defineOptions({ name: 'UserClaimedProfileSection' });

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
});

const pendingClaim = computed(() => {
  const claim = props.user?.claim;
  return claim && claim.decision !== 'approved' ? claim : null;
});
const pendingClaimLabel = computed(() => ({
  pending: 'Claim being checked',
  needs_evidence: 'Claim needs evidence',
  rejected: 'Claim rejected',
}[pendingClaim.value?.decision] || 'Claim'));

const pendingClaimUrl = computed(() => {
  if (!pendingClaim.value?.author_id) return '#';
  const shortId = pendingClaim.value.author_id.replace('https://openalex.org/', '');
  return `https://openalex.org/${shortId}`;
});

const pendingClaimDescription = computed(() => {
  const when = pendingClaim.value?.submitted_at
    ? new Date(pendingClaim.value.submitted_at).toLocaleDateString()
    : '';
  const c = pendingClaim.value || {};
  const state = c.decision === 'needs_evidence'
    ? `Sent back: ${c.feedback_code || 'unknown'}${c.feedback_link ? ` (${c.feedback_link})` : ''}.`
    : c.decision === 'rejected' ? 'Rejected by staff.' : 'Being checked.';
  return when ? `Submitted ${when}. ${state}` : state;
});
</script>
