<template>
  <v-list-item
      @click="$emit('add', value)"
      :disabled="disabled"
  >
    <v-list-item-content>
      <v-list-item-title>
        {{ myDisplayValue }}
        {{ (disabled) ? "(applied)" : "" }}
      </v-list-item-title>
    </v-list-item-content>
    <v-list-item-action-text>
      {{ myCount | toPrecision }}
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
    displayValue: String || null,
    count: Number || null,
    disabled: Boolean,
  },
  data() {
    return {
      foo: 42,
      myCount: this.count,
      myDisplayValue: this.displayValue,
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
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),

    async getMyCount() {
      if (this?.myCount) return
      const filters = url.upsertFilterOptionNoPush(this.entityType, this.filterKey, this.value)
      const count = await api.getResultsCount(this.entityType, filters)
      this.myCount = count
    },
    async getMyDisplayValue() {
      if (this?.myDisplayValue) return // no need to get it it we've got it already
      this.myDisplayValue = await api.getFilterValueDisplayName(this.filterKey, this.valueId)
    },


  },
  created() {
  },
  mounted() {
  },
  watch: {
    value: {
      immediate: true,
      handler(to, from) {
        this.getMyCount()
        this.getMyDisplayValue()
      }
    }
  }
}
</script>

<style scoped lang="scss">
.group-by-table-row {
  cursor: pointer;

  &:hover {
    //background: $color-2;
  }
}

</style>