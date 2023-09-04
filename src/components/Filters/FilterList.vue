<template>
  <v-card
      class="mb-8"
  >
    <v-toolbar
        dark
        class=""
    >
      <!--      <v-icon left>mdi-filter-multiple-outline</v-icon>-->
      <v-menu max-height="90vh">
        <template v-slot:activator="{on}">
          <v-fab-transition>
            <v-btn
                fab
                :disabled="!!filterToCreate"
                color="primary lighten-1"
                v-on="on"
                style="margin: 0 0 -63px -8px;"
                v-if="fabIsVisible"
                small

            >
<!--              <v-icon class="">mdi-filter-plus-outline</v-icon>-->
              <v-icon class="">mdi-plus</v-icon>
            </v-btn>

          </v-fab-transition>
        </template>
        <filter-key-selector
            :disabled-keys="filters.map(f=>f.key)"
            @select="setFilterToCreate"
        />
      </v-menu>
      <v-toolbar-title>
        Filters
<!--        <span class="body-2">-->
<!--          ({{ filters.length }})-->
<!--        </span>-->
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
    <div v-if="!filters.length && !filterToCreate" class="grey--text ml-4 pt-6">
      There are no filters applied.
    </div>
    <v-list nav  class="pt-6">
      <!--      <v-divider />-->
      <template
          v-for="(filter, i) in filters"
      >
        <v-list-item
            :key="filter.key"
        >
          <v-list-item-icon class="">
            <v-icon>{{ filter.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
<!--            <v-row>-->
<!--              <v-col cols="3" class="">-->
<!--                <div class="pt-2">{{ filter.displayName }}</div>-->
<!--              </v-col>-->
<!--              <v-col cols="9" class="">-->
                  <component
                      class="flex-grow-1"
                      :is="'filter-value-' + filter.type"
                      :filter-key="filter.key"
                      :filter-value="filter.value"
                      @update="(newValue) => updateFilter(filter.key, newValue)"
                  />
<!--              </v-col>-->
<!--            </v-row>-->
          </v-list-item-content>

          <v-list-item-action>
            <v-btn icon @click="$emit('delete', filter.key)">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <!--        <v-divider />-->
      </template>


      <v-list-item
            key="filter-to-create"
            v-if="!!filterToCreate"
        >
          <v-list-item-icon class="">
            <v-icon>{{ filterToCreate.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
                  <component
                      :is="'filter-value-' + filterToCreate.type"
                      :filter-key="filterToCreate.key"
                      :filter-value="filterToCreate.value"
                      @update="createFilter"
                  />
          </v-list-item-content>

          <v-list-item-action>
            <v-btn icon @click="filterToCreate = null">
              <v-icon>mdi-delete-outline</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      <!--      <v-divider v-if="!!filterToCreate"></v-divider>-->
    </v-list>

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
      fabIsVisible: false,
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
      const filterToCreate = createSimpleFilter(this.entityType, filterKey)
      if (filterToCreate.type === "boolean") {
        this.$emit("create", filterKey, filterToCreate.value)
      } else {
        this.filterToCreate = filterToCreate
      }
    },
    createFilter(newValue) {
      this.$emit("create", this.filterToCreate.key, newValue)
      this.filterToCreate = null
    },
    updateFilter(filterKey, newValue) {
      console.log("updateFilter", filterKey, newValue)
      if (newValue === "" || newValue === "-"){
        this.$emit("delete", filterKey)
      }
      else {
        this.$emit("update", filterKey, newValue)

      }
    },


  },
  created() {
  },
  mounted() {
    this.fabIsVisible = true
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>