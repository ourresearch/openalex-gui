<template>
  <div class="d-flex py-1 px-2 align-center">
<!--    <v-toolbar-title>Untitled search</v-toolbar-title>-->

    <v-spacer/>
    <v-btn icon @click="url.pushQueryParam('show_api', !$route.query.show_api)">
      <v-icon>mdi-api</v-icon>
    </v-btn>

    <v-menu rounded offset-y>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <!--          <v-icon>mdi-export-variant</v-icon>-->
          <v-icon>mdi-share-variant</v-icon>
        </v-btn>

      </template>
      <v-list>
        <v-subheader>Share this search via:</v-subheader>
        <v-divider/>
        <v-list-item @click="isDialogOpen.qrCode = true">
          <v-list-item-icon>
            <v-icon>mdi-qrcode</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              QR code
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item @click="copyUrlToClipboard">
          <v-list-item-icon>
            <v-icon>mdi-link-variant</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              Link
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
          <v-spacer />
        </v-toolbar>
        <qrcode-vue :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
          <v-spacer />
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";
import ExportButton from "@/components/ExportButton.vue";
import {url} from "@/url";
import QrcodeVue from 'qrcode.vue'


export default {
  name: "Template",
  components: {
    Action,
    ExportButton,
    QrcodeVue,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,
      url,
      isDialogOpen: {
        qrCode: false,
      }
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    urlToShare() {
      return `https://openalex.org` + this.$route.fullPath
    },
    qrCodeSize(){
      return this.$vuetify.breakpoint.mdAndUp ?
          600 :
          300
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    async copyUrlToClipboard() {
      await navigator.clipboard.writeText(this.urlToShare);
      this.snackbar("URL copied to clipboard.")
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