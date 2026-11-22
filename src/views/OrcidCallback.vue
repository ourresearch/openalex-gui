<template>
  <v-container class="py-12" style="max-width: 560px;">
    <OrcidSignupFinish
      v-if="stage === 'finish'"
      :offer="offer"
      :from-login="flow === 'login'"
      :redirect="trip?.redirect || null"
    />
    <v-card v-else rounded flat border class="pa-6">
      <div class="text-h6 mb-3">{{ title }}</div>
      <p v-if="stage === 'linking'">{{ copy.orcidCallback.linking }}</p>
      <p v-else-if="stage === 'signing_in'">{{ copy.orcidSignIn.signingIn }}</p>
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
      <v-btn v-else-if="stage === 'error' && !signedIn" class="mt-2" rounded color="primary" variant="flat" :to="{ name: 'Login' }">
        {{ copy.orcidSignIn.logInWithEmail }}
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
// ORCID return page (oxjobs #1466, #1475, #2538). orcid.org sends the user here with ?code=...&state=... . ORCID
// accepts only this one redirect, so the trip saved under `state` (orcidAuth.js) says what they were doing: log in
// or sign up with ORCID, link the iD from Settings, or link it and claim a profile. A code whose state this browser
// didn't save is never used.
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { copy, reasonText, shortId } from '@/components/Entity/claimCopy.js';
import { takeOrcidTrip, finishOrcidLogin } from '@/components/Orcid/orcidAuth.js';
import OrcidSignupFinish from '@/components/Orcid/OrcidSignupFinish.vue';

defineOptions({ name: 'OrcidCallback' });

const store = useStore();
const route = useRoute();
const router = useRouter();
const stage = ref('linking');
const errorMessage = ref('');
const trip = ref(null);
const offer = ref(null);
const flow = computed(() => trip.value?.flow || null);
const authorId = computed(() => (flow.value === 'claim' ? trip.value.authorId : null));
const signedIn = computed(() => !!store.getters['user/userId']);
const settingsRoute = { name: 'settings-profile', hash: '#orcid' };
const title = computed(() => {
  if (flow.value === 'claim') return copy.title;
  if (flow.value === 'settings') return copy.orcidSettings.linkButton;
  return flow.value === 'signup' ? copy.orcidSignIn.signUp : copy.orcidSignIn.logIn;
});
const reason = computed(() => {
  const c = store.getters['user/userClaim'];
  return reasonText(c?.feedback_code, { email: store.getters['user/userEmail'], link: c?.feedback_link });
});

function fail(message) {
  errorMessage.value = message || '';
  stage.value = 'error';
}

// Log in or sign up with ORCID (#2538): signed in, or no account uses the iD yet (finish with an email).
async function signIn(code, redirectUri) {
  stage.value = 'signing_in';
  try {
    const data = await store.dispatch('user/loginWithOrcid', { code, redirectUri });
    if (data?.no_account && data.orcid_token) {
      offer.value = data;
      stage.value = 'finish';
      return;
    }
    finishOrcidLogin({ store, router, redirect: trip.value.redirect });
  } catch (err) {
    const body = err?.response?.data || {};
    fail(body.code === 'orcid_login_not_enabled' ? copy.orcidSignIn.notEnabled : (body.message || copy.orcidSignIn.failed));
  }
}

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

async function linkAndClaim(code, redirectUri) {
  await store.dispatch('user/linkOrcid', { code, redirectUri });
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
}

onMounted(async () => {
  const { code, state, error } = route.query;
  trip.value = takeOrcidTrip(state);
  // Never leave the one-time code in the address bar or history.
  router.replace({ query: {} });
  if (!trip.value) return fail(copy.orcidCallback.notStartedHere);
  if (error || !code) return fail(copy.orcidCallback.cancelled);
  const redirectUri = `${window.location.origin}/orcid-callback`;
  if (flow.value === 'login' || flow.value === 'signup') return signIn(code, redirectUri);
  // Linking needs the account that started the trip. This page is public, so on a cold load the signed-in user
  // may not be loaded yet: load it before deciding.
  if (!signedIn.value && localStorage.getItem('token')) {
    try {
      await store.dispatch('user/fetchUser');
    } catch (e) {
      console.error('Loading the signed-in user failed:', e);
    }
  }
  if (!signedIn.value) return fail(copy.orcidCallback.logInFirst);
  if (trip.value.userId !== store.getters['user/userId']) {
    return fail(copy.orcidCallback.otherAccount);
  }
  try {
    await linkAndClaim(code, redirectUri);
  } catch (err) {
    fail(err?.response?.data?.message || '');
  }
});
</script>
