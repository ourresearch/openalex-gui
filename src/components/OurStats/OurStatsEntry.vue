<template>
  <span>
    <v-progress-circular :color="color" :size="loadingSpinnerSize" v-if="isLoading" indeterminate></v-progress-circular>
    <span v-if="count">
    {{ count | millify }}

    </span>
  </span>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import axios from "axios";
import {sleep} from "../../util";

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
    }
  },
  computed: {
    ...mapGetters([

    ]),
  },
  asyncComputed: {
    async count(){
      this.isLoading = true
      const randomWaitMilliseconds = Math.random() * 10000
      await sleep(randomWaitMilliseconds)
      const myUrl = new URL("https://api.openalex.org")
      myUrl.pathname = this.entityType
      if (this.filterKey && this.filterValue) {
        const myFilter = this.filterKey + ":" + this.filterValue
        myUrl.search = `filter=${myFilter}`
      }



      const resp = await axios.get(myUrl.toString())
      this.isLoading = false
      return resp.data.meta.count
    }
  },
  methods: {
  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>