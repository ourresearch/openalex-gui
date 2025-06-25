<template>
  <div>
    <div class="text-h4">About Me</div>
    <v-card rounded border class="my-4">
      <v-list color="transparent">
        <v-list-item>
          <v-icon>mdi-account</v-icon>
          <v-list-item-title>{{ userName }}</v-list-item-title>
          <v-list-item-subtitle>Name</v-list-item-subtitle>

        </v-list-item>
        <v-list-item>
            <v-icon>mdi-email</v-icon>
            <v-list-item-title>{{ userEmail }}</v-list-item-title>
            <v-list-item-subtitle>Email</v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <div style="padding: 15px">
        <v-btn @click="logout">Log out</v-btn>
      </div>
    </v-card>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'MeAbout' });

const store = useStore();

// Vuex getters
const userName = computed(() => store.getters['user/userName']);
const userEmail = computed(() => store.getters['user/userEmail']);

// Vuex mutation
const logout = () => store.commit('user/logout');
</script>