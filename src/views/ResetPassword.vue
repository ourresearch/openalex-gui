<template>
  <v-container class="fill-height justify-center">
    <v-card flat rounded v-if="!isSubmitted" style="width: 500px;">
      <v-card-title class="text-h5">
        Reset Your Password
      </v-card-title>
      <v-card-text>
        <form>
          <v-text-field
            variant="solo-filled"
            flat
            rounded
            class="mt-0"
            name="password"
            id="password"
            type="password"
            prepend-icon="mdi-lock-outline"
            v-model="password"
            autofocus
            placeholder="New Password"
          >
          </v-text-field>
        </form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          :disabled="password.length < 5"
          rounded
          color="primary"
          variant="flat"
          class="reset-btn"
          @click="submit"
        >
          Reset Password
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card flat rounded v-else-if="isSubmitted">
      <v-card-text class="text-h6">
        Your password has been reset.
      </v-card-text>
      <v-card-actions class="d-flex justify-center">
        <v-btn
          rounded
          color="primary"
          variant="flat"
          @click="setIsLoginDialogOpen(true)"
        >
          Log in
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

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


<style scoped lang="scss">
.v-btn.reset-btn {
  margin-top: -45px;
  margin-right: 10px;
}
</style>