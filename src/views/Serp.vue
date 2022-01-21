<template>
  <v-container class="entity-page">
    <h3>hola serp</h3>
<!--    <h1 class="text-h3 my-12">{{ entityType }} entity: {{ this.entityId }}</h1>-->
    <div class="loaded">
      <div>
        {{$route.query.display_name}}
      </div>
      <search-box
          :entity-type="$route.params.entityType"
          :value="getFilterValue('display_name')"
      />


    </div>
  </v-container>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {api} from "../api";
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import SearchBox from "../components/SearchBox";
import {readFilter} from "../urls";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    SearchBox,
  },
  props: {},
  data() {
    return {
      foo: 42,
      loading: false,
      apiResp: {},
    }
  },
  computed: {
    ...mapGetters([
        "searchEntityType",
        "searchFilters",
        "searchResults",
        "searchIsLoading",
    ]),
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
    ...mapMutations([
    ]),
    ...mapActions([
      "updateTextSearch",
    ]),
    getFilterValue(k){
      return readFilter(k, this.$route.query.filters)

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