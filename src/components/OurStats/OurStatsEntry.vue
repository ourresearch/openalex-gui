<template>
  <span>
    <v-progress-circular :color="color" :size="loadingSpinnerSize" v-if="isLoading" indeterminate></v-progress-circular>
    <span v-if="count">
    {{ filters.millify(count) }}

    </span>
  </span>
</template>


<script>

import {api} from "@/api";
import filters from "@/filters";

export default {
  name: "OurStatsEntry",
  components: {
  },
  props: {
    entityType: String,
    loadingSpinnerSize: {
      type: Number,
      default: 28
    },
    filterKey: String,
    filterValue: String|Boolean,
    color: String,
  },
  data() {
    return {
      isLoading: false,
      filters,
    }
  },
  computed: {
  },
  asyncComputed: {
    async count(){
      this.isLoading = true;
      const myUrl = "/" + this.entityType;
      const params = {};
      if (this.filterKey && this.filterValue) {
        params.filter = `${this.filterKey}:${this.filterValue}`;
      }

      const resp = await api.get(myUrl, params);
      this.isLoading = false;
      return resp.meta.count;
    }
  },
  methods: {
  }
}
</script>


<style scoped lang="scss">

</style>