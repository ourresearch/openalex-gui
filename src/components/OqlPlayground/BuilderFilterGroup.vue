<template>
  <div class="bgroup" :class="{ nested: !isRoot }">
    <!-- group header (nested groups only): number + connector-to-parent + marker -->
    <div v-if="!isRoot" class="brow group-head">
      <span class="c-num">{{ number }}</span>
      <span class="c-conn">
        <v-chip v-if="connectorText && connectorToggle" class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
        <v-chip v-else-if="connectorText" class="kw-chip" size="small" label
          variant="outlined">{{ connectorText }}</v-chip>
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
          :number="childNumber(i)"
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
          :number="childNumber(i)"
          :connector-text="childConnector(i).text"
          :connector-toggle="childConnector(i).toggle"
          :can-remove="canRemoveChild()"
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <!-- add line: the next number at this level; the + sits in the property column -->
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
import { makeLeaf, makeGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4;

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  // Number of the root's first child line (the root itself has no header line).
  startNum: { type: Number, default: 1 },
  // Hierarchical number of THIS group's header line (nested groups), e.g. "3".
  number: { type: String, default: "" },
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
  // Connector word for THIS group's header (toward its siblings).
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change", "toggle-join"]);

const node = props.node;

// Hierarchical numbering (iter 11): every child takes ONE number at its level.
// Root children count up from startNum (2, 3, 4…); a nested group keeps its own
// header number and its children are decimals under it (3 -> 3.1, 3.2, 3.3).
const childNumber = (i) =>
  props.isRoot ? String(props.startNum + i) : `${props.number}.${i + 1}`;
const addRowNum = computed(() => childNumber(node.children.length));

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
/* Nested clause backdrop (iter 11): a translucent grey wash + subtle dashed
   border anchored at the "group" word (top-left), the group's last line
   (bottom), and the right margin. It's semi-transparent on purpose — nesting
   another group inside stacks a second wash, so depth reads as darkening. */
.bgroup.nested {
  position: relative;
  z-index: 0;
}
.bgroup.nested::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: calc(var(--indent) - 10px);
  right: 0;
  top: 1px;
  bottom: 1px;
  background: rgba(100, 116, 139, 0.05);
  border: 1px dashed rgba(100, 116, 139, 0.28);
  border-radius: 8px;
  pointer-events: none;
}
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
  min-width: var(--num-w);
  white-space: nowrap;
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
.conn-chip {
  cursor: pointer;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* structural keywords (Find / where): outlined, non-interactive */
.kw-chip {
  color: var(--kw-fg) !important;
  border-color: var(--kw-border) !important;
  pointer-events: none;
}
.group-label { color: var(--kw-fg); font-style: italic; font-size: 0.8rem; }
.add-main { opacity: 0.8; }
.add-main:hover { opacity: 1; }
.add-caret { opacity: 0.55; margin-left: -2px; }
.add-caret:hover { opacity: 1; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
