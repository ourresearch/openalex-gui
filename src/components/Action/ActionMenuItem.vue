<template>
  <v-menu rounded offset-y>
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

        </v-list-item-content>
        <v-list-item-icon>
          <v-icon>mdi-checkbox-marked</v-icon>
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
import {getActionConfig} from "@/actionConfigs";


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
      }).map(k => getFacetConfig(this.entityType, k))
    },

    selected: {
      get() {
        if (this.action === "filter") {


        } else if (this.action === "group_by") {
          return this.$route.query.group_by
        } else if (this.action === "sort") {
          return this.$route.query.sort?.replace(":desc", "")
        } else if (this.action === "column") {
          return this.$route.query?.column?.split(",") ?? []
        }
      },
      set(to) {
        const query = {
          ...this.$route.query,
          page: undefined,
        }
        if (this.action === "filter") {

        } else if (this.action === "group_by") {
          query.sort = undefined
          query.group_by = to
        } else if (this.action === "sort") {
          query.sort = to + ":desc"
        } else if (this.action === "column") {
          query.column = to.length ? to.join(",") : undefined
        }

        url.pushToRoute(
            this.$router,
            {
              name: "Serp",
              query,
            }
        )
      }
    },
    selectedConfig() {
      if (!this.selected || this.isMultipleSelect) return
      return getFacetConfig(this.entityType, this.selected)
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
      const appendToKey = (this.action === 'sort') ? ':desc' : ''
      const myKey = key + appendToKey
      const query = {...this.$route.query}
      const newKeys = [...this.urlValues, myKey]
      query[this.action] = newKeys.join(",")
      url.pushToRoute(
          this.$router,
          {
            name: "Serp",
            query,
          }
      )
    },
    removeValue(key){
      console.log("remove value", key)
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