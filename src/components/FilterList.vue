<template>
  <div>
    <div v-if="filters.length" class="text-body-2 px-5 py-2 text-grey">
      Show {{ entityType }} where:
    </div>
    <v-card rounded flat class="mb-12">

      <div class="px-2" v-if="!isCollapsed">
        <div v-if="filters.length === 0" class="mx-5 my-2 pt-5 text-grey">
          No filters applied
        </div>
        <table v-if="$vuetify.display.mdAndUp" style="width: 100%;">
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
              size="small"
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

import {mapGetters} from "vuex";

import {url} from "@/url";
import {getEntityConfig} from "@/entityConfigs";

import FilterBoolean from "@/components/Filter/FilterBoolean.vue";
import FilterRange from "@/components/Filter/FilterRange.vue";
import FilterSearch from "@/components/Filter/FilterSearch.vue";
import FilterSelect from "@/components/Filter/FilterSelect.vue";
import AddFilter from "@/components/AddFilter.vue";

export default {
  name: "FilterList",
  components: {
    FilterBoolean,
    FilterRange,
    FilterSearch,
    FilterSelect,
    AddFilter,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
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
    clearEverything() {
      url.pushNewFilters([])
    }
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


<style lang="scss" scoped>

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