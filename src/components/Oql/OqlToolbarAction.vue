<!--
  OqlToolbarAction — one button in the builder's contextual toolbar (oxjob #428).
  The chip context-menus were removed; every action a chip used to offer is now a
  button up here in the toolbar, surfaced when that chip is highlighted.

  Two shapes, same component:
    • WORDED   (label set)  — "Edit" / "Negate" / "Add filter" — a text button with
                              an optional leading icon.
    • ICON     (no label)   — e.g. the Delete trash can — an icon-only button.

  Every button carries the SAME structured tooltip ("popover" look, Jason 2026-06-17):
  a fixed-width card with the action's one-line description on top and, when the action
  has a keyboard shortcut, a labelled keycap row pinned to the bottom — so all the
  tooltips read as one consistent pattern. Width is capped so a long description wraps
  rather than stretching the card.

  Purely presentational: it renders a button + tooltip and lets clicks/`$attrs` fall
  through (so a parent <v-menu> can use it as an activator). It owns no query state.

  Props
    icon      mdi glyph (leading icon for a worded button, or the whole icon button).
    label     button text; omit for an icon-only button.
    desc      tooltip description (one short line).
    shortcut  array of already-resolved keycaps, e.g. ['⌫'] or ['⌘','enter']; omit if none.
    danger    style as a destructive action (red on hover).
    active    show the pressed/active state (e.g. its editor popover is open).
-->
<template>
  <v-btn v-bind="$attrs" class="tb-action"
    :class="{ 'tb-action--danger': danger, 'tb-action--active': active }"
    size="small" variant="text" density="comfortable"
    :icon="!label">
    <template v-if="label">
      <v-icon v-if="icon" start size="16">{{ icon }}</v-icon>{{ label }}
    </template>
    <v-icon v-else size="18" :color="danger ? undefined : 'grey-darken-1'">{{ icon }}</v-icon>
  </v-btn>
</template>

<script setup>
// No tooltip: the button labels are self-explanatory (Jason 2026-06-17). `desc` /
// `shortcut` props are kept declared (so they don't leak to $attrs / the DOM) but unused.
defineOptions({ inheritAttrs: false });
defineProps({
  icon: { type: String, default: "" },
  label: { type: String, default: "" },
  desc: { type: String, default: "" },
  shortcut: { type: Array, default: () => [] },
  danger: { type: Boolean, default: false },
  active: { type: Boolean, default: false },
});
</script>

<style scoped>
/* Quiet text/icon buttons that match the existing right-side toolbar cluster
   (edit code · copy · clear) — same density, no heavier weight. */
.tb-action {
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.7);
  min-width: 0;
}
.tb-action--active { background: rgba(0, 0, 0, 0.06); }
.tb-action--danger:hover { color: #b3261e; }
</style>
