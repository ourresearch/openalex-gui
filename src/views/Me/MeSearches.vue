<template>
  <div class="saved-searches-page" style="min-height: 50vh;">
    
    <div class="text-h4 ml-1 mr-4 mb-2">Saved Searches</div>

    <v-card rounded flat class="px-2 pb-4">
      <v-simple-table v-if="userSavedSearches.length">
        <thead>
        <tr>
          <th>Name</th>
          <th>Last updated</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(savedSearch, i) in userSavedSearches"
            :key="savedSearch.id"
            @click="openSavedSearch(savedSearch.id)"
            class="saved-search-row"
        >
          <td>
            <v-icon left>mdi-folder-outline</v-icon>
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
            <v-menu offset-y>
              <template v-slot:activator="{on}">
                <v-btn icon v-on="on">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <saved-search-menu :id="savedSearch.id"/>

              <!--            <v-list>-->
              <!--              <v-list-item @click="openRenameDialog(savedSearch.id)">-->
              <!--                <v-list-item-icon>-->
              <!--                  <v-icon>mdi-pencil-outline</v-icon>-->
              <!--                </v-list-item-icon>-->
              <!--                <v-list-item-title>Rename</v-list-item-title>-->
              <!--              </v-list-item>-->
              <!--              <v-list-item @click="deleteSavedSearch(savedSearch.id)">-->
              <!--                <v-list-item-icon>-->
              <!--                  <v-icon>mdi-delete-outline</v-icon>-->
              <!--                </v-list-item-icon>-->
              <!--                <v-list-item-title>Delete</v-list-item-title>-->
              <!--              </v-list-item>-->
              <!--              <v-list-item @click="openAsCopy(savedSearch.id)">-->
              <!--                <v-list-item-icon>-->
              <!--                  <v-icon>mdi-folder-multiple-outline</v-icon>-->
              <!--                </v-list-item-icon>-->
              <!--                <v-list-item-title>Open as copy</v-list-item-title>-->
              <!--              </v-list-item>-->
              <!--            </v-list>-->
            </v-menu>
          </td>

        </tr>
        </tbody>
      </v-simple-table>
      <div  class="color-3 d-flex my-12 mx-4 pa-12" v-else>
        <div class="grey--text">
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
              filled
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              placeholder="New name"
              v-model="renameString"
          />
        </div>
        <v-card-actions>
          <v-spacer/>
          <v-btn text rounded @click="isDialogOpen.rename = false">Cancel</v-btn>
          <v-btn text rounded color="primary" @click="rename(searchIdToRename, renameString)">Rename</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {VueTyper} from 'vue-typer'
import {isToday} from "@/util";
import {url} from "@/url";
import UserSavedSearch from "@/components/user/UserSavedSearch.vue";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

export default {
  name: 'SavedSearches',
  components: {
    UserSavedSearch,
    VueTyper,
    SavedSearchMenu,
  },
  metaInfo: {
    title: "OpenAlex: The open catalog to the global research system",
    titleTemplate: undefined, // have to override this or it'll get the site title template
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
      "createSerpTab",
      "selectSerpTab",
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
  mounted() {
  },
  watch: {
    "isDialogOpen.rename"(to) {

    }
  }
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
