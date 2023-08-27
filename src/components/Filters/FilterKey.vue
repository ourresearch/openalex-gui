<template>
  <div>
<!--    <v-btn disabled text x-large class="low-key-button" v-if="keyReadonly">-->
<!--      {{ myFilterConfig.displayName }}-->
<!--    </v-btn>-->
    <v-autocomplete
        :items="filters"
        dense
        item-text="displayName"
        item-value="key"
        class="mr-3"
        v-model="selectedFilterKey"
        :readonly="keyReadonly"
    />
  </div>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {facetConfigs, filtersList} from "@/facetConfigs";

export default {
  name: "FilterKey",
  components: {},
  props: {
    keyReadonly: Boolean,
    filterKey: String,
    resetOnRouteChange: Boolean,
  },
  data() {
    return {
      foo: 42,
      selectedFilterKey: this.filterKey,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    filters() {
      return filtersList(this.entityType, [], "")
    },
    myFilterConfig() {
      return facetConfigs().find(c => c.key === this.selectedFilterKey)
    },
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
  watch: {
    selectedFilterKey(to, from) {
      this.$emit("input", to)
    },
    '$route': {
      immediate: true,
      handler: function (to, from) {
        if (this.resetOnRouteChange) {
          this.selectedFilterKey = this.filterKey
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>