<template>
  <!-- Clause tree, LINE-FLOW (oxjob #428 #2+#3 — Jason): the builder mirrors the
       canonical OQL pretty-print line-for-line. Connectors are LEADING and inline
       (`where`/`and`/`or` at the start of each line). The ROOT group's children are
       flush-left lines (no surrounding parens, NOT indented under `works`). A NESTED
       subquery breaks to `[conn] (` + its children one level in + `)`. -->

  <!-- open paren line (nested subquery only): [connector] ( -->
  <div v-if="!isRoot" class="bline" :style="{ '--depth': depth }">
    <div class="bl-body">
      <template v-if="connectorText">
        <v-chip v-if="connectorToggle" class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ connectorText }}</v-chip>
        <v-chip v-else class="kw-chip" size="small" label variant="flat">{{ connectorText }}</v-chip>
      </template>
      <ParenBrick label="(" :actions="addActions" />
    </div>
  </div>

  <!-- children — rows + nested subqueries, in order. childDepth indents a nested
       subquery's children one level past its parens; the root's stay at depth. -->
  <template v-for="(child, i) in node.children" :key="child._id">
    <BuilderFilterGroup
      v-if="child.type === 'group'"
      :node="child"
      :properties="properties"
      :entity="entity"
      :depth="childDepth"
      :connector-text="childConnector(i).text"
      :connector-toggle="childConnector(i).toggle"
      @toggle-join="toggleOwnJoin"
      @remove="removeChild(i)"
      @add-sibling="addSiblingAfter(i)"
      @change="$emit('change')"
    />
    <BuilderFilterRow
      v-else
      :node="child"
      :properties="properties"
      :entity="entity"
      :depth="childDepth"
      :connector-text="childConnector(i).text"
      :connector-toggle="childConnector(i).toggle"
      @toggle-join="toggleOwnJoin"
      @remove="removeChild(i)"
      @change="$emit('change')"
    />
  </template>

  <!-- close paren line (nested subquery only): ) + hover add-sibling / delete -->
  <div v-if="!isRoot" class="bline sb-close" :style="{ '--depth': depth }"
    @mouseenter="closeHover = true" @mouseleave="closeHover = false">
    <div class="bl-body">
      <ParenBrick label=")" :actions="addActions" />
      <span class="close-actions" :class="{ shown: closeHover }">
        <v-btn class="close-act" icon size="x-small" variant="text" density="comfortable"
          @click="$emit('add-sibling')">
          <v-icon size="16">mdi-plus</v-icon>
          <v-tooltip activator="parent" location="top">Add a clause after this</v-tooltip>
        </v-btn>
        <v-btn class="close-act" icon size="x-small" variant="text" density="comfortable"
          @click="$emit('remove')">
          <v-icon size="14">mdi-delete-outline</v-icon>
          <v-tooltip activator="parent" location="top">Delete this clause</v-tooltip>
        </v-btn>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import BuilderFilterGroup from "@/components/OqlPlayground/BuilderFilterGroup.vue";
import BuilderFilterRow from "@/components/OqlPlayground/BuilderFilterRow.vue";
import ParenBrick from "@/components/OqlPlayground/ParenBrick.vue";
import { makeLeaf, makeGroup } from "@/components/OqlPlayground/oqoTree";

defineOptions({ name: "BuilderFilterGroup" });

const MAX_DEPTH = 4;

const props = defineProps({
  node: { type: Object, required: true },
  properties: { type: Object, default: () => ({}) },
  entity: { type: String, default: "works" },
  // Indent level of THIS group's paren lines (and the level its children sit one
  // step past). The root group has no parens; its children render at `depth`.
  depth: { type: Number, default: 0 },
  isRoot: { type: Boolean, default: false },
  // Connector word on a nested subquery's OPEN line, supplied by the parent
  // ("and"/"or" toggles the PARENT's join; null = the parent's first child).
  connectorText: { type: String, default: null },
  connectorToggle: { type: Boolean, default: false },
});
const emit = defineEmits(["remove", "change", "add-sibling", "toggle-join"]);

const node = props.node;

// JS-driven hover for the close-row controls (CDP synthetic hover doesn't reliably
// trip CSS :hover; iter-19).
const closeHover = ref(false);

// Root children stay flush-left; a nested subquery indents its children one level
// past its own parens.
const childDepth = computed(() => (props.isRoot ? props.depth : props.depth + 1));

// Clicking either paren adds INTO this clause (the gutter `+` is gone — iter 20.x).
const addActions = computed(() => {
  const out = [{ key: "addF", title: "Add filter", icon: "mdi-plus", run: addFilter }];
  if (props.depth < MAX_DEPTH) {
    out.push({ key: "addC", title: "Add filter clause", icon: "mdi-plus-box-multiple-outline", run: addGroup });
  }
  return out;
});

// Add a SIBLING after child i: a leaf row stays a leaf, a group stays a group.
const addSiblingAfter = (i) => {
  const sib = node.children[i]?.type === "group" ? makeGroup("or", [makeLeaf()]) : makeLeaf();
  node.children.splice(i + 1, 0, sib);
  emit("change");
};

// Leading connector for each child: the root's first child reads "where" (real
// OQL, static); a subquery's first child has none; the rest carry the join (a
// toggle that flips this group's conjunction).
const childConnector = (i) => {
  if (i === 0) return { text: props.isRoot ? "where" : null, toggle: false };
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
/* Line primitives — duplicated in each builder component's scoped style (the CSS
   counter `bline` is document-global, so numbering stays continuous across them).
   Widths/colours come from the CSS vars on `.builder` (--num-w, --indent, --gx,
   --conn-*, --kw-*), inherited since this renders inside it. */
.bline {
  display: flex;
  align-items: flex-start;
  padding: 1px 0;
}
.bline::before {
  counter-increment: bline;
  content: counter(bline);
  flex: 0 0 auto;
  width: var(--num-w);
  margin-top: 7px;
  padding-right: 9px;
  text-align: right;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.72rem;
  color: rgba(0, 0, 0, 0.32);
  user-select: none;
}
.bl-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gx);
  row-gap: 4px;
  min-height: 30px;
  padding-left: calc(var(--depth, 0) * var(--indent));
}
/* connector (and/or) brick — amber, toggles the join */
.conn-chip {
  cursor: pointer;
  justify-content: center;
  padding: 0 6px;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* static keyword bricks (where) — solid gray, inert */
.kw-chip {
  justify-content: center;
  padding: 0 6px;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
  pointer-events: none;
}
/* close-paren controls (add sibling / delete) — to the RIGHT of `)`, hover-revealed.
   Hidden via visibility (App.vue's ghost-variant reset forces button opacity to 1);
   dim through the inner icon. */
.close-actions {
  display: inline-flex;
  align-items: center;
  visibility: hidden;
}
.close-actions.shown { visibility: visible; }
.close-act :deep(.v-icon) { opacity: 0.5; }
.close-act:hover :deep(.v-icon) { opacity: 1; }
</style>
