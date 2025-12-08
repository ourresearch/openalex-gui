<template>
  <v-dialog v-model="isOpen" max-width="500">
    <!-- Email sent confirmation -->
    <v-card v-if="magicLinkSent" flat rounded class="">
      <v-card-title class="d-flex align-center">
        <v-icon variant="plain" start color="success">mdi-email-check</v-icon>
        Check your email
        <v-spacer/>
        <v-btn v-if="!isFixed" icon variant="plain" @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          We sent a login link to <strong>{{ magicLinkEmail }}</strong>
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Click the link in the email to complete your signup. The link expires in 15 minutes.
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Don't see it? Check your spam folder.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn
          variant="text"
          @click="resetForm"
        >
          Use a different email
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Signup form -->
    <v-card v-else flat rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title class="d-flex align-center">
        <v-icon variant="plain" start>mdi-account-plus</v-icon>
        Sign up
        <v-spacer/>
        <v-btn v-if="!isFixed" icon variant="plain" @click="isOpen = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          Signing up for an OpenAlex account lets you create alerts and save searches.
        </p>
        <form @submit.prevent="submit">
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            autofocus
            hide-details
            type="text"
            name="name"
            id="signup-name"
            v-model="name"
            prepend-icon="mdi-account-outline"
            placeholder="Your name"
          >
          </v-text-field>

          <v-text-field
            variant="solo-filled"
            flat
            rounded
            type="email"
            id="signup-email"
            name="email"
            class="mt-3"
            prepend-icon="mdi-email-outline"
            v-model="email"
            placeholder="Your institutional or work email"
            :messages="emailMsg"
            :error="isEmailAlreadyInUse"
            @keyup.enter="submit"
          >
          </v-text-field>
          
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
        </form>
      </v-card-text>
      <v-card-actions>
        <a @click.prevent="switchToLogin" class="ml-3 text-link" href="/login">
          Have an account? Log in.
        </a>
        <v-spacer/>
        <v-btn
            :disabled="isFormDisabled"
            color="primary"
            variant="flat"
            @click="submit"
            rounded
        >
          Send signup link
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

defineOptions({ name: 'UserSignup' });

const store = useStore();
const route = useRoute();
const router = useRouter();

defineProps({
  showCloseButton: Boolean,
});

const email = ref('');
const name = ref('');
const isEmailAlreadyInUse = ref(false);
const isLoading = ref(false);

const isSignupDialogOpen = computed(() => store.getters['user/isSignupDialogOpen']);
const magicLinkSent = computed(() => store.getters['user/magicLinkSent']);
const magicLinkEmail = computed(() => store.getters['user/magicLinkEmail']);

// Check if email is a common personal email provider
const isPersonalEmail = computed(() => {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'live.com', 'msn.com'];
  const emailDomain = email.value.split('@')[1]?.toLowerCase();
  return personalDomains.includes(emailDomain);
});

const showInstitutionalHint = computed(() => {
  return isPersonalEmail.value && email.value.includes('@');
});

// computed
const emailMsg = computed(() => {
  if (isEmailAlreadyInUse.value) return 'This email already has an account. Try logging in instead.';
  return 'Used only for login and account notifications; never shared';
});

const isFormDisabled = computed(() => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isEmailValid = emailRegex.test(email.value);
  const isNameValid = !!name.value?.trim();
  return isLoading.value || !isEmailValid || !isNameValid;
});

const isFixed = computed(() => route.name === 'Signup');

const isOpen = computed({
  get: () => isSignupDialogOpen.value,
  set: (val) => {
    store.commit('user/setIsSignupDialogOpen', val);
    if (!val) {
      // Reset magic link state when closing
      store.commit('user/setMagicLinkSent', { sent: false, email: '' });
      if (isFixed.value) {
        router.push({ name: 'Home' });
      }
    }
  },
});

// methods
const switchToLogin = () => {
  if (isFixed.value) {
    router.push({ name: 'Login', query: route.query });
  } else {
    store.commit('user/setIsLoginDialogOpen', true);
  }
};

const resetForm = () => {
  store.commit('user/setMagicLinkSent', { sent: false, email: '' });
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
    store.commit('user/setMagicLinkSent', { sent: true, email: email.value });
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

// watchers
watch(isOpen, (newVal) => {
  if (newVal) {
    name.value = '';
    email.value = '';
    isLoading.value = false;
    isEmailAlreadyInUse.value = false;
  }
});

watch(email, () => {
  isEmailAlreadyInUse.value = false;
});
</script>


<style scoped lang="scss">
.text-link {
  text-decoration: none;
  font-size: 11px;
  color: #999;
}
.text-link:hover {
  text-decoration: underline;
}
</style>