<template>
  <div class="d-flex- align-center">
    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn v-on="on" text rounded >
          File
        </v-btn>
      </template>
      <saved-search-menu
          :id="$route.query.id"
          @save="clickSaveButton"
      />
    </v-menu>
    <v-btn text rounded>View</v-btn>
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
      isDialogOpen: {
        qrCode: false,
        saveSearch: false,
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
    ]),
    urlToShare() {
      return `https://openalex.org` + this.$route.fullPath
    },
    qrCodeSize() {
      return this.$vuetify.breakpoint.mdAndUp ?
          400 :
          300
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
      if (this.$route.query.id) {
        this.updateSearchUrl({
          id: this.activeSearchId,
          search_url: this.urlToShare,
        })
      } else {
        this.openSaveDialog(false)
      }
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