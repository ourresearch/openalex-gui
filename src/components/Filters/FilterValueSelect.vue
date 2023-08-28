<template>
  <div>
    <v-autocomplete
        dense
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
      const myUrl = url.makeGroupByUrl(
          this.filterKey,
          {searchString: this.searchString},
      )
      const resp = await axios.get(myUrl)
      this.options = resp.data.group_by.map(group => {
        return createDisplayFilter(
            this.entityType,
            this.filterKey,
            group.key,
            false,
            group.key_display_name,
            group.count,
        )
      })
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