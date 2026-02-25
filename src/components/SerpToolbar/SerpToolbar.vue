<template>
  <v-toolbar density="compact" flat class="mb-0 mt-0" color="transparent" style="min-height: 36px;">

    <v-spacer/>

    <serp-toolbar-menu
      @save="clickSave"
      @toggle-alert="toggleAlert"
      style="margin-right: -22px;"
    />

  </v-toolbar>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

import SerpToolbarMenu from '@/components/SerpToolbar/SerpToolbarMenu.vue';

defineOptions({ name: 'SerpToolbar', });

defineProps({
  resultsObject: Object,
});

const store = useStore();
const route = useRoute();
const saveSearchDialogHasAlert = ref(false);
const isDialogOpen = reactive({
  saveSearch: false,
});

const setEditAlertId = (id) => store.commit('user/setEditAlertId', id);
const updateSearchUrl = (payload) => store.dispatch('user/updateSearchUrl', payload);

function clickSave() {
  if (route.query.id) {
    saveThisSearch();
  } else {
    openSaveDialog(false);
  }
}

async function saveThisSearch() {
  await updateSearchUrl({
    id: route.query.id,
    search_url: 'https://openalex.org/' + route.fullPath,
  });
}

function openSaveDialog(hasAlert) {
  console.log('SerpToolbar openSaveDialog', hasAlert);
  saveSearchDialogHasAlert.value = hasAlert;
  isDialogOpen.saveSearch = true;
}

function toggleAlert() {
  if (route.query.id) {
    setEditAlertId(route.query.id);
  } else {
    openSaveDialog(true);
  }
}
</script>

<style scoped lang="scss">
$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.logo-link {
  padding: 10px 5px 10px 10px;

  img {
    height: 50px;
    //margin: 10px 20px;
  }
}

.tab {
  background-color: transparent !important;

  &.selected {
    background-color: white !important;
  }
}

</style>