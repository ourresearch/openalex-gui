<template>
  <div class="facet">
    <div>
      <strong>{{ dimensionDisplayName }}</strong> ({{ dimensionKey }})
    </div>
    <pre>{{groups.slice(0, 2)}}</pre>


  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'


export default {
  name: "Facet",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {},
  props: {
    dimensionKey: String,
    dimensionDisplayName: String,
    groups: Array,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
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
  watch: {}
}
</script>

<style scoped>

</style>