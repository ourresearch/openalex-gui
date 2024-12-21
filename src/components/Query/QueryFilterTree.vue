<template>
  <v-card flat rounded :class="{'query-filter-tree': true, 'inline-block': displayInline}">
    <div v-html="topText" :class="{'query-section-label': true, 'inline-block': displayButtonInline}"/>

    <v-treeview
        v-if="!isEmpty"
        :items="displayFilters"
        :open.sync="openNodes"
        open-all
        dense
    >
      <template v-slot:prepend="{item, open}">
        <span class="number grey--text" :style="{'margin-left': item.depth ? (item.depth * 20) + 'px' : 0 }">
          {{ item.displayPath.join(".") }}.
        </span>
      </template>

      <template v-slot:label="{ item, open }">
        <query-filter-tree-leaf
            :column_id="item.column_id"
            :operator="item.operator"
            :join-operator="item.joinOperator"
            :value="item.value"
            :depth="item.depth"
            :subject-entity="subjectEntity"
            :sibling-index="item.siblingIndex"
            :can-group-above="item.canGroupAbove"
            @setDepth="(depth) => setFilterDepth(item.path, depth)"
            @setJoinOperator="(joinOperator) => setFilterJoinOperator(item.path, joinOperator)"
            @setOperator="(operator) => setFilterOperator(item.path, operator)"
            @setValue="(value) => setFilterValue(item.path, value)"
        />
      </template>

      <template v-slot:append="{ item, open }">
        <div class="d-flex">
          <v-btn icon @click="deleteFilter(item.path)">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </template>

    </v-treeview>

    <div :class="{'button-wrapper': true, 'inline-block': displayButtonInline}">
      <query-filter-tree-button
          :subject-entity="subjectEntity"
          :parent-id="null"
          :nameWorks="isWithAggs"
          :withExistingFilters="!isEmpty"
          @addFilter="addFilter"
      />
    </div>
  </v-card>
</template>


<script>

import {mapActions, mapGetters, mapMutations} from "vuex";
import {
  cleanFilters,
  convertFlatToRecursive, deleteNode,
  makeFilterBranch,
  makeFilterButton,
  makeFilterLeaf
} from "@/components/Query/query";
import {getConfigs} from "@/oaxConfigs";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";
import {filter} from "core-js/internals/array-iteration";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";
import QueryFilterTreeButton from "@/components/Query/QueryFilterTreeButton.vue";
import Vue from "vue";


