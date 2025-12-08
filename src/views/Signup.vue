<template>
  <v-container fluid class="auth-page fill-height">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">
        <!-- Email sent confirmation -->
        <div v-if="magicLinkSent" class="text-center">
          <v-icon size="64" color="success" class="mb-4">mdi-email-check</v-icon>
          <h1 class="text-h4 font-weight-bold mb-2">Check your email</h1>
          <p class="text-body-1 mb-2">
            We sent a link to <strong>{{ magicLinkEmail }}</strong>
          </p>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Click the link in the email to complete your signup. The link expires in 15 minutes.
            <br>Don't see it? Check your spam folder.
          </p>
          <v-btn variant="text" @click="resetForm">
            Use a different email
          </v-btn>
        </div>

        <!-- Signup form -->
        <div v-else>
          <div class="text-center mb-8">
            <h1 class="text-h4 font-weight-bold mb-2">Create your account</h1>
            <p class="text-body-1 text-medium-emphasis">
              Sign up to create alerts and save searches.
            </p>
          </div>

          <v-card flat class="pa-6" :loading="isLoading" :disabled="isLoading">
            <form @submit.prevent="submit">
              <v-text-field
                variant="outlined"
                density="comfortable"
                type="text"
                name="name"
                id="signup-name"
                v-model="name"
                autofocus
                label="Your name"
                class="mb-3"
              />

              <v-text-field
                variant="outlined"
                density="comfortable"
                type="email"
                id="signup-email"
                name="email"
                v-model="email"
                label="Email address"
                :error-messages="emailErrorMessage"
                @keyup.enter="submit"
              />
              
              <!-- Institutional email hint -->
              <v-alert
                v-if="showInstitutionalHint"
                type="info"
                variant="tonal"
                density="compact"
                class="mt-3"
              >
                We recommend using your institutional or work email if you have one, for faster support.
              </v-alert>

              <v-btn
                block
                size="large"
                :disabled="isFormDisabled"
                color="primary"
                variant="flat"
                class="mt-6"
                @click="submit"
              >
                Send signup link
              </v-btn>
            </form>
          </v-card>

          <p class="text-center mt-6 text-body-2">
            Already have an account?
            <router-link :to="{ name: 'Login', query: $route.query }" class="text-primary font-weight-medium">
              Log in
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

defineOptions({ name: 'SignupPage' });

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({ title: 'Sign up for OpenAlex' });

// state
const email = ref('');
const name = ref('');
const isLoading = ref(false);
const isEmailAlreadyInUse = ref(false);
const magicLinkSent = ref(false);
const magicLinkEmail = ref('');

// Check if email is a common personal email provider
const isPersonalEmail = computed(() => {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com'];
  const emailDomain = email.value.split('@')[1]?.toLowerCase();
  return personalDomains.includes(emailDomain);
});

const showInstitutionalHint = computed(() => {
  return isPersonalEmail.value && email.value.includes('@');
});

const emailErrorMessage = computed(() => {
  if (isEmailAlreadyInUse.value) return 'This email already has an account. Try logging in instead.';
  return undefined;
});

const isFormDisabled = computed(() => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isEmailValid = emailRegex.test(email.value);
  const isNameValid = !!name.value?.trim();
  return isLoading.value || !isEmailValid || !isNameValid;
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
  name.value = '';
  isEmailAlreadyInUse.value = false;
};

const submit = async () => {
  if (isFormDisabled.value) return;
  isLoading.value = true;
  isEmailAlreadyInUse.value = false;
  
  try {
    await store.dispatch('user/requestSignupEmail', {
      email: email.value,
      displayName: name.value,
    });
    magicLinkEmail.value = email.value;
    magicLinkSent.value = true;
  } catch (e) {
    if (e.response?.status === 409) {
      isEmailAlreadyInUse.value = true;
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