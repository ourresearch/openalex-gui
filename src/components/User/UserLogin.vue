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
            Click the link in the email to log in. The link expires in 15 minutes.
          </p>
          <p class="text-sm text-muted-foreground mt-2">
            Don't see it? Check your spam folder.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="resetForm">Use a different email</Button>
        </DialogFooter>
      </template>

      <!-- Email input form -->
      <template v-else>
        <DialogHeader>
          <DialogTitle class="flex items-center">
            <User class="h-5 w-5 mr-2" />
            Log in
          </DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <p class="text-sm mb-4">Enter your email and we'll send you a link to log in.</p>
          <form @submit.prevent="submit">
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="email"
                id="login-email"
                type="email"
                v-model="email"
                autofocus
                placeholder="Your email"
                class="pl-10"
                :class="{ 'border-destructive': isEmailUnrecognized }"
                @keyup.enter="submit"
              />
            </div>
            <p v-if="emailMessage" class="text-sm text-destructive mt-1">{{ emailMessage }}</p>
          </form>
        </div>
        <DialogFooter class="flex-col sm:flex-row gap-2">
          <a @click.prevent="switchToSignup" class="text-link text-xs text-muted-foreground hover:underline mr-auto" href="/signup">
            Don't have an account? Sign up.
          </a>
          <Button :disabled="isFormDisabled || isLoading" @click="submit">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            Send login link
          </Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

import { MailCheck, User, Mail, Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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