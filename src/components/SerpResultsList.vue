<template>
  <div class="">
    <div class="mx-4 mt-6">
      <div v-if="!resultsCount" class="mt-8 grey--text">
        There are no results for this search.
      </div>
      <div v-else class=" d-flex align-center">
        <div class="grey--text">
          {{ resultsCount | toPrecision }} results
        </div>
        <v-spacer/>
        <v-menu>
          <template v-slot:activator="{on}">
            <v-btn small rounded class="font-weight-regular" text v-on="on">
              <v-icon left class="">mdi-sort</v-icon>
              Sort by {{ sortObject.displayName }}
            </v-btn>
          </template>
          <v-list>
            <v-subheader>Sort by</v-subheader>
            <v-divider></v-divider>
            <v-list-item
                v-for="mySortOption in $store.getters.sortObjectOptions"
                :key="mySortOption.key"
                @click="setSort(mySortOption.key)"
            >
              <v-list-item-icon>
                <v-icon>
                  {{ (sortObject.key === mySortOption.key) ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{ mySortOption.displayName }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>

      </div>
    </div>

    <!--    <div v-else class="mt-4 ml-4 grey&#45;&#45;text">-->
    <!--      {{ resultsCount | toPrecision }} results-->

    <!--    </div>-->
    <v-list v-if="resultsCount" class="serp-results-list" nav>
      <component
          v-for="result in $store.state.results"
          :key="result.id"
          :is="resultComponentName"
          :data="result"
      />
    </v-list>
    <div class="serp-bottom" v-if="$store.state.results.length">
      <v-pagination
          v-model="page"
          :length="numPages"
          :total-visible="10"
          light
      />
    </div>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import ResultWork from "./Result/ResultWork.vue";
import ResultAuthor from "./Result/ResultAuthor.vue";
import ResultSource from "./Result/ResultSource.vue";
import ResultPublisher from "./Result/ResultPublisher.vue";
import ResultFunder from "@/components/Result/ResultFunder.vue";
import ResultInstitution from "./Result/ResultInstitution.vue";
import ResultConcept from "./Result/ResultConcept.vue";

export default {
  name: "SerpResultsList",
  components: {
    ResultWork,
    ResultAuthor,
    ResultSource,
    ResultPublisher,
    ResultFunder,
    ResultInstitution,
    ResultConcept,
  },
  props: {},
  data() {
    return {
      resultsPerPage: 25, // not editable now, but could be in future
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "resultsCount",
      "entityConfig",
      "sortObject",
      "sortObjectOptions",
    ]),
    resultComponentName() {
      return "result-" + this.entityConfig.nameSingular

    },
    page: {
      get() {
        return this.$store.state.page
      },
      set(val) {
        this.$store.dispatch("setPage", val)
      }
    },
    numPages() {
      return Math.min(
          Math.ceil(this.$store.state.resultsCount / this.resultsPerPage),
          10
      )
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([
      "setSort",
    ]),


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style lang="scss">
div.serp-results-list {
  .v-list-item__title, .v-list-item__subtitle {
    white-space: normal !important;
    line-height: 1.4 !important;
  }
}
</style>