<template>
  <div class="flex justify-center items-center min-h-screen">
    <!-- Loading state -->
    <Card v-if="isLoading" class="max-w-[500px] min-w-[300px]">
      <CardHeader>
        <CardTitle class="flex items-center">
          <Loader2 class="h-5 w-5 mr-2 animate-spin" />
          Logging you in...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">
          Please wait while we verify your login link.
        </p>
      </CardContent>
    </Card>

    <!-- Error state -->
    <Card v-else-if="hasError" class="max-w-[500px] min-w-[300px]">
      <CardHeader>
        <CardTitle class="flex items-center">
          <AlertCircle class="h-5 w-5 mr-2 text-destructive" />
          Login link expired
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>This login link has expired or is invalid.</p>
        <p class="text-sm text-muted-foreground mt-2">
          Login links expire after 15 minutes for security. Please request a new one.
        </p>
      </CardContent>
      <CardFooter class="flex justify-end">
        <Button @click="goToLogin">Request new link</Button>
      </CardFooter>
    </Card>

    <!-- Success state (brief, before redirect) -->
    <Card v-else class="max-w-[500px] min-w-[300px]">
      <CardHeader>
        <CardTitle class="flex items-center">
          <CheckCircle class="h-5 w-5 mr-2 text-green-600" />
          Success!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>You're now logged in. Redirecting...</p>
      </CardContent>
    </Card>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

defineOptions({
  name: 'MagicToken'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const isLoading = ref(true);
const hasError = ref(false);

const loginWithMagicToken = (token) => store.dispatch('user/loginWithMagicToken', token);

const goToLogin = () => {
  router.push({ name: 'Login' });
};

onMounted(async () => {
  try {
    await loginWithMagicToken(route.params.token);
    isLoading.value = false;
    
    // Get the user's name for the welcome message
    const userName = store.getters['user/userName'];
    store.commit('snackbar', `Welcome back, ${userName}!`);
    
    // Brief delay to show success state, then redirect
    setTimeout(() => {
      // Check for redirect query param
      const redirectPath = route.query.redirect || '/';
      router.push(redirectPath);
    }, 500);
  } catch (e) {
    console.error('Magic link login failed:', e);
    isLoading.value = false;
    hasError.value = true;
  }
});
</script>