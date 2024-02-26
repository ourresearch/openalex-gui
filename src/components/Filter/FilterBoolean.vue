<template>
  <filter-base :filter-key="filterKey" :index="index" >
    <td>
      {{ config.displayName }}
    </td>


  </filter-base>


</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {createSimpleFilter} from "@/filterConfigs";
import {url} from "@/url";

import FilterBase from "@/components/Filter/FilterBase.vue";

export default {
  name: "FilterValueSearch",
  components: {
    FilterBase,
  },
  props: {
    filterKey: String,
    index: Number,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    config() {
      return facetConfigs().find(c => c.key === this.filterKey)
    },
    value: {
      get() {
        return url.readFilterValue(this.$route, this.entityType, this.index)
      },
      set(to) {
        this.value === undefined ?
            url.createFilter(this.entityType, this.filterKey, to) :
            url.updateFilter(this.entityType, this.index, to)

        // url.upsertFilter(
        //     this.entityType,
        //     this.filterKey,
        //     !!to
        // )
      }

    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    deleteMe() {
      url.deleteFilter(this.entityType, this.filterKey)
    },
    toggleValue() {

    },

  },
  created() {
  },
  mounted() {
  },
  watch: {
    '$route': {
      immediate: true,
      handler: function (to, from) {
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>