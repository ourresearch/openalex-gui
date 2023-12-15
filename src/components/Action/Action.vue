<template>
  <div>
    <v-menu
        rounded
        offset-y
    >
      <template v-slot:activator="{on}">
        <v-btn
            text
            rounded
            v-on="on"
            class="font-weight-regular"
            :disabled="isDisabled"
            :close="isClearable"
            @click:close="selected = undefined"
        >
          {{ myConfig.displayName }}
        </v-btn>
      </template>
<!--      <v-card class="pa-4" v-if="action==='filter'">-->
<!--&lt;!&ndash;        <filter-chips-list/>&ndash;&gt;-->
<!--        <v-btn text rounded-->
<!--        @click="$store.state.activeFilter = 'default.search'"-->
<!--      >-->
<!--        do it-->
<!--      </v-btn>-->
<!--      </v-card>-->
      <v-card class="">
        <v-list>
            <v-list-item
                v-for="key in menuOptions"
                :key="key"
                color="primary"
                :value="key"
                :disabled="myConfig?.disableKeys?.includes(key)"
                @click="clickOption(key)"
            >
              <v-list-item-icon>
                  <v-icon v-if="selectedOptions.includes(key)">mdi-check</v-icon>
                </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ getKeyDisplayName(key) }}
                </v-list-item-title>
              </v-list-item-content>
              <!--            <v-icon left>mdi-check</v-icon>-->
            </v-list-item>
          <v-divider />
          <v-list-item @click="openMoreDialog">
            <v-list-item-content>
              <v-list-item-title>More</v-list-item-title>
            </v-list-item-content>
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
          <v-spacer />
          <v-btn icon @click="closeMoreDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-divider />
        <v-card-text class="pa-0">
          <v-list-item-group
                v-model="selected"
                :multiple="myConfig.isMultiple"
                :mandatory="false"
            >

              <v-list-item
                  v-for="key in allOptions"
                  :key="key"
                  color="primary"
                  :value="key"
                  :disabled="myConfig?.disableKeys?.includes(key)"
                  @click="closeMoreDialog"
              >
                <v-list-item-icon>
                  <v-icon>mdi-check</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ getKeyDisplayName(key) }}
                  </v-list-item-title>
                </v-list-item-content>
                <!--            <v-icon left>mdi-check</v-icon>-->
              </v-list-item>
            </v-list-item-group>

        </v-card-text>
      </v-card>
    </v-dialog>
  </div>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs, facetsByCategory, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import {getActionConfig, getActionDefaultValues} from "@/actionConfigs";
import ActionKeyChip from "@/components/Action/ActionKeyChip.vue";
import FilterList from "@/components/Filters/FilterList.vue";
import FilterChipsList from "@/components/Filters/FilterChipsList.vue";


export default {
  name: "Template",
  components: {
    FilterList,
    ActionKeyChip,
    FilterChipsList,

  },
  props: {
    action: String,
  },
  data() {
    return {
      foo: 42,
      isMoreDialogOpen: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    selected: {
      get() {
        if (this.action === 'sort') {
          return url.getSort(this.$route)
        } else if (this.action === "group_by") {
          return url.getGroupBy(this.$route)
        } else if (this.action === "column") {
          return url.getColumn(this.$route)
        }
      },
      set(to) {
        if (this.action === 'sort') {
          url.setSort(to)
        } else if (this.action === "group_by") {
          url.setGroupBy(to)
        } else if (this.action === "column") {
          url.setColumn(to)
        }
      }
    },
    selectedOptions() {
      return url.getActionValueKeys(this.$route, this.action)
    },
    allOptions(){
      return facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes(this.action))
          .map(conf => conf.key)
    },
    popularOptions(){
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
    isClearable() {
      return (this.action === 'group_by' && !!this.selected)
    },


    myConfig() {
      return getActionConfig(this.action)
    },
    isDisabled() {
      return !!(["sort", "column"].includes(this.action) && this.$route.query.group_by?.length)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    isDefault(key) {
      const defaults = getActionDefaultValues(this.action, this.$route.query)
      return defaults.includes(key)
    },
    getKeyDisplayName(key) {
      return getFacetConfig(this.entityType, key)?.displayName
    },
    openMoreDialog(){
      this.isMoreDialogOpen = true
    },
    closeMoreDialog(){
      this.isMoreDialogOpen = false
    },
    clickOption(key){
      console.log("clickOption", key)
        if (this.action === 'sort') {
          url.toggleSort(key)
        } else if (this.action === "group_by") {
          url.toggleGroupBy(key)
        } else if (this.action === "column") {
          url.toggleColumn(key)
        }
    },



  },
  created() {
  },
  mounted() {
  },
  watch: {
    "$route.query": {
      immediate: true,
      handler(to) {


      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>