<template>
  <div>
    <v-autocomplete
        :items="filters"
        item-text="displayName"
        item-value="key"
        class="mr-3"
        v-model="selectedFilterKey"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {filtersList} from "@/facetConfigs";

export default {
  name: "FilterKey",
  components: {},
  props: {
    readonly: Boolean,
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      selectedFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersList(this.entityType, [], "")
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
  watch: {
    selectedFilterKey(to, from){
      this.$emit("change", to)
    }
  }
}
</script>

<style scoped lang="scss">

</style>