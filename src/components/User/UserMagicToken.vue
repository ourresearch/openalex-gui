<template>
  <v-container class="d-flex justify-center fill-height">
    <!-- Ready state: require an explicit click before consuming the token.
         Email security scanners (Mimecast, Defender Safe Links, Proofpoint, …)
         pre-fetch links and execute page JS, but do not click buttons. Auto-
         logging-in on mount let those scanners consume the single-use token
         before the real user clicked, locking them out (oxjob #321). -->
    <v-card v-if="isReady" max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start color="primary">mdi-login</v-icon>
        Log in to OpenAlex
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          Click below to finish logging in.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
          color="primary"
          variant="flat"
          rounded
          @click="doLogin"
        >
          Log in to OpenAlex
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loading state -->
    <v-card v-else-if="isLoading" loading max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-loading mdi-spin</v-icon>
        Logging you in...
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 text-medium-emphasis">
          Please wait while we verify your login link.
        </p>
      </v-card-text>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="hasError" max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start color="error">mdi-alert-circle</v-icon>
        Login link expired
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          This login link has expired or has already been used.
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Login links expire after 15 minutes for security. Please request a new one.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
          color="primary"
          variant="flat"
          rounded
          @click="goToLogin"
        >
          Request new link
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Success state (brief, before redirect) -->
    <v-card v-else max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start color="success">mdi-check-circle</v-icon>
        Success!
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          You're now logged in. Redirecting...
        </p>
      </v-card-text>
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
