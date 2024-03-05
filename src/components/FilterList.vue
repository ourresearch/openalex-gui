<template>

  <v-card rounded flat class="">
    <v-toolbar flat rounded>
      <v-icon class=" mr-3">mdi-filter-outline</v-icon>
      <v-toolbar-title class="font-weight-bold">
        Filters
        <span>({{ filters.length }})</span>
      </v-toolbar-title>
      <v-spacer/>


      <add-filter small v-if="isCollapsed"  />
      <v-btn :disabled="filters.length === 0" icon @click="clearEverything">
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>

      <v-btn icon @click="isCollapsed = !isCollapsed">
        <v-icon>{{ isCollapsed ? "mdi-chevron-down" : "mdi-chevron-up" }}</v-icon>
      </v-btn>
    </v-toolbar>

    <div v-if="!isCollapsed">
      <!--      <v-divider/>-->
      <div v-if="filters.length === 0" class="mx-5 my-2 grey--text">
        No filters applied
      </div>
      <table style="width: 100%;">
        <tbody>
        <component
            class=""
            style="width: 100%;"
            v-for="(filter, i) in filters"
            :key="i"
            :is="'filter-phrase-' + filter.type"
            :filter-key="filter.key"
            :index="i"
            @delete="url.deleteFilter(entityType, filter.key)"
        />
        </tbody>
      </table>

      <v-card-actions class="py-4">
        <add-filter include-chips  />
      </v-card-actions>
    </div>


  </v-card>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

import FilterPhraseSearch from "@/components/Filter/FilterSearch.vue";
import FilterPhraseSelect from "@/components/Filter/FilterSelect.vue";
import FilterPhraseRange from "@/components/Filter/FilterRange.vue";
import FilterPhraseBoolean from "@/components/Filter/FilterBoolean.vue";
import AddFilter from "@/components/AddFilter.vue";

import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import ExportButton from "@/components/ExportButtonOld.vue";
import SearchBar from "@/components/SearchBar.vue";
import Action from "@/components/Action/Action.vue";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {clear} from "core-js/internals/task";

export default {
  name: "Template",
  components: {
    Action,
    SerpResultsCount,
    SearchBar,
    FilterPhraseSelect,
    FilterPhraseSearch,
    FilterPhraseRange,
    FilterPhraseBoolean,
    AddFilter,


    ExportButton,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      foo: 42,

      url,
      dialogs: {
        moreFilters: false
      },
      autocompleteResponses: [],
      isLoading: false,
      isCollapsed: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    entityConfig() {
      return getEntityConfig(this.entityType)
    },
    filters() {
      return url.readFilters(this.$route)
    },
    filterKeys() {
      return this.filters.map(f => f.key)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    clearEverything(){
      url.pushNewFilters([])
    }




  },
  created() {
  },
  mounted() {
  },
  watch: {
    "dialogs.moreFilters"(to) {
      if (to) this.potentialFiltersSearchString = ""
    },
    '$route': {
      immediate: true,
      handler(to, from) {
        this.activeFilterKey = null
        this.searchString = ""
      }
    },
  }
}
</script>

<style lang="scss">

.internal-search-field.v-text-field--rounded > .v-input__control > .v-input__slot {
  padding-left: 0 !important;
}

.filter {
  border-radius: 25px !important;

  &:hover {
    //background: #f4f9ff;
    //box-shadow: 5px 5px #000 !important;
  }

}

.filter-list {
  .v-text-field--rounded > .v-input__control > .v-input__slot {
    //padding: 0 !important;
  }
}

table {
  border-top: 1px solid #eee;
  border-collapse: collapse !important;
}


</style>