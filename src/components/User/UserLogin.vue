<template>
  <v-dialog v-model="isOpen" max-width="500">
    <!-- Email sent confirmation -->
    <v-card v-if="magicLinkSent" flat rounded class="">
      <v-card-title class="d-flex align-center">
        <v-icon variant="plain" start color="success">mdi-email-check</v-icon>
        Check your email
        <v-spacer/>
        <v-btn v-if="!isFixed" icon variant="plain" @click="isOpen = false">
          <v-icon variant="plain">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          We sent a login link to <strong>{{ magicLinkEmail }}</strong>
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          Click the link in the email to log in. The link expires in 15 minutes.
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

    <!-- Email input form -->
    <v-card v-else flat rounded :loading="isLoading" :disabled="isLoading" class="">
      <v-card-title class="d-flex align-center">
        <div>
          <v-icon variant="plain" start>mdi-account</v-icon>
          Log in
        </div>
        <v-spacer/>
        <v-btn v-if="!isFixed" icon variant="plain" @click="isOpen = false">
          <v-icon variant="plain">mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-4">
          Enter your email and we'll send you a link to log in.
        </p>
        <form @submit.prevent="submit">
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            class="mt-0"
            name="email"
            id="login-email"
            type="email"
            prepend-icon="mdi-email-outline"
            v-model="email"
            autofocus
            placeholder="Your email"
            :messages="emailMessage"
            :error="isEmailUnrecognized"
            :hide-details="!emailMessage"
            @keyup.enter="submit"
          >
          </v-text-field>
        </form>
        
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
      </v-card-text>  
      <v-card-actions>
        <a @click.prevent="switchToSignup" class="ml-3 text-link" href="/signup">
          Don't have an account? Sign up.
        </a>
        <v-spacer/>
        <v-btn
          :disabled="isFormDisabled"
          rounded
          color="primary"
          variant="flat"
          @click="submit"
        >
          Send login link
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

defineOptions({
  name: 'UserLogin'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// state
const email = ref('');
const isLoading = ref(false);
const isEmailUnrecognized = ref(false);

// getters
const isLoginDialogOpen = computed(() => store.getters['user/isLoginDialogOpen']);
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

const emailMessage = computed(() => {
  if (isEmailUnrecognized.value) return 'Email not found. Need to sign up?';
  return undefined;
});

// computed props
const isFormDisabled = computed(() => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegex.test(email.value);
  return isLoading.value || !isValid;
});

const isFixed = computed(() => route.name === 'Login');

const isOpen = computed({
  get: () => isLoginDialogOpen.value,
  set: (val) => {
    store.commit('user/setIsLoginDialogOpen', val);
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
const switchToSignup = () => {
  if (isFixed.value) {
    router.push({ name: 'Signup', query: route.query });
  } else {
    store.commit('user/setIsSignupDialogOpen', true);
  }
};

const resetForm = () => {
  store.commit('user/setMagicLinkSent', { sent: false, email: '' });
  email.value = '';
  isEmailUnrecognized.value = false;
};

const submit = async () => {
  if (isFormDisabled.value) return false;
  isLoading.value = true;
  isEmailUnrecognized.value = false;
  
  try {
    await store.dispatch('user/requestLoginEmail', email.value);
    store.commit('user/setMagicLinkSent', { sent: true, email: email.value });
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

// watchers
watch(isOpen, (newVal) => {
  if (newVal) {
    email.value = '';
    isLoading.value = false;
    isEmailUnrecognized.value = false;
  }
});

watch(email, () => {
  isEmailUnrecognized.value = false;
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