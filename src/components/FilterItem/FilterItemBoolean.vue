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
            {{ myFilterConfig.displayName}}
          </v-card-title>
          <v-card-text>
            {{ myFilterConfig.docstring }}
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="error" rounded @click="$emit('delete')">
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
    </v-menu>
    is
      <a
          class="font-weight-bold"
          @click="toggleMyFilterValue"
      >
         {{ myFilterValue }}{{ (appendSeparator) ? ";" : "" }}
      </a>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {getFacetConfig} from "@/facetConfigs";
import FilterEditBoolean from "@/components/FilterEdit/FilterEditBoolean.vue";

export default {
  name: "FilterValueBoolean",
  components: {
    FilterEditBoolean,
  },
  props: {
    disabled: Boolean,
    filterKey: String,
    filterValue: [Boolean, String],
    appendSeparator: Boolean,
  },
  data() {
    return {
      foo: 42,
      options: [],
      myFilterValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    label() {
      const negationString = (this.myFilterValue) ? "" : "NOT"
      return `${negationString} ${this.myFilterConfig.displayName}`
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    toggleMyFilterValue(){
      this.myFilterValue = !this.myFilterValue
      this.$emit("update", this.myFilterValue)
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

</style>