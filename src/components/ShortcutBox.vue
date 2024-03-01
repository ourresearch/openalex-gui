<template>
  <div>
    <v-autocomplete
        v-model="select"
        :items="suggestions"
        :search-input.sync="searchString"
        :filter="(item, queryText, itemText) => true"
        item-text="displayValue"
        return-object
        rounded
        :dense="dense"
        filled
        hide-no-data
        hide-details
        class="shortcut-box"
        placeholder="Search OpenAlex"
        prepend-inner-icon="mdi-magnify"
        ref="shortcutBox"
        :autofocus="autofocus"

        @blur="suggestions = []"
        @change="goToEntity"
        @keyup.enter="submitSearchString"


    >
      <template v-slot:item="data">
        <v-list-item-icon>
          <v-icon>{{ data.item.icon }}</v-icon>
        </v-list-item-icon>
        <template v-if="data.item.isFilterLink">
          <v-list-item-content>
            <v-list-item-title>
              <span class="font-weight-bold">{{ data.item.displayValue | capitalize }}</span>
            </v-list-item-title>
            <v-list-item-subtitle>
              Filter by {{ data.item.displayValue }}
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-icon>
            <v-icon>mdi-plus</v-icon>
          </v-list-item-icon>
        </template>
        <template v-else>
          <v-list-item-content>
            <v-list-item-title
                v-html="$prettyTitle(data.item.displayValue)"
                style="white-space: normal;"
            />
            <v-list-item-subtitle>
              {{ data.item.displayName |capitalize }}
              <!--            <span class="grey&#45;&#45;text">{{ data.item.value }}</span>-->
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action
              v-if="data.item.entityId !== 'works' && data.item.worksCount"
              class=""
          >
            <v-btn
                rounded
                text
                class="font-weight-regular grey--text"
                @click.stop="viewWorks(data.item.value)"
            >
              {{ data.item.worksCount | toPrecision }} works
            </v-btn>
          </v-list-item-action>

        </template>

        <!--        {{ data.item }}-->
      </template>
    </v-autocomplete>
<!--    <div class="ml-2 mt-2" v-if="showExamples">-->
<!--      <span>Try:</span>-->
<!--      <v-chip-->
<!--          color="white"-->
<!--          v-for="search in searchesToTry"-->
<!--          :key="search"-->
<!--          @click="trySearch(search)"-->
<!--          class="body-1"-->
<!--      >-->
<!--        {{ search }}-->
<!--      </v-chip>-->
<!--    </div>-->
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {entityConfigs, externalEntityTypeFromId, urlPartsFromId} from "@/entityConfigs";
import {findFacetConfig, findFacetConfigs} from "@/facetConfigs";
import {entityTypeFromId, shortenOpenAlexId} from "@/util";

export default {
  name: "Template",
  components: {},
  props: {
    dense: Boolean,
    showExamples: Boolean,
    autofocus: Boolean,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      searchString: "",
      select: null,
      suggestions: [],
      searchesToTry: [
        "Albert Einstein",
        "Solar power",
        "Author",
      ]
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),
    submitSearchString(e) {
      if (this.select) return false // the user is hitting enter after highlighting an option using the arrow keys
      if (!this.searchString) {
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
        return
      }

      const searchFilter = createSimpleFilter(this.entityType, "default.search", this.searchString)
      url.pushNewFilters([searchFilter])
    },
    viewWorks(id) {
      console.log("view my works", id)
      this.searchString = ""
      this.select = null

      // copies from main.js, horrible
      const entityType = entityTypeFromId(id)
      if (!id || !entityType) return

      const shortId = shortenOpenAlexId(id)

      const idForFilter = externalEntityTypeFromId(id) ?
          shortId.split("/")[1] :
          shortId
      const filter = createSimpleFilter(
          "works",
          entityConfigs[entityType].filterKey,
          idForFilter,
      )
      url.pushNewFilters([
          ...url.readFilters(this.$route),
          filter,
      ])

    },
    goToEntity(e) {
      console.log("goToEntity()", e)
      if (e.isFilterLink) {
        console.log("let's make a filter!")
        this.$store.state.newFilterKey = e.key
        this.select = null
        this.searchString = ""
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
      } else {
        url.pushToRoute(this.$router, {
          name: "EntityPage",
          params: urlPartsFromId(this.select.value)
        })
      }

    },
    trySearch(str) {
      this.searchString = str
      this.$nextTick(() => {
        this.$refs.shortcutBox.focus()
      })
    },
    async getSuggestions() {
      if (!this.searchString) return []
      const myEntityType = (this.entityType === "works") ?
          null :
          this.entityType
      const autocompleteUrl = url.makeAutocompleteUrl(myEntityType, this.searchString)
      this.isLoading = true
      const resp = await api.getUrl(autocompleteUrl)
      this.isLoading = false


      const apiResults = resp.results
          .filter(r => !!r.id)
          .filter(r => r.entity_type !== "filter")
          .filter(r => !!r.display_name)
          .map(result => {

            let filterKey
            if (result.filter_key === "id") filterKey = "ids.openalex"
            else if (result.filter_key === "topics.id") filterKey = "primary_topic.id"
            else filterKey = result.filter_key

            let id
            if (filterKey === "authorships.countries") id = "https://openalex.org/countries/" + result.id
            else id = result.id

            // const filterConfig = getFacetConfig(this.entityType, filterKey)
            const myFilter = createSimpleFilter(
                this.entityType,
                filterKey,
                id
            )
            myFilter.displayValue = result.display_name
            myFilter.worksCount = result.works_count
            return myFilter

            // return {
            //   ...result,
            //   icon: filterConfig.icon,
            //   hint: filterConfig.displayName
            // }
          })

      const filterLinks = this.searchString?.length > 3 ?
          findFacetConfigs(this.entityType, this.searchString).map(f => {
            return {
              ...f,
              isFilterLink: true,
              displayValue: f.displayName,
            }
          }) :
          []

      const ret = [
        ...filterLinks,
        ...apiResults,
      ]
      const everySuggestionIsAWork = ret.every(f => f.entityId === "works")
      const cleaned = everySuggestionIsAWork ?
          ret.slice(0, 3) :
          ret.filter(f => f.entityId !== "works").slice(0, 5)


      this.suggestions = cleaned
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    searchString(to) {
      if (!to) this.suggestions = []
      to && this.getSuggestions(to)
    }
  }
}
</script>

<style lang="scss">
.shortcut-box {
  .v-icon.notranslate.mdi.mdi-menu-down.theme--light {
    display: none !important;
  }

}

</style>