<template>
  <div class="py-8">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-12 md:col-span-3">
          <div class="bg-transparent">
            <div class="text-xl font-semibold mb-4">Account</div>
            <nav class="space-y-1">
              <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">About You</div>
              <router-link
                v-for="item in aboutYouItems"
                :key="item.route"
                :to="item.route"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
              >
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.title }}
              </router-link>
              
              <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 mt-4">Your Stuff</div>
              <router-link
                v-for="item in yourStuffItems"
                :key="item.route"
                :to="item.route"
                class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                :class="{ 'bg-primary/10 text-primary': $route.path === item.route }"
              >
                <component :is="item.icon" class="h-4 w-4" />
                {{ item.title }}
              </router-link>
            </nav>
          </div>
        </div>
        <div class="col-span-12 md:col-span-9">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import { User, Building2, CreditCard, Code, FolderOpen, Download, Pencil, Tag } from 'lucide-vue-next';

defineOptions({
  name: 'MeBase'
});

const store = useStore();
const $route = useRoute();
const userName = computed(() => store.state.user.name || 'Settings');

const aboutYouItems = [
  { title: 'About', route: '/me/about', icon: User },
  { title: 'Organization', route: '/me/organization', icon: Building2 },
  { title: 'Plan', route: '/me/plan', icon: CreditCard },
  { title: 'API', route: '/me/api', icon: Code },
];

const yourStuffItems = [
  { title: 'Saved searches', route: '/me/searches', icon: FolderOpen },
  { title: 'Exports', route: '/me/exports', icon: Download },
  { title: 'Edits', route: '/me/edits', icon: Pencil },
  { title: 'Tags', route: '/me/tags', icon: Tag },
];
</script>


<style scoped>
/* Styles handled via Tailwind classes */
</style>