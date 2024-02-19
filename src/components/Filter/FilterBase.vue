<template>
  <v-card
      flat
      rounded
      class="d-flex align-center text-h6  pl-4 pr-1 py-2 font-weight-regular hover-color-3"
      @click="$emit('click')"
  >
    <div class="pr-2">
      <span class="grey--text">
        {{ index + 1 }}.
      </span>
      <span class="grey--text">
        {{ index > 0 ? "and" : "" }}
      </span>
      <v-icon class="mr-0">{{ myConfig.icon }}</v-icon>
      <span v-if="myConfig.type !== 'boolean'">
        <span class="">
          {{ myConfig.displayName }}
        </span>
        <span class="">
          <v-chip outlined @click="isNegated = !isNegated" class="text-h6">
            {{ isNegated ? "is not" : "is"}}
          </v-chip>
        </span>
      </span>

    </div>
    <slot></slot>
    <v-btn icon @click.stop="url.deleteFilter(entityType, index)" v-if="myConfig.type !== 'select'">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-card>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    index: Number,
  },
  data() {
    return {
      foo: 42,
    }
  },
  computed: {
    url() {
      return url
    },
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    ...mapGetters("user", [
      "userId",
    ]),
    myConfig() {
      return getFacetConfig(this.entityType, this.filterKey)
    },
    isNegated: {
      get(){
        return url.readIsFilterNegated(this.$route, this.entityType, this.index)
      },
      set(to){
        return url.setIsFilterNegated(this.entityType, this.index, to)
      }
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    ...mapActions("user", []),


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