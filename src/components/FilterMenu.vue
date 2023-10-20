<template>
  <div>
    <v-menu rounded offset-y>
      <template v-slot:activator="{on}">
        <v-btn
            text
            rounded
            v-on="on"
            class="text-capitalize"
            :disabled="disabled"
        >
          {{ action }}

        </v-btn>
      </template>
      <v-card flat rounded>
        <v-list-item-group v-model="selected" :multiple="isMultipleSelect">
          <v-list-item
            v-for="filterConfig in topFilters"
            :key="filterConfig.key"
            :value="filterConfig.key"
          >
            <v-list-item-icon>
              <v-icon v-if="selected === filterConfig.key">mdi-check</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ filterConfig.displayName }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
        <v-list>
        <v-divider />
        <v-list-item
            key="link-to-more"
          >
            <v-list-item-content>
              <v-list-item-title>
                More
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

      </v-card>
    </v-menu>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetsByCategory, getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";


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
    topFilters(){
      const config = {
        filter: facetsByCategory(this.entityType)[0].filterConfigs,
        "group by": facetsByCategory(this.entityType)[0].filterConfigs,
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
    isMultipleSelect(){
      return ["filter", "column"].includes(this.action)
    },
    urlAction(){
      return this.action.replace(" ", "_")
    },
    selected: {
      get(){
        if (this.action === "filter") {

        }
        else if (this.action === "group by") {
         return this.$route.query.group_by
        }
        else if (this.action === "sort") {
          return this.$route.query.sort?.replace(":desc", "")
        }
        else if (this.action === "column") {
          return this.$route.query?.column?.split(",") ?? []
        }
      },
      set(to){
        const query = {
          ...this.$route.query,
          page: undefined,
        }
        if (this.action === "filter") {

        }
        else if (this.action === "group by") {
          query.sort = undefined
          query.group_by = to
        }
        else if (this.action === "sort") {
          query.sort = to + ":desc"
        }
        else if (this.action === "column") {
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
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


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