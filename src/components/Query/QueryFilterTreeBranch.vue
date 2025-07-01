<template>
  <div class="query-filter-tree-branch">
    <template v-for="(item, index) in filters">
      <query-filter-tree-branch 
        v-if="item.filters"
        :key="index"
        :filters="item.filters"
        :join-operator="item.join"
        :parent-join-operator="joinOperator"
        :subject-entity="subjectEntity"
        :is-sentence="isSentence"
        :is-group="true"
        @setValue="(path, value, dontApply) => $emit('setValue', path, value, dontApply)"
        @setOperator="(path, operator, dontApply) => $emit('setOperator', path, operator, dontApply)"
        @deleteFilter="(path) => $emit('deleteFilter', path)"
        @setJoinOperator="(path, joinOperator) => $emit('setJoinOperator', path, joinOperator)"
        @groupWithAbove="(path) => $emit('groupWithAbove', path)"
        @ungroupFromAbove="(path) => $emit('ungroupFromAbove', path)"
      />

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
        :is-first-of-group="isGroup && index === 0"
        :is-last-of-group="isGroup && index === filters.length - 1"
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


<script setup>
import {defineAsyncComponent } from 'vue';
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";

// Import self component for recursive usage
const QueryFilterTreeBranch = defineAsyncComponent(() => import('./QueryFilterTreeBranch.vue'));

defineOptions({ name: "QueryFilterTreeBranch" });

defineProps({
  filters: Array,
  joinOperator: String,
  parentJoinOperator: String,
  subjectEntity: String,
  isSentence: Boolean,
  isRoot: Boolean,
  isGroup: Boolean,
});

defineEmits([
  'setValue',
  'setOperator',
  'deleteFilter',
  'setJoinOperator',
  'groupWithAbove',
  'ungroupFromAbove'
]);
</script>


<style scoped lang="scss">
.no-space-paren {
  display: inline-block;
  margin: 0;
  padding: 0;
  font-size: inherit;
  font-weight: bold;
  line-height: 0;
  vertical-align: baseline;
}
</style>