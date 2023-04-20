<template>
  <span>
    <router-link
        :to="link"
        style="display: inline-block; white-space: nowrap;"
        class="text-decoration-none"
        v-if="count"
    ><span>{{ count | millify }}</span> <!--{{ entityType }}--></router-link>
    <span
        style="display: inline-block; white-space: nowrap;"
        class="grey--text"
        v-else
    ><strong>0</strong> {{ entityType }}</span>

  </span>
</template>


<script>
import {createSimpleFilter} from "../filterConfigs";

export default {
  components: {},
  props: {
    count: Number,
    entityType: String,
    filterKey: String,
    filterValue: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  methods: {},
  computed: {
    link() {
      const filter = createSimpleFilter(this.entityType, this.filterKey, this.filterValue)
      return {
        name: "Serp",
        params: {entityType: this.entityType},
        query: {filter: filter.asStr},
      }
    }
  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">


</style>