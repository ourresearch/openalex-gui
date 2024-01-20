<template>
  <div class="d-flex py-1 px-2 align-center">
    <v-slide-x-transition group class="d-flex" v-if="$vuetify.breakpoint.mdAndUp">
      <v-card
          flat
          v-for="(tab, i) in searchTabs"
          :key="i"
          class="d-flex pa-1 px-2 align-center mr-1 hover-color-3"
          :class="{'color-2': selectedTab === i, 'hover-color-2': selectedTab === i}"
          @click.self="selectTab(i)"
      >
        {{ tab.name || "Untitled tab" }}
        <v-menu rounded offset-y v-if="selectedTab === i">
          <template v-slot:activator="{on}">
            <v-btn icon small v-on="on">
              <v-icon>mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="openRenameTabDialog(i)">
              <v-list-item-icon>
                <v-icon>mdi-pencil-outline</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>Rename tab</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <!--          <v-list-item>-->
            <!--            <v-list-item-icon><v-icon>mdi-content-copy</v-icon></v-list-item-icon>-->
            <!--            <v-list-item-content><v-list-item-title>Copy to new tab</v-list-item-title></v-list-item-content>-->
            <!--          </v-list-item>-->
            <v-list-item :disabled="searchTabs.length === 1" @click="deleteTab(i)">
              <v-list-item-icon>
                <v-icon>mdi-delete-outline</v-icon>
              </v-list-item-icon>
              <!--            <v-list-item-icon><v-icon>mdi-close-circle-outline</v-icon></v-list-item-icon>-->
              <v-list-item-content>
                <v-list-item-title>Remove tab</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn icon small v-else @click.stop="deleteTab(i)">
          <v-icon small>mdi-close</v-icon>
        </v-btn>
      </v-card>
      <v-btn key="add-tab" icon @click="addTab">
        <v-icon>mdi-plus</v-icon>
      </v-btn>`
    </v-slide-x-transition>

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
          <v-spacer/>
        </v-toolbar>
        <qrcode-vue :value="urlToShare" :size="qrCodeSize" class=""/>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn color="primary" rounded @click="isDialogOpen.qrCode = false">Dismiss</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog width="300" v-model="isDialogOpen.renameTab">
      <v-card rounded>
        <v-toolbar flat class="">
          <v-toolbar-title>
            Rename tab
          </v-toolbar-title>
          <v-spacer/>
        </v-toolbar>
        <v-card-text>
          <v-text-field
              filled
              hide-details
              rounded
              v-model="newTabName"
              autofocus
              @keydown.enter="renameTab"
              clearable

          />
        </v-card-text>
        <v-card-actions class="">
          <v-spacer/>
          <v-btn text rounded @click="isDialogOpen.renameTab = false">Cancel</v-btn>
          <v-btn color="primary" rounded @click="renameTab">Rename</v-btn>
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
        renameTab: false,
      },
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
    addTab() {
      this.searchTabs = [
        ...this.searchTabs,
        {
          name: null,
          query: undefined
        }
      ]
      this.selectedTab = this.searchTabs.length - 1
      this.$router.push({
        name: "Serp",
        query: undefined,
      })
    },
    async selectTab(index, isMoving=false) {
      if (this.selectedTab === index && !isMoving) {
        this.openRenameTabDialog(index)
        return
      }
      this.selectedTab = index
      const query = this.searchTabs[index].query

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
    deleteTab(indexToDelete) {
      const newIndex = Math.min(this.selectedTab, this.searchTabs.length - 2)
      this.searchTabs = this.searchTabs.filter((tab, i) => {
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
        this.searchTabs[this.selectedTab].query = to
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>