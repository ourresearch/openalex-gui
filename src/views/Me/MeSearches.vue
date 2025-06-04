<template>
  <div class="saved-searches-page" style="min-height: 50vh;">
    
    <div class="text-h4 ml-1 mr-4 mb-2">Saved Searches</div>

    <v-card rounded flat class="px-2 pb-4">
      <v-table v-if="userSavedSearches.length">
        <thead>
        <tr>
          <th>Name</th>
          <th>Last updated</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="savedSearch in userSavedSearches"
            :key="savedSearch.id"
            @click="openSavedSearch(savedSearch.id)"
            class="saved-search-row"
        >
          <td>
            <v-icon start>mdi-folder-outline</v-icon>
            {{ savedSearch.name }}
          </td>
          <td>
            {{ formatDate(savedSearch.updated) }}
            <!--          {{ (savedSearch.updated) }} -->
          </td>
          <td class="d-flex align-center">
            <v-spacer></v-spacer>
            <v-btn icon @click.stop="setEditAlertId(savedSearch.id)">
              <v-icon>{{ savedSearch.has_alert ? "mdi-bell" : "mdi-bell-outline" }}</v-icon>
            </v-btn>
            <v-menu location="bottom">
              <template v-slot:activator="{props}">
                <v-btn icon v-bind="props">
                  <v-icon>mdi-dots-vertical</v-icon>
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
          <v-btn variant="text" rounded color="primary" @click="rename(searchIdToRename, renameString)">Rename</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import { useHead } from '@unhead/vue';

import {url} from "@/url";
import {isToday} from "@/util";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

export default {
  name: 'SavedSearches',
  components: {
    SavedSearchMenu,
  },
  created() {
    useHead({
      title: 'Saved Searches',
    });
  },
  data() {
    return {
      renameString: "",
      isDialogOpen: {
        rename: false,
      },
      searchIdToRename: null,
    }
  },
  computed: {
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
    ]),
  },
  methods: {
    ...mapActions("user", [
      "deleteSavedSearch",
      "openSavedSearch",
    ]),
    ...mapMutations("user", [
      "setEditAlertId",
    ]),
    openRenameDialog(id) {
      this.renameString = this.nameFromId(id)
      this.searchIdToRename = id
      this.isDialogOpen.rename = true
    },
    rename(id, newName) {
      console.log("rename search", id, newName)
      this.isDialogOpen.rename = false
      this.searchIdToRename = null
    },
    openAsCopy(id) {
      const baseSearchName = this.nameFromId(id)
      const newName = baseSearchName + " copy"

      const query = {
        ...this.queryFromId(id),
        id: undefined,
        name: newName,
      }
      url.pushToRoute(this.$router, {
        name: "Serp",
        params: {entityType: "works"},
        query,
      })
    },
    queryFromId(id) {
      const myUrl = this.urlFromId(id)
      return Object.fromEntries(new URL(myUrl).searchParams)
    },
    urlFromId(id) {
      return this.userSavedSearches.find(s => s.id === id)?.search_url
    },
    nameFromId(id) {
      const myUrl = this.urlFromId(id)
      return this.nameFromUrl(myUrl)
    },
    nameFromUrl(urlArg) {
      const myUrl = new URL(urlArg)
      const name = myUrl.searchParams.get("name") ?? "Unsaved search"
      return name
    },
    formatDate(dateString) {
      const dateOptions = {
        month: "short",
        // weekday: "short",
        day: "numeric"
      }
      const timeOptions = {
        timeStyle: "short",
      }

      const updatedDate = new Date(dateString + "+0000") // server gives us UTC

      return (isToday(updatedDate)) ?
          updatedDate.toLocaleTimeString(undefined, timeOptions) :
          updatedDate.toLocaleDateString(undefined, dateOptions)
    }
  },
}
</script>

<style lang="scss" >
.saved-searches-page {
  .saved-search-row {
    cursor: pointer;
  }
  table {
    border-top: none !important;
  }
}
</style>
