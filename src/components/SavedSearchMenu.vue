<template>
  <v-card flat>
    <v-list>

      <v-list-item @click="">
        <v-list-item-icon>
          <v-icon>mdi-content-save-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Save
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>


      <v-list-item @click="newSearch">
        <v-list-item-icon>
          <v-icon>mdi-folder-plus-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            New
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/me/searches">
        <v-list-item-icon>
          <v-icon>mdi-folder-open-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Open
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider/>



      <v-list-item :disabled="!id" @click="setRenameId(id)">
        <v-list-item-icon>
          <v-icon>mdi-pencil-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Rename
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item :disabled="!id" @click="openAsCopy">
        <v-list-item-icon>
          <v-icon>mdi-folder-multiple-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Make a copy
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item :disabled="!id" @click="deleteSavedSearch(id)">
        <v-list-item-icon>
          <v-icon>mdi-delete-outline</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            Delete
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-dialog v-model="isDialogOpen.save" max-width="600">

    </v-dialog>


  </v-card>
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
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setRenameId",
      "setActiveSearchId",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "deleteSavedSearch",
    ]),
    newSearch() {
      url.pushToRoute(this.$router, {name: "Serp"})
    },
    openAsCopy() {
      // const baseSearchName = this.myName
      // const newName = baseSearchName + " copy"
      this.setActiveSearchId(null)

      const query = {
        ...this.myQuery,
        id: undefined,
        name: undefined,
      }
      url.pushToRoute(this.$router, {
        name: "Serp",
        params: {entityType: "works"},
        query,
      })
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