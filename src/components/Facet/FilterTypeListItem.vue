<template>
  <v-list-item
      v-on="(!bold) ? {click: clickHandler} : {}"
      style="min-height: 30px; "
  >
    <v-list-item-icon >
      <!--      <v-icon v-if="appliedFiltersCount">mdi-chevron-down</v-icon>-->
      <!--      <v-icon v-else>mdi-chevron-right</v-icon>-->
      <!--      <v-chip-->
      <!--          color="primary"-->
      <!--          small-->
      <!--          outlined-->
      <!--          class="px-2"-->
      <!--      >-->
      <!--        {{ appliedFiltersCount }}-->
      <!--      </v-chip>-->

    </v-list-item-icon>
    <v-list-item-title style=" font-weight: normal; line-height: 1.2;font-size: 16px;"
                       :class="{'font-weight-normal': bold, 'body-2': bold}"
    >
      {{ config.displayName }}

    </v-list-item-title>
        <v-btn
            v-if="bold && !config.noOptions"
            small
            icon
            class="low-key-button mr-1"
            @click="$emit('select')"
        >
          <v-icon small>mdi-plus</v-icon>
        </v-btn>
        <v-btn
            v-if="bold"
            small
            icon
            class="low-key-button mr-1"
            @click.stop="clearAllFilters"
        >
          <v-icon small>mdi-delete-outline</v-icon>
        </v-btn>


  </v-list-item>
</template>

<script>

// import VueJsonPretty from 'vue-json-pretty';
// import 'vue-json-pretty/lib/styles.css';


import {mapGetters, mapMutations, mapActions,} from 'vuex'
import {getFacetConfig} from "../../facetConfigs";
import {filtersAsUrlStr, filtersFromUrlStr} from "../../filterConfigs";

export default {
  name: "FilterTypeListItem",
  components: {},
  props: {
    facetKey: String,
    bold: Boolean,
  },
  data() {
    return {
      loading: false,
      apiResp: {},
      isChecked: this.showChecked,
    }
  },
  computed: {
    ...mapGetters([
      "searchApiUrl",
    ]),
    appliedFiltersCount() {
      const allFilters = filtersFromUrlStr(this.$route.query.filter)
      const myFilters = allFilters.filter(f => {
        return f.key === this.facetKey
      })
      return myFilters.length
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
  },
  methods: {
    ...mapMutations([
        "snackbar",
    ]),
    ...mapActions([]),
    clickHandler() {
      this.$emit('select')
    },
    async clearAllFilters(){
      const filters = filtersFromUrlStr(this.$route.query.filter)
      const filtersToKeep = filters.filter(f => f.key !== this.facetKey)
      const filterString = filtersAsUrlStr(filtersToKeep)
      const query = {...this.$route.query}
      query.filter = filterString || undefined

      await this.$router.push({
        name: "Serp",
        query
      })
      this.snackbar("Filters removed")
    },

  },

  created() {
  },
  async mounted() {

  },
  watch: {}
}
</script>

<style scoped lang="scss">
</style>