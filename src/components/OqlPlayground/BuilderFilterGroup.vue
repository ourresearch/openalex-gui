<template>
  <div class="bgroup">
    <!-- group header (nested groups only): number + connector-to-parent + marker -->
    <div v-if="!isRoot" class="brow group-head">
      <span class="c-num">{{ startNum }}</span>
      <span class="c-conn">
        <v-chip v-if="connectorText && connectorToggle" class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
        <span v-else-if="connectorText" class="conn-word">{{ connectorText }}</span>
      </span>
      <span class="group-label">group</span>
      <v-spacer />
      <v-btn icon="mdi-close" size="x-small" variant="text" density="comfortable"
        class="row-remove" @click="$emit('remove')" />
    </div>

    <!-- A nested clause is its OWN indented sub-grid (its number / connector gutters
         deliberately don't line up with the parent — that's what shows the nesting). -->
    <div class="group-body" :class="{ indented: !isRoot }">
      <template v-for="(child, i) in node.children" :key="child._id">
        <BuilderFilterGroup
          v-if="child.type === 'group'"
          :node="child"
          :properties="properties"
          :entity="entity"
          :start-num="childStartNum(i)"
          :depth="depth + 1"
          :connector-text="childConnector(i).text"
          :connector-toggle="childConnector(i).toggle"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
        <BuilderFilterRow
          v-else
          :node="child"
          :properties="properties"
          :entity="entity"
          :number="String(childStartNum(i))"
          :connector-text="childConnector(i).text"
          :connector-toggle="childConnector(i).toggle"
          :can-remove="canRemoveChild()"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <!-- add line: the next sequential number; the + sits in the property column -->
      <div class="brow add-row">
        <span class="c-num">{{ addRowNum }}</span>
        <span class="c-conn"></span>
        <v-btn class="add-main" icon size="x-small" variant="tonal" density="comfortable" @click="addFilter">
          <v-icon size="18">mdi-plus</v-icon>
          <v-tooltip activator="parent" location="bottom">Add a filter</v-tooltip>
        </v-btn>
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
import { computed } from "vue";
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import BuilderFilterRow from "@/components/OqlPlayground/BuilderFilterRow.vue";
import { makeLeaf, makeGroup, lineCount } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4;

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  // Sequential line number of THIS group's header (or, for the root, of its first child).
  startNum: { type: Number, default: 1 },
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
  // Connector word for THIS group's header (toward its siblings).
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node;

// Sequential line numbering: the root's children start at startNum; a nested
// group's header takes startNum, so its children start one line later.
const childrenStart = computed(() => (props.isRoot ? props.startNum : props.startNum + 1));
const childStartNum = (i) => {
  let acc = childrenStart.value;
  for (let j = 0; j < i; j++) acc += lineCount(node.children[j], false);
  return acc;
};
const addRowNum = computed(() => {
  let acc = childrenStart.value;
  for (const c of node.children) acc += lineCount(c, false);
  return acc;
});

// Connector in each child's gutter. Root reads "where" then the and/or join; a
// nested clause has the same gutter (its own), first child blank, rest the join.
const childConnector = (i) => {
  if (props.isRoot) return i === 0 ? { text: "where", toggle: false } : { text: node.join, toggle: true };
  return i === 0 ? { text: null, toggle: false } : { text: node.join, toggle: true };
};

// Toggle THIS group's own conjunction (any child's and/or connector).
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
.bgroup { }
/* Each nested clause indents its whole body by one full gutter so its sub-grid
   sits clearly to the right of the parent's (the header stays at the parent level). */
.group-body.indented { padding-left: var(--indent); }
.brow {
  display: flex;
  align-items: center;
  gap: var(--gx);
  flex-wrap: wrap;
  padding: 2px 0;
  min-height: 34px;
}
.c-num {
  flex: 0 0 auto;
  width: var(--num-w);
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.4);
}
.c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
.conn-word { color: var(--conn-fg); font-size: 0.78rem; }
.conn-chip {
  cursor: pointer;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
.group-label { color: var(--rel-fg); font-style: italic; font-size: 0.8rem; }
.add-main { opacity: 0.8; }
.add-main:hover { opacity: 1; }
.add-caret { opacity: 0.55; margin-left: -2px; }
.add-caret:hover { opacity: 1; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
