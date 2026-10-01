<template>
  <SettingsRow :label="words.label" :description="description">
    <!-- Claimed: the description is the full OpenAlex author id, as the ORCID row shows the full iD -->
    <template v-if="claimedId" #description>
      <router-link :to="`/${claimedId}`" class="author-id-link novice-link">https://openalex.org/{{ claimedId }}</router-link>
    </template>

    <!-- Claimed: Unclaim, confirmed in the row (no browser dialog) -->
    <div v-if="claimedId && confirmingUnclaim" class="unclaim-confirm text-body-2">
      <span>{{ words.unclaimConfirm }}</span>
      <v-btn size="small" variant="text" class="settings-action" :disabled="busy" @click="confirmingUnclaim = false">
        {{ words.cancel }}
      </v-btn>
      <v-btn size="small" variant="flat" rounded color="error" :loading="busy" @click="unclaim">
        {{ words.unclaimButton }}
      </v-btn>
    </div>
    <v-btn v-else-if="claimedId" variant="outlined" rounded size="small" class="unclaim-btn" @click="confirmingUnclaim = true">
      {{ words.unclaimButton }}
    </v-btn>

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
      {{ words.findButton }}
    </router-link>
  </SettingsRow>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import { copy, reasonText, shortId } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'AuthorProfileSection' });

const store = useStore();
const words = copy.profileSettings;

const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const pendingClaim = computed(() => store.getters['user/pendingClaim']);
const needsEvidenceClaim = computed(() => store.getters['user/needsEvidenceClaim']);
const claimedId = computed(() => (userAuthorId.value ? shortId(userAuthorId.value).toUpperCase() : null));

// Unset, the row says what it does; set, its description is the value (#1475).
const description = computed(() => {
  if (claimedId.value) return '';
  if (pendingClaim.value) return words.pending(shortId(pendingClaim.value.author_id).toUpperCase());
  if (needsEvidenceClaim.value) return '';
  return words.notClaimed;
});
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

const confirmingUnclaim = ref(false);
const busy = ref(false);

async function unclaim() {
  busy.value = true;
  try {
    await store.dispatch('user/deleteAuthorId');
  } catch (e) {
    store.commit('snackbar', { msg: 'Could not unclaim your profile. Please try again.', color: 'error' });
  } finally {
    busy.value = false;
    confirmingUnclaim.value = false;
  }
}
</script>

<style scoped>
.unclaim-confirm {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.unclaim-btn {
  text-transform: none;
  letter-spacing: normal;
}
.author-id-link {
  color: inherit; /* a value, not a link; novice-link opts out of the global blue */
  text-decoration: none;
}
.author-id-link:hover {
  text-decoration: underline;
}
</style>
