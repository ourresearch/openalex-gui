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

    <!-- The linked ORCID iD is on OpenAlex profiles: claim in one click (#1475). -->
    <div v-else-if="foundProfiles.length" class="text-body-2">
      <div v-if="foundProfiles.length === 1">
        {{ copy.orcidFound.one(foundProfiles[0].display_name, foundProfiles[0].works_count) }}
      </div>
      <div v-else>{{ copy.orcidFound.several(foundCount, foundProfiles.length) }}</div>
      <div v-for="a in foundProfiles" :key="a.id" class="found-profile">
        <template v-if="foundProfiles.length > 1">
          <router-link :to="`/${shortId(a.id).toUpperCase()}`" class="text-decoration-none">
            {{ a.display_name }}
          </router-link>
          <span class="text-medium-emphasis">({{ worksText(a.works_count) }})</span>
        </template>
        <v-btn
          size="small"
          rounded
          color="primary"
          :variant="foundProfiles.length === 1 ? 'flat' : 'outlined'"
          :loading="claimingId === a.id"
          :disabled="!!claimingId"
          @click="claim(a.id)"
        >
          {{ copy.orcidFound.button }}
        </v-btn>
      </div>
      <div v-if="claimError" class="text-error mt-1">{{ claimError }}</div>
    </div>

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
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import AuthorProfileClaimed from './AuthorProfileClaimed.vue';
import { copy, reasonText, worksText, shortId } from '@/components/Entity/claimCopy.js';

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

// Profiles that carry the account's linked ORCID iD, when it has no claimed
// or pending profile (#1475). The verifier approves such a claim by
// `orcid_login` within about a minute.
const linkedOrcid = computed(() => store.getters['user/verifiedOrcid']);
const foundProfiles = ref([]);
const foundCount = ref(0);
const FOUND_SHOWN = 5;
const claimingId = ref(null);
const claimError = ref('');

async function findProfiles() {
  foundProfiles.value = [];
  foundCount.value = 0;
  if (!linkedOrcid.value || userAuthorId.value || pendingClaim.value) return;
  try {
    const resp = await axios.get(`${urlBase.api}/authors`, {
      params: {
        filter: `orcid:${linkedOrcid.value},works_count:>0`,
        select: 'id,display_name,works_count',
        sort: 'works_count:desc',
        'per-page': FOUND_SHOWN,
      },
    });
    foundProfiles.value = resp.data?.results || [];
    foundCount.value = resp.data?.meta?.count || foundProfiles.value.length;
  } catch (e) {
    // No list: the row falls back to "Find your author profile".
  }
}
watch([linkedOrcid, userAuthorId, () => !!pendingClaim.value], findProfiles, { immediate: true });

async function claim(authorId) {
  claimError.value = '';
  claimingId.value = authorId;
  try {
    const data = await store.dispatch('user/setAuthorId', { authorId: shortId(authorId), evidence: '' });
    if (!data?.auto_approved) await store.dispatch('user/pollClaim', { timeoutMs: 90000 });
    if (store.getters['user/userAuthorId']) {
      store.commit('snackbar', { msg: 'Your claim is approved.', color: 'success' });
    }
  } catch (err) {
    claimError.value = err?.response?.data?.message || 'Could not send your claim. Please try again.';
  } finally {
    claimingId.value = null;
  }
}
</script>

<style scoped>
.found-profile {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
</style>
