<template>
  <div class="d-flex align-center pr-3">

    <!-- you can only get alerts for new works -->
    <v-btn
        v-if="entityType === 'works'"
        icon
        @click="$emit('toggle-alert')"
    >
      <template v-if="activeSearchHasAlert">
        <!-- Remove alert-->
        <v-icon>mdi-bell-check</v-icon>
      </template>
      <template v-else>
        <!-- Create alert-->
        <v-icon>mdi-bell-outline</v-icon>
      </template>
    </v-btn>

    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-cog-outline</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-subheader>
          Show on page:
        </v-subheader>
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

    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <v-btn icon v-on="on">
          <v-icon>mdi-share-variant</v-icon>
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

    <v-spacer/>

    <v-dialog :width="qrCodeSize" v-model="isDialogOpen.qrCode">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            QR code for this page:
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text v-if="isUrlTooBigForQR">Add commentMore actions
          <v-alert  type="warning" text>
            Your current URL is too long to create a QR code.
          </v-alert>
        </v-card-text>
        <qrcode-vue v-else :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import QrcodeVue from "qrcode.vue";
import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import SavedSearchMenu from "@/components/SavedSearchMenu.vue";

export default {
  name: "SerpToolbarMenu",
  components: {
    QrcodeVue,
  },
  props: {},
  data() {
    return {
      saveSearchDialogHasAlert: false,
      isMenuOpen: {
        search: false,
      },
      isDialogOpen: {
        qrCode: false,
      }
    }
  },
  computed: {
    url() {
      return url
    },
    ...mapGetters([
      "entityType",
    ]),
    ...mapGetters("user", [
      "activeSearchHasAlert",
      "activeSearchObj",
    ]),
    urlToShare() {
      return `https://openalex.org` + this.$route.fullPath;
    },
    isUrlTooBigForQR() {
      return this.urlToShare.length > 3000;
    },
    qrCodeSize() {
      return this.$vuetify.breakpoint.mdAndUp ? 400 : 300;
    },
    groupByDownloadUrl() {
      const myFilters = filtersFromUrlStr(this.entityType, this.$route.query.filter);
      return url.makeGroupByUrl(
          this.entityType,
          this.groupByKeys.join(","),
          {
            filters: myFilters,
            isMultipleGroups: true
          }
      );
    },
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setEditAlertId",
    ]),
    ...mapActions("user", [
      "updateSearchUrl",
    ]),
    async copyUrlToClipboard() {
      await navigator.clipboard.writeText(this.urlToShare);
      this.snackbar("URL copied to clipboard.")
    },
  },
}
</script>


<style scoped lang="scss">

</style>