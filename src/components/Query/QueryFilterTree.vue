<!--
UX for create a tree of filters fos a query.
Stores a local copy of filter state with additional properties to help with manipulations.
Local filter state maybe in progress with e.g. values not yet set.
Calls this.applyFilters() whenver filter state is ready to be passed up to global state.
Manipulations of current filter state occur locally and are passed to global state as a complete set.
-->

<template>
  <v-card v-if="hasAvailableFilters" flat rounded :class="{'query-filter-tree': true, 'inline-block': displayInline}">

    <div v-if="hasTopSpace" class="spacer my-2"></div>

    <div v-if="!displayInline && topText" v-html="topText" :class="{'query-section-label': true, 'inline-block': displayButtonInline}"/>

    <query-filter-tree-branch
      v-if="!isEmpty"
      :filters="myFilters"
      :join-operator="rootJoin"
      :subject-entity="subjectEntity"
      @setJoinOperator="setJoinOperator"
      @setOperator="setOperator"
      @setValue="setValue"
      @deleteFilter="deleteFilter"
      @groupWithAbove="groupWithAbove"
      @ungroupFromAbove="ungroupFromAbove"
    />

    <div :class="{'button-wrapper': true, 'mx-4': !isEmpty, 'inline-block': displayButtonInline}">
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
import {getConfigs} from "@/oaxConfigs";
import {filter} from "core-js/internals/array-iteration";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";
import QueryFilterTreeButton from "@/components/Query/QueryFilterTreeButton.vue";
import Vue from "vue";
import _ from 'lodash'


