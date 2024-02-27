<template>
  <tr
      @click="$emit('click')"
      class="hover-color-3"
      :class="{clickable}"
  >
    <!--    <td class="grey&#45;&#45;text shrink pl-5">-->
    <!--      {{ index + 1 }}.-->
    <!--    </td>-->
    <!--    <td class="grey&#45;&#45;text shrink">-->
    <!--      {{ index > 0 ? "and" : "" }}-->
    <!--    </td>-->
    <td class="shrink font-weight-bold align-center pl-4">
      <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
      {{ (myConfig.type === 'boolean' ? "work" : myConfig.displayName) | capitalize }}
    </td>
    <td class="shrink" style="min-width: 5em;">
      <span v-if="myConfig.type === 'search'" class="px-3">is</span>
      <v-chip v-else outlined @click.stop="isNegated = !isNegated">
        {{ isNegated ? "is not" : "is" }}
      </v-chip>
    </td>
    <slot></slot>
    <td class="text-right">
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

export default {
  name: "Template",
  components: {},
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
    isNegated: {
      get() {
        const urlFilter = url.readFilter(this.$route, this.entityType, this.index)
        console.log("isNegated getter()", urlFilter?.value)
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
  padding: 3px 9px;
  border-bottom: 1px solid #eee;
}

td.shrink {
  white-space: nowrap;
  width: 1px;
}

</style>