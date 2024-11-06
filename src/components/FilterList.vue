<template>
  <div>

<!--    <v-toolbar dense flat rounded color="transparent" height="30">-->
<!--      &lt;!&ndash;      <v-toolbar-title class="font-weight-bold">&ndash;&gt;-->
<!--      &lt;!&ndash;        <span>{{ filters.length }}</span>&ndash;&gt;-->
<!--      &lt;!&ndash;        {{ "Filter" | pluralize(filters.length) }}&ndash;&gt;-->
<!--      &lt;!&ndash;      </v-toolbar-title>&ndash;&gt;-->
<!--      <v-list-subheader class=" ">-->
<!--        Filter {{ entityType }} by:-->
<!--      </v-list-subheader>-->
<!--      <v-spacer/>-->


<!--      <add-filter v-if="isCollapsed"/>-->
<!--      &lt;!&ndash;      <v-btn small rounded text :disabled="filters.length === 0"  @click="clearEverything">&ndash;&gt;-->
<!--      &lt;!&ndash;        <v-icon small left>mdi-delete-outline</v-icon>&ndash;&gt;-->
<!--      &lt;!&ndash;        clear&ndash;&gt;-->
<!--      &lt;!&ndash;      </v-btn>&ndash;&gt;-->

<!--      &lt;!&ndash;      <v-btn icon @click="isCollapsed = !isCollapsed">&ndash;&gt;-->
<!--      &lt;!&ndash;        <v-icon>{{ isCollapsed ? "mdi-chevron-down" : "mdi-chevron-up" }}</v-icon>&ndash;&gt;-->
<!--      &lt;!&ndash;      </v-btn>&ndash;&gt;-->
<!--    </v-toolbar>-->

      <div v-if="filters.length" class="body-2 px-5 py-2 grey--text">
        Show {{ entityType }} where:
      </div>
    <v-card rounded flat class="mb-12">

      <div class="px-2" v-if="!isCollapsed">
        <!--      <v-divider/>-->
        <div v-if="filters.length === 0" class="mx-5 my-2 pt-5 grey--text">
          No filters applied
        </div>
        <table v-if="isMdAndUp" style="width: 100%;">
          <tbody>
          <component
              class=""
              style="width: 100%;"
              v-for="(filter, i) in filters"
              :key="i"
              :is="'filter-' + filter.type"
              :filter-key="filter.key"
              :index="i"
              @delete="url.deleteFilter(entityType, filter.key)"
          />
          </tbody>
        </table>
        <div v-else>
          <component
              class=""
              style="width: 100%;"
              v-for="(filter, i) in filters"
              :key="i"
              :is="'filter-' + filter.type"
              :filter-key="filter.key"
              :index="i"
              @delete="url.deleteFilter(entityType, filter.key)"
          />
        </div>
        <div class="d-flex" style="height: 30px;">
          <add-filter class="ml-0" style="position: relative; top: 0px;"/>
          <v-btn
              @click="clearEverything"
              v-if="filters.length"
              fab
              small
              class="ml-3 elevation-0"
              color="white"
              style="position: relative; top: 5px; border: 2px solid #fff;"
          >
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </div>


      </div>


    </v-card>
  </div>


</template>

<script>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import {mapActions, mapGetters, mapMutations} from "vuex";
import FilterBoolean from "@/components/Filter/FilterBoolean.vue";
import FilterRange from "@/components/Filter/FilterRange.vue";
import FilterSearch from "@/components/Filter/FilterSearch.vue";
import FilterSelect from "@/components/Filter/FilterSelect.vue";
import AddFilter from "@/components/AddFilter.vue";

// import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {url} from "@/url";
// import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import Action from "@/components/Action/Action.vue";
// import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
// import {clear} from "core-js/internals/task";

export default {
  name: "Template",
  components: {
    Action,
    SerpResultsCount,
    FilterBoolean,
    FilterRange,
    FilterSearch,
    FilterSelect,
    AddFilter,


  },
  props: {
    resultsObject: Object,
  },
  setup(props) {
    const { mdAndUp } = useDisplay();
    const isMdAndUp = computed(() => mdAndUp.value)

    return {
      isMdAndUp
    };
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
    clearEverything() {
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
  //tr {
  //  display: flex;
  //}
}


</style>
