<template>
  <v-container class="page">

    <div class="text-h4">
      Current Stats
    </div>

    <div class="grey--text">Last updated {{ new Date().toDateString() }}</div>
    <v-divider class="my-3" />
    <v-row dense>
      <v-col
        cols="12"
        lg="4"
        class=""
        v-for="cardData in cards"
        :key="cardData.name"
      >
        <v-hover>
        <v-card
            rounded
            flat
            class="fill-height d-flex flex-column pb-3"
            :color="`${cardData.color} lighten-5`"
        >
          <div class="flex-grow-1 " :class="`${cardData.color}--text`">
            <div class="d-flex align-baseline pa-4 pb-2">
              <v-icon left large :color="cardData.color">{{ cardData.icon }}</v-icon>
              <our-stats-entry
                  :entity-type="cardData.name"
                  class="text-h4 font-weight-bold"

              />
              <span class="ml-2 text-capitalize">
                {{ cardData.name }}
              </span>
              <v-spacer />
                <v-btn
                    v-if="cardData.hasDocs"
                    small
                    icon
                    :href="`https://docs.openalex.org/api-entities/${cardData.name}`"
                    target="_blank"
                >
                  <v-icon small>mdi-information-outline</v-icon>
                </v-btn>

            </div>
            <v-divider v-if="cardData.highlightFilters" />
            <v-list class="pa-0" color="transparent" v-if="cardData.highlightFilters">
              <v-list-item
                v-for="highlightFilter in cardData.highlightFilters"
                :key="highlightFilter.key"
              >
                <v-list-item-content>
                  <v-list-item-title>
                      <our-stats-entry
                        :entity-type="cardData.name"
                        :loading-spinner-size="12"
                        :filter-key="highlightFilter.key"
                        :filter-value="highlightFilter.value"
                        color="grey"
                        class="font-weight-bold"
                      />
                      <span>
                       {{ highlightFilter.displayName }}
                      </span>

                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>

        </v-card>

        </v-hover>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {entityConfigs} from "../entityConfigs";
import OurStatsEntry from "../components/OurStats/OurStatsEntry.vue";
import {getFacetConfig} from "../facetConfigs";

export default {
  name: "OurStats",
  components: {
    OurStatsEntry,
  },
  props: {},
  data() {
    return {
      getFacetConfig,
    }
  },
  computed: {
    cards(){
      const copy = _.cloneDeep(entityConfigs)
      let list = Object.values(copy)

      const entitiesWithDocs = ["works", "authors", "sources", "institutions", "topics", "keywords", "publishers", "funders", "concenpts"]

      list = list.map(e => {
        if (entitiesWithDocs.includes(e.name)) { e.hasDocs = true }
        return e
      })

      return list
    }
  },
  methods: {
    ...mapMutations([
      "snackbar",
    ]),
  },
  created() {
  },
  mounted() {
  },
  watch: {
  }
}
</script>

<style scoped lang="scss">

</style>