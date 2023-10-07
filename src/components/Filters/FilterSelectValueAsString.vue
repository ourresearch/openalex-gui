<template>
  <span v-if="filterValueOptions">
    <template v-if="count">({{ filterValueOptions.length }})</template>
    <template v-else>
      <span v-if="firstOptionIsNegated" class="font-weight-bold">NOT </span>
      {{ firstOptionDisplayName }}
      <span class="font-weight-bold " v-if="filterValueOptions.length > 1">
            +{{ filterValueOptions.length - 1 }}
          </span>
    </template>
    <!--    <filter-value-chip v-else :filter-key="filterKey" :filter-value="items[0]" />-->

    <!--    {{ filterKey }}: {{ items }}-->
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getItemsFromSelectFilterValue} from "../../filterConfigs";
import {url} from "../../url";
import {api} from "../../api";

export default {
  name: "Template",
  components: {
  },
  props: {
    filterKey: String,
    count: Boolean,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterValueOptions() {
      return this.filterValue?.split(/[+|]/)
    },
    filterValue() {
      return url.readFilterValue(this.entityType, this.filterKey)
    },
    firstOptionIsNegated() {
      return this.filterValueOptions[0].includes("!")
    },
    firstOptionId() {
      return this.filterValueOptions[0].replace("!", "")
    },
  },
  asyncComputed: {
    firstOptionDisplayName: async function () {
      if (!this.filterValueOptions) return
      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.firstOptionId)
      this.isLoading = false
      return resp.display_name
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
  watch: {}
}
</script>

<style scoped lang="scss">

</style>