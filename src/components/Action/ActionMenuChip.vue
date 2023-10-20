<template>
  <v-chip
      color="#fff"
      :value="action"
  >
    <template v-if="action==='group_by'">
      Group by
    </template>

    <template v-else>
      <span class="text-capitalize">
        {{ myConfig.displayName | pluralize(actionNamePluralizeCount) }}
      </span>
      <span v-if="actionValuesCount" class="ml-1 font-weight-bold">
        ({{ actionValuesCount }})
      </span>
    </template>

    <span>
    </span>
  </v-chip>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {actionConfigs, getActionConfig} from "@/actionConfigs";

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