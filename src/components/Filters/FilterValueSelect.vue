<template>
  <div>
    <v-autocomplete
        dense
        :loading="isLoading"
        :items="options"
        item-text="displayValue"
        v-model="selectedValue"
        :search-input.sync="searchString"
        @change="$emit('submit', selectedValue)"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {api} from "@/api";

export default {
  name: "FilterValueSelect",
  components: {},
  props: {
    readonly: Boolean,
    filterKey: String,
    filterValue: String,
    displayValue: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      options: [],
      searchString: "",
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
    async fetchOptions() {
      this.isLoading = true
      try {
        this.options = await api.getGroups(this.entityType, this.filterKey, {})
      }
      catch(e){
        console.log("fetchFilters() error:", e.message)
      }
      finally {
        this.isLoading = false
      }
    }


  },
  created() {
  },
  mounted() {

  },
  watch: {
    searchString: {
      immediate: true,
      handler: async function (newVal, oldVal) {
        await this.fetchOptions()
      },
    }

  }
}
</script>

<style scoped lang="scss">

</style>