<template>
  <v-card border rounded :loading="isLoading" :disabled="isLoading">
    <v-card-title class="d-flex align-center">
      <div>
        <v-icon variant="plain" start>mdi-account</v-icon>
        Forgot Your Password
      </div>
      <v-spacer/>
      <v-btn icon variant="plain" @click="setIsLoginDialogOpen(false)">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>

    <template v-if="!isSubmitted">
      <v-card-text class="error-message" v-if="showPasswordResetErrorMessage">
        Your password reset link is expired or invalid. Please request a new link.
      </v-card-text>
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
            hide-details
            autofocus
            placeholder="Your email"
          >
          </v-text-field>
        </form>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
        <v-btn
          :disabled="isFormDisabled"
          rounded
          color="primary"
          variant="flat"
          @click="submit"
        >
          Send Reset Link
        </v-btn>
      </v-card-actions>
    </template>
    <div class="submit-message" v-else>
      A link to reset your password has been sent to <b>{{ email }}</b>.
    </div>
  </v-card>
</template>


<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';

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