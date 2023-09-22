<template>
      <v-list-item
          @click="$emit('edit')"
      >
        <v-list-item-icon>
          <v-icon>{{ myFilterConfig.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            <q>{{ myFilterValue }}</q>
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ myFilterConfig.displayName }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-btn icon @click="$emit('delete', filterKey)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import FilterEditSearch from "@/components/FilterEdit/FilterEditSearch.vue";
import FilterEditRange from "@/components/FilterEdit/FilterEditRange.vue";

export default {
  name: "FilterValueSearch",
  components: {
    FilterEditRange,
    FilterEditSearch,
  },
  props: {
    filterKey: String,
    filterValue: String,
  },
  data() {
    return {
      foo: 42,
      myFilterValue: this.filterValue,
      myFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.myFilterKey)
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    setIsNegated(val) {
      this.myIsNegated = !!val
      this.submit()
    },
    submit() {
      this.$emit("submit", this.myFilterValue, this.myIsNegated)
    }

  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>