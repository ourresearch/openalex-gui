<template>
  <v-list>
    <template v-if="$route.name === 'Serp'">

      <v-list-item @click="newSearch">
        <template #prepend>
          <v-icon>mdi-plus</v-icon>
        </template>
        <v-list-item-title>
          New
        </v-list-item-title>
      </v-list-item>

      <v-menu location="right" open-on-hover>
        <template v-slot:activator="{props}">
          <v-list-item v-bind="props" :disabled="!userId" @click.stop>
            <template #prepend>
              <v-icon :disabled="!userId">mdi-folder-open-outline</v-icon>
            </template>

            <v-list-item-title>
              Open
            </v-list-item-title>
            
            <template #append>
              <v-icon :disabled="!userId">mdi-menu-right</v-icon>
            </template>
          </v-list-item>
        </template>

        <!-- Submenu of Saved Searches-->
        <v-list>
          <v-list-item
            v-for="search in searchesToOpen"
            :key="search.id"
            @click="openSearch(search.id)"
          >
            <template #prepend>
              <v-icon>mdi-folder-outline</v-icon>
            </template>
            <v-list-item-title>{{ search.name }}</v-list-item-title>
          </v-list-item>

          <v-divider/>
          
          <v-list-item
            key="view-em-all"
            to="/me/searches"
          >
            <template #prepend>
              <v-icon>mdi-folder-multiple-outline</v-icon>
            </template>
            <v-list-item-title>View all</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-list-item :disabled="!id" @click="createSearchFromTemplate(id)" @click.stop>
        <template #prepend>
          <v-icon :disabled="!id">mdi-folder-multiple-outline</v-icon>
        </template>
        <v-list-item-title>
          Make a copy
        </v-list-item-title>
      </v-list-item>

      <v-divider/>

    </template>

    <v-list-item v-if="$route.name === 'Serp'" @click="$emit('save')">
      <template #prepend>
        <v-icon>mdi-content-save-outline</v-icon>
      </template>
      <v-list-item-title>
        Save {{ id ? "" : "As..." }}
      </v-list-item-title>
      
    </v-list-item>

    <v-list-item :disabled="!id" @click="setRenameId(id)">
      <template #prepend>
        <v-icon :disabled="!id">mdi-pencil-outline</v-icon>
      </template>
      <v-list-item-title>
        Rename
      </v-list-item-title>
    </v-list-item>

    <v-list-item :disabled="!id" @click="deleteSavedSearch(id)">
      <template #prepend>
        <v-icon :disabled="!id">mdi-delete-outline</v-icon>
      </template>
      <v-list-item-title>
        Delete
      </v-list-item-title>
    </v-list-item>

    <v-divider/>

    <v-list-item :disabled="!id" @click="$emit('toggle-alert')">
      <template #prepend>
        <v-icon :disabled="!id">{{ activeSearchObj?.has_alert ? "mdi-bell-minus" : "mdi-bell-plus-outline" }}</v-icon>
      </template>
      <v-list-item-title>
        {{ activeSearchObj?.has_alert ? "Remove" : "Create" }} alert
      </v-list-item-title>
    </v-list-item>

  </v-list>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { url } from '@/url';

defineOptions({ name: 'SavedSearchMenu' });

defineProps({
  id: String,
});

const emit = defineEmits(['close']);

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);

const searchesToOpen = computed(() => userSavedSearches.value);

// Vuex mutations
const snackbar = (msg) => store.commit('snackbar', msg);
const setRenameId = (id) => store.commit('user/setRenameId', id);

// Vuex actions
const deleteSavedSearch = (id) => store.dispatch('user/deleteSavedSearch', id);
const createSearchFromTemplate = (query) => store.dispatch('user/createSearchFromTemplate', query);
const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);

// Methods
function newSearch() {
  url.pushToRoute(router, { name: 'Serp' });
  // snackbar('New search created.');
}

function openSearch(id) {
  openSavedSearch(id);
  emit('close');
  snackbar('Search opened.');
}
</script>