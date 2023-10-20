<template>
  <v-card flat class="d-flex align-center">
    <span class="mr-2">
      {{ myConfig.displayName }}
    </span>
    <v-chip-group
        v-model="selected"
        :mandatory="false"
        :multiple="isMultipleSelect"
    >
      <v-chip
          v-for="filterConfig in topFilters"
          :key="filterConfig.key"
          :value="filterConfig.key"
          class="text--primary"

          :outlined="!isSelected(filterConfig.key)"
          filter
          label
      >
        {{ filterConfig.displayName }}
      </v-chip>

    </v-chip-group>

  </v-card>
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
    myConfig(){
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
    isSelected(key){
      return this.selected === key || this.selected?.includes(key)
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