<template>
  <v-container>
    <v-toolbar flat>
      <v-toolbar-title class="text-h6">
        Your saved searches

      </v-toolbar-title>
      <v-spacer/>
      <!--        <v-btn rounded color="primary" :to="{name:'Serp', params: {entityType: 'works'}}">-->
      <!--          <v-icon left>mdi-plus</v-icon>-->
      <!--          new search-->
      <!--        </v-btn>-->
    </v-toolbar>
    <v-simple-table>
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
          @click="open(savedSearch.id)"
      >
        <td>{{ nameFromUrl(savedSearch.search_url) }}</td>
        <td>
          {{ formatDate(savedSearch.updated) }}
        </td>
        <td class="d-flex align-center">
          <v-spacer></v-spacer>
          <v-menu offset-y>
            <template v-slot:activator="{on}">
              <v-btn icon v-on="on">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="rename(savedSearch.id)">
                <v-list-item-icon>
                  <v-icon>mdi-pencil-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Rename</v-list-item-title>
              </v-list-item>
              <v-list-item @click="deleteSavedSearch(savedSearch.id)">
                <v-list-item-icon>
                  <v-icon>mdi-delete-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openAsCopy(savedSearch.id)">
                <v-list-item-icon>
                  <v-icon>mdi-folder-multiple-outline</v-icon>
                </v-list-item-icon>
                <v-list-item-title>Open as copy</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </td>

      </tr>
      </tbody>
    </v-simple-table>

<!--    <v-list rounded>-->
<!--      <user-saved-search-->
<!--          v-for="(savedSearch, i) in userSavedSearches"-->
<!--          :key="savedSearch.id"-->
<!--          :id="savedSearch.id"-->
<!--          :search-url="savedSearch.search_url"-->
<!--          :updated="savedSearch.updated"-->
<!--      >-->
<!--      </user-saved-search>-->
<!--    </v-list>-->

    <v-dialog v-model="isDialogOpen.rename">
      <v-card flat rounded>
        <v-card-title>Rename saved search</v-card-title>
        <div class="pa-4">
          <v-text-field
              rounded
              filled
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              placeholder="New name"
              v-model="renameString"
          />
        </div>
      </v-card>
    </v-dialog>

  </v-container>


</template>

<script>

import {url} from "@/url";
import SearchBar from "@/components/SearchBar.vue";
import {VueTyper} from 'vue-typer'
import FilterList from "@/components/FilterList.vue";
import {mapActions, mapGetters} from "vuex";
import UserSavedSearch from "@/components/user/UserSavedSearch.vue";

export default {
  name: 'home',
  components: {
    UserSavedSearch,
    SearchBar,
    FilterList,
    VueTyper,
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
      }
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
    ]),
    openRenameDialog(id) {
      this.renameString = this.nameFromId(id)
      this.isDialogOpen.rename = true
    },
    rename(id, newName) {

    },
    open(id){
      const myUrl = this.urlFromId(id)
      url.pushToRoute(
          this.$router,
          url.urlObjectFromSearchUrl(myUrl)
      )
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
    urlFromId(id){
      return this.userSavedSearches.find(s => s.id === id)?.search_url
    },
    nameFromId(id) {
      const myUrl = this.urlFromId(id)
      return this.nameFromUrl(myUrl)
    },
    nameFromUrl(urlArg) {
      const myUrl = new URL(urlArg)
      const name = myUrl.searchParams.get("name") ?? "Untitled search"
      return name
    },
    formatDate(dateString) {
      const dateOptions = {
        month: "short",
        weekday: "short",
        day: "numeric"
      }
      const timeOptions = {
        timeStyle: "short",
      }

      const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1));
      const updatedDate = new Date(dateString)

      return (updatedDate < oneDayAgo) ?
          updatedDate.toLocaleDateString(undefined, dateOptions) :
          updatedDate.toLocaleTimeString(undefined, timeOptions)
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

<style lang="scss" scoped>


</style>
