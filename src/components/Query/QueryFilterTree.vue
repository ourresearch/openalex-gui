<!--
UX for creating a tree of filters which are stored in either `filter_aggs` or `filter_works`.
-->
<template>
  <div :class="{'query-filter-tree':  true, 'mb-2': isEmpty, 'mb-4': !isEmpty}">
    <span class="query-section-label">
      
      <!-- Sentence UI - Entity First -->
      <template v-if="uiVariant === 'sentence-entityfirst'">
        <!-- Works Filters -->
        <template v-if="isWorks && props.isWithAggs">
          {{ props.isSentence ? 'of' : 'Of' }}
          {{ isEmpty ? ' all' : '' }}
          <v-chip label color="catBlue" variant="flat" class="entity-chip">Works</v-chip>
          {{ !isEmpty ? ' where' : '' }}
        </template>

        <!-- Entity Filters -->
        <template v-else>
          {{ props.isSentence ? '' : 'Show' }}
          {{ !props.isSentence && isEmpty ? 'all' : '' }}
          <query-summarize-by :subjectEntity="props.subjectEntity" key="summarize-by"/>
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
          {{  hasResults ? (props.isSentence ? " grouped by" : "Grouped by") : (props.isSentence ? " group by" : "Group by") }}
          <query-summarize-by :subjectEntity="props.subjectEntity" key="summarize-by"/>
          {{ !isEmpty ? ' where' : '' }}
        </template>
      </template>

    </span>
    
    <span 
      :class="{'top-button-wrapper': true, 'mb-2': isEmpty, 'mb-4': !isEmpty, 'tight': uiVariant.includes('sentence')}" 
      v-if="!props.isSentence && props.subjectEntity !== null && hasAvailableFilters"
    >
      <query-filter-tree-button
        :subject-entity="props.subjectEntity"
        :text="uiVariant.includes('sentence') ? '' : 'Filter'"
        @addFilter="addFilter" />
    </span>

    <div class="query-wrapper" :style="{'border-color': borderColor }">
      <query-filter-tree-branch
        v-if="!isEmpty"
        :filters="myFilters"
        :join-operator="rootJoin"
        :subject-entity="props.subjectEntity"
        :is-sentence="props.isSentence"
        :is-root="true"
        @setJoinOperator="setJoinOperator"
        @setOperator="setOperator"
        @setValue="setValue"
        @deleteFilter="deleteFilter"
        @groupWithAbove="groupWithAbove"
        @ungroupFromAbove="ungroupFromAbove" />{{ props.isSentence && isFinal && !isEmpty ? '.' : '' }}
      
      <div class="bottom-button-wrapper mt-2" v-if="props.isSentence && props.subjectEntity !== null">
        <query-filter-tree-button
          :subject-entity="props.subjectEntity"
          text=""
          @addFilter="addFilter" />
      </div>

      <template v-if="uiVariant=== 'top'">
        <div class="results-count" v-if="!hasQueryChanged  && !isSearchCanceled && queryIsCompleted">
          <span v-if="props.subjectEntity === 'works' && props.isWithAggs || props.subjectEntity === 'summary'">
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


<script setup>
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import { useTheme } from "vuetify";
import _ from "lodash";

import { getConfigs } from "@/oaxConfigs";
import textFilters from "@/filters";

import QuerySummarizeBy from "@/components/Query/QuerySummarizeBy.vue";
import QueryFilterTreeBranch from "@/components/Query/QueryFilterTreeBranch.vue";
import QueryFilterTreeButton from "@/components/Query/QueryFilterTreeButton.vue";

defineOptions({ name: "QueryFilterTree" });

const props = defineProps({
  subjectEntity: String,
  filters: Array,
  isWithAggs: Boolean,
  isSentence: {
    type: Boolean,
    default: false,
  }
});

const store = useStore();

const myFilters = ref([]);
const rootJoin = ref("and");
const isRootGroupUserCreated = ref(false);

const uiVariant        = computed(() => store.getters.uiVariant);
const resultsMeta      = computed(() => store.getters["search/resultsMeta"]);
const isSearchCanceled = computed(() => store.getters["search/isSearchCanceled"]);
const hasQueryChanged  = computed(() => store.getters["search/hasQueryChanged"]);
const queryIsCompleted = computed(() => store.getters["search/queryIsCompleted"]);
const hasResults       = computed(() => store.getters["search/hasResults"]);

const isWorks = computed(() => ["works", "summary"].includes(props.subjectEntity));
const isEmpty = computed(() => myFilters.value.length === 0);
const isFinal = computed(() => uiVariant.value === 'sentence-worksfirst' ? !isWorks.value : isWorks.value);

const hasAvailableFilters = computed(() => {
  const myConfig = getConfigs()[props.subjectEntity];
  const myPossibleColumns = Object.values(myConfig.columns);
  const availableFilters = myPossibleColumns.filter(f => f.actions && f.actions.includes("filter"));
  return availableFilters.length > 0;
});

const borderColor = computed(() => {
  const theme = useTheme();
  return isWorks.value ? theme.current.value.colors.catWorks : theme.current.value.colors.catEntity;
});

