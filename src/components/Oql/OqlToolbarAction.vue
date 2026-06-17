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

    <v-tooltip activator="parent" location="bottom" offset="8" :open-delay="180"
      :disabled="active" content-class="tb-tip-overlay">
      <div class="tb-tip">
        <div class="tb-tip-desc">{{ desc }}</div>
        <div v-if="shortcut && shortcut.length" class="tb-tip-foot">
          <span class="tb-tip-foot-label">Shortcut</span>
          <OqlKbdHint :keys="shortcut" />
        </div>
      </div>
    </v-tooltip>
  </v-btn>
</template>

<script setup>
import OqlKbdHint from "@/components/Oql/OqlKbdHint.vue";
import "@/components/Oql/oqlChip.css"; // shared .mi-key keycap styles (used by OqlKbdHint)

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

<!-- The tooltip overlay is teleported to <body>, so its look is set GLOBALLY (an
     unscoped block can't reach a teleported node). Mirrors how the chip menu cards
     are styled from oqlChip.css. -->
<style>
.tb-tip-overlay {
  /* override Vuetify's dark pill — this reads as a small white popover */
  background: transparent !important;
  padding: 0 !important;
  opacity: 1 !important;
}
.tb-tip-overlay .tb-tip {
  max-width: 220px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
  padding: 8px 10px;
}
.tb-tip-overlay .tb-tip-desc {
  font-size: 0.78rem;
  line-height: 1.35;
  color: rgba(0, 0, 0, 0.82);
}
.tb-tip-overlay .tb-tip-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 7px;
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.tb-tip-overlay .tb-tip-foot-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(0, 0, 0, 0.4);
}
</style>
