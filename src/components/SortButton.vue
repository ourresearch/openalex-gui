<template>
  <v-menu>
    <template v-slot:activator="{on}">
      <a v-if="textMode" v-on="on">
        sort={{ activeSortKey }}
      </a>
      <v-btn
          v-else
          icon
          class="font-weight-regular"
          v-on="on"
          :disabled="disabled"
      >
        <v-icon>mdi-sort</v-icon>
<!--        <v-icon v-if="$vuetify.breakpoint.mobile">mdi-sort</v-icon>-->
<!--        <template v-else>-->
<!--          <v-icon left class="">mdi-sort</v-icon>-->
<!--          Sort-->
<!--          by {{ activeSortConfig.displayName }}-->
<!--        </template>-->
      </v-btn>
    </template>
    <v-list>
      <v-subheader>Sort by</v-subheader>
      <v-divider></v-divider>
      <v-list-item-group
          mandatory
          v-model="activeSortKey"
      >
        <v-list-item
            v-for="sortConfig in sortObjectOptions"
            :key="sortConfig.key"
            :value="sortConfig.key"
        >
          <v-list-item-icon>
            <v-icon v-if="activeSortKey === sortConfig.key">mdi-check</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>
              {{ sortConfig.displayName }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import VueJsonPretty from 'vue-json-pretty'
import {entityTypes} from "../util";


const sortConfigs = [
  {
    key: "cited_by_count:desc",
    displayName: "Citations",
    showForEntityTypes: entityTypes.all(),
  },
  {
    // only for non-work entities
    key: "works_count:desc",
    displayName: "Works",
    showForEntityTypes: entityTypes.allExcept("works"),
  },
  {
    // only for works
    key: "publication_date:desc",
    displayName: "Date",
    showForEntityTypes: ["works"],
  },
  {
    // only if there's a text search on
    key: "relevance_score:desc",
    displayName: "Relevance",
    showForEntityTypes: entityTypes.all(),
    requiresTextSearch: true,
  },
]


const sortDefaults = {
  works: {
    textSearch: "relevance_score:desc",
    // noTextSearch: "publication_date:desc",
    noTextSearch: "cited_by_count:desc",
  },
  authors: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
  sources: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
  publishers: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
  funders: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
  institutions: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
  concepts: {
    textSearch: "relevance_score:desc",
    noTextSearch: "works_count:desc",
  },
}

export default {
  name: "SerpResultsList",
  components: {
  },
  props: {
    disabled: Boolean,
    textMode: Boolean,
  },
  data() {
    return {
    }
  },
  computed: {
    ...mapGetters([
      "entityConfig",
      "entityType",
    ]),
    activeSortKey: {
      get() {
        const fromUrl = this.$route.query.sort
        const fromDefault = this.defaultSort
        return fromUrl ?? fromDefault
      },
      set(val) {
        this.pushQueryChanges({
          sort: val
        })
      }
    },
    isSearchFilterApplied() {
      const params = new URLSearchParams(this.$route.query)
      return params.toString().indexOf(".search") > -1
    },
    defaultSort() {
      return sortDefaults[this.entityType][(this.isSearchFilterApplied) ? "textSearch" : "noTextSearch"]
    },
    sortObjectOptions() {
      return sortConfigs.filter(sortConfig => {
        if (sortConfig.requiresTextSearch && !this.isSearchFilterApplied) return false
        if (!sortConfig.showForEntityTypes.includes(this.entityType)) return false
        return true
      })
    },
    activeSortConfig() {
      return sortConfigs.find(sortConfig => {
        return sortConfig.key === this.activeSortKey
      })
    },


  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "setSort",
    ]),
    async pushQueryChanges(query) {
      const pushTo = {
        name: "Serp",
        query: {
          ...this.$route.query,
          ...query,
        }
      }
      console.log("pushQueryChanges", query)
      await this.$router.push(pushTo)
          .catch((e) => {
            if (e.name !== "NavigationDuplicated") {
              throw e
            }
          })

    }


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style lang="scss">
</style>