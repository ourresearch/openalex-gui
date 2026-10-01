<template>
  <v-container class="py-12" style="max-width: 560px;">
    <v-card rounded flat border class="pa-6">
      <div class="text-h6 mb-3">{{ flow === 'claim' ? copy.title : copy.orcidSettings.linkButton }}</div>
      <p v-if="stage === 'linking'">{{ copy.orcidCallback.linking }}</p>
      <p v-else-if="stage === 'checking'">{{ copy.checkingOrcid }}</p>
      <p v-else-if="stage === 'approved'">{{ copy.approved }}</p>
      <template v-else-if="stage === 'needs_evidence'">
        <p class="font-weight-medium">{{ copy.notYet }}</p>
        <p style="white-space: pre-line;">{{ reason }}</p>
      </template>
      <p v-else-if="stage === 'still'">{{ copy.stillChecking }}</p>
      <p v-else class="text-error">{{ errorMessage || copy.orcidCallback.failed }}</p>
      <v-btn v-if="authorId && stage !== 'linking' && stage !== 'checking'" class="mt-2" rounded color="primary" variant="flat" :to="`/${authorId}`">
        Open the profile
      </v-btn>
      <v-btn v-else-if="flow === 'settings' && stage === 'error'" class="mt-2" rounded color="primary" variant="flat" :to="settingsRoute">
        {{ copy.orcidCallback.backToSettings }}
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
// ORCID return page (oxjobs #1466, #1475). orcid.org sends the user here with
// ?code=...&state=... . ORCID accepts only this one redirect, so `state` says
// where they started: an author id (link, claim that profile, and wait for the
// verifier: a matching iD approves it) or 'settings' (link, back to Settings).
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { copy, reasonText, orcidCallbackFlow, shortId } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'OrcidCallback' });

const store = useStore();
const route = useRoute();
const router = useRouter();
const stage = ref('linking');
const errorMessage = ref('');
const target = computed(() => orcidCallbackFlow(route.query.state));
const flow = computed(() => target.value.flow);
const authorId = computed(() => target.value.authorId || null);
const settingsRoute = { name: 'settings-profile', hash: '#orcid' };
const reason = computed(() => {
  const c = store.getters['user/userClaim'];
  return reasonText(c?.feedback_code, { email: store.getters['user/userEmail'], link: c?.feedback_link });
});

// Linked from Settings: claim the profile that carries the iD, then go back to
// Settings, where the row shows the claim pending until the verifier approves.
async function linkedFromSettings() {
  let msg = copy.orcidCallback.linked;
  try {
    const claimed = await store.dispatch('user/claimOrcidProfile');
    if (claimed) msg = copy.orcidCallback.linkedAndClaiming(claimed.authorId);
    // Keeps polling after we leave this page; the Settings row follows the claim.
    if (store.getters['user/pendingClaim']) {
      store.dispatch('user/pollClaim', { timeoutMs: 120000 }).then(() => {
        if (store.getters['user/userAuthorId']) {
          store.commit('snackbar', { msg: 'Your claim is approved.', color: 'success' });
        }
      });
    }
  } catch (err) {
    msg = copy.orcidCallback.claimFailed(err?.response?.data?.message || '');
  }
  store.commit('snackbar', { msg, color: 'success' });
  router.replace(settingsRoute);
}

onMounted(async () => {
  const code = route.query.code;
  if (!code || route.query.error) {
    stage.value = 'error';
    return;
  }
  try {
    await store.dispatch('user/linkOrcid', { code, redirectUri: `${window.location.origin}/orcid-callback` });
    if (flow.value === 'settings') {
      await linkedFromSettings();
      return;
    }
    if (authorId.value && !store.getters['user/userAuthorId']) {
      const claim = store.getters['user/userClaim'];
      const sameProfile = claim && shortId(claim.author_id) === shortId(authorId.value);
      if (!sameProfile || claim.decision !== 'pending') {
        await store.dispatch('user/setAuthorId', { authorId: authorId.value, evidence: '' });
      }
    }
    stage.value = 'checking';
    const claim = await store.dispatch('user/pollClaim', { timeoutMs: 90000 });
    stage.value = store.getters['user/userAuthorId'] ? 'approved'
      : claim?.decision === 'needs_evidence' ? 'needs_evidence'
        : 'still';
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || '';
    stage.value = 'error';
  }
});
</script>
