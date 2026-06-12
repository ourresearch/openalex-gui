<template>
  <div class="bgroup" :class="{ nested: !isRoot }">
    <!-- children. A child GROUP renders as a row whose number + connector live
         at THIS level (iter 15 — no more "group" header line: the subquery's
         first row sits on the same line as the and/or that spawns it), with the
         boxed subquery flowing beside them. Rows inside a subquery carry no
         line numbers (numbers are plain integers down the root's left margin
         only). -->
    <template v-for="(child, i) in node.children" :key="child._id">
      <div v-if="child.type === 'group'" class="brow group-row">
        <span v-if="isRoot" class="c-num">{{ childNumber(i) }}</span>
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
          @change="$emit('change')"
        />
      </div>
      <BuilderFilterRow
        v-else
        :node="child"
        :properties="properties"
        :entity="entity"
        :number="isRoot ? childNumber(i) : ''"
        :connector-text="childConnector(i).text"
        :connector-toggle="childConnector(i).toggle"
        @toggle-join="toggleOwnJoin"
        @remove="removeChild(i)"
        @change="$emit('change')"
      />
    </template>

    <!-- subquery close line (the ROOT's add line lives below sort, rendered by
         the host — see OqlQueryBuilder). The gutter holds TWO bricks that
         together fill the column: the add button (outlined square + icon —
         opens a menu every time, no one-click add; iter 19; outlined not
         black so Run stays the only primary button) and the close-paren
         brick. The ")" stays put while a filter is mid-creation (the + just
         hides). No group-level delete (iter 17): a group whose last row goes —
         removed or abandoned on blur — prunes itself, same as rows. -->
    <div v-if="!isRoot" class="brow add-row">
      <span class="c-conn paren-conn">
        <v-menu location="bottom start" offset="2">
          <template #activator="{ props: mp }">
            <v-btn v-bind="mp" class="add-sq" :style="hasPendingChild ? 'visibility:hidden' : null"
              icon size="x-small" variant="outlined" density="comfortable">
              <v-icon size="16">mdi-plus</v-icon>
              <v-tooltip activator="parent" location="top">Add to this clause</v-tooltip>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-plus" title="Add filter" @click="addFilter" />
            <v-list-item v-if="depth < MAX_DEPTH" prepend-icon="mdi-plus-box-multiple-outline"
              title="Add filter clause" @click="addGroup" />
          </v-list>
        </v-menu>
        <v-chip class="kw-chip paren-close" size="small" label variant="flat">)</v-chip>
      </span>
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
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change"]);

const node = props.node;

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

// A filter mid-creation: a leaf with no field picked yet (see iter 13).
const hasPendingChild = computed(() =>
  node.children.some((c) => c.type === "leaf" && !c.column_id)
);

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
.bgroup { }
/* Subquery backdrop: a translucent wash + subtle dashed border, lining up
   EXACTLY with the property-brick column (the box IS the group now — no header
   row, no label). Super-light AMBER (iter 18, follows the conjunction hue —
   the group belongs with its leading and/or). Semi-transparent on purpose —
   nesting stacks darker. */
.bgroup.nested {
  position: relative;
  z-index: 0;
  flex: 1 1 auto;
  min-width: 0;
  padding: 2px 10px 2px 8px;
}
.bgroup.nested::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  background: rgba(177, 158, 81, 0.07);
  border: 1px dashed rgba(144, 128, 60, 0.4);
  border-radius: 8px;
  pointer-events: none;
}
/* a child group's row: number + connector at this level, box beside them.
   Top-align so the connector pairs with the box's FIRST line. */
.group-row {
  align-items: flex-start !important;
}
.group-row > .c-num { margin-top: 10px; }
.group-row > .c-conn { margin-top: 5px; }
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
/* close line: [+ square][)] together fill the gutter column (iter 19) */
.paren-conn { justify-content: space-between; align-items: center; gap: 4px; }
.add-sq { width: 26px; height: 26px; border-radius: 4px; }
.paren-close {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  justify-content: center;
}
</style>
