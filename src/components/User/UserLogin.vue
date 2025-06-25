<template>
  <v-dialog v-model="isOpen" max-width="500">

    <v-card v-if="!isForgotPassword" border rounded :loading="isLoading" :disabled="isLoading" class="">
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
        <form>
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            class="mt-0"
            name="email"
            id="email"
            type="email"
            prepend-icon="mdi-email-outline"
            v-model="email"
            autofocus
            placeholder="Your email"
            :messages="isEmailUnrecognized ? 'Email not found' : undefined"
            :error="isEmailUnrecognized"
            :hide-details="!isEmailUnrecognized"
          >
          </v-text-field>
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            class="mt-3"
            prepend-icon="mdi-lock-outline"
            v-model="password"
            placeholder="Password"
            name="current-password"
            id="current-password"
            :type="isPasswordVisible ? 'text' : 'password'"
            :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="isPasswordVisible = !isPasswordVisible"
            :messages="isPasswordWrong ? 'Wrong password' : undefined"
            :error="isPasswordWrong"
            :hide-details="!isPasswordWrong"
            @keyup.enter="submit"
          >
          </v-text-field>
        </form>
      </v-card-text>  
      <v-card-actions>
        <a @click.prevent="switchToSignup" class="ml-3 text-link" href="/signup">
          Don't have an account? Sign up.
        </a>
        <v-spacer/>
        <a href="#" class="forgot-password-link text-link mr-3" @click.stop.prevent="forgotPasswordClick">
          Forgot password?
        </a>
        <v-btn
          :disabled="isFormDisabled"
          rounded
          color="primary"
          variant="flat"
          @click="submit"
        >
          Log in
        </v-btn>
      </v-card-actions>
    </v-card>
 
    <user-forgot-password v-else-if="isForgotPassword"/>
  </v-dialog>

</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import UserForgotPassword from '@/components/User/UserForgotPassword.vue';

defineOptions({
  name: 'UserLogin'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

// state
const email = ref('');
const password = ref('');
const isPasswordVisible = ref(false);
const isLoading = ref(false);
const isEmailUnrecognized = ref(false);
const isPasswordWrong = ref(false);
const isForgotPassword = ref(false);

// getters
const userName = computed(() => store.getters['user/userName']);
const isLoginDialogOpen = computed(() => store.getters['user/isLoginDialogOpen']);
const showPasswordResetErrorMessage = computed(() => store.getters['user/showPasswordResetErrorMessage']);

// computed props
const isFormDisabled = computed(() => {
  const isDirty = !!email.value || !!password.value;
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegex.test(email.value) && password.value?.length >= 5;
  return isLoading.value || (isDirty && !isValid);
});

const isFixed = computed(() => route.name === 'Login');
const handlingRedirect = ref(false); // Track if we're handling a redirect after login to prevent double navigation

const isOpen = computed({
  get: () => isLoginDialogOpen.value,
  set: (val) => {
    store.commit('user/setIsLoginDialogOpen', val);
    if (!val && isFixed.value && !handlingRedirect.value) {
      console.log('Login closing redirect');
      router.push({ name: 'Home' });
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

const forgotPasswordClick = (event) => {
  console.log('forgotPasswordClick');
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  isForgotPassword.value = true;
};

const submit = async () => {
  if (isFormDisabled.value) return false;
  isLoading.value = true;
  try {
    await store.dispatch('user/loginUser', {
      email: email.value,
      password: password.value,
    });
    store.commit('snackbar', `You're logged in. Welcome back, ${userName.value}!`);
    console.log("Login Succeeded");
    
    if (route.query.redirect) {
      console.log('Login redirecting to', route.query.redirect);
      handlingRedirect.value = true;
      router.replace(route.query.redirect);
      return;
    } else if (route.name === 'ResetPassword') {
      handlingRedirect.value = true;
      router.push({ name: 'Home' });
      return;
    }
    
    isOpen.value = false;
  } catch (e) {
    if (e.message.includes('404')) {
      isEmailUnrecognized.value = true;
    } else if (e.message.includes('403')) {
      isPasswordWrong.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

// watchers
watch(isOpen, () => {
  email.value = '';
  password.value = '';
  isLoading.value = false;
  isPasswordVisible.value = false;
  isEmailUnrecognized.value = false;
  isPasswordWrong.value = false;
  isForgotPassword.value = showPasswordResetErrorMessage.value;
});

watch(password, () => {
  isPasswordWrong.value = false;
});

watch(email, () => {
  isEmailUnrecognized.value = false;
  password.value = '';
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