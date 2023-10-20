<template>
  <v-chip
      color="#fff"
      :value="action"
  >
    <span>
      {{ myConfig.displayName | pluralize(actionNamePluralizeCount) }}
    </span>
    <span v-if="action === 'sort' && actionValueString" class="ml-1"> by </span>
    <span class="ml-1 font-weight-bold">
      {{  actionValueString }}
    </span>
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {actionConfigs, getActionConfig} from "@/actionConfigs";
import {getFacetConfig} from "@/facetConfigs";

export default {
  name: "Template",
  components: {},
  props: {
    action: String,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    actionValues(){
      return this.$route.query[this.action]?.split(",")
    },
    actionValuesCount(){
      return this.actionValues?.length ?? 0
    },
    actionNamePluralizeCount() {
      return Math.max(this.actionValuesCount, 1)
    },
    myConfig(){
      return getActionConfig(this.action)
    },
    actionValueString(){
      if (!this.actionValues?.length) return
      if (this.myConfig.isMultiple) {
        return `(${this.actionValuesCount})`
      }
      else {
        const key = this.actionValues[0]?.replace(":desc", "")
        const config = getFacetConfig("works", key)
        return config.displayName
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),


  },
  created() {
  },
  mounted() {
  },
  watch: {}
}
</script>

<style scoped lang="scss">

</style>