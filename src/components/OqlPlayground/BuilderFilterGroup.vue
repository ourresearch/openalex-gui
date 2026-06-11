<template>
  <div class="bgroup">
    <!-- group header (nested groups only): number + connector + "group (join)" -->
    <div v-if="!isRoot" class="brow group-head">
      <template v-if="!nested">
        <span class="c-num">{{ number }}</span>
        <span class="c-conn">
          <span v-if="connectorText && connectorToggle" class="conn-chip" @click="$emit('toggle-join')">{{ connectorText }}</span>
          <span v-else-if="connectorText" class="conn-word">{{ connectorText }}</span>
        </span>
      </template>
      <span v-else class="c-num c-num-nested">{{ number }}</span>

      <span class="group-label">group (<span class="group-join" @click="toggleOwnJoin">{{ node.join }}</span>)</span>
      <v-spacer />
      <v-btn icon="mdi-close" size="x-small" variant="text" density="comfortable"
        class="row-remove" @click="$emit('remove')" />
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
          :nested="childNested"
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
          :number="childNumber(i)"
          :nested="childNested"
          :connector-text="childConnector(i).text"
          :connector-toggle="childConnector(i).toggle"
          :can-remove="canRemoveChild()"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <!-- add line: carries the NEXT clause number; the + sits in the property column -->
      <div class="brow add-row">
        <span class="c-num" :class="{ 'c-num-nested': childNested }">{{ childNumber(node.children.length) }}</span>
        <span v-if="!childNested" class="c-conn"></span>
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
  // Header placement when this group is itself nested inside another group.
  nested: { type: Boolean, default: false },
  // Connector word for THIS group's header (toward its siblings).
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node;

// "1", "2" at root; "2.1", "2.2" inside group "2"; "2.3.1" deeper.
const childNumber = (i) => (props.number ? props.number + "." : "") + (i + 1);

// Children of the root are top-level (number col + connector); children of any
// group are nested (decimal number slides into the gutter, no per-row connector —
// the group's join lives in its header).
const childNested = computed(() => !props.isRoot);
const childConnector = (i) => {
  if (!props.isRoot) return { text: null, toggle: false };
  // Root: first clause reads "where", the rest are the toggleable and/or join.
  return i === 0 ? { text: "where", toggle: false } : { text: node.join, toggle: true };
};

// Toggle THIS group's own conjunction (root child connector, or the header "(join)").
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
/* No box / border — nesting is conveyed by the decimal numbers + header, keeping
   the grid tight and tabular (oxjob #428 iter 8). */
.bgroup { }
.group-body { }
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
.c-num-nested { width: calc(var(--num-w) + var(--gx) + var(--conn-w)); }
.c-conn {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
}
.conn-word { color: var(--conn-fg); font-size: 0.78rem; }
.conn-chip {
  cursor: pointer;
  color: var(--conn-fg);
  background: var(--conn-bg);
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 0.72rem;
  text-transform: lowercase;
}
.group-label { color: var(--rel-fg); font-style: italic; font-size: 0.8rem; }
.group-join { cursor: pointer; text-decoration: underline dotted; }
.add-main { opacity: 0.8; }
.add-main:hover { opacity: 1; }
.add-caret { opacity: 0.55; margin-left: -2px; }
.add-caret:hover { opacity: 1; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
