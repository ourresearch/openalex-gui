<template>
  <div>
    <v-menu
        content-class="no-highlight"
        min-width="150"
        open-on-hover
    >
      <template v-slot:activator="{on, attrs}">
        <v-btn
        color="primary"
        v-bind="attrs"
        v-on="on"
        fab
        x-small
    >
      <v-icon>mdi-filter-menu</v-icon>
    </v-btn>
      </template>
      <v-list
          dense
      >
        <v-subheader class="">Filter by:</v-subheader>
          <v-divider></v-divider>
        <v-list-item
            v-for="facet in searchFacetConfigs"
            :key="facet.key"
            :to="'filters:'+ facet.key | zoomLink"
        >
          {{ facet.displayName }}
        </v-list-item>
      </v-list>
    </v-menu>



  </div>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../facetConfigs";
import {entityConfigs} from "../entityConfigs";
import EntityIcon from "./EntityIcon";
import axios from "axios";


export default {
  name: "SerpToolbar",
  components: {
    EntityIcon,
  },
  props: {},
  data() {
    return {
      loading: false,
      getFacetConfig,
      filterResultsTooltip: false,
      dialogs: {
        export: false,
        createAlert: false,
      },
      exportEmail: "",
      exportIsLoading: false,
      exportIsInProgress: false,
      createAlert: {
        velocityIsLoading: false
      }
    }
  },
  computed: {
    ...mapGetters([
      "searchFacetConfigs",
    ]),

    sort: {
      get() {
        return this.$store.getters.sortObject
      },
      set(val) {
        this.$store.dispatch("setSort", val)
      }
    },
    exportEmailIsValid() {
      return /.+@.+/.test(this.exportEmail)
    },
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
      "removeInputFilters",
      "setSort"
    ]),
    removeTextSearch() {
      this.$router.push({
        name: "Serp",
        query: {filter: this.$route.query.filter}
      })
    },
    removeFiltersAndSearch() {
      this.$router.push({
        name: "Serp",
      })
    },
    getEntityIcon(facetKey) {
      const entityId = getFacetConfig(facetKey, "entityId")
      if (!entityId) return
      return entityConfigs[entityId].icon

    },
    openExportToCsvDialog() {
      this.exportIsInProgress = false
      this.dialogs.export = true
    },
    async openCreateAlertDialog() {
      this.dialogs.createAlert = true
      this.createAlert.velocityIsLoading = true

      // check the velocity endpoint
      const url = `https://api.openalex.org/alert/work/${this.inputFiltersAsString}/velocity`
      const resp = await axios.get(url)
      console.log("openCreateAlertDialog velocity:", resp.data)

    },
    async exportToCsv() {
      const params = [
        `filter=${this.inputFiltersAsString}`,
        `email=${this.exportEmail}`,
        "format=csv",
      ]
      const url = `https://api.openalex.org/works?` + params.join("&")
      this.exportIsLoading = true
      try {
        const resp = await axios.get(url)
        console.log("exportToCsv submitted", resp.data)
        // this.snackbar("Export job submitted.")
      } catch (e) {
        console.log("exportToCsv error", e)
      } finally {
        this.exportIsInProgress = true
        this.exportIsLoading = false
        // this.dialogs.export = false
        // this.exportEmail = ""
      }
    },
  },

  created() {
  },
  async mounted() {
  },
  watch: {
    "$route": function (to, from) {
    }
  }
}
</script>

<style lang="scss">
table.serp-filters-list {
  td {
    //align-items: baseline;
    vertical-align: unset;
  }
}

.serp-filters-list {
  .v-toolbar__content {
    //padding: 0 !important;
  }

}

</style>