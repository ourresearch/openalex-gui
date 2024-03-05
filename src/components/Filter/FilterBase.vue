<template>
  <tr
      @click="$emit('click')"
      class="hover-color-3  font-weight-regular"
      :class="{clickable}"
  >
        <td class="grey--text shrink pl-5">
          {{ index + 1 }}.
        </td>
        <td class="grey--text shrink">
          {{ index > 0 ? "and" : "" }}
        </td>
    <td class="shrink align-center pl-4">
      <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
      {{ (myConfig.type === 'boolean' ? "work" : myConfig.displayName) | capitalize }}
    </td>
    <td class="shrink pr-6" style="min-width: 5em; text-align: center;">
<!--      <span-->
<!--          v-if="myConfig.type === 'search'"-->
<!--          class="px-3"-->
<!--      >-->
<!--        includes-->
<!--      </span>-->
      <filter-verb
          :is-negated="isNegated"
          :value="myValue"
          :type="myConfig?.type"
          @set="(val) => isNegated = val"
      />
    </td>
    <slot></slot>
    <td class="text-right">
<!--      <v-btn icon @click.stop="url.toggleGroupBy(filterKey)">-->
<!--        <v-icon v-if="url.getGroupBy($route).includes(filterKey)">mdi-clipboard-off</v-icon>-->
<!--        <v-icon v-else>mdi-clipboard-outline</v-icon>-->
<!--      </v-btn>-->
      <v-btn icon @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
        <v-icon>mdi-plus-thick</v-icon>
      </v-btn>
      <v-btn icon @click.stop="url.deleteFilter(entityType, index)">
        <v-icon>mdi-close</v-icon>
      </v-btn>

    </td>

  </tr>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {getFacetConfig} from "@/facetConfigs";
import {url} from "@/url";
import FilterVerb from "@/components/Filter/FilterVerb.vue";

export default {
  name: "Template",
  components: {
    FilterVerb,
  },
  props: {
    filterKey: String,
    index: Number,
    clickable: Boolean,
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
    myValue(){
      return url.readFilterValue(this.$route, this.entityType, this.index)
    },
    isNegated: {
      get() {
        const urlFilter = url.readFilter(this.$route, this.entityType, this.index)
        return this.myConfig.type === "boolean" ?
            !url.readFilter(this.$route, this.entityType, this.index)?.value :
            url.readIsFilterNegated(this.$route, this.entityType, this.index)
      },
      set(to) {
        console.log("isNegated setter()", to)
        return this.myConfig.type === "boolean" ?
            url.updateFilter(this.entityType, this.index, !to) :
            url.setIsFilterNegated(this.entityType, this.index, to)
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
tr {
  &.clickable {
    cursor: pointer;
  }
}

td {
  padding: 10px 9px;
  border-bottom: 1px solid #eee;
}

td.shrink {
  white-space: nowrap;
  width: 1px;
}

</style>