export default {
  name: "QueryFilterTree",
  components: {
    QueryFilterTreeLeaf,
    QueryFilterTreeBranch,
    QueryFilterTreeButton,
  },
  props: {
    subjectEntity: String,
    filters: Array,
    isWithAggs: Boolean,
  },
  data() {
    return {
      foo: 42,
      openNodes: [],
      myFilters: [],
    }
  },
  computed: {
    ...mapGetters([]),
    ...mapGetters("user", [
      "userId",
    ]),
    ...mapGetters("search", [
      "query",
      "querySubjectEntity",
      "querySubjectEntityConfig",
    ]),
    displayFilters() {
      const results = []
      this.myFilters.forEach((f, i) => 
        results.push({
          ...f,
          id: i, // for the treeview to know which nodes are open
          path: [i], // so we can find which nodes to update and delete
          siblingIndex: i, // just for display
        })
      )
      return results
    },
    filtersToStore() {
      const ret = this.myFilters.filter(f => {
        // don't save filters unless the value is set
        const valueIsSet = f.value !== null && f.value !== "" && f.value !== undefined

        // but it's ok to save filters with no operator set, it'll just use the default.
        return valueIsSet
      })
      return _.cloneDeep(ret)
    },
    isEmpty() {
      return this.myFilters.length === 0
    },
    displayInline() {
      return this.isEmpty && !this.isWithAggs
    },
    displayButtonInline() {
      return this.isEmpty && this.isWithAggs
    },
    topText() {
      if (this.isWithAggs && !this.isEmpty) {
        return "Based on <b>works</b> where"
      } else if (this.isWithAggs && this.isEmpty) {
        return "Based on <b>all works</b>"
      } else if (this.isEmpty) {
        return ""
      } else {
        return "Where"
      }
    }
  },
  methods: {
    filter,
    ...mapMutations([
      "snackbar",
    ]),
    ...mapMutations("search", []),
    ...mapActions("search", [
      "createSearch",
      "setAllFilters",
    ]),
    ...mapActions("user", []),
    // create
    addFilter(columnId, columnType) {
      const initValue = columnType === "boolean" ? true : null
      this.myFilters.push({
        column_id: columnId,
        // operator is not required, it'll use the default if not supplied later
        value: initValue,
      })
      this.decorateMyFilters()
      if (columnType === "boolean") {
        this.applyFilters()
      }
    },
    decorateMyFilters() {
      // Adds values to `myFilters` that requre looking at them as a set.
      const results = []
      this.myFilters.forEach((f, i) => {
        f.depth = f.depth ?? 0
        const prev = i > 0 ? results[i-1] : undefined
        const canGroupAbove = prev && this.myFilters.length > 2 && prev.depth !== f.depth-1

        // Add a display path repsenting depth / groups like [1], [2,3]
        let displayPath = []
        const prevDisplayPath = prev ? prev.displayPath : undefined
        if (!prev) { 
          displayPath = [1] 
        } else if (prev.depth === f.depth-1) {
          // Add a new level of depth
          displayPath = [...prev.displayPath, 1] 
        } else if (prev.depth > f.depth) {
          // Removing levels of depth
          displayPath = prev.displayPath.slice(0, -(prev.depth-f.depth))
          displayPath[displayPath.length - 1] += 1
        } else { 
          // Adding to the exisiting level of depth
          displayPath = [...prevDisplayPath.slice(0, -1), prevDisplayPath[prevDisplayPath.length - 1] + 1]
        }

        results.push({
          ...f,
          canGroupAbove,
          displayPath,
        })
      })
      this.myFilters = results
    },
    // read
    getFilterFromPath(path) {
      // for now we just assume there is only a flat array of filters
      const index = path[0]
      return this.myFilters[index]
    },
    getFiltersInSameGroup(path) {
      // Returns an array of all filters in the same join group as `path`
      const testFilter = this.getFilterFromPath(path)
      const testGroup = testFilter.displayPath.slice(0, -1).join(".")

      return this.myFilters.filter(f => {
        return testGroup === f.displayPath.slice(0, -1).join(".")
      })
    },
    // update
    setFilterValue(pathToFilter, value) {
      console.log("setFilterValue", pathToFilter, value)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "value", value)
      this.applyFilters()
    },
    setFilterOperator(pathToFilter, operator) {
      console.log("setFilterOperator", pathToFilter, operator)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "operator", operator)
      this.applyFilters()
    },
    setFilterJoinOperator(pathToFilter, joinOperator) {
      console.log("setFilterJoin", pathToFilter, joinOperator)
      const filtersToUpdate = this.getFiltersInSameGroup(pathToFilter)
      filtersToUpdate.forEach(f => {
        Vue.set(f, "joinOperator", joinOperator)
      })
      this.applyFilters()
    },
    setFilterDepth(pathToFilter, depth) {
      console.log("setFilterDepth", pathToFilter, depth)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "depth", depth)
      this.applyFilters()
    },          
    // delete
    deleteFilter(path) {
      // for now we just assume there is only a flat array of filters
      const index = path[0]
      this.myFilters.splice(index, 1)
      this.applyFilters()
    },
    // apply
    applyFilters() {
      if (this.subjectEntity === "works") {
        this.$store.state.search.query.filter_works = this.filtersToStore
      } else {
        this.$store.state.search.query.filter_aggs = this.filtersToStore
      }
      this.createSearch()
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    "filters": {
      handler: function (filters) {
        this.myFilters = _.cloneDeep(filters)
        this.decorateMyFilters()
        this.openNodes = filters.map(f => f.id)
        console.log("filters update")
        console.log(this.myFilters)
      },
      immediate: true
    }
  }
}
</script>


<style lang="scss">
.invisible {
  visibility: hidden !important;
}
.query-filter-tree {
  margin-top: 28px
}
.query-section-label.inline-block {
  display: inline-block;
}
.button-wrapper.inline-block {
  display: inline-block;
  position: relative;
  top: -2px;
}
.query-filter-tree.inline-block {
  display: inline-block;
  margin-top: 0px;
  position: relative;
  top: -5px;
}
.query-filter-tree-button.inline-block {
  display: inline-block;
}
.v-treeview-node__prepend {
  min-width: 0;
}
.v-treeview-node__root .v-treeview-node__level {
  width: 16px
}
</style>