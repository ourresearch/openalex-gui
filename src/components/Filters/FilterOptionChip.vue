<template>
  <v-chip
      close
      outlined
      @click:close="$emit('delete')"
  >

<!--    <v-progress-circular v-if="isLoading" size="10" indeterminate class="mr-2" />-->
    <template v-if="filterDisplayValue">
      {{ filterDisplayValue | truncate(590) }}
    </template>
    <template v-else>
      Loading...
    </template>
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {api} from "@/api";
import {isOpenAlexId} from "@/util";

export default {
  name: "FilterOptionChip",
  components: {},
  props: {
    disabled: Boolean,
    filterValue: String,
    filterKey: String,
      close: Boolean,
  },
  data() {
    return {
      foo: 42,
      displayValue: "",
      isLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
    ]),
    isEntity(){
      return isOpenAlexId(this.filterValue)
    }
  },
  asyncComputed: {
    filterDisplayValue: async function () {
      if (!this.isEntity) return this.filterValue

      this.isLoading = true
      const resp = await api.makeAutocompleteResponseFromId(this.filterValue)
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
  async mounted() {


  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>