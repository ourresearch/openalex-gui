<template>
  <v-dialog v-model="isOpen" max-width="500">

    <v-card flat rounded :loading="isLoading" :disabled="isLoading" class="">
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
        <form>
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            autofocus
            hide-details
            type="text"
            name="name"
            id="name"
            v-model="name"
            prepend-icon="mdi-account-outline"
            placeholder="Your name"
            @keyup.enter="submit"
          >
          </v-text-field>

          <v-text-field
            variant="solo-filled"
            flat
            rounded
            type="email"
            id="email"
            name="email"
            class="mt-3"
            prepend-icon="mdi-email-outline"
            v-model="email"
            placeholder="Your email"
            :messages="emailMsg"
            :error="isEmailAlreadyInUse"
          >
          </v-text-field>
          <v-text-field
            hide-details
            variant="solo-filled"
            flat
            rounded
            class="mt-4"
            prepend-icon="mdi-lock-outline"
            v-model="password"
            placeholder="Password"
            id="new-password"
            name="new-password"
            :type="isPasswordVisible ? 'text' : 'password'"
            :append-icon="isPasswordVisible ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append="isPasswordVisible = !isPasswordVisible"
            @keydown.enter="submit"
          >
          </v-text-field>
        </form>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <a @click.prevent="switchToLogin" class="mr-3 text-link" href="/login">
          Have an account? Log in.
        </a>
        <v-btn
            :disabled="isFormDisabled"
            color="primary"
            variant="flat"
            @click="submit"
            rounded
        >
          Sign up
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
const password = ref('');
const isPasswordVisible = ref(false);
const isEmailAlreadyInUse = ref(false);
const isLoading = ref(false);

const isSignupDialogOpen = computed(() => store.getters['user/isSignupDialogOpen']);

// computed
const emailMsg = computed(() =>
  isEmailAlreadyInUse.value
    ? 'Sorry, this email already has an account'
    : 'Used only for login and account notifications; never shared'
);

const isFormDisabled = computed(() => {
  const isDirty = !!email.value || !!name.value || !!password.value;
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isEmailValid = emailRegex.test(email.value);
  const isNameValid = !!name.value;
  const isPasswordValid = password.value?.length >= 5;
  const isFormValid = isEmailValid && isNameValid && isPasswordValid;
  return isLoading.value || (isDirty && !isFormValid);
});

const isFixed = computed(() => route.name === 'Signup');
const redirectPath = computed(() => route.query.redirect);

const isOpen = computed({
  get: () => isSignupDialogOpen.value,
  set: (val) => {
    store.commit('user/setIsSignupDialogOpen', val);
    if (!val && isFixed.value) {
      router.push({ name: 'Home' });
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

const submit = async () => {
  if (isFormDisabled.value) return;
  isLoading.value = true;
  try {
    await store.dispatch('user/createUser', {
      email: email.value,
      name: name.value,
      password: password.value,
    });
    if (redirectPath.value) {
      router.replace(redirectPath.value);
    }
    store.commit('snackbar', `Account created. Welcome, ${name.value}!`);
    isOpen.value = false;
  } catch (e) {
    if (e.message.includes('409')) {
      isEmailAlreadyInUse.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

// watchers
watch(isOpen, () => {
  name.value = '';
  email.value = '';
  password.value = '';
  isLoading.value = false;
  isPasswordVisible.value = false;
  isEmailAlreadyInUse.value = false;
});

watch(email, () => {
  password.value = '';
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