<template>
  <v-list-item
      @click="$emit('select')"
      style="min-height: 30px;"
  >
    <v-list-item-icon>
      <v-chip
        color="primary"
        small
        outlined
        class="px-2"
        v-if="appliedFiltersCount"
      >
        {{ appliedFiltersCount }}
      </v-chip>
    </v-list-item-icon>
    {{ config.displayName }}
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
    appliedFiltersCount(){
      const allFilters = filtersFromUrlStr(this.$route.query.filter)
      console.log("allFilters", allFilters)
      const myFilters = allFilters.filter(f => {
        return f.key === this.facetKey
      })
      return myFilters.length
    },
    config() {
      return getFacetConfig(this.facetKey)
    },
    link(){
      return {
        name: "filter",
        params: {
          filterTypeKey: this.facetKey,
        },
        query: {...this.$route.query}
      }
    }
  },
  methods: {
    ...mapMutations([]),
    ...mapActions([
    ]),
  },

  created() {
  },
  async mounted() {

  },
  watch: {
  }
}
</script>

<style scoped lang="scss">
</style>