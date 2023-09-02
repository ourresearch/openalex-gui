<template>
  <v-card
      flat
      class="mb-8"
  >
    <v-toolbar flat dense class="">
<!--      <v-icon left>mdi-filter-multiple-outline</v-icon>-->
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
<!--      <v-divider />-->
      <template
          v-for="(filter, i) in filters"
      >
        <v-list-item
            :key="filter.key"
            :disabled="!!filterToCreate"
        >
          <div class="mr-2">
            <v-icon :disabled="!!filterToCreate">mdi-filter-outline</v-icon>

          </div>
          <v-list-item-content>
            <div class="d-flex align-center">
              <div class="">{{ filter.displayName }}:</div>
              <component
                  :is="'filter-value-' + filter.type"
                  :disabled="!!filterToCreate"
                  :filter-key="filter.key"
                  :filter-value="filter.value"
                  @update="(newValue) => $emit('update', filter.key, newValue)"
              />
            </div>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn :disabled="!!filterToCreate" icon @click="$emit('delete', filter.key)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
<!--        <v-divider />-->
      </template>



      <v-list-item
          key="filter-to-create"
          v-if="filterToCreate"
          class=""

      >
        <div class="mr-3">
            <v-icon>mdi-filter-plus-outline</v-icon>

        </div>
        <v-list-item-content>
          <div class="d-flex align-center ">
            <div class="font-weight-bold ">{{ filterToCreate.displayName }}: </div>
            <component
                :is="'filter-value-' + filterToCreate.type"
                :filter-key="filterToCreate.key"
                :filter-value="filterToCreate.value"
                @update="createFilter"
            />
          </div>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn text @click="filterToCreate = null">
            Cancel
          </v-btn>
        </v-list-item-action>
      </v-list-item>
<!--      <v-divider v-if="!!filterToCreate"></v-divider>-->
    </v-list>


    <v-card-actions>
      <v-menu max-height="90vh">
        <template v-slot:activator="{on}">
          <v-btn
              fab
              :disabled="!!filterToCreate"
              color="primary"
              v-on="on"
              style="margin-bottom: -33px"
          >
            <v-icon left class="">mdi-filter-plus-outline</v-icon>
          </v-btn>
        </template>
        <filter-key-selector
            :disabled-keys="filters.map(f=>f.key)"
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