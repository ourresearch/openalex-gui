<template>
  <v-toolbar dense color="" flat class="">
<!--    diff? {{ isSavedSearchModified }}  -->
    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on"><v-icon>mdi-menu</v-icon></v-btn>
      </template>
      <saved-search-menu />
    </v-menu>

    <v-btn
        text
        rounded
        class="text-h6 px-2"
        @click="clickSearchName"
    >
      {{ activeSearchDescription || "Unsaved search" }}
    </v-btn>


    <v-spacer/>

    <v-btn icon @click="clickSaveButton" >
      <v-icon>mdi-content-save-outline</v-icon>
    </v-btn>
    <serp-alert/>
    <!--    <export-button/>-->


    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <!--          <v-icon>mdi-export-variant</v-icon>-->
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>

      </template>
      <v-list>
        <v-list-item @click="isDialogOpen.qrCode = true">
          <v-list-item-icon>
            <v-icon>mdi-qrcode</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Get QR code to share
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="copyUrlToClipboard">
          <v-list-item-icon>
            <v-icon>mdi-link-variant</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Copy link to share
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>


        <v-divider/>
        <v-list-item @click="url.pushQueryParam('show_api', !$route.query.show_api)">
          <v-list-item-icon>
            <v-icon>mdi-api</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              View API call
            </v-list-item-title>
          </v-list-item-content>
          <!--          <v-list-item-action>-->
          <!--            <v-switch readonly hide-details :value="false" />-->
          <!--          </v-list-item-action>-->
        </v-list-item>

      </v-list>
    </v-menu>

    <v-dialog :width="qrCodeSize" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            QR code for this page:
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <qrcode-vue :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog max-width="600" v-model="isDialogOpen.openSearch">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            Open a saved search
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-list color="transparent">
          <user-saved-search
              v-for="(savedSearch, i) in userSavedSearches"
              :key="savedSearch.id"
              :id="savedSearch.id"
              :search-url="savedSearch.search_url"
              :updated="savedSearch.updated"
              @click="isDialogOpen.openSearch = false"
          >
          </user-saved-search>
        </v-list>
      </v-card>
    </v-dialog>

    <v-dialog max-width="400" v-model="isDialogOpen.saveSearch">
      <v-card rounded flat>
        <v-card-title>Save this search</v-card-title>
        <div class="pa-4">
          <v-text-field
              autofocus
              rounded
              filled
              hide-details
              clearable
              placeholder="Name for search"
              v-model="newSearchName"
              @keydown.enter="saveThisSearch"
          />
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded @click="isDialogOpen.saveSearch = false">Cancel</v-btn>
          <v-btn text rounded color="primary" :disabled="!newSearchName" @click="saveThisSearch">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog max-width="400" v-model="isDialogOpen.loginRequired">
      <v-card rounded flat>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          Log in or sign up to save searches and get alerts.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text rounded to="/login">Log in</v-btn>
          <v-btn text rounded color="primary" to="/signup">Sign up</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


  </v-toolbar>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";
import ExportButton from "@/components/ExportButton.vue";
import {url} from "@/url";
import QrcodeVue from 'qrcode.vue'
import SerpAlert from "@/components/SerpAlert.vue";
import UserSavedSearch from "@/components/user/UserSavedSearch.vue";
import FilterList from "@/components/FilterList.vue";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

const shortUuid = require('short-uuid');


export default {
  name: "Template",
  components: {
    UserSavedSearch,
    SerpAlert,
    Action,
    ExportButton,
    QrcodeVue,
    FilterList,
    SavedSearchMenu,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
      isLoadingSave: false,
      newSearchName: "",
      isDialogOpen: {
        qrCode: false,
        openSearch: false,
        loginRequired: false,
        saveSearch: false,
      },
      isEditingName: false,
      nameToEdit: "",
      searchTabs: [
        {
          name: null,
          query: undefined,
        }
      ],
      selectedTab: 0,
      newTabName: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "isCurrentSerpTabSaved",
      "userSavedSearches",
      "isUserSaving",
        "userId",
        "activeSearchObj",
        "activeSearchId",
        "activeSearchUrl",
        "activeSearchDescription"
    ]),
    urlToShare() {
      return `https://openalex.org` + this.$route.fullPath
    },
    qrCodeSize() {
      return this.$vuetify.breakpoint.mdAndUp ?
          600 :
          300
    },
    selectedTabObject() {
      return this.searchTabs[this.selectedTab]
    },


    isSavedSearchModified(){
      if (!this.activeSearchId) return
      const activeSearchUrlFullPath = this.activeSearchUrl.replace("https://openalex.org", "")
      return activeSearchUrlFullPath !==   this.$route.fullPath
    },
    tabName: {
      get() {
        return this.$route.query.name
      },
      set(to) {
        url.setSerpTabName(to)
      }
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setRenameId",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
        "createSearch",
        "updateSearchUrl",
    ]),
    clickSaveButton(){
      if (!this.userId) {
        this.isDialogOpen.loginRequired = true
        return
      }

      if (this.activeSearchId){
        this.updateSearchUrl({
          id: this.activeSearchId,
          search_url: this.urlToShare,
        })

      }
      else {
        this.newSearchName = ""
        this.isDialogOpen.saveSearch = true
      }
    },
    saveThisSearch(){
      this.isDialogOpen.saveSearch = false
      this.createSearch({
        search_url: `https://openalex.org` + this.$route.fullPath,
        description: this.newSearchName
      })
      this.snackbar("Search saved.")
    },
    clickSearchName(){
      if (!this.userId) {
        this.isDialogOpen.loginRequired = true
      }
      else {
        this.activeSearchId ?
            this.setRenameId(this.activeSearchId) :
            this.clickSaveButton()
      }
    },
    newSearch() {
      url.pushToRoute(this.$router,{
        name: "Serp",
        params: {entityType: this.entityType}
      })
    },
    async copyUrlToClipboard() {
      await navigator.clipboard.writeText(this.urlToShare);
      this.snackbar("URL copied to clipboard.")
    },
    deleteSearch() {
      this.$store.dispatch("user/deleteSavedSearch", this.$route.query.id)
    },

    copySearch() {
      const newName = this.$route.query?.name ?
          this.$route.query?.name + " copy" :
          "Untitled search copy"

      const query = {
        ...this.$route.query,
        id: undefined,
        name: newName,
      }
      this.$router.push({
        name: "Serp",
        params: {entityType: this.entityType},
        query,
      })
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isAutoSaved(to) {
      if (to) this.snackbar("Autosave enabled; changes will be saved automatically.")
    },
    "$route.query": {
      immediate: true,
      handler(to) {
      }
    },
    isEditingName(to) {
      console.log("editing name!")
      if (to) { // open edit
        this.nameToEdit = this.tabName
      } else {
        this.tabName = this.nameToEdit
      }
    }
  }
}
</script>

<style scoped lang="scss">
$color-3: hsl(210, 60%, 98%);
$color-2: hsl(213, 69%, 95%);
$color-1: hsl(213, 72%, 88%);
$color-0: hsl(212, 77%, 82%);

.tab {
  background-color: transparent !important;

  &.selected {
    background-color: white !important;
  }
}

</style>