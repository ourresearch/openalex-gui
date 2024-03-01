<template>
  <v-list-item
      :disabled="disabled"
      @click="isApplied = !isApplied"
  >
<!--      @click="$emit('add', value)"-->
    <v-list-item-icon>
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>
        {{ displayValue }}
        {{ (disabled) ? "(applied)" : "" }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="hint">
        {{ hint }}
      </v-list-item-subtitle>
    </v-list-item-content>
    <v-list-item-action-text>
      <template v-if="isCountLoading">
        <v-progress-circular indeterminate size="10" width="2" color="grey" />
      </template>
      <template>
        {{ myCount | toPrecision }}
      </template>
    </v-list-item-action-text>
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import {api} from "@/api";

export default {
  name: "Template",
  components: {},
  props: {
    filterKey: String,
    filterIndex: Number,
    value: String,
    displayValue: String,
    count: Number || null,
    disabled: Boolean,
    hint: String,
    isFromAutocomplete:Boolean,
  },
  data() {
    return {
      foo: 42,
      myCount: this.count,
      isCountLoading: false,
    }
  },
  computed: {
    ...mapGetters([
      "resultsFilters",
      "entityType",
    ]),
    valueId() {
      return this.value.replace("!", "")
    },
    isApplied: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        if (to) {
          url.createFilter(this.entityType, this.filterKey, this.value)
        } else {
          url.deleteFilterOptionByKey(this.entityType, this.filterKey, this.value)
        }
      }
    },
    isNegated(){
      return false
    }
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),

    async getMyCount() {
      if (!this.isFromAutocomplete) return
      this.isCountLoading = true
      this.myCount = undefined
      const filters = url.upsertFilterOptionNoPush(this.entityType, this.filterKey, this.value)
      const count = await api.getResultsCount(this.entityType, filters)
      this.myCount = count
      this.isCountLoading = false
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    // value: {
    //   immediate: true,
    //   handler(to, from) {
    //     this.getMyCount()
    //   }
    // },
    "$route.query.filter": {
      immediate: true,
      handler(to, from) {
        this.getMyCount()
      }
    },
  }
}
</script>

<style scoped lang="scss">
.v-list-item__icon {
  margin: 0;
  align-self: normal;
}

.group-by-table-row {
  cursor: pointer;

  &:hover {
    //background: $color-2;
  }
}

</style>