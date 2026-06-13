<template>
  <!-- ROOT: rows down the left margin with the Find/where/and·or spine. A child
       GROUP renders as a row whose number + connector live at THIS level (iter 15),
       with the boxed subquery flowing beside them; rows inside a subquery carry no
       line numbers. -->
  <div v-if="isRoot" class="bgroup">
    <template v-for="(child, i) in node.children" :key="child._id">
      <div v-if="child.type === 'group'" class="brow group-row">
        <span class="c-num">{{ childNumber(i) }}</span>
        <span class="c-conn">
          <v-chip v-if="childConnector(i).toggle" class="conn-chip" size="small" label variant="flat"
            @click="toggleOwnJoin">{{ childConnector(i).text }}</v-chip>
          <v-chip v-else class="kw-chip" size="small" label
            variant="flat">{{ childConnector(i).text }}</v-chip>
        </span>
        <BuilderFilterGroup
          class="group-box"
          :node="child"
          :properties="properties"
          :entity="entity"
          :depth="depth + 1"
          @remove="removeChild(i)"
          @add-sibling="addSiblingAfter(i)"
          @change="$emit('change')"
        />
      </div>
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
        @add-sibling="addSiblingAfter(i)"
        @change="$emit('change')"
      />
    </template>
  </div>

  <!-- NESTED: a parenthesized SubclauseBox (the SAME box+gutter layout the value
       tree uses). Each child row is rendered WITHOUT its own gutter (`boxed`) — the
       box supplies the `(` / and·or / `)` gutter column and the close-line add menu.
       A group whose last row goes prunes itself (iter 17). -->
  <SubclauseBox v-else :join="node.join" :row-count="node.children.length"
    @toggle-join="toggleOwnJoin" @add-sibling="$emit('add-sibling')" @remove-self="$emit('remove')">
    <!-- click either paren to add INTO this clause (Add filter / Add filter clause) -->
    <template #open><ParenBrick label="(" :actions="addActions" wide /></template>
    <template #close><ParenBrick label=")" :actions="addActions" wide /></template>
    <template #row="{ index }">
      <BuilderFilterGroup
        v-if="node.children[index].type === 'group'"
        :node="node.children[index]"
        :properties="properties"
        :entity="entity"
        :depth="depth + 1"
        @remove="removeChild(index)"
        @add-sibling="addSiblingAfter(index)"
        @change="$emit('change')"
      />
      <BuilderFilterRow
        v-else
        boxed
        :node="node.children[index]"
        :properties="properties"
        :entity="entity"
        @remove="removeChild(index)"
        @add-sibling="addSiblingAfter(index)"
        @change="$emit('change')"
      />
    </template>
  </SubclauseBox>
</template>

<script setup>
import { computed } from "vue";
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import BuilderFilterRow from "@/components/OqlPlayground/BuilderFilterRow.vue";
import SubclauseBox from "@/components/OqlPlayground/SubclauseBox.vue";
import ParenBrick from "@/components/OqlPlayground/ParenBrick.vue";
import { makeLeaf, makeGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4;

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  // Number of the root's first child line (the root itself has no header line).
  startNum: { type: Number, default: 1 },
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change", "add-sibling"]);

const node = props.node;

// Clicking either paren adds INTO this clause (the gutter `+` is gone — iter 20.x).
const addActions = computed(() => {
  const out = [{ key: "addF", title: "Add filter", icon: "mdi-plus", run: addFilter }];
  if (props.depth < MAX_DEPTH) {
    out.push({ key: "addC", title: "Add filter clause", icon: "mdi-plus-box-multiple-outline", run: addGroup });
  }
  return out;
});

// Add a SIBLING after child i: a leaf row stays a leaf (ephemeral field menu), a
// group stays a group. Used by the box's close-row `+` (operates on the box as a
// unit within its parent) and by a child row/group's own box.
const addSiblingAfter = (i) => {
  const sib = node.children[i]?.type === "group" ? makeGroup("or", [makeLeaf()]) : makeLeaf();
  node.children.splice(i + 1, 0, sib);
  emit("change");
};

// Plain integers down the root's left margin; rows inside a subquery get none.
const childNumber = (i) => String(props.startNum + i);

// Connector in each child's gutter: the root's first child reads "where" (real
// OQL); a subquery's first child reads "(" — the clause IS a parenthesized
// expression, so the gutter bricks spell it out (iter 19). The rest the join.
const childConnector = (i) => {
  if (i === 0) return { text: props.isRoot ? "where" : "(", toggle: false };
  return { text: node.join, toggle: true };
};

// Toggle THIS group's own conjunction (any child's and/or connector).
const toggleOwnJoin = () => { node.join = node.join === "and" ? "or" : "and"; emit("change"); };

const addFilter = () => { node.children.push(makeLeaf()); emit("change"); };
const addGroup = () => { node.children.push(makeGroup("or", [makeLeaf()])); emit("change"); };

const removeChild = (i) => {
  node.children.splice(i, 1);
  // An empty root is fine (just the add brick + sort); an empty NESTED group
  // prunes itself from its parent.
  if (!props.isRoot && node.children.length === 0) {
    emit("remove");
  }
  emit("change");
};
</script>

<style scoped>
/* The nested-subquery box now lives in the shared SubclauseBox component (used by
   both the clause tree and the value tree). This file keeps only the ROOT-level
   spine (numbers + Find/where/and·or connectors) and the per-group add button. */
/* a child group's row: number + connector at this level, box beside them.
   Top-align so the connector pairs with the box's FIRST line. */
.group-row {
  align-items: flex-start !important;
}
.group-row > .c-num { margin-top: 10px; }
.group-row > .c-conn { margin-top: 5px; }
/* top-align the connector with the box's first row */
/* NOTE: this scoped rule also reaches BuilderFilterRow's ROOT element (parent
   scoped CSS applies to a child component's root) — keep it nowrap; wrapping
   happens inside the row's .row-body (iter 18). */
.brow {
  display: flex;
  align-items: flex-start;
  gap: var(--gx);
  flex-wrap: nowrap;
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
</style>
