<template>
  <pre>
    {{ groups }}
  </pre>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {createDisplayFilter} from "@/filterConfigs";
import axios from "axios";
import {facetConfigs} from "@/facetConfigs";

export default {
  name: "FilterValueSelect",
  components: {},
  props: {
    filterKey: String,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      selectedValue: this.filterValue,
      groups: [],
      searchString: "",
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    myFilterConfig() {
      return facetConfigs(this.entityType).find(c => c.key === this.filterKey)
    },
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
          {},
      )
      try {
        const resp = await axios.get(myUrl)
        this.groups = resp.data.group_by.map(group => {
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