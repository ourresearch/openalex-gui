<template>
  <div
      class="py-1 my-0 d-flex filter-row"
      v-ripple
  >
    <div>
      <v-checkbox dense hide-details class="pa-0 ma-0" v-model="isChecked"/>
    </div>
    <div
        class="body-1 black--text"
        style="line-height: 1.2; padding-top: 2px;"
    >
      {{ filter.displayValue }}
    </div>
    <v-spacer></v-spacer>
    <div class="body-2 grey--text" style="margin: 1px 5px;">
      {{ filter.count.toLocaleString() }}
    </div>
  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'


export default {
  name: "FacetValueListItem",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {},
  props: {
    filter: Object,
    showChecked: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
      "sortOptions",
    ]),
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
    sort: {
      get() {
        return this.$store.getters.sortObject
      },
      set(val) {
        this.$store.dispatch("setSort", val)
      }
    },
    entityType() {
      return this.$route.params.entityType
    },
    entityId() {
      return this.$route.params.id
    },
    apiUrl() {
      return `/${this.entityType}/${this.entityId}`
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "updateTextSearch",
      "addInputFilter",
      "removeInputFilter",
    ]),
    getFilterValue(k) {

    }
  },

  created() {
  },
  async mounted() {
    this.loading = true
    // this.apiResp = await api.get(this.apiUrl)
    this.loading = false

  },
  watch: {
    isChecked: {
      immediate: false,
      handler(isCheckedNow) {
        if (isCheckedNow) this.addInputFilter(this.filter)
        else this.removeInputFilter(this.filter)
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