<template>
  <div class="bgroup" :class="{ nested: !isRoot }">
    <!-- group header (nested groups only): number + connector-to-parent + marker -->
    <div v-if="!isRoot" class="brow group-head">
      <span class="c-num">{{ number }}</span>
      <span class="c-conn">
        <v-chip v-if="connectorText && connectorToggle" class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
        <v-chip v-else-if="connectorText" class="kw-chip" size="small" label
          variant="flat">{{ connectorText }}</v-chip>
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
          @toggle-join="toggleOwnJoin"
          @remove="removeChild(i)"
          @change="$emit('change')"
        />
      </template>

      <!-- add line: the black add brick sits in the GUTTER (iter 13). It hides
           while a filter is mid-creation — you can't start a new filter while
           you're in the middle of making one. -->
      <div v-if="!hasPendingChild" class="brow add-row">
        <span class="c-num">{{ addRowNum }}</span>
        <span class="c-conn">
          <v-btn class="add-main" size="small" color="black" variant="flat" density="comfortable"
            @click="addFilter"><v-icon size="16" start>mdi-plus</v-icon>add</v-btn>
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
// nested clause's first child ALSO reads "where" (a static gap-filler brick —
// gaps in the connector column are jarring; OQL doesn't accept a nested `where`
// yet, this is display-only, see iter 12).
const childConnector = (i) => {
  if (i === 0) return { text: "where", toggle: false };
  return { text: node.join, toggle: true };
};

// Toggle THIS group's own conjunction (any child's and/or connector).
const toggleOwnJoin = () => { node.join = node.join === "and" ? "or" : "and"; emit("change"); };

// A filter mid-creation: a leaf with no field picked yet. The row auto-opens
// its field menu; abandoning it (blur w/o picking) removes the leaf, which
// brings the add brick back. While one exists, the add brick hides (iter 13).
const hasPendingChild = computed(() =>
  node.children.some((c) => c.type === "leaf" && !c.column_id)
);

const addFilter = () => { node.children.push(makeLeaf()); emit("change"); };
const addGroup = () => { node.children.push(makeGroup("or", [makeLeaf()])); emit("change"); };

const removeChild = (i) => {
  node.children.splice(i, 1);
  // An empty root is fine now (just the add brick + sort); an empty NESTED
  // group prunes itself from its parent.
  if (!props.isRoot && node.children.length === 0) {
    emit("remove");
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
  background: rgba(100, 116, 139, 0.03);
  border: 1px dashed rgba(100, 116, 139, 0.28);
  border-radius: 8px;
  pointer-events: none;
}
/* Each nested clause indents its whole body by one full gutter so its sub-grid
   sits clearly to the right of the parent's (the header stays at the parent
   level). The right padding insets each row's × a constant distance from the
   NEAREST enclosing box border — sacrifices the flush right margin to
   underscore the subgrouping (iter 12). */
.group-body.indented { padding-left: var(--indent); padding-right: 10px; }
.bgroup.nested > .group-head { padding-right: 10px; }
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
/* all gutter bricks are equal width (fill the connector column) */
.conn-chip {
  cursor: pointer;
  width: var(--conn-w);
  justify-content: center;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* static keyword bricks (Find / where / sort): equal width, solid gray, inert */
.kw-chip {
  width: var(--conn-w);
  justify-content: center;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
.group-label { color: var(--kw-fg); font-style: italic; font-size: 0.8rem; }
/* the add brick fills the gutter like every other gutter brick */
.add-main { text-transform: none; letter-spacing: 0; min-width: var(--conn-w); padding: 0 6px; }
.add-caret { opacity: 0.55; margin-left: -2px; }
.add-caret:hover { opacity: 1; }
.row-remove { opacity: 0.4; }
.row-remove:hover { opacity: 1; }
</style>
