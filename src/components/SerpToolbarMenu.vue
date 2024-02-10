<template>
  <div class="d-flex align-center">
    <v-menu offset-y v-model="isMenuOpen.search">
      <template v-slot:activator="{on}">
        <v-btn v-on="on" text rounded >
          Search
        </v-btn>
      </template>
      <saved-search-menu
          :id="$route.query.id"
          @save="clickSaveButton"
          @close="isMenuOpen.search = false"
      />
    </v-menu>




    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn rounded text v-on="on">
          View
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="view in url.viewConfigs"
          :key="view.id"
          @click="url.toggleView(view.id)"
        >
          <v-list-item-icon>
            <v-icon>{{ view.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ view.displayName }}
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action class="pt-2">
            <v-icon v-if="url.isViewSet($route, view.id)">mdi-check</v-icon>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-menu>





    <export-menu />




    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn rounded text v-on="on">
          Share
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
      </v-list>
    </v-menu>

    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn rounded text v-on="on">
          Help
        </v-btn>
      </template>
      <v-list>
        <v-list-item href="https://openalex.zendesk.com/hc/en-us/requests/new" target="_blank">
          <v-list-item-icon>
            <v-icon>mdi-comment-question-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Contact support
              <!--              <v-icon small right>mdi-open-in-new</v-icon>-->
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item href="https://help.openalex.org/" target="_blank">
          <v-list-item-icon>
            <v-icon>mdi-help-circle-outline</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Visit help center
              <!--              <v-icon small right>mdi-open-in-new</v-icon>-->
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-spacer />

    <div v-if="$route.query.id" class="body-2 grey--text mr-5">
        <v-icon small left>mdi-content-save-outline</v-icon>
        autosaved
      </div>


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

    <saved-search-save-dialog
        :is-open="isDialogOpen.saveSearch"
        :has-alert="saveSearchDialogHasAlert"
        @close="isDialogOpen.saveSearch = false"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import QrcodeVue from "qrcode.vue";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";
import SavedSearchSaveDialog from "@/components/SavedSearchSaveDialog.vue";
import ExportMenu from "@/components/ExportMenu.vue";
import {filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {
    SavedSearchSaveDialog,
    SavedSearchMenu,
    QrcodeVue,
    ExportMenu,
  },
  props: {},
  data() {
    return {
      foo: 42,
      saveSearchDialogHasAlert: false,
      isMenuOpen: {
        search: false,
      },
      isDialogOpen: {
        qrCode: false,
        saveSearch: false,
      }
    }
  },
  computed: {
    url() {
      return url
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    urlToShare() {
      return `https://openalex.org` + this.$route.fullPath
    },
    qrCodeSize() {
      return this.$vuetify.breakpoint.mdAndUp ?
          400 :
          300
    },
    groupByDownloadUrl(){
      const myFilters = filtersFromUrlStr(this.entityType, this.$route.query.filter)
      return url.makeGroupByUrl(
          this.entityType,
          this.groupByKeys.join(","),
          {
            filters: myFilters,
            isMultipleGroups: true
          }
      )
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", [
        "updateSearchUrl",
    ]),
    async copyUrlToClipboard() {
      await navigator.clipboard.writeText(this.urlToShare);
      this.snackbar("URL copied to clipboard.")
    },
    clickSaveButton() {
      this.openSaveDialog(false)
      // if (this.$route.query.id) {
      //   this.updateSearchUrl({
      //     id: this.activeSearchId,
      //     search_url: this.urlToShare,
      //   })
      // } else {
      //   this.openSaveDialog(false)
      // }
    },
    openSaveDialog(hasAlert) {
      console.log("openSaveDialog", hasAlert)
      this.saveSearchDialogHasAlert = hasAlert
      this.isDialogOpen.saveSearch = true
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