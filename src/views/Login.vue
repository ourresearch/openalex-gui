<template>
  <v-container class="fill-height justify-center">
  </v-container>
</template>


<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'LoginPage'
});

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({ title: 'Log in to OpenAlex' });

const setIsLoginDialogOpen = (val) => store.commit('user/setIsLoginDialogOpen', val);

console.log('Login setting both flags');
setIsLoginDialogOpen(true);

onMounted(() => {
  const userId = store.getters['user/userId'];
  if (userId) {
    console.log('Login redirecting to', route.query.redirect);
    router.push(route.query.redirect || '/');
  }
});

onBeforeUnmount(() => {
  setIsLoginDialogOpen(false);
});
</script>


<style scoped lang="scss">
.v-list .v-list-item--active {
  color: #1976d2; // primary
}
</style>