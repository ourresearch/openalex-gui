<template>
  <v-toolbar  color="" flat class="">
    <v-btn v-if="!isEditingName" text class="text-h6 px-2" @click="isEditingName = true" rounded>
      {{ tabName || "Untitled search" }}
    </v-btn>

    <v-text-field
        v-else
        autofocus
        rounded
        hide-details
        filled
        dense
        @blur="isEditingName = false"
        @keydown.enter="isEditingName = false"
        v-model="nameToEdit"
        class="text-h6 pl-0 ml-0"
    />

    <div class="pt-1">
      <v-icon small>mdi-{{ isAutoSaved ? (isUserSaving ? "autorenew" : "content-save") : "content-save-off-outline" }}</v-icon>
      <span class="text-caption grey--text ml-1" v-if="isAutoSaved">{{ isUserSaving ? "saving" : "saved" }}</span>

    </div>


    <v-spacer/>

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
        <v-list-item @click="isAutoSaved = true" :disabled="isAutoSaved">
          <v-list-item-icon>
            <v-icon :disabled="isAutoSaved">mdi-content-save-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title v-if="isAutoSaved">
              Autosave <span class="font-weight-bold">on</span>
            </v-list-item-title>
            <v-list-item-title v-else>Autosave</v-list-item-title>
          </v-list-item-content>
          <!--          <v-list-item-icon>-->
          <!--            <v-icon>mdi-toggle-switch</v-icon>-->
          <!--          </v-list-item-icon>-->
          <v-list-item-action>
            <v-switch :disabled="isAutoSaved" class="pt-2" hide-details readonly :input-value="!!isAutoSaved"/>
          </v-list-item-action>
        </v-list-item>
        <v-divider/>

        <v-list-item @click="newSearch" v-if="Object.keys($route.query)?.length">
          <v-list-item-icon>
            <v-icon>mdi-folder-plus-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              New search
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item @click="isDialogOpen.openSearch = true">
          <v-list-item-icon>
            <v-icon>mdi-folder-open-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Open search
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="copySearch">
          <v-list-item-icon>
            <v-icon>mdi-folder-multiple-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Copy search
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item v-if="isAutoSaved" @click="deleteSearch">
          <v-list-item-icon>
            <v-icon>mdi-delete-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Delete search
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>


        <v-divider/>
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
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
      isLoadingSave: false,
      isDialogOpen: {
        qrCode: false,
        openSearch: false,
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
    tabName: {
      get() {
        return this.$route.query.name
      },
      set(to) {
        url.setSerpTabName(to)
      }
    },
    isAutoSaved: {
      get() {
        return !!this.$route.query.id
      },
      set(to) {
        console.log("set isAutoSaved")
        to ?
            this.saveSearch() :
            url.replaceQueryParam("id", undefined)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    async saveSearch() {
      try {
        await this.$router.replace({
          name: "Serp",
          query: {
            ...this.$route.query,
            id: shortUuid.generate()
          }
        })
      } catch (e) {
        if (e.name !== "NavigationDuplicated") {
          throw e
        }
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