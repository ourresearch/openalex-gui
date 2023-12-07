<template>
  <div>
    <v-menu
        rounded
        offset-y
        :close-on-content-click="myConfig.closeMenuOnContentClick"
    >
      <template v-slot:activator="{on}">
        <v-btn
            text
            v-on="on"
            class="font-weight-regular"
            :disabled="isDisabled"
            :close="isClearable"
            @click:close="selected = undefined"
        >
<!--          <v-icon left v-if="myConfig.isIconRotated" style="transform: rotate(90deg)">{{ myConfig.icon }}</v-icon>-->
<!--          <v-icon v-else left>{{ myConfig.icon }}</v-icon>-->
          {{ myConfig.displayName }}
          <span v-if="selectedKeyDisplayName" class="ml-1">{{ selectedKeyDisplayName }}</span>
          <span v-if="myConfig.isMultiple" class="ml-1 font-weight-bold">({{ selectedOptions.length }})</span>
        </v-btn>
      </template>
      <v-card class="pa-4" v-if="action==='filter'">
        <filter-chips-list/>
      </v-card>
      <v-card v-else class="pa-4">
        <v-chip-group
            v-model="selected"
            :multiple="myConfig.isMultiple"
            :mandatory="false"
            column
        >
          <v-chip
              v-for="key in allOptions"
              :key="key"
              filter
              :color="myConfig.color"
              :value="key"
              :disabled="myConfig?.disableKeys?.includes(key)"
              :outlined="!keyIsSelected(key)"
              class="white--text"
          >
<!--            <v-icon left>mdi-check</v-icon>-->
            {{ getKeyDisplayName(key) }}
          </v-chip>
        </v-chip-group>
      </v-card>


<!--      <v-card v-else class="pa-4">-->
<!--        <v-chip-group-->
<!--            v-model="selected"-->
<!--            :multiple="myConfig.isMultiple"-->
<!--            :mandatory="false"-->
<!--            column-->
<!--        >-->
<!--          <v-chip-->
<!--              v-for="key in selected"-->
<!--              :key="key"-->
<!--              :value="key"-->
<!--              color="primary"-->
<!--              class="white&#45;&#45;text"-->
<!--              :disabled="myConfig?.disableKeys?.includes(key)"-->
<!--          >-->
<!--            <v-icon left>mdi-check</v-icon>-->
<!--            {{ getKeyDisplayName(key) }}-->
<!--          </v-chip>-->
<!--          <v-chip-->
<!--              v-for="key in unselectedOptions"-->
<!--              :key="key"-->
<!--              :value="key"-->
<!--              color="primary"-->
<!--              outlined-->
<!--          >-->
<!--            {{ getKeyDisplayName(key) }}-->
<!--          </v-chip>-->

<!--        </v-chip-group>-->

<!--      </v-card>-->



    </v-menu>
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
      isDialogOpen: false,
      foo: 42,
      isAllFiltersDialogOpen: false,
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
        }
        else if (this.action === "group_by") {
          return url.getGroupBy(this.$route)
        }
        else if (this.action === "column") {
          return url.getColumn(this.$route)
        }
      },
      set(to) {
        if (this.action === 'sort') {
          url.setSort(to)
        }
        else if (this.action === "group_by") {
          url.setGroupBy(to)
        }
        else if (this.action === "column") {
          url.setColumn(to)
        }
      }
    },
    selectedOptions() {
      return url.getActionValueKeys(this.$route, this.action)
    },
    allOptions(){
      const options = facetConfigs(this.entityType)
          .filter(conf => conf.actions?.includes(this.action))
          .map(conf => conf.key)

      options.sort((a, b) => {
        return this.keyIsSelected(a) ? -1 : 1
      })
      return options
    },
    unselectedOptions() {
      return facetConfigs(this.entityType)
          .filter(config => {
            // return !this.selectedOptions.includes(config.key)
            return !this.selected.includes(config.key)
          })
          .map(config => {
            return config.key
          })


      return getActionConfig(this.action).topValues.filter(k => {
        return !this.selected?.includes(k)
      })
          .filter(k => {
            const conf = getFacetConfig(this.entityType, k)
            return url.isSearchFilterApplied() || conf.type !== "search"
          })
    },
    isClearable(){
      return (this.action === 'group_by' && !!this.selected)
    },



    myConfig() {
      return getActionConfig(this.action)
    },
    selectedKeyDisplayName() {
      if (!this.selectedOptions[0]) return
      if (this.myConfig.isMultiple) return
      const key = this.selectedOptions[0]
      return getFacetConfig(this.entityType, key).displayName
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
    getKeyDisplayName(key){
      return getFacetConfig(this.entityType, key)?.displayName
    },
    keyIsSelected(key){
      return this.myConfig.isMultiple ?
          this.selected?.includes(key) :
          this.selected === key
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


      }
    },
  }
}
</script>

<style scoped lang="scss">

</style>