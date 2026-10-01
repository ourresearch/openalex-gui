<template>
  <!--
    Password sign-in for ONE account: the test account OpenAI's plugin review
    uses (oxjob #1294). OpenAI rules out magic links for reviewers and asks for
    "a login and password", so this page exists for them alone. Nothing links
    here; users-api accepts only accounts flagged password_login_allowed
    (migration 095), which is set by hand on the reviewer account. Everyone
    else signs in by emailed link at /login.
  -->
  <v-container fluid class="auth-page fill-height">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <div class="text-center mb-8">
          <h1 class="text-h4 font-weight-bold mb-2">Reviewer sign-in</h1>
          <p class="text-body-1 text-medium-emphasis">
            This page is only for the OpenAI plugin review account.
            Everyone else <router-link :to="{ name: 'Login', query: $route.query }">logs in with an email link</router-link>.
          </p>
        </div>

        <v-card flat class="pa-6" :loading="isLoading" :disabled="isLoading">
          <form @submit.prevent="submit">
            <v-text-field
              variant="outlined"
              density="comfortable"
              name="email"
              type="email"
              autocomplete="username"
              v-model="email"
              autofocus
              label="Email address"
            />
            <v-text-field
              variant="outlined"
              density="comfortable"
              name="password"
              type="password"
              autocomplete="current-password"
              v-model="password"
              label="Password"
              :error-messages="errorMessage"
            />
            <v-btn
              block
              size="large"
              type="submit"
              :disabled="isFormDisabled"
              color="primary"
              variant="flat"
              class="mt-4"
            >
              Log in
            </v-btn>
          </form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { sanitizeRedirectPath } from '@/util';

defineOptions({ name: 'ReviewerLoginPage' });

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({
  title: 'Reviewer sign-in',
  meta: [{ name: 'robots', content: 'noindex' }],
});

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const isFormDisabled = computed(() => isLoading.value || !email.value || !password.value);

onMounted(() => {
  if (store.getters['user/userId']) {
    router.push(sanitizeRedirectPath(route.query.redirect));
  }
});

const submit = async () => {
  if (isFormDisabled.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    await store.dispatch('user/loginWithPassword', { email: email.value, password: password.value });
    router.push(sanitizeRedirectPath(route.query.redirect));
  } catch (e) {
    errorMessage.value = e.response?.status === 401
      ? 'Wrong email or password.'
      : 'Something went wrong. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
  background: #fff;
  max-width: 100% !important;
  padding: 0;
}
</style>
