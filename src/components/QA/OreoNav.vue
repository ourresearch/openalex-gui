<template>
  <v-navigation-drawer permanent width="90">
    <v-list class="mt-10">
      <v-list-item 
        v-for="section in sections" 
        :key="section.title" 
        exact
        exact-path
        :class="['text-center', { 'bg-grey-lighten-2': isActive(section) }]"
      >
        <RouterLink :to="section.to" class="d-flex flex-column align-center text-decoration-none w-100 h-100 pa-2">
          <v-icon size="x-large" color="blue" class="mb-2" :icon="section.icon" />
          <v-list-item-title class="text-caption text-grey-darken-2">{{ section.title }}</v-list-item-title>
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
  { title: 'Xpac', to: '/oreo/xpac', icon: "mdi-file-document-plus-outline" },
]

function isActive(section) {
  if (route.path === '/oreo' && section.mode) {
    return route.query.mode === section.mode
  }
  if (section.to === '/oreo/xpac') {
    return route.path === '/oreo/xpac'
  }
  return false
}
</script>