<template>
  <v-card flat >
    <v-list v-if="userId">

      <template v-if="$route.name === 'Serp'">

          <v-list-item  @click="newSearch" >
            <v-list-item-icon>
              <v-icon>mdi-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                New
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item disabled v-if="id" @click="$emit('save')" >
            <v-list-item-icon>
              <v-icon>mdi-content-save-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Autosave is on
              </v-list-item-title>
              <v-list-item-subtitle>
                Changes saved automatically
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>



          <v-list-item v-else @click="$emit('save')" >
            <v-list-item-icon>
              <v-icon>mdi-content-save-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Save
              </v-list-item-title>
<!--              <v-list-item-subtitle>-->
<!--                Changes saved automatically-->
<!--              </v-list-item-subtitle>-->
            </v-list-item-content>
          </v-list-item>

        <v-list-item  @click="openSearch" >
            <v-list-item-icon>
              <v-icon>mdi-folder-open-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                Open
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

        <v-divider />

      </template>


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
      <v-list-item :disabled="!id" @click="createSearchFromTemplate(id)">
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

    <v-card v-else class="">
<!--        <v-card-title>-->
<!--          Login required-->
<!--        </v-card-title>-->
        <div class="px-6 pt-6 pb-4">
          Login or sign up to save searches.
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded @click="setIsLoginDialogOpen(true)">Log in</v-btn>
          <v-btn color="primary" rounded @click="setIsSignupDialogOpen(true)">Sign up</v-btn>
        </v-card-actions>
      </v-card>



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
        "setIsLoginDialogOpen",
        "setIsSignupDialogOpen",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "deleteSavedSearch",
      "createSearchFromTemplate",
    ]),
    newSearch() {
      url.pushToRoute(this.$router, {name: "Serp"})
    },
    openSearch(){
      this.$router.push("/me/searches")
    }


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