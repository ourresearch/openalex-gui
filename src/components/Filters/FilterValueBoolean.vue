<template>
  <div>
    <v-select
      dense
      :items="options"
      item-text="displayValue"
      item-value="value"
      v-model="selectedValue"

      @change="$emit('submit', selectedValue)"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";

export default {
  name: "FilterValueBoolean",
  components: {
  },
  props: {
    readonly: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      options: [],
      selectedValue: this.filterValue,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
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
    this.options = await api.getGroups(this.entityType, this.filterKey, {})
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>