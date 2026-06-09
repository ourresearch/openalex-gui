<template>
  <div class="filter-group" :class="{ 'is-root': isRoot }">
    <div class="group-head">
      <v-btn-toggle
        :model-value="node.join"
        @update:model-value="setJoin"
        density="compact"
        variant="outlined"
        divided
        mandatory
        class="join-toggle"
      >
        <v-btn value="and" size="x-small">and</v-btn>
        <v-btn value="or" size="x-small">or</v-btn>
      </v-btn-toggle>
      <span class="group-hint text-caption text-medium-emphasis">
        match {{ node.join === "and" ? "all" : "any" }} of:
      </span>
      <v-spacer />
      <v-btn
        v-if="!isRoot"
        icon="mdi-close"
        size="x-small"
        variant="text"
        density="comfortable"
        class="group-remove"
        @click="$emit('remove')"
      />
    </div>

    <div class="group-body">
      <template v-for="(child, i) in node.children" :key="child._id">
        <div v-if="i > 0" class="joiner text-caption">{{ node.join }}</div>
        <BuilderFilterGroup
          v-if="child.type === 'group'"
          :node="child"
          :properties="properties"
          :depth="depth + 1"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
        <BuilderFilterRow
          v-else
          :node="child"
          :properties="properties"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <div v-if="node.children.length === 0" class="empty-hint text-caption text-medium-emphasis">
        No conditions yet.
      </div>

      <div class="group-actions">
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-plus"
          @click="addFilter"
        >Add filter</v-btn>
        <v-btn
          v-if="depth < MAX_DEPTH"
          size="small"
          variant="text"
          prepend-icon="mdi-plus-box-multiple-outline"
          @click="addGroup"
        >Add filter group</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import BuilderFilterRow from "@/components/OqlPlayground/BuilderFilterRow.vue";
import { makeLeaf, makeGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4; // nesting cap (Notion/Airtable cap at 3; we allow a little more)

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change"]);

// The node is a shared reactive member of the builder's tree (owned by
// PlaygroundBuilder, stable per :key). We edit it in place; alias it so we're not
// mutating the prop binding itself.
const node = props.node;

const setJoin = (j) => {
  if (!j) return;
  node.join = j;
  emit("change");
};
const addFilter = () => {
  node.children.push(makeLeaf());
  emit("change");
};
const addGroup = () => {
  node.children.push(makeGroup("or", [makeLeaf()]));
  emit("change");
};
const removeChild = (i) => {
  node.children.splice(i, 1);
  emit("change");
};
</script>

<style scoped>
.filter-group {
  border-left: 3px solid rgba(103, 58, 183, 0.25);
  padding: 8px 0 8px 12px;
  margin: 4px 0;
  background: rgba(103, 58, 183, 0.02);
  border-radius: 0 4px 4px 0;
}
.filter-group.is-root {
  border-left: none;
  background: transparent;
  padding-left: 0;
}
.group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.group-hint { white-space: nowrap; }
.group-body { padding-left: 2px; }
.joiner {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
  padding: 2px 0 2px 4px;
}
.empty-hint { padding: 6px 0; }
.group-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
