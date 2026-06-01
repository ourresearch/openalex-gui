<template>
  <v-container class="d-flex justify-center align-center fill-height">
    <!-- Ready state: require an explicit click before consuming the token.
         Email security scanners (Mimecast, Defender Safe Links, Proofpoint, …)
         pre-fetch links and execute page JS, but do not click buttons. Auto-
         logging-in on mount let those scanners consume the single-use token
         before the real user clicked, locking them out (oxjob #321). -->
    <v-card v-if="isReady" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="primary" class="mb-4">mdi-login-variant</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">Log in to OpenAlex</h1>
      <p class="text-body-2 text-medium-emphasis mb-8">
        Click below to finish logging in.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        block
        @click="doLogin"
      >
        Log in to OpenAlex
      </v-btn>
    </v-card>

    <!-- Loading state -->
    <v-card v-else-if="isLoading" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-progress-circular indeterminate color="primary" size="32" width="3" class="mb-4"/>
      <h1 class="text-h6 font-weight-medium mb-2">Logging you in…</h1>
      <p class="text-body-2 text-medium-emphasis">
        Verifying your login link.
      </p>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="hasError" class="magic-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">Login link expired</h1>
      <p class="text-body-2 text-medium-emphasis mb-8">
        This link has expired or has already been used. Login links last 15
        minutes for security — request a fresh one to continue.
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
      <h1 class="text-h6 font-weight-medium mb-2">You're in</h1>
      <p class="text-body-2 text-medium-emphasis">
        Redirecting you now…
      </p>
    </v-card>
  </v-container>
</template>


<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

defineOptions({
  name: 'MagicToken'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// Start in the "ready" state showing a Log in button. We deliberately do NOT
// consume the token on mount: email link scanners load this page and run its
// JS, but don't click buttons, so gating consumption behind a real click keeps
// the single-use token alive for the actual user (oxjob #321).
const isReady = ref(true);
const isLoading = ref(false);
const hasError = ref(false);

const loginWithMagicToken = (token) => store.dispatch('user/loginWithMagicToken', token);

const goToLogin = () => {
  router.push({ name: 'Login' });
};

const doLogin = async () => {
  isReady.value = false;
  isLoading.value = true;
  try {
    await loginWithMagicToken(route.params.token);
    isLoading.value = false;

    // Get the user's name for the welcome message
    const userName = store.getters['user/userName'];
    store.commit('snackbar', `Welcome back, ${userName}!`);

    // Brief delay to show success state, then redirect
    setTimeout(() => {
      // Check for redirect query param
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
    }, 500);
  } catch (e) {
    console.error('Magic link login failed:', e);
    isLoading.value = false;

    // Check if login actually succeeded despite the error
    // (fetchUser sub-calls like fetchCorrections may fail even after successful login)
    if (localStorage.getItem('token')) {
      // Login succeeded - redirect to home
      const userName = store.getters['user/userName'];
      if (userName) {
        store.commit('snackbar', `Welcome back, ${userName}!`);
      }
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
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
