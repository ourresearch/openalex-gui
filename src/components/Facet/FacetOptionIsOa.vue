<template>
  <div
      class="py-1 my-0 d-flex filter-row"
      v-ripple
      @click="clickHandler"
  >
    <div>
      <v-checkbox
          dense
          hide-details
          class="pa-0 ma-0"
          readonly
          :indeterminate="isIndeterminate"
          v-model="isChecked"/>
    </div>
    <div
        class="body-1 black--text"
        style="line-height: 1.2; padding-top: 2px;"
    >
      All OA
    </div>
    <v-spacer></v-spacer>
    <div class="body-2 grey--text" style="margin: 1px 5px 0 20px;">
      <!--      {{ filter.count.toLocaleString() }} -->

    </div>
  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {createSimpleFilter} from "../../filterConfigs";

const oaFilterValues = ["gold", "bronze", "green", "hybrid",]
const makeOaFilters = function () {
  return oaFilterValues.map(v => {
    return createSimpleFilter("oa_status", v)
  })
}


export default {
  name: "FacetValueListItemIsOa",
  components: {},
  props: {
    filter: Object,
    showChecked: Boolean,
  },
  data() {
    return {
      isChecked: false,
      isIndeterminate: false,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
    ]),
    oaResultsFilterValues(){
      return this.$store.state.resultsFilters.filter(f => f.key === "oa_status").map(f => f.value)
    },
    everyOaFilterIsSet() {
      return oaFilterValues.every(oaValue => {
          return this.oaResultsFilterValues.includes(oaValue)
        })
    },
    someOaFiltersAreSet(){
      return oaFilterValues.some(oaValue => {
          return this.oaResultsFilterValues.includes(oaValue)
        })
    }

  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
      "addInputFilters",
      "removeInputFilters",
    ]),
    toggleIsChecked() {
      this.isChecked = !this.isChecked
    },
    clickHandler(){
      this.isChecked = !this.isChecked
      this.isIndeterminate = false

      const oaFilters = makeOaFilters()
      if (this.isChecked) this.addInputFilters(oaFilters)
      else this.removeInputFilters(oaFilters)
    }
  },

  created() {
  },
  async mounted() {

  },
  watch: {
    // isChecked: {
    //   immediate: false,
    //   handler(isCheckedNow) {
    //     const oaFilters = makeOaFilters()
    //     console.log("FacetOptionIsOa: check me out", isCheckedNow, oaFilters)
    //
    //     if (isCheckedNow) this.addInputFilters(oaFilters)
    //     else this.removeInputFilters(oaFilters)
    //   },
    // },
    "$store.getters.resultsFiltersAsStringToWatch": {
      immediate: true,
      handler(newVal, oldVal) {
        this.isIndeterminate = this.someOaFiltersAreSet && !this.everyOaFilterIsSet
        this.isChecked = this.someOaFiltersAreSet
      }
      ,
    },
  }
}
</script>

<style scoped lang="scss">
.filter-row {
  cursor: pointer;

  &:hover {
    background: #eee;
  }
}

</style>