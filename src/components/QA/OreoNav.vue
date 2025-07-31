<template>
  <v-navigation-drawer permanent width="80">
    <v-list class="mt-10">
      <v-list-item 
        v-for="section in sections" 
        :key="section.title" 
        exact
        exact-path
        :class="['nav-item', 'text-center', 'px-0', {'bg-grey-lighten-3': isActive(section)}]"
      >
        <RouterLink :to="section.to" class="d-flex flex-column align-center text-decoration-none w-100 h-100 py-1">
          <div>
            <v-icon size="large" class="mb-1" color="blue-lighten-2" :icon="section.icon" />
            <v-list-item-title class="text-grey-darken-2" style="font-size: 11px !important;">{{ section.title }}</v-list-item-title>
          </div>
        </RouterLink>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useRoute } from 'vue-router'

defineOptions({
  name: 'OreoNav'
});

const route = useRoute()

const sections = [
  { title: 'Works', to: '/oreo?mode=works', icon: "mdi-file-document-multiple-outline", mode: 'works' },
  { title: 'Metrics', to: '/oreo?mode=metrics', icon: "mdi-poll", mode: 'metrics' },
  { title: 'Coverage', to: '/oreo?mode=coverage', icon: "mdi-chart-donut", mode: 'coverage' },
  { title: 'Xpac', to: '/oreo/xpac?source=xpac', icon: "mdi-file-document-plus-outline", source: 'xpac' },
  { title: 'Prod Only', to: '/oreo/xpac?source=prod-only', icon: "mdi-file-question-outline", source: 'prod-only' },

]

function isActive(section) {
  if (route.path === '/oreo' && section.mode) {
    if (section.mode === 'works' && !route.query.mode) { return true }
    return route.query.mode === section.mode
  }
  if (route.path === '/oreo/xpac') {
    if (section.source === 'xpac' && (!route.query.source || route.query.source === 'xpac')) { return true }
    if (section.source === 'prod-only' && route.query.source === 'prod-only') { return true }
  }
  return false
}
</script>

<style scoped>
.nav-item:hover {
  background-color: #F5F5F5;
}
</style>
