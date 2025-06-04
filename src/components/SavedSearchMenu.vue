<template>
  <v-list>

    <template v-if="$route.name === 'Serp'">

      <v-list-item @click="newSearch">
        <v-list-item-icon>
          <v-icon>mdi-plus</v-icon>
        </v-list-item-icon>
        
          <v-list-item-title>
            New
          </v-list-item-title>
        
      </v-list-item>

      <v-menu offset-x open-on-hover>
        <template v-slot:activator="{props}">
          <v-list-item @click="placeholder" v-bind="props" :disabled="!userId">
            <v-list-item-icon>
              <v-icon :disabled="!userId">mdi-folder-open-outline</v-icon>
            </v-list-item-icon>
            
              <v-list-item-title>
                Open
              </v-list-item-title>
            
            <v-list-item-action class="pt-2">
              <v-icon :disabled="!userId">mdi-menu-right</v-icon>
            </v-list-item-action>
          </v-list-item>
        </template>
        <v-list>
          <v-list-item
              v-for="search in searchesToOpen"
              :key="search.id"
              @click="openSearch(search.id)"
          >
            <v-list-item-icon>
              <v-icon>mdi-folder-outline</v-icon>
            </v-list-item-icon>
            
              <v-list-item-title>{{ search.name }}</v-list-item-title>
            
          </v-list-item>
          <v-divider/>
          <v-list-item
              key="view-em-all"
              to="/me/searches"
          >
            <v-list-item-icon>
              <v-icon>mdi-folder-multiple-outline</v-icon>
            </v-list-item-icon>
            
              <v-list-item-title>View all</v-list-item-title>
            
          </v-list-item>
        </v-list>
      </v-menu>


      <v-list-item :disabled="!id" @click="createSearchFromTemplate(id)">
        <v-list-item-icon>
          <v-icon :disabled="!id">mdi-folder-multiple-outline</v-icon>
        </v-list-item-icon>
        
          <v-list-item-title>
            Make a copy
          </v-list-item-title>
        
      </v-list-item>

      <v-divider/>

    </template>

    <v-list-item v-if="$route.name === 'Serp'" @click="$emit('save')">
      <v-list-item-icon>
        <v-icon>mdi-content-save-outline</v-icon>
      </v-list-item-icon>
      
        <v-list-item-title>
          Save {{ id ? "" : "As..." }}
        </v-list-item-title>
      
    </v-list-item>


    <v-list-item :disabled="!id" @click="setRenameId(id)">
      <v-list-item-icon>
        <v-icon :disabled="!id">mdi-pencil-outline</v-icon>
      </v-list-item-icon>
      
        <v-list-item-title>
          Rename
        </v-list-item-title>
      
    </v-list-item>
    <v-list-item :disabled="!id" @click="deleteSavedSearch(id)">
      <v-list-item-icon>
        <v-icon :disabled="!id">mdi-delete-outline</v-icon>
      </v-list-item-icon>
      
        <v-list-item-title>
          Delete
        </v-list-item-title>
      
    </v-list-item>


    <v-divider/>
    <v-list-item :disabled="!id" @click="$emit('toggle-alert')">
      <v-list-item-icon>
        <v-icon :disabled="!id">{{ activeSearchHasAlert ? "mdi-bell-minus" : "mdi-bell-plus-outline" }}</v-icon>
      </v-list-item-icon>
      
        <v-list-item-title>
          {{ activeSearchHasAlert ? "Remove" : "Create" }} alert
        </v-list-item-title>
      
    </v-list-item>
  </v-list>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";


export default {
  name: "Template",
  components: {},
  props: {
    id: String,
  },
  data() {
    return {
      foo: 42,
      isDialogOpen: {
        save: false,
        rename: false,
        alert: false,
      }
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
      "activeSearchHasAlert",
    ]),
    mySearchObj() {
      return this.userSavedSearches.find(s => s.id === this.id)
    },
    myName() {
      const myUrl = new URL(this.mySearchObj?.search_url)
      const name = myUrl.searchParams.get("name") ?? "Unsaved search"
      return name
    },
    myQuery() {
      const myUrl = this.mySearchObj?.search_url
      return Object.fromEntries(new URL(myUrl).searchParams)
    },
    searchesToOpen() {
      return this.userSavedSearches
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setRenameId",
      "setEditAlertId",
      "setActiveSearchId",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "deleteSavedSearch",
      "createSearchFromTemplate",
      "openSavedSearch",
    ]),
    newSearch() {
      url.pushToRoute(this.$router, {name: "Serp"})
      // this.snackbar("New search created.")
    },
    openSearch(id) {
      this.openSavedSearch(id)
      this.$emit("close")
      this.snackbar("Search opened.")
    },
    placeholder() {

    },


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>