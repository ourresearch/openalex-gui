<template>
  <div class="query-filter-tree-branch">
    <template v-for="item in filters">
      <query-filter-tree-branch v-if="item.filters"
        :filters="item.filters"
        :join-operator="item.join"
        :subject-entity="subjectEntity"
        @setValue="(path, value, dontApply) => $emit('setValue', value, dontApply)"
        @setOperator="(path, operator, dontApply) => $emit('setOperator', operator, dontApply)"
        @deleteFilter="(path) => $emit('deleteFilter', path)"
        @setJoinOperator="(path, joinOperator) => $emit('setJoinOperator', path, joinOperator)"
        @groupWithAbove="(path) => $emit('groupWithAbove', path)"
        @ungroupFromAbove="(path) => $emit('ungroupFromAbove', path)"
      />
      <query-filter-tree-leaf v-else
        :subject-entity="subjectEntity"
        :column_id="item.column_id"
        :operator="item.operator"
        :value="item.value"
        :join-operator="joinOperator"
        :path="item.path"
        :can-group-above="item.canGroupAbove"
        :can-ungroup="item.canUngroup"
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


import {mapActions, mapGetters, mapMutations} from "vuex";
import QueryFilterTreeLeaf from "@/components/Query/QueryFilterTreeLeaf.vue";

export default {
  name: "QueryFilterTreeBranch",
  components: {
    QueryFilterTreeBranch: () => import('./QueryFilterTreeBranch.vue'),
    QueryFilterTreeLeaf
  },
  props: {
    filters: Array,
    joinOperator: String,
    subjectEntity: String,
  },
  emits: ['setValue', 'setOperator', 'deleteFilter', 'setJoinOperator', 'groupWithAbove', 'ungroupFromAbove'],  data() {
    return {
    }
  },
}
</script>


<style scoped lang="scss">

</style>