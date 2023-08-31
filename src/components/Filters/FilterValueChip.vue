<template>
  <v-chip
      close
      @click:close="$emit('remove')"
  >
    <v-progress-circular v-if="isLoading" size="18" indeterminate class="mr-2" />
    <template v-if="filterDisplayValue">
      {{ filterDisplayValue }}
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
  name: "FilterValueChip",
  components: {},
  props: {
    filterValue: String,
    filterKey: String,
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
      const resp = await api.getEntityDisplayName(this.filterValue)
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