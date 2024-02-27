<template>
  <div>
    <v-autocomplete
      v-model="select"
      :items="suggestions"
      :search-input.sync="searchString"
      :filter="(item, queryText, itemText) => true"
      item-text="displayValue"
      item-value="value"
      rounded
      :dense="dense"
      filled
      hide-no-data
      hide-details
      class="shortcut-box"
      placeholder="Search OpenAlex"
      prepend-inner-icon="mdi-magnify"


      @blur="suggestions = []"
      @change="goToEntity"
      @keyup.enter="submitSearchString"
    >
      <template v-slot:item="data">
        <v-list-item-icon><v-icon>{{ data.item.icon }}</v-icon></v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title
              v-html="$prettyTitle(data.item.displayValue)"
              style="white-space: normal;"
          />
<!--          <v-list-item-subtitle>-->
<!--            {{ data.item.key }}:{{ data.item.value }}-->
<!--          </v-list-item-subtitle>-->
        </v-list-item-content>
        <v-list-item-action-text
            v-if="data.item.entityId !== 'works'"
            class="body-1 grey--text pl-3"
            :class="{'body-2': dense}"
        >
          {{ data.item.worksCount | toPrecision }} works
        </v-list-item-action-text>
<!--        {{ data.item }}-->
      </template>
    </v-autocomplete>
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {api} from "@/api";
import {createSimpleFilter, filtersFromUrlStr} from "@/filterConfigs";
import {urlPartsFromId} from "@/entityConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    dense: Boolean,
  },
  data() {
    return {
      foo: 42,
      isLoading: false,
      searchString: null,
      select:null,
      suggestions: []
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
    submitSearchString(e){
      if (this.select) return false // the user is hitting enter after highlighting an option using the arrow keys
      if (!this.searchString) {
        url.pushToRoute(this.$router, {name: "Serp", params: {entityType: this.entityType}})
        return
      }

      const searchFilter = createSimpleFilter(this.entityType, "default.search", this.searchString)
      url.pushNewFilters([searchFilter])
    },
    goToEntity(e){
      console.log("goToEntity()", e)
      url.pushToRoute(this.$router, {
        name: "EntityPage",
        params: urlPartsFromId(this.select)
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


      const ret = resp.results
          .filter(r => !!r.id)
          .filter(r => r.entity_type !== "filter")
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
    searchString(to){
      if (!to) this.suggestions = []
      to && to !== this.select && this.getSuggestions(to)
    }
  }
}
</script>

<style  lang="scss">
.shortcut-box {
  .v-icon.notranslate.mdi.mdi-menu-down.theme--light {
    display:none !important;
  }

}

</style>