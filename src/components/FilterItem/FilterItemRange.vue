<template>
  <span>
        <v-menu rounded max-width="350">
          <template v-slot:activator="{on}">
            <a v-on="on">
              {{ myFilterConfig.displayName }}
            </a>
          </template>
            <v-card rounded class="">
              <v-card-title class="text-h6 font-weight-regular">
                {{ myFilterConfig.displayName }}
              </v-card-title>
              <v-card-text>
                {{ myFilterConfig.docstring }}
              </v-card-text>
              <v-card-actions>
                <v-spacer/>
                <v-btn color="error" rounded @click="$emit('delete')">
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
        </v-menu>
        is
        <v-menu :nudge-top="18" rounded max-width="350" :close-on-content-click="false">
          <template v-slot:activator="{on}">
            <a
                class="font-weight-bold"
                v-on="on"
            >
               "{{ filterValue }}{{ (appendSeparator) ? ";" : "" }}"
            </a>
          </template>
          <v-card rounded class="">
            <div class="px-4 pb-3">
              <v-text-field
                  autofocus
                  rounded
                  v-model="myFilterValue"
                  :placeholder="myFilterConfig.displayName"
                  hide-details
                  prepend-icon="mdi-magnify"
                  @keyup.enter="$emit('upsert', myFilterValue)"
              />
            </div>
            <v-divider/>
            <v-card-actions>
              <v-spacer/>
              <v-btn color="primary" rounded @click="$emit('update', myFilterValue)">
                Update
              </v-btn>
            </v-card-actions>
        </v-card>
        </v-menu>
  </span>

</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs, getFacetConfig} from "@/facetConfigs";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";

export default {
  name: "FilterValueRange",
  components: {
    FilterEditRange,
  },
  props: {
    filterKey: String,
    filterValue: String,
    appendSeparator: Boolean,
  },
  data() {
    // const splitValue = (this.filterValue) ? this.filterValue.split("-") : ["", ""]
    return {
      foo: 42,
      // start: String(splitValue[0]),
      // end: String(splitValue[1]),

      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    asStr() {
      return this.start + "-" + this.end
    },
    myFilterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },

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