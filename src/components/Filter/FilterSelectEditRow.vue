<template>
  <v-list-item
      :disabled="disabled"
      @click="isApplied = !isApplied"
  >
    <!--      @click="$emit('add', value)"-->
    <span>
      <template v-if="isApplied">
        <v-icon v-if="isNegated">mdi-minus-circle</v-icon>
        <v-icon v-else>mdi-checkbox-marked</v-icon>
      </template>
      <v-icon v-else>mdi-checkbox-blank-outline</v-icon>
    </span>
    
      <v-list-item-title :class="{isNegated}">
        {{ displayValue }}
        {{ (disabled) ? "(applied)" : "" }}
      </v-list-item-title>
      <v-list-item-subtitle v-if="hint" style="white-space: normal;">
        <span v-if="myEntityConfig">{{ myEntityConfig.displayName | $pluralize(1) |capitalize }} </span>
        <span v-if="hint"> {{ hint | truncate(100)}}</span>
      </v-list-item-subtitle>
    
    <small class="body-1">
      <template v-if="isCountLoading">
        <v-progress-circular indeterminate size="10" width="2" color="grey"/>
      </template>
      <template>
        {{ myCount | $toPrecision }}
      </template>
    </small>
  </v-list-item>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {url} from "@/url";
import {filtersFromUrlStr} from "@/filterConfigs";
import {api} from "@/api";
import {getEntityConfig} from "@/entityConfigs";
import {getFacetConfig} from "@/facetConfigs";

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
    isFromAutocomplete: Boolean,
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

      "entityType",
    ]),
    myConfig(){
      return getFacetConfig(this.entityType, this.filterKey)
    },
    myEntityConfig(){
      return getEntityConfig(this.myConfig?.entityId)
    },
    valueId() {
      return this.value.replace("!", "")
    },
    index() {
      return url.findFilterIndex(this.$route, this.entityType, this.filterKey, this.value)
    },
    isApplied: {
      get() {
        return url.isFilterOptionApplied(this.$route, this.entityType, this.filterKey, this.value)
      },
      set(to) {
        if (this.filterIndex >= 0){
          console.log("FilterSelectEditRow set()", this.filterIndex)
          to ? url.addFilterOption(this.entityType, this.filterIndex, this.value) :
              url.deleteFilterOption(this.entityType, this.filterIndex, this.value)
        }
        else {
          to ? url.createFilter(this.entityType, this.filterKey, this.value) :
               url.deleteFilterOptionByKey(this.entityType, this.filterKey, this.value)
        }
      }
    },
    isNegated() {
      return url.readIsFilterNegated(this.$route, this.entityType, this.index)
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
.isNegated {
  text-decoration: line-through !important;
}

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
