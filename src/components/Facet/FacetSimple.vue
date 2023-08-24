<template>
  <v-list-item

          style="min-height: 35px;"
          @click="url.setGroupBy(config.key)"
  >
<!--    <v-icon :color="myColor" class="mr-2">{{ config.icon }}</v-icon>-->
    <v-list-item-content>
      <v-list-item-title style="font-size: 15px;">
      <span v-if="myResultsFilters.length" class="font-weight-bold" :class="myTextColor">
        {{ config.displayName }} ({{ myResultsFilters.length }})
      </span>
      <span v-else :class="myTextColor">
        {{ config.displayName }}
      </span>

      </v-list-item-title>

    </v-list-item-content>
  </v-list-item>
</template>

<script>


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {prettyTitle} from "../../util";
import {url} from "@/url";

export default {
    name: "Facet",
    components: {},
    props: {
        facetKey: String,
        facetEntityType: String,
    },
    data() {
        return {
            foo: 42,
          url,
        }
    },
    computed: {
        ...mapGetters([
            "searchApiUrl",
            "resultsFilters",
            "resultsFiltersAny",
            "resultsFiltersNegated",
            "entityType",
            "textSearch",
        ]),
        config() {
            return getFacetConfig(this.facetEntityType, this.facetKey)
        },
        myResultsFilters() {
            return this.resultsFilters.filter(f => {
                return f.key === this.facetKey
            })
        },
        myColor() {
          return (this.myResultsFilters.length) ? "green" : null
        },
        myTextColor() {
            return (this.myResultsFilters.length) ? "green--text" : null
        }
    },
    methods: {
        ...mapMutations([
            "snackbar",
        ]),
        ...mapActions([]),
        prettyTitle,
    },

    created() {
    },
    async mounted() {
    },
    watch: {}
}
</script>

<style lang="scss">
</style>