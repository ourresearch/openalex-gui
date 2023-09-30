<template>
  <span>
    <filter-value-chip :filter-key="filterKey" :filter-value="items[0]" />

<!--    {{ filterKey }}: {{ items }}-->
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getItemsFromSelectFilterValue} from "../../filterConfigs";
import FilterValueChip from "../FilterEdit/FilterValueChip.vue";

export default {
  name: "Template",
  components: {
    FilterValueChip
  },
  props: {
    filterValue: String,
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    items(){
      return getItemsFromSelectFilterValue(this.filterValue)
    }
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
  }
}
</script>

<style scoped lang="scss">

</style>