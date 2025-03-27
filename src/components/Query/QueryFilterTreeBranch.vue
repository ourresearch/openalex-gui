<template>
  <div class="query-filter-tree-branch">
    <template v-for="(item, index) in filters">
      <span :key="'openParen' + index" v-if="isSentence && item.filters" class="no-space-paren">(&#x2060;</span>
      <query-filter-tree-branch 
        v-if="item.filters"
        :key="index"
        :filters="item.filters"
        :join-operator="item.join"
        :parent-join-operator="joinOperator"
        :subject-entity="subjectEntity"
        :is-sentence="isSentence"
        @setValue="(path, value, dontApply) => $emit('setValue', path, value, dontApply)"
        @setOperator="(path, operator, dontApply) => $emit('setOperator', path, operator, dontApply)"
        @deleteFilter="(path) => $emit('deleteFilter', path)"
        @setJoinOperator="(path, joinOperator) => $emit('setJoinOperator', path, joinOperator)"
        @groupWithAbove="(path) => $emit('groupWithAbove', path)"
        @ungroupFromAbove="(path) => $emit('ungroupFromAbove', path)"
      />
      <span :key="'closeParen' + index" v-if="isSentence && item.filters" class="no-space-paren">&#x2060;)</span>

      <query-filter-tree-leaf 
        v-if="!item.filters"
        :key="index"
        :subject-entity="subjectEntity"
        :column_id="item.column_id"
        :operator="item.operator"
        :value="item.value"
        :join-operator="index === 0 ? parentJoinOperator : joinOperator"
        :path="item.path"
        :can-group-above="item.canGroupAbove"
        :can-ungroup="item.canUngroup"
        :is-sentence="isSentence"
        @setValue="(path, value, dontApply) => $emit('setValue', path, value, dontApply)"
        @setOperator="(path, operator, dontApply) => $emit('setOperator', path, operator, dontApply)"
        @deleteFilter="(path) => $emit('deleteFilter', path)"
        @setJoinOperator="(path, joinOperator) => $emit('setJoinOperator', path, joinOperator)"
        @groupWithAbove="(path) => $emit('groupWithAbove', path)"
        @ungroupFromAbove="(path) => $emit('ungroupFromAbove', path)"
      />
    </template>
  </div>
</template>


<script>

import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";

export default {
  name: "QueryFilterTreeBranch",
  components: {
    QueryFilterTreeBranch: () => import('./QueryFilterTreeBranch.vue'),
    QueryFilterTreeLeaf,
  },
  props: {
    filters: Array,
    joinOperator: String,
    parentJoinOperator: String,
    subjectEntity: String,
    isSentence: Boolean,
    isRoot: Boolean,
  },
  emits: [
    'setValue',
    'setOperator',
    'deleteFilter',
    'setJoinOperator',
    'groupWithAbove',
    'ungroupFromAbove'
  ],
}
</script>


<style scoped lang="scss">
.no-space-paren {
  display: inline-block;
  margin: 0;
  padding: 0;
  font-size: inherit;
  line-height: 0;
  vertical-align: baseline;
}
</style>