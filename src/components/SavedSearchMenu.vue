<template>
  <v-list>

    <template v-if="$route.name === 'Serp'">

      <v-list-item @click="newSearch">
        <v-list-item-icon>
          <v-icon>mdi-plus</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            New
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <!--          <v-list-item disabled v-if="id" @click="$emit('save')" >-->
      <!--            <v-list-item-icon>-->
      <!--              <v-icon>mdi-content-save-outline</v-icon>-->
      <!--            </v-list-item-icon>-->
      <!--            <v-list-item-content>-->
      <!--              <v-list-item-title>-->
      <!--                Autosave is on-->
      <!--              </v-list-item-title>-->
      <!--              <v-list-item-subtitle>-->
      <!--                Changes saved automatically-->
      <!--              </v-list-item-subtitle>-->
      <!--            </v-list-item-content>-->
      <!--          </v-list-item>-->


      <v-menu offset-x open-on-hover>
        <template v-slot:activator="{on}">
          <v-list-item @click="placeholder" v-on="on">
            <v-list-item-icon>
              <v-icon>mdi-folder-open-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Open
              </v-list-item-title>
            </v-list-item-content>
            <v-list-item-action class="pt-2">
              <v-icon>mdi-menu-right</v-icon>
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
            <v-list-item-content>
              <v-list-item-title>{{ search.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <v-divider/>

    </template>

    <v-list-item v-if="$route.name === 'Serp'" @click="$emit('save')">
      <v-list-item-icon>
        <v-icon>mdi-content-save-outline</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Save
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>


    <v-list-item :disabled="!id" @click="setRenameId(id)">
      <v-list-item-icon>
        <v-icon :disabled="!id">mdi-pencil-outline</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Rename
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-list-item :disabled="!id" @click="createSearchFromTemplate(id)">
      <v-list-item-icon>
        <v-icon :disabled="!id">mdi-folder-multiple-outline</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Make a copy
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
    <v-list-item :disabled="!id" @click="deleteSavedSearch(id)">
      <v-list-item-icon>
        <v-icon :disabled="!id">mdi-delete-outline</v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title>
          Delete
        </v-list-item-title>
      </v-list-item-content>
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
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
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
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setRenameId",
      "setActiveSearchId",
      "setIsLoginDialogOpen",
      "setIsSignupDialogOpen",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "deleteSavedSearch",
      "createSearchFromTemplate",
      "openSavedSearch",
    ]),
    newSearch() {
      url.pushToRoute(this.$router, {name: "Serp"})
      this.snackbar("New unsaved search created.")
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