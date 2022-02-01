<template>
  <v-list-item
  >
      <v-list-item-action>
        <v-checkbox></v-checkbox>
      </v-list-item-action>
    <v-list-item-content>
      <div>
      university of north carolina - west haverbrook
      </div>
    </v-list-item-content>
    <v-list-item-action>
        <v-list-item-action-text>
          123,456
        </v-list-item-action-text>
      </v-list-item-action>
  </v-list-item>
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