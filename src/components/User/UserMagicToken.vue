<template>
  <v-container class="d-flex justify-center align-center fill-height">
    <!-- Ready state: require an explicit click before consuming the token.
         Email security scanners (Mimecast, Defender Safe Links, Proofpoint, …)
         pre-fetch links and execute page JS, but do not click buttons. Auto-
         logging-in on mount let those scanners consume the single-use token
         before the real user clicked, locking them out (oxjob #321). -->
    <v-card v-if="isReady" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="primary" class="mb-4">{{ copy.icon }}</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">{{ copy.title }}</h1>
      <p class="text-body-2 text-medium-emphasis" :class="isActivation ? 'mb-3' : 'mb-8'">{{ copy.text }}</p>
      <!-- An AI agent asked for this key (oxjob #1697): the person decides, knowing what it is. -->
      <p v-if="isActivation" class="text-body-2 text-medium-emphasis mb-8">
        Only activate it if you, or an assistant you use, asked for it. If you didn't, close this page:
        the key stops working in 7 days.
      </p>
      <!-- Cloudflare Turnstile, invisible unless Cloudflare asks for a click: activating a key an agent asked for
           needs it (users-api), since the agent's call couldn't solve one. -->
      <div ref="turnstileEl" class="turnstile-anchor" />
      <p v-if="checkMessage" class="text-body-2 text-error mb-4">{{ checkMessage }}</p>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        block
        @click="doLogin"
      >
        {{ copy.button }}
      </v-btn>
    </v-card>

    <!-- Loading state -->
    <v-card v-else-if="isLoading" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-progress-circular indeterminate color="primary" size="32" width="3" class="mb-4"/>
      <h1 class="text-h6 font-weight-medium mb-2">{{ isActivation ? 'Activating your key…' : 'Logging you in…' }}</h1>
      <p class="text-body-2 text-medium-emphasis">
        {{ isActivation ? 'Verifying your activation link.' : 'Verifying your login link.' }}
      </p>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="hasError" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">{{ isActivation ? 'Activation link expired' : 'Login link expired' }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-8">
        {{ isActivation
          ? 'This link has expired or has already been used. Log in to see your key, or ask your assistant to request it again.'
          : 'This link has expired or has already been used. Login links last 15 minutes for security — request a fresh one to continue.' }}
      </p>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        block
        @click="goToLogin"
      >
        Request new link
      </v-btn>
    </v-card>

    <!-- Success state (brief, before redirect) -->
    <v-card v-else class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">{{ isActivation ? 'Your key is active' : "You're in" }}</h1>
      <p class="text-body-2 text-medium-emphasis">
        Redirecting you now…
      </p>
    </v-card>
  </v-container>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { sanitizeLoginToken, sanitizeRedirectPath } from '@/util';
import { useTurnstile } from '@/composables/useTurnstile';

defineOptions({
  name: 'MagicToken'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// The org-invitation email links here with ?invite=1 (#317). Most invitees have
// no account yet, so show "accept invitation / set up your account" copy rather
// than the existing-user "log in" framing.
const isInvite = computed(() => !!route.query.invite);

// The activation email for a key an AI agent asked for links here with ?activate=1 (oxjob #1697).
const isActivation = computed(() => !!route.query.activate);

const copy = computed(() => {
  if (isActivation.value) return {
    icon: 'mdi-key-outline',
    title: 'Activate your API key',
    text: 'An AI assistant or app asked for a free OpenAlex API key for your email address. Activating it raises the key from $0.10 to $1 a day of free usage, and signs you in.',
    button: 'Activate my API key',
  };
  if (isInvite.value) return {
    icon: 'mdi-account-multiple-plus-outline',
    title: 'Accept your invitation',
    text: 'Click below to accept and set up your OpenAlex account.',
    button: 'Accept invitation',
  };
  return {
    icon: 'mdi-login-variant',
    title: 'Log in to OpenAlex',
    text: 'Click below to finish logging in.',
    button: 'Log in to OpenAlex',
  };
});

// Turnstile renders on every link page: users-api asks for it only when this click activates an agent's key, and
// a plain login link can be that click too. It's invisible, and an ordinary login never waits for it.
const { turnstileEl, turnstileToken, mountTurnstile, resetTurnstile } = useTurnstile();
const checkMessage = ref('');
onMounted(() => { mountTurnstile(); });

function turnstileTokenNow() {
  return turnstileToken.value || '';
}

async function tokenForActivation() {
  // Give the invisible check up to ~5 s to finish before sending the click on.
  for (let i = 0; i < 50 && !turnstileToken.value; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  return turnstileToken.value;
}

function welcomeSnackbar(loginData) {
  const userName = store.getters['user/userName'];
  if (loginData?.key_activated) {
    return 'Your API key is active: it now has $1 a day of free usage.';
  }
  // The backend tells us whether this invite created a brand-new account vs.
  // matched an existing one, plus which org they joined.
  if (loginData?.invitation_accepted) {
    const org = loginData.organization_name;
    const joined = org ? ` You've joined ${org}.` : '';
    return loginData.created_account
      ? `Welcome to OpenAlex!${joined}`
      : `Welcome back, ${userName}!${joined}`;
  }
  return `Welcome back, ${userName}!`;
}

// Start in the "ready" state showing a Log in button. We deliberately do NOT
// consume the token on mount: email link scanners load this page and run its
// JS, but don't click buttons, so gating consumption behind a real click keeps
// the single-use token alive for the actual user (oxjob #321).
const isReady = ref(true);
const isLoading = ref(false);
const hasError = ref(false);

const loginWithMagicToken = (token) => store.dispatch('user/loginWithMagicToken', token);

const goToLogin = () => {
  // Carry the destination onto the retry: a user whose link expired shouldn't
  // lose where they were headed just because they took too long (oxjob #855).
  const redirect = sanitizeRedirectPath(route.query.redirect, null);
  router.push(redirect ? { name: 'Login', query: { redirect } } : { name: 'Login' });
};

const doLogin = async () => {
  checkMessage.value = '';
  const checkToken = isActivation.value ? await tokenForActivation() : turnstileTokenNow();
  isReady.value = false;
  isLoading.value = true;
  try {
    // Some mail gateways append a stray char (e.g. a quote) to the link's
    // URL; strip anything outside the base64url token alphabet (#8891).
    const loginData = await loginWithMagicToken({token: sanitizeLoginToken(route.params.token), turnstileToken: checkToken});
    isLoading.value = false;

    store.commit('snackbar', welcomeSnackbar(loginData));

    // Brief delay to show success state, then redirect
    setTimeout(() => {
      // Send invitees to their new org's profile; everyone else to home —
      // unless an explicit redirect survived the round trip through email.
      // That value is attacker-reachable, so validate before navigating
      // (oxjob #855); an invalid one falls back to the same default as before.
      const fallback = loginData?.invitation_accepted ? '/settings/org-profile'
        : loginData?.key_activated ? '/settings/api-key' : '/';
      router.push(sanitizeRedirectPath(route.query.redirect, fallback));
    }, 500);
  } catch (e) {
    console.error('Magic link login failed:', e);
    isLoading.value = false;

    // The human check didn't pass (or hadn't finished): the link is still good, so let them try again.
    const code = e?.response?.data?.code || '';
    if (code.startsWith('turnstile_')) {
      checkMessage.value = e.response.data.message || 'Please complete the check and try again.';
      resetTurnstile();
      isReady.value = true;
      return;
    }

    // Check if login actually succeeded despite the error
    // (fetchUser sub-calls like fetchSavedSearches may fail even after successful login)
    if (localStorage.getItem('token')) {
      // Login succeeded despite a sub-call failing. We don't have the login
      // response body here, so fall back to a generic welcome (invite-aware).
      const userName = store.getters['user/userName'];
      if (isInvite.value) {
        store.commit('snackbar', 'Welcome to OpenAlex!');
      } else if (userName) {
        store.commit('snackbar', `Welcome back, ${userName}!`);
      }
      const fallback = isInvite.value ? '/settings/org-profile' : '/';
      router.push(sanitizeRedirectPath(route.query.redirect, fallback));
    } else {
      hasError.value = true;
    }
  }
};
</script>

<style scoped>
.magic-card {
  /* Roomy, centered, Linear-style: generous padding, hairline border,
     no heavy shadow. Flex column keeps every element (incl. the button)
     centered regardless of Vuetify's default button width. */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 36px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* Full-width primary CTA — a single, unmistakable action. */
.magic-card :deep(.v-btn) {
  width: 100%;
}
</style>
