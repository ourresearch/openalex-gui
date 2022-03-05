<template>
  <div
      class="py-1 my-0 d-flex filter-row"
      v-ripple
      @click="isChecked = !isChecked"
  >
    <div>
      <v-checkbox
          dense
          hide-details
          class="pa-0 ma-0"
          readonly
          v-model="isChecked"/>
    </div>
    <div
        class="body-1 black--text"
        style="line-height: 1.2; padding-top: 2px;"
    >
      Is free to read
    </div>
    <v-spacer></v-spacer>
    <div class="body-2 grey--text" style="margin: 1px 5px 0 20px;">
<!--      {{ filter.count.toLocaleString() }} -->

      42
    </div>
  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'


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
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
    ]),
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
    }
  },

  created() {
  },
  async mounted() {

  },
  watch: {
    isChecked: {
      immediate: false,
      handler(isCheckedNow) {
        console.log("FacetOptionIsOa: check me out")

        // if (isCheckedNow) this.addInputFilters([this.filter])
        // else this.removeInputFilterss([this.filter])
      },
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