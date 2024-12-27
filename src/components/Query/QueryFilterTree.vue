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
        <span class="">
          <span class="number grey--text">
            {{ item.siblingIndex + 1 }}.
          </span>
          <span
              class="d-inline-flex justify-center"
              style="min-width: 1.6em;"
          >
            <template v-if="item.siblingIndex === 0">
              The
            </template>
            <template v-else>
              {{ item.parentOperator }}
            </template>
          </span>
        </span>
      </template>

      <template v-slot:label="{ item, open }">
        <query-filter-tree-leaf
            :column_id="item.column_id"
            :operator="item.operator"
            :value="item.value"
            :subject-entity="subjectEntity"
            @setOperator="(operator) => setFilterOperator(item.path, operator)"
            @setValue="(value) => setFilterValue(item.path, value)"
        />
      </template>

      <template v-slot:append="{ item, open }">
        <div class="d-flex">
          <v-btn
              icon
              @click="deleteFilter(item.path)"
          >
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
      return this.myFilters.map((f, i) => {
        return {
          ...f,
          id: i, // for the treeview to know which nodes are open
          path: [i], // so we can find which nodes to update and delete
          siblingIndex: i, // just for display
          parentOperator: "and", // just for display
        }
      })
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
      if (columnType === "boolean") {
        this.applyFilters()
      }
    },
    // read
    getFilterFromPath(path) {
      // for now we just assume there is only a flat array of filters
      const index = path[0]
      return this.myFilters[index]
    },
    // update
    setFilterOperator(pathToFilter, operator) {
      console.log("setFilterOperator", pathToFilter, operator)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "operator", operator)
      this.applyFilters()
    },
    setFilterValue(pathToFilter, value) {
      console.log("setFilterValue", pathToFilter, value)
      const filterToUpdate = this.getFilterFromPath(pathToFilter)
      Vue.set(filterToUpdate, "value", value)
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
        this.openNodes = filters.map(f => f.id)
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
  margin-left: 0px;
}
.query-filter-tree-button.inline-block {
  display: inline-block;
}
.v-treeview-node__root .v-treeview-node__level {
  width: 16px
}
</style>