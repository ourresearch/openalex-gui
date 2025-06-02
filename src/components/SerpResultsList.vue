<template>
  <div>
    <v-toolbar dense flat class="" color="transparent">
      <v-toolbar-title class="font-weight-bold mr-2">
        {{ filters.capitalize(filters.pluralize(entityType, 2)) }}
      </v-toolbar-title>  
      <v-spacer/>
      <serp-results-sort-button />

      <serp-results-export-button v-if="entityType === 'works'" />
      <v-menu offset-y rounded>
        <template v-slot:activator="{on}">
          <v-btn
            v-on="on"
            icon
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-subheader>Results per page:</v-subheader>
          <v-list-item @click="url.setPerPage(10)">
            <v-list-item-content>
              <v-list-item-title>10</v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon v-if="url.getPerPage() === 10">
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>
          <v-list-item @click="url.setPerPage(100)">
            <v-list-item-content>
              <v-list-item-title>100</v-list-item-title>
            </v-list-item-content>
            <v-list-item-icon v-if="url.getPerPage() === 100">
              <v-icon>mdi-check</v-icon>
            </v-list-item-icon>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>

  <v-card rounded flat class="">

    <v-list nav v-if="resultsObject?.results" class="" color="">
      <serp-results-list-item
        v-for="result in resultsObject.results"
        :key="result.id"
        :result="result"
        show-icon
      />

    </v-list>
    <div class="serp-bottom" v-if="resultsObject?.results?.length">
      <v-pagination
          v-if="showPagination"
          class="pb-8 pt-3 elevation-0"
          circle
          v-model="page"
          :length="numPages"
          :total-visible="10"
          light
      />
    </div>
    <v-card v-if="!resultsObject?.meta?.count" flat rounded class="grey--text mt-2 pa-4 color-3">
      There are no results for this search.
    </v-card>
  </v-card>
  </div>
</template>

<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import filters from '@/filters';

import Action from "@/components/Action/Action.vue";
import SerpResultsCount from "@/components/SerpResultsCount.vue";
import SerpApiEditor from "@/components/SerpApiEditor.vue";
import SerpResultsExportButton from "@/components/SerpResultsExportButton.vue";
import SerpResultsSortButton from "@/components/SerpResultsSortButton.vue";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";
import WorkAuthorsString from "@/components/WorkAuthorsString.vue";

export default {
  name: "SerpResultsList",
  components: {
    Action,
    SerpApiEditor,
    SerpResultsCount,
    SerpResultsExportButton,
    SerpResultsSortButton,
    SerpResultsListItem,
    WorkAuthorsString,
  },
  props: {
    resultsObject: Object,
  },
  data() {
    return {
      url,
      filters,
    }
  },
  computed: {
    ...mapGetters([
      "entityType",
    ]),
    numPages() {
      const maxToShow = this.$vuetify.breakpoint.mobile ? 4 : 10

      return Math.min(
          Math.floor(this.resultsObject.meta.count / url.getPerPage()),
          maxToShow
      )
    },
    showPagination() {
      return this.resultsObject.meta.count > url.getPerPage()
    },
    page: {
      get() {
        return this.resultsObject?.meta?.page ?? 1
      },
      set(val) {
        const valToUse = (val === 1) ? undefined : val
        url.setPage(valToUse)
      }
    },
    isShowApiSet: {
      get() {
        return !!this.$route.query.show_api
      },
      set(to) {
        const show_api = (to) ? to : undefined
        url.pushToRoute(this.$router, {
          name: "Serp",
          query: {
            ...this.$route.query,
            show_api
          },
        })
      }
    },
  },
  methods: {
  },
}
</script>


<style scoped lang="scss">
.v-list-item--link:hover, .v-list-item:hover {
}
</style>