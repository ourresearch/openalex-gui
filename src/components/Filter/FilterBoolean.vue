<template>
  <filter-base :filter-key="filterKey" :index="index" >
    <span class="pl-6">
      {{ config.displayName }}
    </span>
  </filter-base>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs} from "../../facetConfigs";
import {url} from "@/url";

import FilterBase from "@/components/Filter/FilterBase.vue";

export default {
  name: "FilterBoolean",
  components: {
    FilterBase,
  },
  props: {
    filterKey: String,
    index: Number,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
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