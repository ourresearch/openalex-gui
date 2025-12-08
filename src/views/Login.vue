<template>
  <v-container fluid class="auth-page fill-height">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <!-- Email sent confirmation -->
        <div v-if="magicLinkSent" class="text-center">
          <v-icon size="64" color="success" class="mb-4">mdi-email-check</v-icon>
          <h1 class="text-h4 font-weight-bold mb-2">Check your email</h1>
          <p class="text-body-1 mb-2">
            We sent a login link to <strong>{{ magicLinkEmail }}</strong>
          </p>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Click the link in the email to log in. The link expires in 15 minutes.
            <br>Don't see it? Check your spam folder.
          </p>
          <v-btn variant="text" @click="resetForm">
            Use a different email
          </v-btn>
        </div>

        <!-- Login form -->
        <div v-else>
          <div class="text-center mb-8">
            <h1 class="text-h4 font-weight-bold mb-2">Welcome back</h1>
            <p class="text-body-1 text-medium-emphasis">
              Enter your email and we'll send you a link to log in.
            </p>
          </div>

          <v-card flat class="pa-6" :loading="isLoading" :disabled="isLoading">
            <form @submit.prevent="submit">
              <v-text-field
                variant="outlined"
                density="comfortable"
                name="email"
                id="login-email"
                type="email"
                v-model="email"
                autofocus
                label="Email address"
                :error-messages="emailMessage"
                @keyup.enter="submit"
              />

              <v-btn
                block
                size="large"
                :disabled="isFormDisabled"
                color="primary"
                variant="flat"
                class="mt-4"
                @click="submit"
              >
                Send login link
              </v-btn>
            </form>
          </v-card>

          <p class="text-center mt-6 text-body-2">
            Don't have an account?
            <router-link :to="{ name: 'Signup', query: $route.query }" class="text-primary font-weight-medium">
              Sign up
            </router-link>
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'LoginPage' });

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({ title: 'Log in to OpenAlex' });

// state
const email = ref('');
const isLoading = ref(false);
const isEmailUnrecognized = ref(false);
const magicLinkSent = ref(false);
const magicLinkEmail = ref('');

const emailMessage = computed(() => {
  if (isEmailUnrecognized.value) return 'Email not found. Need to sign up?';
  return undefined;
});

const isFormDisabled = computed(() => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegex.test(email.value);
  return isLoading.value || !isValid;
});

// Redirect if already logged in
onMounted(() => {
  const userId = store.getters['user/userId'];
  if (userId) {
    router.push(route.query.redirect || '/');
  }
});

const resetForm = () => {
  magicLinkSent.value = false;
  magicLinkEmail.value = '';
  email.value = '';
  isEmailUnrecognized.value = false;
};

const submit = async () => {
  if (isFormDisabled.value) return;
  isLoading.value = true;
  isEmailUnrecognized.value = false;
  
  try {
    await store.dispatch('user/requestLoginEmail', email.value);
    magicLinkEmail.value = email.value;
    magicLinkSent.value = true;
  } catch (e) {
    if (e.response?.status === 404) {
      isEmailUnrecognized.value = true;
    } else {
      store.commit('snackbar', 'Something went wrong. Please try again.');
    }
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