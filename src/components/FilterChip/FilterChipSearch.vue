<template>
      <v-chip
      @click="$emit('edit')"
      close
      label
      color="primary"
      close-icon="mdi-close"
      @click:close="$emit('delete')"
  >

            "{{ filterValue }}"
  </v-chip>
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