<template>
  <SettingsRow
    label="Claimed author profile"
  >
    <!-- Already claimed (approved) -->
    <AuthorProfileClaimed v-if="userAuthorId" :author-id="userAuthorId" />

    <!-- Being checked right now (a minute or so; #1466). -->
    <v-chip
      v-else-if="pendingClaim"
      color="warning"
      variant="flat"
      size="small"
      label
    >
      Claim pending
    </v-chip>

    <!-- Sent back: what's missing, and where to fix it. -->
    <div v-else-if="needsEvidenceClaim" class="text-body-2">
      <div class="font-weight-medium">We need one more thing for your claim.</div>
      <div class="text-medium-emphasis" style="white-space: pre-line;">{{ reason }}</div>
      <router-link :to="claimProfileRoute" class="settings-action text-decoration-none">
        Open the profile to send a new link
      </router-link>
    </div>

    <!-- No claim — send them to a search for their own name. -->
    <router-link
      v-else
      :to="findProfileRoute"
      class="settings-action text-decoration-none"
    >
      Find your author profile
    </router-link>
  </SettingsRow>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from './AuthorProfileClaimed.vue';
import { reasonText } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'AuthorProfileSection' });

const store = useStore();

const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const pendingClaim = computed(() => store.getters['user/pendingClaim']);
const needsEvidenceClaim = computed(() => store.getters['user/needsEvidenceClaim']);
const reason = computed(() => reasonText(needsEvidenceClaim.value?.feedback_code, {
  email: store.getters['user/userEmail'],
  link: needsEvidenceClaim.value?.feedback_link,
}));
const claimProfileRoute = computed(() =>
  `/${(needsEvidenceClaim.value?.author_id || '').split('/').pop()}`
);
const userName = computed(() => store.state.user?.name || '');

const findProfileRoute = computed(() => ({
  name: 'Serp',
  params: { entityType: 'authors' },
  query: { filter: `default.search:${userName.value}` },
}));
</script>
