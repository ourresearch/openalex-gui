<!--
UX for creating a tree of filters which are stored in either `filter_aggs` or `filter_works`.
-->
<template>
  <div :class="{'query-filter-tree':  true, 'mb-2': isEmpty, 'mb-4': !isEmpty}">
    <span class="query-section-label">
      
      <!-- Sentence UI - Entity First -->
      <template v-if="uiVariant === 'sentence-entityfirst'">
        <!-- Works Filters -->
        <template v-if="isWorks && isWithAggs">
          {{ isSentence ? 'of' : 'Of' }}
          {{ isEmpty ? ' all' : '' }}
          <v-chip label color="catBlue" variant="flat" class="entity-chip">Works</v-chip>
          {{ !isEmpty ? ' where' : '' }}
        </template>

        <!-- Entity Filters -->
        <template v-else>
          {{ isSentence ? '' : 'Show' }}
          {{ !isSentence && isEmpty ? 'all' : '' }}
          <query-summarize-by :subjectEntity="subjectEntity" key="summarize-by"/>
          {{ !isEmpty ? ' where' : '' }}
        </template>
      </template>

      <!-- Sentence UI - Works First -->
      <template v-else-if="uiVariant === 'sentence-worksfirst'">
        <!-- Works Filters -->
        <template v-if="isWorks">
          {{ isEmpty && !hasResults ? '' : '' }}
          <v-chip label color="catBlue" variant="flat" class="entity-chip">Works</v-chip>
          {{ !isEmpty ? ' where' : '' }}
        </template>

        <!-- Entity Filters -->
        <template v-else>
          {{  hasResults ? (isSentence ? " grouped by" : "Grouped by") : (isSentence ? " group by" : "Group by") }}
          <query-summarize-by :subjectEntity="subjectEntity" key="summarize-by"/>
          {{ !isEmpty ? ' where' : '' }}
        </template>
      </template>

    </span>
    
    <span 
      :class="{'top-button-wrapper': true, 'mb-2': isEmpty, 'mb-4': !isEmpty, 'tight': uiVariant.includes('sentence')}" 
      v-if="!isSentence && subjectEntity !== null && hasAvailableFilters"
    >
      <query-filter-tree-button
        :subject-entity="subjectEntity"
        :text="uiVariant.includes('sentence') ? '' : 'Filter'"
        @addFilter="addFilter" />
    </span>

    <div class="query-wrapper" :style="{'border-color': borderColor }">
      <query-filter-tree-branch
        v-if="!isEmpty"
        :filters="myFilters"
        :join-operator="rootJoin"
        :subject-entity="subjectEntity"
        :is-sentence="isSentence"
        :is-root="true"
        @setJoinOperator="setJoinOperator"
        @setOperator="setOperator"
        @setValue="setValue"
        @deleteFilter="deleteFilter"
        @groupWithAbove="groupWithAbove"
        @ungroupFromAbove="ungroupFromAbove" />{{ isSentence && isFinal && !isEmpty ? '.' : '' }}
      
      <div class="bottom-button-wrapper mt-2" v-if="isSentence && subjectEntity !== null">
        <query-filter-tree-button
          :subject-entity="subjectEntity"
          text=""
          @addFilter="addFilter" />
      </div>

      <template v-if="uiVariant=== 'top'">
        <div class="results-count" v-if="!hasQueryChanged  && !isSearchCanceled && queryIsCompleted">
          <span v-if="subjectEntity === 'works' && isWithAggs || subjectEntity === 'summary'">
            Analyzing 
            {{ resultsMeta?.works_count > 10000 ? "about " : "" }}
            {{ textFilters.toPrecision(resultsMeta?.works_count) }}
            works
          </span>
          <span v-else>
            {{ resultsMeta?.count > 10000 ? "about " : "" }}
            {{ textFilters.toPrecision(resultsMeta?.count) }}
            results
          </span>
        </div>
      </template>
    </div>

  </div>
