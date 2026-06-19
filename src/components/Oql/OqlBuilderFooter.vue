<!--
  OqlBuilderFooter — the OQL no-code builder's ancestor-path breadcrumb (oxjob #487,
  superseding #474's staged single-address footer).

  A thin status strip (XML/JSON-editor style) below the builder lines, NARROWER than
  the header row. It shows the full humanized ancestor path of whatever node the user
  is hovering — selection as a resting fallback, else the entity root — e.g.

      works › 2 full text › 2.1 any() › 2.1.2 cat

  The builder computes the path (oqlBreadcrumb.js: addr→segment index over the render
  tree, prefixes of the hovered `tok.addr`) and passes the segment array in. This
  component is PURELY PRESENTATIONAL: it joins the segments with ` › ` (U+203A) and
  renders them muted + monospace. No click behaviour for v1 (display-only).

  Two emphasis modes (oxjob #487 follow-up):
    • `bold` — the path reflects a SELECTION (resting on a selected chip/row), so it
      goes bold + black to match the selected chip.
    • `countLabel` — when 2+ values are selected there's no single path to show, so the
      builder passes e.g. "2 values selected" and we render that (bold + black)
      instead of the segments.

  Each segment is `‹address› ‹label›` (the root segment is just the entity, no
  address) — already formatted by pathForAddr; we only lay them out.
-->
<template>
  <div class="builder-foot-path" :class="{ 'is-bold': bold || !!countLabel }" aria-hidden="true">
    <span v-if="countLabel" class="seg">{{ countLabel }}</span>
    <template v-else v-for="(seg, i) in segments" :key="i">
      <span v-if="i > 0" class="sep">›</span>
      <span class="seg">{{ seg }}</span>
    </template>
    <!-- keep the strip a stable height even when empty -->
    <span v-if="!countLabel && (!segments || !segments.length)" class="seg">&nbsp;</span>
  </div>
</template>

<script setup>
defineProps({
  // Pre-humanized ancestor-path segments (root first), e.g.
  // ["works(all)", "2 full text(all)", "2.1 any()", "2.1.2 cat"].
  segments: { type: Array, default: () => [] },
  // Render the path bold + black (the path reflects a selection, not a hover).
  bold: { type: Boolean, default: false },
  // When set (2+ chips selected), render this message instead of the segments.
  countLabel: { type: String, default: null },
});
</script>

<style scoped>
.builder-foot-path {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  /* Slim status strip — deliberately shorter than the builder header row. */
  height: 28px;
  /* Bleed left/right past the card's 16px side padding so the top border reaches the
     card edges (matches the .bline full-bleed rails); re-pad the content by 16px. */
  margin: 0 -16px;
  padding: 0 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-family: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.5);
  letter-spacing: 0.01em;
  user-select: none;
  overflow: hidden;
  white-space: nowrap;
}
/* Selection / multi-select state: bold + black to match the selected chip. */
.builder-foot-path.is-bold {
  color: #1a1a1a;
  font-weight: 700;
}
.seg { flex: 0 0 auto; }
/* the ` › ` separator inherits the strip's colour (muted or bold-black) so it's never
   a different shade from the segments around it. */
.sep {
  flex: 0 0 auto;
  margin: 0 6px;
}
</style>
