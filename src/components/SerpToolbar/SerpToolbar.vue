<template>
  <v-toolbar dense flat class="" color="transparent">

    <serp-toolbar-title
        @save="clickSave"
        @toggle-alert="toggleAlert"
        style="margin-left: -19px;"
    />
    <v-spacer/>
    <serp-toolbar-menu
        @save="clickSave"
        @toggle-alert="toggleAlert"
        style="margin-right: -22px;"
    />
    <saved-search-save-dialog
        :is-open="isDialogOpen.saveSearch"
        :has-alert="saveSearchDialogHasAlert"
        @close="isDialogOpen.saveSearch = false"
    />
  </v-toolbar>
</template>

<script>

import {mapActions, mapMutations} from "vuex";
import SerpToolbarMenu from "@/components/SerpToolbar/SerpToolbarMenu.vue";
import SerpToolbarTitle from "@/components/SerpToolbar/SerpToolbarTitle.vue";
import SavedSearchSaveDialog from "@/components/SavedSearchSaveDialog.vue";


export default {
  name: "SerpToolbar",
  components: {
    SavedSearchSaveDialog,
    SerpToolbarMenu,
    SerpToolbarTitle,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      saveSearchDialogHasAlert: false,
      isDialogOpen: {
        saveSearch: false,
      }
    }
  },
  computed: {
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
      "setEditAlertId",
    ]),
    ...mapActions("user", [
      "updateSearchUrl"
    ]),
    clickSave() {
      this.$route.query.id ?
          this.saveThisSearch() :
          this.openSaveDialog(false)

    },
    async saveThisSearch() {
      await this.updateSearchUrl({
        id: this.$route.query.id,
        search_url: "https://openalex.org/" + this.$route.fullPath
      })
    },
    openSaveDialog(hasAlert) {
      console.log("SerpToolbar openSaveDialog", hasAlert)
      this.saveSearchDialogHasAlert = hasAlert
      this.isDialogOpen.saveSearch = true
    },
    toggleAlert() {
      this.$route.query.id ?
          this.setEditAlertId(this.$route.query.id) :
          this.openSaveDialog(true)
    },
  },
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