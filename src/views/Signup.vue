<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'SignupPage' });

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({ title: 'Sign up' });

const userId = computed(() => store.getters['user/userId']);
const setIsSignupDialogOpen = (val) => store.commit('user/setIsSignupDialogOpen', val);

// On Created
setIsSignupDialogOpen(true);

onMounted(() => {
  if (userId.value) {
    router.push(route.query.redirect || '/');
  }
});

onBeforeUnmount(() => {
  setIsSignupDialogOpen(false);
});
</script>

<style scoped lang="scss">

.v-list .v-list-item--active {
  color: #1976d2; // primary
}

</style>