<template>
  <div class="d-flex align-center mt-2 mb-2">
    <!--    <router-link-->
    <!--        :to="{name: 'Home'}"-->
    <!--        class="logo-link "-->
    <!--        v-if="$vuetify.breakpoint.mdAndUp"-->
    <!--    >-->
    <!--      <img-->
    <!--          src="@/assets/openalex-logo-icon-black-and-white.png"-->
    <!--          class="logo-icon mr-0 colorizable"-->
    <!--      />-->
    <!--      <span class="logo-text d-none colorizable">OpenAlex</span>-->

    <!--    </router-link>-->
    <div>
      <serp-title/>
<!--      <div class="body-2 ml-4 mb-4">-->
<!--        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.-->
<!--      </div>-->
      <serp-toolbar-menu class=""/>
    </div>

    <v-spacer/>

    <!--    <user-toolbar-menu v-if="$vuetify.breakpoint.mdAndUp"/>-->


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


    <v-dialog max-width="300" v-model="isDialogOpen.loginRequired">
      <v-card rounded flat>
        <v-card-title>Login required</v-card-title>
        <v-card-text>
          Log in or sign up to save searches and get alerts.
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn text rounded to="/login">Log in</v-btn>
          <v-btn text rounded color="primary" to="/signup">Sign up</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <saved-search-save-dialog
        :is-open="isDialogOpen.saveSearch"
        :has-alert="saveSearchDialogHasAlert"
        @close="isDialogOpen.saveSearch = false"
    />

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";
import ExportButton from "@/components/ExportButton.vue";
import {url} from "@/url";
import QrcodeVue from 'qrcode.vue'
import UserSavedSearch from "@/components/user/UserSavedSearch.vue";
import FilterList from "@/components/FilterList.vue";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

import SavedSearchSaveDialog from "@/components/SavedSearchSaveDialog.vue";
import {user} from "@/store/user.store";
import UserToolbarMenu from "@/components/user/UserToolbarMenu.vue";
import SerpToolbarMenu from "@/components/SerpToolbarMenu.vue";
import SerpTitle from "@/components/SerpTitle.vue";

const shortUuid = require('short-uuid');


export default {
  name: "Template",
  components: {
    UserSavedSearch,
    QrcodeVue,
    SavedSearchMenu,
    SavedSearchSaveDialog,
    UserToolbarMenu,
    SerpToolbarMenu,
    SerpTitle,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
      isLoadingSave: false,
      saveSearchDialogHasAlert: false,

      isDialogOpen: {
        qrCode: false,
        openSearch: false,
        saveSearch: false,
        loginRequired: false,
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
    user() {
      return user
    },
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
      "activeSearchDescription",
      "activeSearchHasAlert",
      "editAlertId",
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


    isSavedSearchModified() {
      if (!this.activeSearchId) return
      const activeSearchUrlFullPath = this.activeSearchUrl.replace("https://openalex.org", "")
      return activeSearchUrlFullPath !== this.$route.fullPath
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
      "setEditAlertId",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
      "createSearch",
      "updateSearchUrl",
    ]),
    openSaveDialog(hasAlert) {
      console.log("openSaveDialog", hasAlert)
      this.saveSearchDialogHasAlert = hasAlert
      this.isDialogOpen.saveSearch = true
    },
    clickAlertButton() {
      if (this.$route.query.id) {
        this.setEditAlertId(this.activeSearchId)
      } else {
        this.openSaveDialog(true)
      }
    },
    clickSaveButton() {
      if (this.$route.query.id) {
        this.updateSearchUrl({
          id: this.activeSearchId,
          search_url: this.urlToShare,
        })
      } else {
        this.openSaveDialog(false)
      }
    },
    newSearch() {
      url.pushToRoute(this.$router, {
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
    "isDialogOpen.saveSearch"(to) {
      // console.log( "toolbar savesearch dialog open changed", to )
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

.logo-link {
  padding: 10px 5px 10px 10px;

  img {
    height: 50px;
    //margin: 10px 20px;
  }
}

.tab {
  background-color: transparent !important;

  &.selected {
    background-color: white !important;
  }
}

</style>