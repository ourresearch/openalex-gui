<template>
    <v-switch
        class="pt-0 mt-0"
      v-model="selectedValue"
      :label="String(selectedValue)"
      color="success"
      hide-details
      @change="$emit('update', selectedValue)"
    />

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
      selectedValue: this.filterValue == "true",
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