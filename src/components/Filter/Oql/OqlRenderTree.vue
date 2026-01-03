<template>
  <div class="oql-tree">
    <!-- First line: Entity + where + first clause (SQL style) -->
    <div class="oql-first-line">
      <span class="oql-entity">{{ tree.entity?.text }}</span>
      <span v-if="tree.where_keyword" class="oql-where-keyword">{{ tree.where_keyword }}</span>
      <!-- If single clause, render inline -->
      <oql-clause-node
        v-if="tree.where && tree.where.type === 'clause'"
        :node="tree.where"
        @remove="$emit('remove', $event)"
        @change-operator="$emit('change-operator', $event)"
        @add="$emit('add', $event)"
        class="oql-inline-clause"
      />
      <!-- If group, render first child inline -->
      <oql-clause-node
        v-else-if="tree.where && tree.where.type === 'group' && tree.where.children?.[0]?.type === 'clause'"
        :node="tree.where.children[0]"
        @remove="$emit('remove', $event)"
        @change-operator="$emit('change-operator', $event)"
        @add="$emit('add', $event)"
        class="oql-inline-clause"
      />
      <oql-expression-node
        v-else-if="tree.where && tree.where.type === 'group' && tree.where.children?.[0]?.type === 'group'"
        :node="tree.where.children[0]"
        :depth="1"
        :is-first-in-group="true"
        @remove="$emit('remove', $event)"
        @change-operator="$emit('change-operator', $event)"
        @toggle-join="$emit('toggle-join', $event)"
        @add="$emit('add', $event)"
        class="oql-inline-clause"
      />
    </div>

    <!-- Subsequent clauses: indented, starting with and/or -->
    <template v-if="tree.where && tree.where.type === 'group'">
      <div
        v-for="(child, index) in tree.where.children.slice(1)"
        :key="index"
        class="oql-subsequent-line"
      >
        <oql-group-toggle
          :join="tree.where.join"
          :source-pointer="tree.where.meta?.source_pointer"
          @toggle="$emit('toggle-join', $event)"
        />
        <oql-expression-node
          :node="child"
          :depth="1"
          @remove="$emit('remove', $event)"
          @change-operator="$emit('change-operator', $event)"
          @toggle-join="$emit('toggle-join', $event)"
          @add="$emit('add', $event)"
        />
      </div>
    </template>

    <!-- Directives (sort, sample) - each on own line, indented -->
    <div v-for="(directive, index) in tree.directives" :key="'d'+index" class="oql-directive-line">
      <oql-sort-directive
        v-if="directive.type === 'sort'"
        :directive="directive"
        @remove="$emit('remove-directive', $event)"
        @change="$emit('change-directive', $event)"
      />
      <oql-sample-directive
        v-else-if="directive.type === 'sample'"
        :directive="directive"
        @remove="$emit('remove-directive', $event)"
        @change="$emit('change-directive', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import OqlExpressionNode from './OqlExpressionNode.vue';
import OqlClauseNode from './OqlClauseNode.vue';
import OqlGroupToggle from './OqlGroupToggle.vue';
import OqlSortDirective from './OqlSortDirective.vue';
import OqlSampleDirective from './OqlSampleDirective.vue';

defineOptions({ name: 'OqlRenderTree' });

const emit = defineEmits(['remove', 'change-operator', 'toggle-join', 'add', 'remove-directive', 'change-directive']);

const props = defineProps({
  tree: {
    type: Object,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.oql-tree {
  font-size: 16px;
  line-height: 2;
  word-break: break-word;
}

.oql-first-line {
  // Entity + where + first clause on same line
}

.oql-entity {
  font-weight: 600;
  color: #333;
}

.oql-where-keyword {
  color: #666;
}

.oql-inline-clause {
  display: inline;
}

.oql-subsequent-line {
  padding-left: 3em; // Indent like SQL
}

.oql-directive-line {
  padding-left: 3em;
}
</style>
