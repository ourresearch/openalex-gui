<template>
  <div>
    <v-toolbar flat>
      <v-toolbar-title>
        Summaries
      </v-toolbar-title>
      <v-spacer/>

      <v-menu
          :close-on-content-click="false"
          v-model="isCreateMenuOpen"
          min-width="400"
      >
        <template v-slot:activator="{on}">
          <v-btn
              icon
              v-on="on"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-subheader class="pl-1">Add summary:</v-subheader>
          <v-text-field
              autofocus
              hide-details
              outlined
              dense
              class="ma-1"
              prepend-inner-icon="mdi-magnify"
              clearable
              v-model="searchString"
          />
          <filter-key-selector
              :include-only-types="['select','boolean']"
              :search-string="searchString"
              :disabled-keys="summaries"
              dense
              @select="createSummary"
          />
        </v-card>
      </v-menu>
    </v-toolbar>
    <div>
      <pinboard-widget
          v-for="summaryFilterKey in summaries"
          :key="summaryFilterKey"
          :filter-key="summaryFilterKey"
          :filters="filters"
          class="mt-4"
          @delete="deleteSummary(summaryFilterKey)"
      />

    </div>

  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import YearRange from "../YearRange.vue";
import {filtersList} from "../../facetConfigs";
import PinboardWidget from "@/components/Pinboard/PinboardWidget.vue";
import entity from "@/components/Entity/Entity.vue";
import FilterKeySelector from "@/components/Filters/FilterKeySelector.vue";
import {url} from "../../url";

export default {
  name: "Pinboard",
  components: {
    YearRange,
    PinboardWidget,
    FilterKeySelector,
  },
  props: {
    filters: Array,
  },
  data() {
    return {
      foo: 42,
      searchString: "",
      summaries: [],
      isCreateMenuOpen: false,

    }
  },
  computed: {
    entity() {
      return entity
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filterOptions() {
      return filtersList(this.entityType, [], this.searchString)
    },

  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    createSummary(key) {
      this.isCreateMenuOpen = false
      const newRoute = {
        name: "Serp",
        params: {entityType: this.entityType},
        query: {
          ...this.$route.query,
          summaries: [...this.summaries, key].join(",")

        }
      }
      console.log("push new summary", key, newRoute)
      url.pushToRoute(this.$router, newRoute)
    },
    deleteSummary(key) {
      const newRoute = {
        name: "Serp",
        params: {entityType: this.entityType},
        query: {
          ...this.$route.query,
          summaries: this.summaries.filter(k => k !== key).join(",")

        }
      }
      console.log("push new summary", key, newRoute)
      url.pushToRoute(this.$router, newRoute)
    },


  },
  created() {
  },
  mounted() {
    // this.viewKeys = pinboard.getViews(this.entityType)
  },
  watch: {
    "$route.query.summaries": {
      immediate: true,
      handler(to, from) {
        console.log("summaries just changed",to)
        this.summaries = (to) ?
            to.split(",") :
            []
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>