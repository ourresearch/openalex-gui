<template>
  <tr
      @click="$emit('click')"
      class="hover-color-3 font-weight-regular"
      :class="{clickable, card: $vuetify.breakpoint.smAndDown}"
  >
    <td class="grey--text shrink pl-5 d-none d-md-table-cell">
<!--      {{ index + 1 }}.-->
      <v-icon>mdi-numeric-{{ index + 1 }}-circle</v-icon>
    </td>
    <td class="grey--text shrink d-none d-md-table-cell">
      {{ index > 0 ? "and" : "" }}
    </td>

    <template v-if="$vuetify.breakpoint.mdAndUp">
      <td class="shrink align-center pl-4">
        <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
        {{ (myConfig.type === 'boolean' ? "work" : myConfig.displayName) | capitalize }}
      </td>
      <td class="shrink pr-6" style="min-width: 5em; text-align: center;">
        <filter-verb
            :is-negated="isNegated"
            :value="myValue"
            :filter-key="filterKey"
            :type="myConfig?.type"
            @set="(val) => isNegated = val"
        />
      </td>
      <td class="">
        <slot></slot>
      </td>
      <td class="text-right">
        <v-btn icon @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
          <v-icon>mdi-plus-thick</v-icon>
        </v-btn>
        <v-btn icon @click.stop="url.deleteFilter(entityType, index)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </td>
    </template>
    <template v-else>
      <div style="width: 100%;" class="pa-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2 mb-1">{{ myConfig.icon }}</v-icon>
          <div>
            {{ (myConfig.type === 'boolean' ? "work" : myConfig.displayName) | capitalize }}
          </div>
          <v-spacer />
          <filter-verb
              :is-negated="isNegated"
              :value="myValue"
              :type="myConfig?.type"
              @set="(val) => isNegated = val"
          />

          <v-btn icon @click.stop="url.deleteFilter(entityType, index)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <div class="ml-3">
          <slot></slot>
          <v-btn small rounded class="ml-2 mt-2" @click.stop="$emit('add-option')" v-if="myConfig.type === 'select'">
            <v-icon left>mdi-plus-thick</v-icon> add {{ myConfig.displayName }}
          </v-btn>
        </div>
      </div>
    </template>


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
    myValue() {
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

  &.card {
    display: flex;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    align-items: center;
    align-content: center;
    td {
      display: block;

    }
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