<template>
  <v-container class="d-flex justify-center fill-height">
    <v-card loading max-width="600" min-width="300" flat rounded class="">
      <v-card-title>
        Logging you in...
      </v-card-title>
      <v-card-text>
        <div>user id: {{ userId }}</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>


<script setup>
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

defineOptions({
  name: 'MagicToken'
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const userId = computed(() => store.getters['userId'] || store.getters['user/userId']);

const loginWithMagicToken = (token) => store.dispatch('user/loginWithMagicToken', token);

onMounted(async () => {
  await loginWithMagicToken(route.params.token);
  router.push('/');
});
</script>