// Cleaned filters that get pushed into store
const filtersToStore = computed(() => {
  const cleanFilter = (filter) => {
    if (filter.filters) {
      const cleanedChildFilters = filter.filters.map(cleanFilter).filter(f => f !== null);
      if (cleanedChildFilters.length === 0) return null;
      return { join: filter.join, filters: cleanedChildFilters };
    }
    const cleanedLeaf = { column_id: filter.column_id, value: filter.value };
    if (filter.operator) cleanedLeaf.operator = filter.operator;
    return cleanedLeaf;
  };
  let cleaned = myFilters.value.map(cleanFilter).filter(f => f !== null);
  return rootJoin.value === "or" ? [{ join: "or", filters: cleaned }] : cleaned;
});

function decorateMyFilters() {
  const decorate = (filters, parentPath = []) => {
    return filters.map((filter, index) => {
      const path = [...parentPath, index];
      const canGroupAbove = (parentPath.length === 0 && index > 0) || (parentPath.length > 0 && index > 1);
      const canUngroup = path.length > 1;
      if (filter.filters) {
        return { join: filter.join, filters: decorate(filter.filters, path) };
      } else {
        return { ...filter, path, canGroupAbove, canUngroup };
      }
    });
  };
  myFilters.value = decorate(myFilters.value);
}

function hasSingleRootGroup() {
  return myFilters.value.length === 1 && myFilters.value[0].filters;
}

function getFilterFromPath(path) {
  if (!path || path.length === 0) return { join: rootJoin.value, filters: myFilters.value, root: true };
  let current = myFilters.value;
  for (let i = 0; i < path.length; i++) {
    const f = current[path[i]];
    if (!f) return null;
    if (i < path.length - 1) current = f.filters;
    else return f;
  }
}

function getGroupParentPath(path) {
  while (path[path.length - 1] === 0) path = path.slice(0, -1);
  return path.slice(0, -1);
}

function addFilter(column) {
  const initValue = column.type === "boolean" ? true : null;
  myFilters.value.push({ column_id: column.id, value: initValue, operator: column.defaultOperator });
  decorateMyFilters();
  applyFilters();
}

function deleteFilter(path) {
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = getFilterFromPath(parentPath);
  if (parentPath.length === 0) myFilters.value.splice(index, 1);
  else if (parent && Array.isArray(parent.filters)) {
    parent.filters.splice(index, 1);
    if (parent.filters.length === 0) removeEmptyGroup(parentPath);
  }
  if (parentPath.length === 1 && parentPath[0] === 0) isRootGroupUserCreated.value = false;
  applyFilters();
}

function setOperator(path, operator) {
  getFilterFromPath(path).operator = operator;
  applyFilters();
}

function setValue(path, value) {
  getFilterFromPath(path).value = value;
  applyFilters();
}

function setJoinOperator(path, joinOperator) {
  const groupParentPath = getGroupParentPath(path);
  if (groupParentPath.length === 0) rootJoin.value = joinOperator;
  else getFilterFromPath(groupParentPath).join = joinOperator;
  applyFilters();
}

function groupWithAbove(path) {
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  if (index === 0) return;
  const parent = getFilterFromPath(parentPath);
  const group = parent.filters;
  const sibling = group[index - 1];
  const current = group[index];
  if (sibling.join && Array.isArray(sibling.filters)) {
    group.splice(index, 1);
    sibling.filters.push(current);
  } else {
    const newGroup = { join: parent.join, filters: [sibling, current] };
    group.splice(index - 1, 2, newGroup);
  }
  if (parentPath.length === 0 && hasSingleRootGroup()) isRootGroupUserCreated.value = true;
  applyFilters();
}

function ungroupFromAbove(path) {
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = getFilterFromPath(parentPath);
  const [removed] = parent.filters.splice(index, 1);
  const grandPath = parentPath.slice(0, -1);
  const parentIndex = parentPath[parentPath.length - 1];
  const grand = getFilterFromPath(grandPath);
  if (!grand || !Array.isArray(grand.filters)) return;
  grand.filters.splice(parentIndex + 1, 0, removed);
  if (parent.filters.length === 0) removeEmptyGroup(parentPath);
  else if (parent.filters.length === 1) grand.filters.splice(parentIndex, 1, parent.filters[0]);
  if (parentPath.length === 1 && parentPath[0] === 0) isRootGroupUserCreated.value = false;
  applyFilters();
}

function removeEmptyGroup(path) {
  if (path.length === 0) return;
  const grandPath = path.slice(0, -1);
  const index = path[path.length - 1];
  if (grandPath.length === 0) myFilters.value.splice(index, 1);
  else {
    const grand = getFilterFromPath(grandPath);
    if (grand && Array.isArray(grand.filters)) {
      grand.filters.splice(index, 1);
      if (grand.filters.length === 0) removeEmptyGroup(grandPath);
    }
  }
}

async function applyFilters() {
  const method = props.subjectEntity === "works" ? "setFilterWorks" : "setFilterAggs";
  store.commit(`search/${method}`, filtersToStore.value);
}

watch(() => props.filters, 
  (val) => {
    myFilters.value = _.cloneDeep(val);
    if (myFilters.value.length === 1 && myFilters.value[0].join === "or" && !isRootGroupUserCreated.value) {
      rootJoin.value = "or";
      myFilters.value = myFilters.value[0].filters;
    }
    decorateMyFilters();
  }, 
  { immediate: true });
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