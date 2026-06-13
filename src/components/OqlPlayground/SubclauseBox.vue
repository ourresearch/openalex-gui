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
    <div v-for="i in rowCount" :key="i" class="sb-row">
      <span class="sb-gutter">
        <!-- first row: open paren; rest: the and/or connector (toggles the join) -->
        <slot v-if="i === 1" name="open">
          <span class="kw-chip sb-paren">(</span>
        </slot>
        <v-chip v-else class="conn-chip" size="small" label variant="flat"
          @click="$emit('toggle-join')">{{ join }}</v-chip>
      </span>
      <div class="sb-body"><slot name="row" :index="i - 1" /></div>
    </div>

    <!-- close row: the add button + the close paren together fill the gutter -->
    <div class="sb-row sb-close">
      <span class="sb-gutter paren-conn">
        <slot name="add" />
        <slot name="close">
          <span class="kw-chip sb-paren paren-close">)</span>
        </slot>
      </span>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "SubclauseBox" });
defineProps({
  // the group's conjunction, shown on the connector bricks (rows 2..N)
  join: { type: String, default: "and" },
  // number of content rows (the close row is added automatically)
  rowCount: { type: Number, required: true },
});
defineEmits(["toggle-join"]);
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
/* close line: [+ add][) ] together fill the gutter column */
.paren-conn {
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}
.paren-close {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  justify-content: center;
}
</style>
