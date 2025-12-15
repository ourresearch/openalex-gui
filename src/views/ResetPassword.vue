<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <Card v-if="!isSubmitted" class="w-[500px]">
      <CardHeader>
        <CardTitle class="text-xl">Reset Your Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form>
          <div class="relative">
            <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="password"
              id="password"
              type="password"
              v-model="password"
              autofocus
              placeholder="New Password"
              class="pl-10"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter class="flex justify-end">
        <Button
          :disabled="password.length < 5"
          @click="submit"
        >
          Reset Password
        </Button>
      </CardFooter>
    </Card>

    <Card v-else-if="isSubmitted">
      <CardContent class="text-lg py-6">
        Your password has been reset.
      </CardContent>
      <CardFooter class="flex justify-center">
        <Button @click="setIsLoginDialogOpen(true)">
          Log in
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { Lock } from 'lucide-vue-next';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

defineOptions({ name: 'ResetPassword' });

useHead({ title: 'Reset Password' });

const store = useStore();
const route = useRoute();

const token = ref(null);
const password = ref('');
const isSubmitted = ref(false);

const resetPassword = (payload) => store.dispatch('user/resetPassword', payload);
const setShowPasswordResetErrorMessage = (val) => store.commit('user/setShowPasswordResetErrorMessage', val);
const setIsLoginDialogOpen = (val) => store.commit('user/setIsLoginDialogOpen', val);

// Methods
const submit = async () => {
  console.log('user.store resetPassword submit');
  try {
    await resetPassword({ password: password.value, token: token.value });
    isSubmitted.value = true;
  } catch (e) {
    console.log('user.store resetPassword error', e);
    setShowPasswordResetErrorMessage(true);
    setIsLoginDialogOpen(true);
  }
};

// Lifecycle
onMounted(() => {
  token.value = route.query.token || null;
});

onBeforeUnmount(() => {
  setShowPasswordResetErrorMessage(false);
});
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>