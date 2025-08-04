<template>
  <v-navigation-drawer permanent floating width="90">
    <v-list class="mt-0 pa-0">
      <v-list-item 
        v-for="section in sections" 
        :key="section.title" 
        exact
        exact-path
        :class="['nav-item', 'text-center', 'px-0', 'py-0', {'active': isActive(section)}]"
      >
        <RouterLink :to="section.to" class="d-flex flex-column align-center text-decoration-none w-100 h-100 py-1">
          <div :class="['icon-box', 'rounded-pill', 'py-1', 'px-4', 'mb-1', {'bg-blue-lighten-4': isActive(section)}]">
            <v-icon size="default" class="mb-0" :color="isActive(section) ? 'grey-darken-3' : 'grey-darken-2'" :icon="section.icon" />
          </div>
          <div class="nav-item-label text-grey-darken-2 font-weight-medium" style="font-size: 12px !important;">{{ section.title }}</div>
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

const route = useRoute();

const sections = [
  { title: 'Works', to: '/oreo?mode=works', icon: "mdi-file-document-multiple-outline", mode: 'works' },
  { title: 'Summary', to: '/oreo?mode=summary', icon: "mdi-poll", mode: 'summary' },
  { title: 'Coverage', to: '/oreo?mode=coverage', icon: "mdi-chart-donut", mode: 'coverage' },
  { title: 'Xpac', to: '/oreo/xpac?source=xpac', icon: "mdi-file-document-plus-outline", source: 'xpac' },
  { title: 'Prod Only', to: '/oreo/xpac?source=prod-only', icon: "mdi-factory", source: 'prod-only' },
];

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
.nav-item:hover .icon-box {
  background-color: #eee;
}
.nav-item:hover .v-icon {
}
.nav-item.active .nav-item-label {
  font-weight: bold !important;
}
</style>