export default {
  name: "QueryFilterTree",
  components: {
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
      myFilters: [], // Local copy of filters kept so we can represent filters as they're being edited before they are applied
      rootJoin: "and",
      isEditingFilters: false,
    }
  },
  computed: {
    hasAvailableFilters() {
      const myConfig = getConfigs()[this.subjectEntity];
      const myPossibleColumns = Object.values(myConfig.columns);
      const availableFilters = myPossibleColumns.filter( f => f.actions && f.actions.includes("filter"));
            
      return availableFilters.length > 0;
    },
    isEmpty() {
      return this.myFilters.length === 0;
    },
    displayInline() {
      return false;
      return this.isEmpty && !this.isWithAggs;
    },
    displayButtonInline() {
      return false;
      return this.isEmpty && this.isWithAggs;
    },
    hasTopSpace() {
      return this.topText == "Where";
    },
    topText() {
      if (this.isWithAggs && !this.isEmpty) {
        return "Found in <b>works</b> where";
      } else if (this.isWithAggs && this.isEmpty) {
        return "Found in <b>all works</b>";
      } else if (this.isEmpty) {
        return null;
      } else {
        return "Where";
      }
    },
    filtersToStore() {
      // Returns local filter state, cleaned of local props, to be stored in Vuex store
      const cleanFilter = (filter) => {
        if (filter.filters) { // Branch
          const cleanedChildFilters = filter.filters
            .map(cleanFilter)
            .filter((f) => f !== null);

          // If no valid child filters remain, discard this group
          if (cleanedChildFilters.length === 0) { return null; }

          return {
            join: filter.join,
            filters: cleanedChildFilters
          };
        }

        // Leaf -- skip leaves with no value
        if ([null, undefined, ""].includes(filter.value)) {
          return null;
        }

        // Keep the basic leaf properties
        const cleanedLeaf = {
          column_id: filter.column_id,
          value: filter.value
        };

        // Only include operator if it exists
        if (filter.operator) {
          cleanedLeaf.operator = filter.operator;
        }

        return cleanedLeaf;
      };

      // Process top-level array
      let cleanedFilters = this.myFilters
        .map(cleanFilter)
        .filter((f) => f !== null);

      if (this.rootJoin == "or") {
        cleanedFilters = [{
          join: "or",
          filters: cleanedFilters
        }];
      }

      return cleanedFilters;
    },
  },
  methods: {
    filter,
    ...mapMutations("search", [
      "setFilterWorks",
      "setFilterAggs",
    ]),
    ...mapActions("search", [
      "createSearch",
    ]),
    decorateMyFilters() {
      // Recursively decorates filters with path + grouping properties
      const decorateFilters = (filters, parentPath = []) => {
        return filters.map((filter, index) => {
          const currentPath = [...parentPath, index];

          const canGroupAbove = (parentPath.length === 0 && index > 0) 
                                || (parentPath.length > 0 && index > 1);
          const canUngroup = (currentPath.length > 1);

          if (filter.filters) {
            // Nested group
            return {
              join: filter.join,
              filters: decorateFilters(filter.filters, currentPath),
            };
          } else {
            // Leaf
            return {
              ...filter,
              path: currentPath,
              canGroupAbove,
              canUngroup,
            };
          }
        });
      };

      this.myFilters = decorateFilters(this.myFilters);
      //console.log("decorated filters:", JSON.stringify(this.myFilters, null, 2));
    },
    getFilterFromPath(path) {
      // Returns filter object give a path like [0], [1,2]
      // If path is empty, interpret that as “the root array”
      if (!path || path.length === 0) {
        // Return a “fake” parent object that points to myFilters
        return { join: this.rootJoin, filters: this.myFilters, root: true };
      }

      let currentFilters = this.myFilters;
      let currentFilter = null;

      for (let i = 0; i < path.length; i++) {
        const index = path[i]; // 0-based index
        currentFilter = currentFilters[index];

        if (!currentFilter) {
          console.log("No filter found at index", index);
          return null; // Path is invalid
        }

        // If we're not at the end, we go deeper
        if (i < path.length - 1) {
          if (!currentFilter.join || !Array.isArray(currentFilter.filters)) {
            console.log("Cannot go deeper - not a nested filter");
            return null;
          }
          currentFilters = currentFilter.filters;
        }
      }
      return currentFilter;
    },
    getFiltersInSameGroup(path) {
      // Returns all filters that are in the same group as the filter at `path`
      const parentFilter = this.getParentFilter(path);
      return parentFilter.filters;
    },
    getParentFilter(path) {
      const parentPath = path.slice(0, -1);
      const parentFilter = this.getFilterFromPath(parentPath);
      return parentFilter;      
    },
    getGroupParentPath(path) {
      // Returns the oldest ancestor of path for which path is always the first child
      while (path[path.length-1] === 0) {
        path = path.slice(0, -1);
      }
      const groupParentPath = path.slice(0, -1);
      return groupParentPath;
    },
    addFilter(columnId, columnType) {
      console.log("Adding filter", { columnId, columnType });
      const initValue = columnType === "boolean" ? true : null
      this.myFilters.push({
        column_id: columnId,
        value: initValue,
      });
      this.decorateMyFilters();
      if (columnType === "boolean") {
        this.applyFilters();
      }
      this.isEditingFilters = true;
      // Log the state after adding
      console.log("After adding filter:", this.myFilters);
    },
    setOperator(path, operator, dontApply) {
      console.log("setOperator", path, operator);
      console.log("dontApply: " + dontApply);
      const filterToUpdate = this.getFilterFromPath(path);
      Vue.set(filterToUpdate, "operator", operator);
      if (dontApply) {
        console.log("setOperator with dontApply");
        this.isEditingFilters = true;
      } else if (!this.isEditingFilters) {
        console.log("setOperator and applyFilters");
        this.applyFilters();
      }
    },
    setValue(path, value, dontApply) {
      console.log("Setting filter value", { path, value, dontApply });
      const filterToUpdate = this.getFilterFromPath(path);
      Vue.set(filterToUpdate, "value", value);
      if (dontApply) {
        this.isEditingFilters = true;
      } else {
        this.applyFilters();
      }
    },
    setJoinOperator(path, joinOperator) {
      console.log("setJoin", JSON.stringify(path), joinOperator);

      /*
      // Changing root from AND to OR, create a group
      if (this.getGroupParentPath(path).length === 0 && joinOperator === "or") {
        this.myFilters = [{
          join: "or",
          filters: this.myFilters
        }];
        this.decorateMyFilters();
      // Changing single root OR group to AND, flatten group
      } else if (joinOperator === "and" && 
                this.myFilters.length === 1 && 
                this.myFilters[0].join === "or") {
        this.myFilters = this.myFilters[0].filters;
        this.decorateMyFilters();
      } else {
        // Otherwise just change "join" prop on the correct group
        const groupParentPath = this.getGroupParentPath(path);
        const groupParentFilter = this.getFilterFromPath(groupParentPath);
        Vue.set(groupParentFilter, "join", joinOperator);
      }
      */

        // Otherwise just change "join" prop on the correct group
        const groupParentPath = this.getGroupParentPath(path);
        if (groupParentPath.length === 0) {
          this.rootJoin = joinOperator;
        } else {
          const groupParentFilter = this.getFilterFromPath(groupParentPath);
          Vue.set(groupParentFilter, "join", joinOperator);          
        }


      this.applyFilters();
    },
    groupWithAbove(path) {
      console.log("groupWithAbove path: " + path);

      // The parent is the array containing this filter
      const parentPath = path.slice(0, -1);
      const index = path[path.length - 1];

      if (index === 0) {
        console.warn("No filter above to group with.");
        return;
      }

      const parentFilter = this.getFilterFromPath(parentPath);

      // Our parent's array
      const parentArray = parentFilter.filters;
      const sibling = parentArray[index - 1];
      const current = parentArray[index];

      // If sibling is already a group, push current into sibling
      if (sibling.join && Array.isArray(sibling.filters)) {
        parentArray.splice(index, 1);    // remove current
        sibling.filters.push(current);   // add to sibling group
      } else {
        // Otherwise create a new group with sibling + current
        const newGroup = {
          join: "and",
          filters: [sibling, current],
        };
        // Remove sibling & current, then insert the group
        parentArray.splice(index - 1, 2);
        parentArray.splice(index - 1, 0, newGroup);
      }

      // Log for debugging
      // console.log("After grouping, myFilters:", JSON.stringify(this.myFilters, null, 2));

      this.applyFilters();
    },
    ungroupFromAbove(path) {
      console.log("ungroupFromAbove path:", path);

      // 1) Identify the parent group and index
      const parentPath = path.slice(0, -1);
      const indexInParent = path[path.length - 1];

      // 2) The parent group
      const parentFilter = this.getFilterFromPath(parentPath);

      // 3) Remove the 'removed' filter from parent's array
      const [removed] = parentFilter.filters.splice(indexInParent, 1);

      // 4) Insert the removed filter as a sibling in the grandparent
      const grandParentPath = parentPath.slice(0, -1);
      const parentIndexInGrand = parentPath[parentPath.length - 1];
      const grandParentFilter = this.getFilterFromPath(grandParentPath);

      if (!grandParentFilter || !grandParentFilter.filters) {
        console.warn("Grandparent is invalid. Cannot ungroup.");
        return;
      }

      // Insert below the parent group
      grandParentFilter.filters.splice(parentIndexInGrand + 1, 0, removed);

      // 5) If the parent group is empty, remove it entirely
      if (parentFilter.filters.length === 0) {
        this.removeEmptyGroup(parentPath);
      }
      // 6) Else if the parent group now has only one child, flatten it 
      //    (i.e. remove the group, put the single child in its place)
      else if (parentFilter.filters.length === 1) {
        const [singleChild] = parentFilter.filters;  // the only remaining child

        // Remove the parent group from the grandparent
        grandParentFilter.filters.splice(parentIndexInGrand, 1);
        // Insert the single child in its place
        grandParentFilter.filters.splice(parentIndexInGrand, 0, singleChild);
      }

      this.applyFilters();
    },
    deleteFilter(path) {
      console.log("deleteFilter at path:", path)
      this.isEditingFilters = true;
      // Get the parent path and the index to remove
      const parentPath = path.slice(0, -1);
      const indexToRemove = path[path.length - 1];

      if (parentPath.length === 0) {
        // Removing from root level
        this.myFilters.splice(indexToRemove, 1);
      } else {
        // Get the parent filter that contains our target
        const parentFilter = this.getFilterFromPath(parentPath);
        
        // If parent exists and has nested filters, remove the target
        if (parentFilter && parentFilter.join && Array.isArray(parentFilter.filters)) {
          parentFilter.filters.splice(indexToRemove, 1);

          // If parent now has no filters, remove it from *its* parent too
          if (parentFilter.filters.length === 0) {
            // Clean up the parent from the grandparent
            this.removeEmptyGroup(parentPath);
          }
        }
      }
      this.applyFilters();
    },
    removeEmptyGroup(path) {
      // Remove an empty group from its parent's filters.
      // If that empties the parent, bubble up again, etc.
      if (path.length === 0) {
        return;
      }

      const grandParentPath = path.slice(0, -1);
      const emptyGroupIndex = path[path.length - 1];

      if (grandParentPath.length === 0) {
        // The group is itself in the root array
        this.myFilters.splice(emptyGroupIndex, 1);
      } else {
        // Remove the group from its grandparent
        const grandParentFilter = this.getFilterFromPath(grandParentPath);
        if (grandParentFilter && grandParentFilter.join && Array.isArray(grandParentFilter.filters)) {
          grandParentFilter.filters.splice(emptyGroupIndex, 1);

          // If that made the grandparent empty, bubble up
          if (grandParentFilter.filters.length === 0) {
            this.removeEmptyGroup(grandParentPath);
          }
        }
      }
    },
    async applyFilters() {
      console.log("applyFilters:")
      //console.log(JSON.stringify(this.filtersToStore, null, 2));
      if (this.subjectEntity === "works") {
        this.setFilterWorks(this.filtersToStore);
      } else {
        this.setFilterAggs(this.filtersToStore);
      }
      await this.createSearch();
      this.isEditingFilters = false;
      //console.log("setting isEditingFilters false")
    },
  },
  created() {
  },
  mounted() {
  },
  watch: {
    "filters": {
      handler: function (filters) {
        if (!this.isEditingFilters) {
          this.myFilters = _.cloneDeep(filters);

          if (this.myFilters.length === 1 && this.myFilters[0].join === "or") {
            // Special case single "or" group to appear at root level
            this.rootJoin == "or";
            this.myFilters = this.myFilters[0].filters;
          }

          this.decorateMyFilters();
          //console.log("Watcher updating filters:");
          //console.log(JSON.stringify(filters, null, 2));
        }
      },
      immediate: true,
    }
  }
}
</script>


<style lang="scss">
.invisible {
  visibility: hidden !important;
}
.query-filter-tree {
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
.inline-block .v-btn {
  margin-left: 10px;
}
.v-treeview-node__prepend {
  min-width: 0;
}
.v-treeview-node__root .v-treeview-node__level {
  width: 16px
}
</style>