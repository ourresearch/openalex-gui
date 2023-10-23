<template>
  <v-menu rounded offset-y :close-on-content-click="false">
    <template v-slot:activator="{on}">
      <v-btn text rounded v-on="on" class="">
        {{ myConfig.displayName }}
      </v-btn>
    </template>

    <v-list>

      <v-list-item
          v-for="config in selectedValueConfigs"
          :key="config.key"
          :value="config.key"
          @click="removeValue(config.key)"
      >
        <v-list-item-icon>
          <v-icon>{{ config.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ config.displayName }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="isDefault(config.key)">
            {{ config.isColumnMandatory ? "Required" : "Default" }}
          </v-list-item-subtitle>

        </v-list-item-content>
        <v-list-item-icon>
          <v-icon v-if="config.isColumnMandatory">mdi-pin</v-icon>
          <v-icon v-else>mdi-checkbox-marked</v-icon>
        </v-list-item-icon>
      </v-list-item>
      <v-divider/>
      <v-list-item
          v-for="config in unselectedValueConfigs"
          :key="config.key"
          :value="config.key"
          @click="addValue(config.key)"
      >
        <v-list-item-icon>
          <v-icon>{{ config.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ config.displayName }}
          </v-list-item-title>
          <v-list-item-subtitle v-if="isDefault(config.key)">
            Default
          </v-list-item-subtitle>

        </v-list-item-content>
        <v-list-item-icon>
          <v-icon>mdi-checkbox-blank-outline</v-icon>
        </v-list-item-icon>
      </v-list-item>

    </v-list>
  </v-menu>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetsByCategory, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import {getActionConfig, getActionDefaultValues} from "@/actionConfigs";


export default {
  name: "Template",
  components: {},
  props: {
    action: String,
    disabled: Boolean,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myConfig() {
      return getActionConfig(this.action)
    },
    topFilters() {
      return this.myConfig.topValues.map(filterKey => {
        return getFacetConfig("works", filterKey)
      })


      const config = {
        filter: facetsByCategory(this.entityType)[0].filterConfigs,
        group_by: facetsByCategory(this.entityType)[0].filterConfigs,
        sort: [
          "publication_date",
          "cited_by_count"
        ].map(k => getFacetConfig(this.entityType, k)),
        column: [
          "publication_year",
          "type",
          "open_access.is_oa",
          "cited_by_count",
        ].map(k => getFacetConfig(this.entityType, k)),
      }

      return config[this.action]
    },
    isMultipleSelect() {
      return ["filter", "column"].includes(this.action)
    },
    isSelectedDirty() {
      return this.selected?.length > 0
    },
    urlAction() {
      return this.action.replace(" ", "_")
    },
    urlValues() {
      return this.$route.query[this.action]?.split(",") ?? []
    },
    urlValueKeys() {
      return this.urlValues.map(val => val.replace(":desc", ""))
    },
    selectedValueConfigs() {
      return this.urlValueKeys.map(k => {
        return getFacetConfig(this.entityType, k)
      })
    },
    unselectedValueConfigs() {
      return this.myConfig.topValues.filter(k => {
        return !this.urlValueKeys.includes(k)
      })
          .map(k => getFacetConfig(this.entityType, k))
          .filter(conf => {
            return url.isSearchFilterApplied() || conf.type !== "search"
            return !(!url.isSearchFilterApplied() && conf.type === "search")
          })
    },

    selectedConfig() {
      if (!this.selected || this.isMultipleSelect) return
      return getFacetConfig(this.entityType, this.selected)
    },
    appendToKeyValues(){
      return (this.action === "sort") ? ":desc" : ""
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    isSelected(key) {
      return this.selected === key || this.selected?.includes(key)
    },
    addValue(key) {
      const myKey = key + this.appendToKeyValues
      const newKeys = [...this.urlValues, myKey]
      const query = {
        ...this.$route.query,
        [this.action]: newKeys.join(","),
      }
      url.pushToRoute(
          this.$router,
          {
            name: "Serp",
            query,
          }
      )
    },
    removeValue(key){
      if (key === "display_name") return
      console.log("remove value", key)


      let newKeys = this.urlValueKeys.filter(k => {
        return k !== key
      })

      if (this.action === "sort" && newKeys.length === 0){
        newKeys = getActionDefaultValues(this.action, this.$route.query)
      }

      const query = {
        ...this.$route.query,
        [this.action]: newKeys.map(k => k + this.myConfig.appendToValues).join(",")
      }


      url.pushToRoute(
          this.$router,
          {
            name: "Serp",
            query,
          }
      )
    },
    isDefault(key){
      const defaults = getActionDefaultValues(this.action, this.$route.query)
      return defaults.includes(key)
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