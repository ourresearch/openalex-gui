<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Email sent confirmation -->
      <div v-if="magicLinkSent" class="text-center">
        <MailCheck class="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 class="text-2xl font-bold mb-2">Check your email</h1>
        <p class="mb-2">
          We sent a login link to <strong>{{ magicLinkEmail }}</strong>
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          Click the link in the email to log in. The link expires in 15 minutes.
          <br>Don't see it? Check your spam folder.
        </p>
        <Button variant="ghost" @click="resetForm">
          Use a different email
        </Button>
      </div>

      <!-- Login form -->
      <div v-else>
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">Welcome back</h1>
          <p class="text-muted-foreground">
            Enter your email and we'll send you a link to log in.
          </p>
        </div>

        <Card class="p-6">
          <form @submit.prevent="submit">
            <div class="space-y-2">
              <Label for="login-email">Email address</Label>
              <Input
                name="email"
                id="login-email"
                type="email"
                v-model="email"
                autofocus
                placeholder="you@example.com"
                @keyup.enter="submit"
              />
              <p v-if="emailMessage" class="text-sm text-destructive">{{ emailMessage }}</p>
            </div>

            <Button
              class="w-full mt-4"
              size="lg"
              :disabled="isFormDisabled"
              @click="submit"
            >
              <template v-if="isLoading">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              </template>
              Send login link
            </Button>
          </form>
        </Card>

        <p class="text-center mt-6 text-sm">
          Don't have an account?
          <router-link :to="{ name: 'Signup', query: $route.query }" class="text-primary font-medium hover:underline">
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

import { MailCheck } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

<style scoped>
/* Styles handled via Tailwind classes */
</style>