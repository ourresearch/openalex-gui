<!--
  OqlBuilderFooter — the OQL no-code builder's ancestor-path breadcrumb (oxjob #487,
  superseding #474's staged single-address footer).

  A thin status strip (XML/JSON-editor style) below the builder lines, NARROWER than
  the header row. It shows the full humanized ancestor path of whatever node the user
  is hovering — selection as a resting fallback, else the entity root — e.g.

      works all › 2 full text all › 2.1 any() › 2.1.2 cat

  The builder computes the path (oqlBreadcrumb.js: addr→segment index over the render
  tree, prefixes of the hovered `tok.addr`) and passes the segment array in. This
  component is PURELY PRESENTATIONAL: it joins the segments with ` › ` (U+203A) and
  renders them muted + monospace. No click behaviour for v1 (display-only).

  Each segment is `‹address› ‹label›` (the root segment is just `‹entity› ‹join›`,
  no address) — already formatted by pathForAddr; we only lay them out.
-->
<template>
  <div class="builder-foot-path" aria-hidden="true">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="i > 0" class="sep">›</span>
      <span class="seg">{{ seg }}</span>
    </template>
    <!-- keep the strip a stable height even when empty -->
    <span v-if="!segments || !segments.length" class="seg">&nbsp;</span>
  </div>
</template>

<script setup>
defineProps({
  // Pre-humanized ancestor-path segments (root first), e.g.
  // ["works all", "2 full text all", "2.1 any()", "2.1.2 cat"].
  segments: { type: Array, default: () => [] },
});
</script>

<style scoped>
.builder-foot-path {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  /* Slim status strip — deliberately shorter than the builder header row. */
  height: 22px;
  padding: 0 12px;
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
.seg { flex: 0 0 auto; }
.sep {
  flex: 0 0 auto;
  margin: 0 6px;
  color: rgba(0, 0, 0, 0.3);
}
</style>
