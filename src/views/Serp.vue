<template>
  <v-container fluid class="entity-page ma-0 pa-0">
    <v-row>
      <v-col cols="3">
        facets go here
      </v-col>
      <v-col cols="9">

        <div class="is-loading-false" v-if="!$store.state.isLoading">
          <div class="d-flex align-end mb-12">
            <div class="body-1 grey--text">
              <span>{{ $store.state.resultsCount.toLocaleString() }} results </span>
              <span>({{ $store.state.responseTime / 1000 }} seconds)</span>
            </div>
            <v-spacer/>
            <div style="max-width: 130px; margin-right: 30px;">
              <v-select
                  v-model="sort"
                  item-text="displayName"
                  item-value="key"
                  :items="$store.getters.sortObjectOptions"
                  label="Sort by"
                  dense
                  hide-details

              ></v-select>
            </div>


            <v-menu offset-y>
              <template v-slot:activator="{on}">
                <v-btn icon v-on="on">
                  <v-icon color="gr">mdi-cloud-download-outline</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-subheader>Export these results as:</v-subheader>
                <v-list-item
                    target="_blank"
                    :href="searchApiUrl"
                >
                  <v-icon left>mdi-code-json</v-icon>
                  JSON
                </v-list-item>
              </v-list>
            </v-menu>


          </div>


          <div>
            <div
                v-for="result in $store.state.results"
                class="result-container my-4"
                :key="result.id"
            >
              <result-work v-if="$store.state.entityType === 'works'" :data="result"/>
              <result-author v-if="$store.state.entityType === 'authors'" :data="result"/>
              <result-venue v-if="$store.state.entityType === 'venues'" :data="result"/>
              <result-institution v-if="$store.state.entityType === 'institutions'" :data="result"/>
              <result-concept v-if="$store.state.entityType === 'concepts'" :data="result"/>
            </div>
          </div>
          <div class="serp-bottom">
            <v-pagination
                v-model="page"
                :length="10"
            />
          </div>

        </div>
      </v-col>
    </v-row>




  </v-container>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {api} from "../api";
import {mapGetters, mapMutations, mapActions,} from 'vuex'
import SearchBox from "../components/SearchBox";

import ResultWork from "../components/ResultWork";
import ResultAuthor from "../components/ResultAuthor";
import ResultVenue from "../components/ResultVenue";
import ResultInstitution from "../components/ResultInstitution";
import ResultConcept from "../components/ResultConcept";

export default {
  name: "EntityPage",
  metaInfo() {
    return {
      title: `${this.entityId}`
    }
  },
  components: {
    SearchBox,
    ResultWork,
    ResultAuthor,
    ResultVenue,
    ResultInstitution,
    ResultConcept,
  },
  props: {},
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