<template>
  <div class="color-2 py-8">
    <v-container>
      <v-row>
        <v-col cols="12" md="3">
          <v-card flat class="bg-transparent">
            <v-list nav density="comfortable" class="bg-transparent">
              <v-list-item
                v-for="item in navItems"
                :key="item.route"
                :to="item.route"
                :prepend-icon="item.icon"
                :title="item.title"
                rounded="lg"
                class="mb-1"
              />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="9">
          <router-view />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({
  name: 'MeBase'
});

const store = useStore();
const userName = computed(() => store.state.user.name || 'Settings');

const navItems = [
  { title: 'Profile', route: '/me/profile', icon: 'mdi-account-outline' },
  { title: 'API', route: '/me/api', icon: 'mdi-code-braces' },
  { title: 'Saved searches', route: '/me/searches', icon: 'mdi-folder-outline' },
  { title: 'Exports', route: '/me/exports', icon: 'mdi-download-outline' },
  { title: 'Edits', route: '/me/edits', icon: 'mdi-pencil-outline' },
  { title: 'Tags', route: '/me/tags', icon: 'mdi-tag-outline' },
];
</script>


<style lang="scss" scoped>
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>