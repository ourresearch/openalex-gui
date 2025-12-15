<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-[500px]">
      <!-- Email sent confirmation -->
      <template v-if="magicLinkSent">
        <DialogHeader>
          <DialogTitle class="flex items-center">
            <MailCheck class="h-5 w-5 mr-2 text-green-600" />
            Check your email
          </DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p>We sent a login link to <strong>{{ magicLinkEmail }}</strong></p>
          <p class="text-sm text-muted-foreground mt-2">
            Click the link in the email to complete your signup. The link expires in 15 minutes.
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            Don't see it? Check your spam folder.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="resetForm">Use a different email</Button>
        </DialogFooter>
      </template>

      <!-- Signup form -->
      <template v-else>
        <DialogHeader>
          <DialogTitle class="flex items-center">
            <UserPlus class="h-5 w-5 mr-2" />
            Sign up
          </DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm mb-4">
            Signing up for an OpenAlex account lets you create alerts and save searches.
          </p>
          <form @submit.prevent="submit" class="space-y-3">
            <div class="relative">
              <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autofocus
                type="text"
                name="name"
                id="signup-name"
                v-model="name"
                placeholder="Your name"
                class="pl-10"
              />
            </div>

            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                id="signup-email"
                name="email"
                v-model="email"
                placeholder="Your institutional or work email"
                class="pl-10"
                :class="{ 'border-destructive': isEmailAlreadyInUse }"
                @keyup.enter="submit"
              />
            </div>
            <p class="text-xs text-muted-foreground" :class="{ 'text-destructive': isEmailAlreadyInUse }">
              {{ emailMsg }}
            </p>
            
            <!-- Institutional email hint -->
            <Alert v-if="showInstitutionalHint" variant="default" class="mt-3">
              <Info class="h-4 w-4" />
              <AlertDescription>
                We recommend using your institutional or work email if you have one, for faster support.
              </AlertDescription>
            </Alert>
          </form>
        </div>
        <DialogFooter class="flex-col sm:flex-row gap-2">
          <a @click.prevent="switchToLogin" class="text-xs text-muted-foreground hover:underline mr-auto" href="/login">
            Have an account? Log in.
          </a>
          <Button :disabled="isFormDisabled || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            Send signup link
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { MailCheck, UserPlus, User, Mail, Info, Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

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