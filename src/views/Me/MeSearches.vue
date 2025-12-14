<template>
  <div class="saved-searches-page" style="min-height: 50vh;">
    <!-- Page title -->
    <h1 class="text-h5 font-weight-bold mb-4">Saved Searches</h1>

    <!-- Controls row: Search -->
    <div v-if="userSavedSearches.length" class="d-flex align-center ga-3 mb-4">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        placeholder="Search saved searches"
        hide-details
        class="search-field"
        @keydown.escape="clearSearch"
      >
        <template #prepend-inner>
          <v-icon size="small" color="grey">mdi-magnify</v-icon>
        </template>
        <template v-if="searchQuery" #append-inner>
          <v-btn
            icon
            variant="text"
            size="x-small"
            @click="clearSearch"
          >
            <v-icon size="small">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-text-field>
      <v-spacer />
    </div>

    <v-card flat class="rounded-o px-2 pb-4">
      <v-table v-if="filteredSearches.length">
        <thead>
        <tr>
          <th>Name</th>
          <th>Last updated</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr
          v-for="savedSearch in filteredSearches"
          :key="savedSearch.id"
          @click="openSavedSearch(savedSearch.id)"
          class="saved-search-row"
        >
          <td>
            <v-icon color="grey" start>mdi-folder-outline</v-icon>
            {{ savedSearch.name }}
          </td>
          <td>
            {{ formatDate(savedSearch.updated) }}
          </td>
          <td class="d-flex align-center">
            <v-spacer></v-spacer>
            <v-btn icon variant="plain" @click.stop="setEditAlertId(savedSearch.id)">
              <v-icon>{{ savedSearch.has_alert ? "mdi-bell" : "mdi-bell-outline" }}</v-icon>
            </v-btn>
            <v-menu location="bottom">
              <template v-slot:activator="{props}">
                <v-btn icon variant="plain" v-bind="props">
                  <v-icon >mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <saved-search-menu :id="savedSearch.id"/>
            </v-menu>
          </td>

        </tr>
        </tbody>
      </v-table>
      <div  class="color-3 d-flex my-12 mx-4 pa-12" v-else>
        <div class="text-grey">
          You have no saved searches.
        </div>
      </div>
    </v-card>
      
    <v-dialog v-model="isDialogOpen.rename" max-width="600">
      <v-card flat rounded>
        <v-card-title>Rename saved search</v-card-title>
        <div class="pa-4">
          <v-text-field
            autofocus
            rounded
            variant="filled"
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            placeholder="New name"
            v-model="renameString"
          />
        </div>
        <v-card-actions>
          <v-spacer/>
          <v-btn variant="text" rounded @click="isDialogOpen.rename = false">Cancel</v-btn>
          <v-btn variant="flat" rounded color="primary" @click="rename(searchIdToRename, renameString)">Rename</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';

import { isToday } from '@/util';

import SavedSearchMenu from '@/components/SavedSearch/SavedSearchMenu.vue';

defineOptions({ name: 'SavedSearches' });

useHead({ title: 'Saved Searches' });

const store = useStore();

const renameString = ref('');
const searchQuery = ref('');
const isDialogOpen = reactive({
  rename: false,
});
const searchIdToRename = ref(null);

const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);

const filteredSearches = computed(() => {
  if (!searchQuery.value.trim()) return userSavedSearches.value;
  const q = searchQuery.value.toLowerCase().trim();
  return userSavedSearches.value.filter(s => 
    s.name?.toLowerCase().includes(q)
  );
});

function clearSearch() {
  searchQuery.value = '';
}

const openSavedSearch = (id) => store.dispatch('user/openSavedSearch', id);
const setEditAlertId = (id) => store.commit('user/setEditAlertId', id);

// Methods
const rename = (id, newName) => {
  console.log('rename search', id, newName);
  isDialogOpen.rename = false;
  searchIdToRename.value = null;
};

const formatDate = (dateString) => {
  const dateOptions = {
    month: 'short',
    day: 'numeric',
  };
  const timeOptions = {
    timeStyle: 'short',
  };

  const updatedDate = new Date(dateString + '+0000'); // server gives us UTC

  return isToday(updatedDate)
    ? updatedDate.toLocaleTimeString(undefined, timeOptions)
    : updatedDate.toLocaleDateString(undefined, dateOptions);
};
</script>


<style lang="scss" >
.saved-searches-page {
  .search-field {
    max-width: 320px;
  }
  
  .saved-search-row {
    cursor: pointer;
  }
  table {
    border-top: none !important;
  }
}
</style>
