<template>
  <v-card rounded flat border class="pa-6" :loading="loading" :disabled="loading">
    <div class="text-h6 mb-1">{{ fromLogin ? words.noAccountTitle : words.finishTitle }}</div>
    <div class="mb-5"><OrcidIdLink :orcid="offer.orcid" /></div>

    <!-- We emailed the link that finishes the sign-up (and, opened in this browser, links the iD). -->
    <template v-if="sentTo">
      <p class="font-weight-medium">{{ words.checkEmailTitle }}</p>
      <p class="text-body-2 mt-1">{{ words.checkEmail(sentTo) }}</p>
    </template>

    <!-- The address is on an account already: log in to it, link the ORCID in Settings. -->
    <template v-else-if="loginLinkSentTo">
      <p class="text-body-2">{{ words.loginLinkSent(loginLinkSentTo) }}</p>
    </template>

    <form v-else @submit.prevent="submit">
      <v-text-field
        v-model="name"
        variant="outlined"
        density="comfortable"
        label="Your name"
        name="name"
        id="orcid-signup-name"
        class="mb-3"
        hide-details="auto"
      />
      <p class="text-body-2 mb-2">{{ words.askEmail }}</p>
      <v-text-field
        v-model="email"
        variant="outlined"
        density="comfortable"
        type="email"
        label="Email address"
        name="email"
        id="orcid-signup-email"
        :error="emailInUse"
        hide-details="auto"
        autofocus
      />
      <div ref="turnstileEl" class="turnstile-anchor" />
      <v-alert v-if="turnstileError" type="warning" variant="tonal" density="compact" class="mt-3">
        {{ turnstileError }}
      </v-alert>

      <v-alert v-if="emailInUse" type="info" variant="tonal" density="compact" class="mt-3">
        {{ words.emailInUse }}
        <div class="mt-2">
          <v-btn size="small" variant="flat" color="primary" rounded @click="sendLoginLink">{{ words.sendLoginLink }}</v-btn>
        </div>
      </v-alert>

      <v-btn type="submit" block size="large" color="primary" variant="flat" rounded class="mt-4" :disabled="!canSubmit">
        {{ words.sendLink }}
      </v-btn>
    </form>

    <p v-if="!sentTo && !loginLinkSentTo" class="text-body-2 text-medium-emphasis mt-5 mb-0">
      {{ words.haveAccount }}
      <router-link :to="{ name: 'Login' }">{{ words.logInWithEmail }}</router-link>
    </p>
  </v-card>
</template>

<script setup>
// The last step of a sign-up with ORCID (oxjob #2538). Every account has an email we hold, so this asks for one,
// pre-filled with the email ORCID shows as verified (it may be years old, so our link still proves it). The emailed
// link finishes the sign-up and, opened in this browser, links the iD. `offer` is users-api's no_account answer:
// {orcid, name, email, orcid_token}.
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import OrcidIdLink from './OrcidIdLink.vue';
import { copy } from '@/components/Entity/claimCopy.js';
import { newSignupKeyHash } from './orcidAuth.js';
import { useTurnstile } from '@/composables/useTurnstile';

defineOptions({ name: 'OrcidSignupFinish' });

const props = defineProps({
  offer: { type: Object, required: true },
  fromLogin: { type: Boolean, default: false },
  redirect: { type: String, default: null },
});

const store = useStore();
const words = copy.orcidSignIn;
const { turnstileEl, turnstileToken, turnstileError, mountTurnstile, resetTurnstile } = useTurnstile();

const name = ref(props.offer.name || '');
const email = ref(props.offer.email || '');
const loading = ref(false);
const emailInUse = ref(false);
const sentTo = ref('');
const loginLinkSentTo = ref('');

const typedEmail = computed(() => email.value.trim());
const canSubmit = computed(() => !loading.value && !!name.value.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(typedEmail.value));

onMounted(() => mountTurnstile());

function showError(err) {
  const body = err?.response?.data || {};
  if (err?.response?.status === 409 && body.code === 'email_in_use') {
    emailInUse.value = true;
  } else if ((body.code || '').startsWith('turnstile_')) {
    turnstileError.value = body.message || 'Please complete the check and try again.';
    resetTurnstile();
  } else {
    store.commit('snackbar', body.message || 'Something went wrong. Please try again.');
  }
}

async function submit() {
  if (!canSubmit.value) return;
  loading.value = true;
  emailInUse.value = false;
  turnstileError.value = '';
  try {
    await store.dispatch('user/requestSignupEmail', {
      email: typedEmail.value,
      displayName: name.value.trim(),
      turnstileToken: turnstileToken.value,
      orcidToken: props.offer.orcid_token,
      orcidBrowserKeyHash: await newSignupKeyHash(),
      redirect: props.redirect,
    });
    sentTo.value = typedEmail.value;
  } catch (err) {
    showError(err);
  } finally {
    loading.value = false;
  }
}

async function sendLoginLink() {
  loading.value = true;
  try {
    await store.dispatch('user/requestLoginEmail', { email: typedEmail.value, redirect: props.redirect });
    loginLinkSentTo.value = typedEmail.value;
  } catch (err) {
    showError(err);
  } finally {
    loading.value = false;
  }
}
</script>
