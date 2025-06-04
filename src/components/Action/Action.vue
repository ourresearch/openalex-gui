<template>
  <div>
    <v-menu class="rounded-lg">
      <template v-slot:activator="{props}">
        <v-btn v-on="on" icon size="large" color="" class="px-2 color-1 elevation-0" v-if="myConfig.id === 'filter'" style="min-width: 0;">
          <v-icon class="">mdi-plus</v-icon>
        </v-btn>
        <v-btn
            v-else
            icon
            variant="text"
            v-bind="props"
            class="rounded-lg"
            :disabled="disabled"
        >
          <template v-if="myConfig.id === 'sort'">
              <v-icon>mdi-sort</v-icon>
          </template>
          <template v-if="myConfig.id === 'group_by'">
            <v-icon>mdi-plus</v-icon>
          </template>
        </v-btn>
      </template>

      <v-card flat class="">
        <v-list>
          <v-list-subheader>
            <template v-if="myConfig.id === 'sort'">
              Sort by:
            </template>
            <template v-if="myConfig.id === 'group_by'">
              Add to report:
            </template>
            <template v-if="myConfig.id === 'filter'">
              Add filter:
            </template>
          </v-list-subheader>
          <v-divider/>
          <v-list-item
              v-for="key in menuOptions"
              :key="key"
              color="primary"
              :value="key"
              :disabled="myConfig?.disableKeys?.includes(key)"
              @click="clickOption(key)"
          >
            <v-icon>{{ getKeyIcon(key) }}</v-icon>
            
              <v-list-item-title>
                {{ getKeyDisplayName(key) }}
              </v-list-item-title>
            
            <v-list-item-action>
              <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-divider/>
          <v-list-item @click="openMoreDialog">
            
              <v-list-item-title>More</v-list-item-title>
            
          </v-list-item>

        </v-list>
      </v-card>
    </v-menu>
    <v-dialog
        v-model="isMoreDialogOpen"
        scrollable
        max-width="400"
    >
      <v-card rounded>
        <v-toolbar flat>
          <v-toolbar-title>More {{ myConfig.displayName }} options</v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="closeMoreDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider/>
        <v-card-text class="pa-0">

          <v-list-item
              v-for="key in allOptions"
              :key="key"
              color="primary"
              :value="key"
              :disabled="myConfig?.disableKeys?.includes(key)"
              @click="clickOption(key)"
          >
            <v-icon>{{ getKeyIcon(key) }}</v-icon>
            <v-list-item-title>
              {{ getKeyDisplayName(key) }}
            </v-list-item-title>
            <v-list-item-action>
              <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>


</template>

<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import {getActionConfig, getActionDefaultValues} from "@/actionConfigs";


export default {
  name: "ActionMenu",
  components: {},
  props: {
    action: String,
    disabled: Boolean,
  },
  data() {
    return {
      isMoreDialogOpen: false,
      isEditDialogOpen: true,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    selectedOptions() {
      return url.getActionValueKeys(this.$route, this.action)
    },
    allOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes(this.action))
          .map(conf => conf.key)
    },
    popularOptions() {
      return facetConfigs(this.entityType)
          .filter(conf => conf.actionsPopular?.includes(this.action))
          .map(conf => conf.key)
    },
    menuOptions() {
      const ret = [...this.popularOptions]
      this.selectedOptions.forEach(optionKey => {
        if (!this.popularOptions.includes(optionKey)) {
          ret.push(optionKey)
        }
      })
      return ret
    },
    myConfig() {
      return getActionConfig(this.action)
    },
  },
  methods: {
    isDefault(key) {
      const defaults = getActionDefaultValues(this.action, this.$route.query)
      return defaults.includes(key)
    },
    getKeyDisplayName(key) {
      return getFacetConfig(this.entityType, key)?.displayName
    },
    getKeyIcon(key) {
      return getFacetConfig(this.entityType, key)?.icon

    },
    openMoreDialog() {
      this.isMoreDialogOpen = true
    },
    closeMoreDialog() {
      this.isMoreDialogOpen = false
    },
    clickOption(key) {
      this.isMoreDialogOpen = false
      if (this.action === 'sort') {
        url.toggleSort(key)
      } else if (this.action === "group_by") {
        url.toggleGroupBy(key)
      } else if (this.action === "column") {
        url.toggleColumn(key)
      } else if (this.action === "filter") {
        this.$emit("click", key)
      }
    },
    openFilterEditDialog(key) {
      console.log("openFilterEditDialog()", key)
    }
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler() {
      }
    },
  }
}
</script>


<style scoped lang="scss">

</style>