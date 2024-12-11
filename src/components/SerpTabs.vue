<template>
  <div class="d-flex py-1 px-2 align-center">
    <v-slide-x-transition group class="d-flex" v-if="$vuetify.breakpoint.mdAndUp">
      <serp-tab
          flat
          v-for="(tabObj, i) in serpTabs"
          :key="i"
          :search-url="tabObj.searchUrl"
          :id="tabObj.id"
          :index="i"
      />
      <v-btn key="add-tab" icon @click="createSerpTab(null)">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
      `
    </v-slide-x-transition>

    <v-spacer/>
    <v-btn icon @click="isDialogOpen.openTab = true">
      <v-icon>mdi-folder-plus-outline</v-icon>
    </v-btn>


    <v-dialog scrollable max-width="500" v-model="isDialogOpen.openTab">
      <v-card rounded>
        <v-toolbar flat class="color-3">
          <v-toolbar-title>
            Open tab
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-list>
          <user-saved-search
              v-for="(savedSearch, i) in userSavedSearches"
              :key="savedSearch.id"
              :id="savedSearch.id"
              :searchUrl="savedSearch.search_url"
              hide-actions
              is-opener
              @click="isDialogOpen.openTab = false"
          />
        </v-list>

        <v-card-actions class="">
          <v-spacer/>
          <v-btn text rounded @click="isDialogOpen.openTab = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import Action from "@/components/Action/Action.vue";
import {url} from "@/url";
import QrcodeVue from 'qrcode.vue'
import UserSavedSearch from "@/components/user/UserSavedSearch.vue";
import SerpTab from "@/components/SerpTab.vue";

export default {
  name: "SerpTabs",
  components: {
    Action,
    QrcodeVue,
    UserSavedSearch,
    SerpTab,
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
        openTab: false,
      },
      selectedTab: 0,
      newTabName: "",
    }
  },
  computed: {
    ...mapGetters([

      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
      "userSavedSearches",
      "serpTabs",
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
      return this.$store.state.serpTabs[this.selectedTab]
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("user", [
    ]),
    ...mapActions("user", [
      "createSerpTab",
      "updateCurrentSerpTab",
    ]),
    async copyUrlToClipboard() {
      await navigator.clipboard.writeText(this.urlToShare);
      this.snackbar("URL copied to clipboard.")
    },
    addTab() {
      this.$store.state.serpTabs = [
        ...this.$store.state.serpTabs,
        {
          name: null,
          query: undefined
        }
      ]
      this.selectedTab = this.$store.state.serpTabs.length - 1
      this.$router.push({
        name: "Serp",
        query: undefined,
      })
    },
    async selectTab(index, isMoving = false) {
      // if (this.selectedTab === index && !isMoving) {
      //   this.openRenameTabDialog(index)
      //   return
      // }
      this.selectedTab = index
      const query = this.$store.state.serpTabs[index].query

      await this.$router.push({
        name: "Serp",
        query,
      }).catch((e) => {
        if (e.name !== "NavigationDuplicated") {
          throw e
        }
      })
    },
    openRenameTabDialog(i) {
      this.newTabName = this.selectedTabObject.name
      this.isDialogOpen.renameTab = true
    },
    renameTab() {
      this.selectedTabObject.name = this.newTabName
      this.isDialogOpen.renameTab = false
      this.newTabName = ""
    },
    closeTab(indexToDelete) {
      if (this.$store.state.serpTabs.length === 1) {
        this.$store.state.serpTabs = [
          {
            id: null,
            name: null,
            query: undefined
          }
        ]
        this.selectTab(0, true)
        return
      }

      const newIndex = Math.min(this.selectedTab, this.$store.state.serpTabs.length - 2)
      this.$store.state.serpTabs = this.$store.state.serpTabs.filter((tab, i) => {
        return i !== indexToDelete
      })
      this.selectTab(newIndex, true)
      return false
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(to) {
        this.updateCurrentSerpTab()
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
    background-color: $color-2 !important;
  }
}

</style>