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
      const myUrl = url.makeGroupByUrl(
          this.filterKey,
          {searchString: this.searchString},
      )
      try {
        const resp = await axios.get(myUrl)
        if (resp.data.meta.q && resp.data.meta.q !== this.searchString) {
          throw new Error(`response with q="${resp.data.meta.q}" no longer matches current searchString "${this.searchString}"`)
        }
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