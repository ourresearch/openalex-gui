<template>
  <div>
    <v-toolbar dense flat class="" color="transparent">
      <v-toolbar-title class="font-weight-bold mr-2">
        {{ filters.capitalize(filters.pluralize(entityType, 2)) }}
      </v-toolbar-title>  
      <v-spacer/>
      <serp-results-sort-button />

      <serp-results-export-button v-if="entityType === 'works'" />
      <v-menu location="bottom" class="rounder-lg">
        <template v-slot:activator="{props}">
          <v-btn
            v-bind="props"
            icon
          >
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-subheader>Results per page:</v-list-subheader>
          <v-list-item @click="url.setPerPage(10)">          
            <v-list-item-title>10</v-list-item-title>
            <v-icon v-if="url.getPerPage() === 10">mdi-check</v-icon>
          </v-list-item>

          <v-list-item @click="url.setPerPage(100)">
            <v-list-item-title>100</v-list-item-title>
            <v-icon v-if="url.getPerPage() === 100">mdi-check</v-icon>
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
          rounded
          v-model="page"
          :length="numPages"
          :total-visible="10"
          light
      />
    </div>
    <v-card v-if="!resultsObject?.meta?.count" flat rounded class="text-grey mt-2 pa-4 color-3">
      There are no results for this search.
    </v-card>
  </v-card>
  </div>
</template>

<script>

import {mapGetters} from "vuex";
import {url} from "@/url";
import filters from '@/filters';

import SerpResultsExportButton from "@/components/SerpResultsExportButton.vue";
import SerpResultsSortButton from "@/components/SerpResultsSortButton.vue";
import SerpResultsListItem from "@/components/SerpResultsListItem.vue";

export default {
  name: "SerpResultsList",
  components: {
    SerpResultsExportButton,
    SerpResultsSortButton,
    SerpResultsListItem,
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
      const maxToShow = this.$vuetify.display.mobile ? 4 : 10

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

</style>