</template>


<script>

import _ from 'lodash';
import {mapGetters, mapMutations} from "vuex";

import {getConfigs} from "@/oaxConfigs";
import filters from "@/filters";

import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";
import QueryFilterTreeButton from "@/components/Query/QueryFilterTreeButton.vue";


export default {
  name: "QueryFilterTree",
  components: {
    QuerySummarizeBy,
    QueryFilterTreeBranch,
    QueryFilterTreeButton,
  },
  props: {
    subjectEntity: String,
    filters: Array,
    isWithAggs: Boolean,
    isSentence: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      myFilters: [], // Local copy of filters kept so we can represent filters as they're being edited before they are applied
      rootJoin: "and",
      textFilters : filters,
    }
  },
  computed: {
    ...mapGetters(["uiVariant"]),
    ...mapGetters("search",[
      "resultsMeta",
      "resultsBody",
      "isSearchCanceled",
      "hasQueryChanged",
      "queryIsCompleted",
      "hasResults",
    ]),
    hasAvailableFilters() {
      const myConfig = getConfigs()[this.subjectEntity];
      const myPossibleColumns = Object.values(myConfig.columns);
      const availableFilters = myPossibleColumns.filter( f => f.actions && f.actions.includes("filter"));
            
      return availableFilters.length > 0;
    },
    isWorks() {
      return ["works", "summary"].includes(this.subjectEntity);
    },
    isEmpty() {
      return this.myFilters.length === 0;
    },
    isFinal() {
      if (this.uiVariant === 'sentence-worksfirst') {
        return !this.isWorks;
      }
      return this.isWorks;
    },
    displayInline() {
      return this.uiVariant === 'worksfirst' ? true : !this.isWithAggs;
    },
    displayButtonInline() {
      return true;
      //return this.isEmpty && this.isWithAggs;
    },
    borderColor() {
      // Access theme colors using the proper Vuetify 3 syntax
      const worksColor = this.$vuetify.theme.themes.light.colors.catWorksDarker;
      const entityColor = this.$vuetify.theme.themes.light.colors.catEntityDarker;
      
      return this.isWorks ? worksColor : entityColor;
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
    ...mapMutations("search", [
      "setFilterWorks",
      "setFilterAggs",
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
    hasSingleRootGroup() {
      return this.myFilters.length === 1 && this.myFilters[0].filters;
    },
    getFilterFromPath(path) {
      // Returns filter object given a path like [0], [1,2]
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
          //console.log("No filter found at index", index);
          return null; // Path is invalid
        }

        // If we're not at the end, we go deeper
        if (i < path.length - 1) {
          if (!currentFilter.join || !Array.isArray(currentFilter.filters)) {
            //console.log("Cannot go deeper - not a nested filter");
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
    addFilter(column) {
      console.log("Adding filter", column.id, column.type);
      const initValue = column.type === "boolean" ? true : null
      this.myFilters.push({
        column_id: column.id,
        value: initValue,
        operator: column.defaultOperator,
      });
      this.decorateMyFilters();
      this.applyFilters();
      // console.log("After adding filter:", this.myFilters);
    },
    deleteFilter(path) {
      //console.log("deleteFilter at path:", path)
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
      if (parentPath.length === 1 && parentPath[0] === 0) {
        this.isRootGroupUserCreated = false;
      }
      this.applyFilters();
    },
    setOperator(path, operator) {
      //console.log("setOperator", path, operator);
      const filterToUpdate = this.getFilterFromPath(path);
      filterToUpdate.operator = operator;
      this.applyFilters();
    },
    setValue(path, value) {
      //console.log("Setting filter value", { path, value, dontApply });
      const filterToUpdate = this.getFilterFromPath(path);
      filterToUpdate.value = value;
      this.applyFilters();
    },
    setJoinOperator(path, joinOperator) {
      console.log("setJoin", JSON.stringify(path), joinOperator);
      const groupParentPath = this.getGroupParentPath(path);
      if (groupParentPath.length === 0) {
        console.log("Setting root join to " + joinOperator);
        this.rootJoin = joinOperator;
      } else {
        console.log("Setting group join to " + joinOperator + " at path " + JSON.stringify(groupParentPath));
        const groupParentFilter = this.getFilterFromPath(groupParentPath);
        groupParentFilter.join = joinOperator;
      }
      this.applyFilters();
    },
    groupWithAbove(path) {
      //console.log("groupWithAbove path: " + path);
      // The parent is the array containing this filter
      const parentPath = path.slice(0, -1);
      const index = path[path.length - 1];

      if (index === 0) { return; } //console.warn("No filter above to group with.");

      const parentFilter = this.getFilterFromPath(parentPath);

      // Our parent's array
      const parentFilters = parentFilter.filters;
      const sibling = parentFilters[index - 1];
      const current = parentFilters[index];

      // If sibling above is already a group, push current into sibling
      if (sibling.join && Array.isArray(sibling.filters)) {
        parentFilters.splice(index, 1);    // remove current
        sibling.filters.push(current);   // add to sibling group
      } else {
        // Otherwise create a new group with sibling + current
        const newGroup = {
          join: parentFilter.join,
          filters: [sibling, current],
        };
        // Remove sibling & current, then insert the group
        parentFilters.splice(index - 1, 2);
        parentFilters.splice(index - 1, 0, newGroup);
      }

      if (parentPath.length === 0 && this.hasSingleRootGroup()) {
        this.isRootGroupUserCreated = true;
      }
      // console.log("After grouping, myFilters:", JSON.stringify(this.myFilters, null, 2));
      this.applyFilters();
    },
    ungroupFromAbove(path) {
      //console.log("ungroupFromAbove path:", path);

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

      if (parentPath.length === 1 && parentPath[0] === 0) {
        this.isRootGroupUserCreated = false;
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
      //console.log("applyFilters:")
      //console.log(JSON.stringify(this.filtersToStore, null, 2));
      if (this.subjectEntity === "works") {
        this.setFilterWorks(this.filtersToStore);
      } else {
        this.setFilterAggs(this.filtersToStore);
      }
    },
  },
  watch: {
    "filters": {
      handler: function (filters) {
        this.myFilters = _.cloneDeep(filters);

        if (this.myFilters.length === 1 && 
            this.myFilters[0].join === "or" &&
            !this.isRootGroupUserCreated) {
          // Special case single "or" group to appear at root level
          console.log("Special case single \"or\" group to appear at root level");
          this.rootJoin == "or";
          this.myFilters = this.myFilters[0].filters;
        }

        this.decorateMyFilters();
        //console.log("Watcher updating filters:");
        //console.log(JSON.stringify(filters, null, 2));
      },
      immediate: true,
    }
  }
}
</script>


<style lang="scss">
.query-filter-tree {
  margin-left: 0px;
}
.query-section-label {
  font-size: 20px;
  vertical-align: middle;
}
.top-button-wrapper {
  margin-left: 8px;
}
.query-wrapper {
  padding: 0px 0px 0px 15px;
  margin-top: 5px;
  border-left: 3px solid;
  border-radius: 0px !important;
  display: flex;
  flex-direction: column;
}
.query-filter-leaf {
  line-height: 1.6;
  font-size: 16px !important;
  vertical-align: middle;
}
.query-filter-leaf .v-chip {
  font-size: 16px !important;
}
.path-label {
  margin-right: 5px;
  font-size: 14px;
  color: #999;
}
.results-box .query-filter-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.results-box .query-wrapper {
  flex: 1 1 auto;
}
.results-box .bottom-button-wrapper {
  margin-bottom: 10px;
}
.v-treeview-node__prepend {
  min-width: 0;
}
.v-treeview-node__root .v-treeview-node__level {
  width: 16px
}
</style>