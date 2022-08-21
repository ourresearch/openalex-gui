<template>
  <v-card
      outlined
      flat
      class="mb-8"
      v-if="resultsFilters.length"
  >
    <v-toolbar dense flat class="pr-0">
      <v-toolbar-title class="subtitle-1 font-weight-bold">
        <v-icon small>mdi-filter-outline</v-icon>
        {{ resultsFilters.length }} filter{{ (resultsFilters.length !== 1) ? "s" : "" }}

      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn
            small
            text
            color="primary"
            :disabled="resultsFilters.length === 0"
            @click="removeAllInputFilters"
        >
          <v-icon left small>mdi-close</v-icon>
          Clear
        </v-btn>

      </v-toolbar-items>
    </v-toolbar>
    <v-divider></v-divider>
    <v-row v-if="$store.state.resultsFilters.length" class="py-3 px-3">
      <v-col cols="9">
        <table class="serp-filters-list">
          <tr
              v-for="f in $store.state.resultsFilters"
              :key="f.id"
          >
            <td>
              <v-btn
                  icon
                  x-small
                  class="align-baseline"
                  @click="removeInputFilters([f])"
              >
                <v-icon small>mdi-close</v-icon>
              </v-btn>

            </td>
            <td class="filter-key  pr-1">
              {{ getFacetConfig(f.key, "displayName") }}:
            </td>
            <td class="filter-value">
              <template v-if="getFacetConfig(f.key, 'entityId')">
                <!--            <v-icon style="vertical-align: unset" small>{{getEntityIcon(f.key)}}</v-icon>-->
                {{ f.displayValue }}
              </template>
              <template v-else>
                {{ f.displayValue }}
              </template>
            </td>
          </tr>
        </table>
      </v-col>
      <v-col cols="3" class="d-flex justify-end">

      </v-col>
    </v-row>
    <!--    <v-divider class="my-4"></v-divider>-->

  </v-card>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";
import {entityConfigs} from "../entityConfigs";


export default {
  name: "SerpFiltersList",
  components: {},
  props: {},
  data() {
    return {
      loading: false,
      getFacetConfig,
    }
  },
  computed: {
    ...mapGetters([
        "resultsFilters"
    ]),
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
        "removeAllInputFilters",
        "removeInputFilters",
    ]),
    getEntityIcon(facetKey) {
      const entityId = getFacetConfig(facetKey, "entityId")
      if (!entityId) return
      return entityConfigs[entityId].icon

    }
  },

  created() {
  },
  async mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">
table.serp-filters-list {
  td {
    //align-items: baseline;
    vertical-align: unset;
  }
}

</style>