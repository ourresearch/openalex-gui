<template>
  <v-card
      flat
      class="mb-8"
  >
    <v-toolbar flat dense class="elevation-0">
      <v-icon left>mdi-filter-outline</v-icon>
      <v-toolbar-title>
        Filters
        <span class="body-2">
          ({{ filters.length }})
        </span>
      </v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom>
        <template v-slot:activator="{on}">
          <v-btn v-on="on" icon>
            <v-icon>mdi-filter-off-outline</v-icon>
          </v-btn>
        </template>
        <div>Clear all filters</div>
      </v-tooltip>
    </v-toolbar>


    <v-list class="pt-0">
      <v-list-item
          v-for="(filter, i) in filters"
          :key="filter.key"
      >
        <div class="">
          <v-btn icon @click="$emit('delete', filter.key)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-list-item-content>
          <div class="d-flex align-center">
            <div>{{ filter.displayName }}</div>
            <component
                :is="'filter-value-' + filter.type"
                :filter-key="filter.key"
                :filter-value="filter.value"
                @update="(newValue) => $emit('update', filter.key, newValue)"
            />
          </div>
        </v-list-item-content>
      </v-list-item>
      <v-list-item
          key="filter-to-create"
          v-if="filterToCreate"
      >
        <div class="">
          <v-btn icon @click="filterToCreate = null">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-list-item-content>
          <div class="d-flex align-center">
            <div>{{ filterToCreate.displayName }}</div>
            <component
                :is="'filter-value-' + filterToCreate.type"
                :filter-key="filterToCreate.key"
                @update="(newValue) => $emit('create', filterToCreate.key, newValue)"
            />
          </div>
        </v-list-item-content>
      </v-list-item>
    </v-list>


    <v-card-actions>
      <v-menu max-height="90vh">
        <template v-slot:activator="{on}">
          <v-btn
              fab
              color="primary"
              v-on="on"
              style="margin-bottom: -33px"
          >
            <v-icon left class="">mdi-filter-plus-outline</v-icon>
          </v-btn>
        </template>
        <filter-key-selector
            @select="setFilterToCreate"
        />
      </v-menu>

    </v-card-actions>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {createSimpleFilter} from "../../filterConfigs";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";
import FilterValueBoolean from "./FilterValueBoolean.vue";
import FilterValueRange from "./FilterValueRange.vue";
import FilterValueSelect from "./FilterValueSelect.vue";
import FilterValueSearch from "./FilterValueSearch.vue";

export default {
  name: "Template",
  components: {
    FilterKeySelector,
    FilterValueBoolean,
    FilterValueRange,
    FilterValueSelect,
    FilterValueSearch,
  },
  props: {
    filters: Array,
  },
  data() {
    return {
      foo: 42,
      filterToCreate: null,
    }
  },
  computed: {
    ...mapGetters([
        "entityType",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setFilterToCreate(filterKey) {
        this.filterToCreate = createSimpleFilter(this.entityType, filterKey)
    }


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