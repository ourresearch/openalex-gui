<template>
  <!-- Shared parenthesized-subclause layout (oxjob #428 iter 20 — Jason): the dashed
       box + fixed-width gutter column used by BOTH the clause tree (filter rows) and
       the value tree (value bricks), so the look is defined ONCE. Each content row is
       `[gutter brick][content]`; the gutter holds `(` on the first row, the and/or
       connector on the rest, and `)` (alone, with the add button) on the close row.
       The box's left margin aligns with the property column, and content sits one
       gutter-column to the right — exactly like a nested clause.

       Parens + the add button are slots so each tree supplies its own menus (the
       clause's add-filter menu vs the value's paren dropdown). The connector is
       owned here and just emits `toggle-join`. -->
  <div class="subclause-box">
    <!-- keyed by the row's stable id (NOT the index): when the tree restructures
         (e.g. a value box wrapping its content to add a sibling), index-keying would
         reuse a child whose captured `props.group/item` is now stale. -->
    <div v-for="(key, idx) in rowKeys" :key="key" class="sb-row">
      <span class="sb-gutter">
        <!-- first row: open paren; rest: the and/or connector (toggles the join) -->
        <slot v-if="idx === 0" name="open">
          <span class="kw-chip sb-paren">(</span>
        </slot>
        <v-chip v-else class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ join }}</v-chip>
      </span>
      <div class="sb-body"><slot name="row" :index="idx" /></div>
    </div>

    <!-- close row: the close paren fills the whole gutter; on hover, the add-sibling
         (+) and delete (trash) controls appear to its RIGHT. Adding INTO this clause
         is done by clicking the parens (the #open/#close menus), not from here. -->
    <div class="sb-row sb-close" @mouseenter="closeHover = true" @mouseleave="closeHover = false">
      <span class="sb-gutter">
        <slot name="close">
          <span class="kw-chip sb-paren paren-full">)</span>
        </slot>
      </span>
      <span class="sb-close-actions" :class="{ shown: closeHover }">
        <v-btn class="sb-act" icon size="x-small" variant="text" density="comfortable"
          @click="$emit('add-sibling')">
          <v-icon size="16">mdi-plus</v-icon>
          <v-tooltip activator="parent" location="top">Add a clause after this</v-tooltip>
        </v-btn>
        <v-btn class="sb-act" icon size="x-small" variant="text" density="comfortable"
          @click="$emit('remove-self')">
          <v-icon size="14">mdi-delete-outline</v-icon>
          <v-tooltip activator="parent" location="top">Delete this clause</v-tooltip>
        </v-btn>
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
defineOptions({ name: "SubclauseBox" });
defineProps({
  // the group's conjunction, shown on the connector bricks (rows 2..N)
  join: { type: String, default: "and" },
  // stable keys for the content rows (one per child); length = row count. Keying
  // by id (not index) so a restructure re-creates rows instead of reusing stale ones.
  rowKeys: { type: Array, required: true },
});
defineEmits(["toggle-join", "add-sibling", "remove-self"]);

// JS-driven hover (CDP synthetic hover doesn't reliably trip CSS :hover; iter-19)
const closeHover = ref(false);
</script>

<style scoped>
/* The box + gutter look — single source of truth (was duplicated in
   BuilderFilterGroup). All widths/colours come from the CSS vars on `.builder`
   (--gx, --conn-w, --conn-*, --kw-*), inherited since the box renders inside it. */
.subclause-box {
  position: relative;
  z-index: 0;
  flex: 1 1 auto;
  min-width: 0;
  padding: 2px 10px 2px 8px;
}
.subclause-box::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  background: rgba(177, 158, 81, 0.07);
  border: 1px dashed rgba(144, 128, 60, 0.4);
  border-radius: 8px;
  pointer-events: none;
}
.sb-row {
  display: flex;
  align-items: flex-start;
  gap: var(--gx);
  flex-wrap: nowrap;
  padding: 2px 0;
  min-height: 34px;
}
/* the fixed-width first column (gutter); brick centered in it */
.sb-gutter {
  flex: 0 0 auto;
  width: var(--conn-w);
  display: inline-flex;
  justify-content: center;
  margin-top: 2px;
}
.sb-body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--gx);
  row-gap: 4px;
  min-height: 30px;
}
/* connector (and/or) brick — fills the gutter, amber, toggles the join */
.conn-chip {
  cursor: pointer;
  width: var(--conn-w);
  justify-content: center;
  color: var(--conn-fg) !important;
  background: var(--conn-bg) !important;
  text-transform: lowercase;
}
/* static keyword bricks (the parens) — fill the gutter, solid gray */
.kw-chip {
  width: var(--conn-w);
  justify-content: center;
  color: var(--kw-fg) !important;
  background: var(--kw-bg) !important;
}
.sb-paren {
  display: inline-flex;
  align-items: center;
  height: 26px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8125rem;
}
/* the close paren fills the whole gutter column */
.paren-full { width: var(--conn-w); justify-content: center; }
/* close-row controls (add sibling / delete) — to the RIGHT of `)`, hover-revealed.
   Hidden via visibility (App.vue's ghost-variant reset forces button opacity to 1);
   dim through the inner icon. */
.sb-close-actions {
  display: inline-flex;
  align-items: center;
  margin-top: 2px;
  visibility: hidden;
}
.sb-close-actions.shown { visibility: visible; }
.sb-act :deep(.v-icon) { opacity: 0.5; }
.sb-act:hover :deep(.v-icon) { opacity: 1; }
</style>
