<template>
  <div class="min-h-screen bg-white flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Email sent confirmation -->
      <div v-if="magicLinkSent" class="text-center">
        <MailCheck class="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 class="text-2xl font-bold mb-2">Check your email</h1>
        <p class="mb-2">
          We sent a link to <strong>{{ magicLinkEmail }}</strong>
        </p>
        <p class="text-sm text-muted-foreground mb-6">
          Click the link in the email to complete your signup. The link expires in 15 minutes.
          <br>Don't see it? Check your spam folder.
        </p>
        <Button variant="ghost" @click="resetForm">
          Use a different email
        </Button>
      </div>

      <!-- Signup form -->
      <div v-else>
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold mb-2">Create your account</h1>
          <p class="text-muted-foreground">
            Sign up to create alerts and save searches.
          </p>
        </div>

        <Card class="p-6">
          <form @submit.prevent="submit">
            <div class="space-y-2 mb-4">
              <Label for="signup-name">Your name</Label>
              <Input
                type="text"
                name="name"
                id="signup-name"
                v-model="name"
                autofocus
                placeholder="John Doe"
              />
            </div>

            <div class="space-y-2">
              <Label for="signup-email">Email address</Label>
              <Input
                type="email"
                id="signup-email"
                name="email"
                v-model="email"
                placeholder="you@example.com"
                @keyup.enter="submit"
              />
              <p v-if="emailErrorMessage" class="text-sm text-destructive">{{ emailErrorMessage }}</p>
            </div>
            
            <!-- Institutional email hint -->
            <Alert v-if="showInstitutionalHint" class="mt-3">
              <Info class="h-4 w-4" />
              <AlertDescription>
                We recommend using your institutional or work email if you have one, for faster support.
              </AlertDescription>
            </Alert>

            <Button
              class="w-full mt-6"
              size="lg"
              :disabled="isFormDisabled"
              @click="submit"
            >
              <template v-if="isLoading">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              </template>
              Send signup link
            </Button>
          </form>
        </Card>

        <p class="text-center mt-6 text-sm">
          Already have an account?
          <router-link :to="{ name: 'Login', query: $route.query }" class="text-primary font-medium hover:underline">
            Log in
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

import { MailCheck, Info } from 'lucide-vue-next';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

<style scoped>
/* Styles handled via Tailwind classes */
</style>