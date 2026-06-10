<template>
  <div class="filter-group" :class="{ 'is-root': isRoot }">
    <!-- group header (nested groups only): number + parent-join chip + remove -->
    <div v-if="!isRoot" class="group-header">
      <span class="clause-num">{{ number }}</span>
      <v-chip v-if="showJoin" class="join-chip" size="small" label variant="tonal"
        color="deep-purple" @click="$emit('toggle-join')">{{ join }}</v-chip>
      <span v-else class="join-spacer"></span>
      <span class="group-tag text-caption text-medium-emphasis">group ({{ node.join }})</span>
      <v-spacer />
      <v-btn icon="mdi-close" size="x-small" variant="text" density="comfortable"
        class="group-remove" @click="$emit('remove')" />
    </div>

    <div class="group-body">
      <template v-for="(child, i) in node.children" :key="child._id">
        <BuilderFilterGroup
          v-if="child.type === 'group'"
          :node="child"
          :properties="properties"
          :entity="entity"
          :number="childNumber(i)"
          :depth="depth + 1"
          :show-join="i > 0"
          :join="node.join"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
        <BuilderFilterRow
          v-else
          :node="child"
          :properties="properties"
          :entity="entity"
          :number="childNumber(i)"
          :show-join="i > 0"
          :join="node.join"
          :can-remove="canRemoveChild()"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <!-- Split add control: the + (aligned under the clause-number column) adds a
           filter row; the caret reveals "Add filter group" (oxjob #428 iter 6). -->
      <div class="group-actions">
        <span class="add-num-col">
          <v-btn class="add-main" icon size="x-small" variant="tonal" density="comfortable"
            @click="addFilter">
            <v-icon size="18">mdi-plus</v-icon>
            <v-tooltip activator="parent" location="bottom">Add a filter</v-tooltip>
          </v-btn>
        </span>
        <v-menu v-if="depth < MAX_DEPTH" location="bottom start" offset="2">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" class="add-caret" icon size="x-small" variant="text" density="comfortable">
              <v-icon size="16">mdi-menu-down</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-plus-box-multiple-outline" title="Add filter group" @click="addGroup" />
          </v-list>
        </v-menu>
      </div>
    </div>
  </div>
</template>

<script setup>
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import BuilderFilterRow from "@/components/OqlPlayground/BuilderFilterRow.vue";
import { makeLeaf, makeGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4;

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  number: { type: String, default: "" },
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
  showJoin: { type: Boolean, default: false },
  join: { type: String, default: "and" },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node;

// "1", "2" at root; "2.1", "2.2" inside group "2"; "2.3.1" deeper.
const childNumber = (i) => (props.number ? props.number + "." : "") + (i + 1);

// Toggle THIS group's own conjunction (called by a child's inline join chip).
const toggleOwnJoin = () => { node.join = node.join === "and" ? "or" : "and"; emit("change"); };

// The sole remaining leaf at the root can't be deleted (never zero rows).
const canRemoveChild = () => {
  if (props.isRoot && node.children.length === 1 && node.children[0].type === "leaf") return false;
  return true;
};

const addFilter = () => { node.children.push(makeLeaf()); emit("change"); };
const addGroup = () => { node.children.push(makeGroup("or", [makeLeaf()])); emit("change"); };

const removeChild = (i) => {
  node.children.splice(i, 1);
  if (props.isRoot) {
    if (node.children.length === 0) node.children.push(makeLeaf()); // never empty
  } else if (node.children.length === 0) {
    emit("remove"); // prune the now-empty group from our parent
  }
  emit("change");
};
</script>

<style scoped>
.filter-group {
  border-left: 3px solid rgba(103, 58, 183, 0.25);
  padding: 6px 0 6px 12px;
  margin: 4px 0;
  background: rgba(103, 58, 183, 0.02);
  border-radius: 0 4px 4px 0;
}
.filter-group.is-root { border-left: none; background: transparent; padding-left: 0; }
.group-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.clause-num {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
  min-width: 30px;
  text-align: right;
}
.join-chip { cursor: pointer; min-width: 38px; justify-content: center; text-transform: lowercase; }
.join-spacer { display: inline-block; width: 38px; }
.group-tag { font-style: italic; }
.group-body { padding-left: 2px; }
/* Mirror the row's number column (30px, right-aligned) so the + sits exactly
   where the clause numbers do; the caret tucks in just to its right. */
.group-actions { display: flex; align-items: center; gap: 0; margin-top: 6px; }
.add-num-col { min-width: 30px; display: inline-flex; justify-content: flex-end; }
.add-main { opacity: 0.8; }
.add-main:hover { opacity: 1; }
.add-caret { opacity: 0.55; margin-left: 2px; }
.add-caret:hover { opacity: 1; }
.group-remove { opacity: 0.5; }
.group-remove:hover { opacity: 1; }
</style>
