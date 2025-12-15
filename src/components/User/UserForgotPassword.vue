<template>
  <Card class="border">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="flex items-center">
        <User class="h-5 w-5 mr-2" />
        Forgot Your Password
      </CardTitle>
      <Button variant="ghost" size="icon" @click="setIsLoginDialogOpen(false)">
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <template v-if="!isSubmitted">
      <CardContent>
        <p v-if="showPasswordResetErrorMessage" class="text-destructive mb-4">
          Your password reset link is expired or invalid. Please request a new link.
        </p>
        <form>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="email"
              id="email"
              type="email"
              v-model="email"
              autofocus
              placeholder="Your email"
              class="pl-10"
            />
          </div>
        </form>
      </CardContent>

      <CardFooter class="flex justify-end">
        <Button :disabled="isFormDisabled || isLoading" @click="submit">
          <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
          Send Reset Link
        </Button>
      </CardFooter>
    </template>
    <CardContent v-else class="text-center py-5 text-muted-foreground">
      A link to reset your password has been sent to <b>{{ email }}</b>.
    </CardContent>
  </Card>
</template>


<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

import { User, X, Mail, Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

defineOptions({ name: 'UserForgotPassword' });

const store = useStore();

const email = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);

const showPasswordResetErrorMessage = computed(() => store.getters['user/showPasswordResetErrorMessage']);

const isFormDisabled = computed(() => {
  const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
  const isValid = emailRegex.test(email.value);
  return isLoading.value || !isValid;
});

const submit = async () => {
  if (isFormDisabled.value) return false;
  isLoading.value = true;
  try {
    await store.dispatch('user/requestPasswordReset', email.value);
    isSubmitted.value = true;
  } catch (e) {
    console.log(e); // Silently catch for security reasons
  } finally {
    isLoading.value = false;
  }
};
</script>


<style scoped lang="scss">
.submit-message {
  font-size: 16px;
  padding: 20px;
  color: #555;
  text-align: center;
}
.error-message {
  margin-bottom: -10px;
  font-size: 16px;
  padding: 0px 55px 10px;
}
</style>