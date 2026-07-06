<!--
  OqlLineTailControls — the trailing controls at the end of a query line: the ghost `or`
  button (add an OR term, #523 round 3) + the end-of-line dropdown (AND clause / AND filter /
  [OR filter, stubbed] / Delete line, #523 round 4).

  OqlQueryBuilder mounts this in TWO spots — inside the tail brick's `.bl-tok--tail` when the
  line's last visible chip is a brick (so chip + `or` + menu never wrap apart, #523 round 6),
  or after the token loop as the fallback for a text-block tail. ONE component so the two
  mounts can't drift (they were hand-synced template copies before the 2026-07-05 cleanup).

  Reveal is pure CSS: the controls fade in when the ancestor `.bline` row is hovered (the
  ancestor part of a scoped selector is left unscoped by the compiler, so `.bline:hover …`
  reaches up into the parent's DOM). No per-line hover state needed in the builder.

  Contract:
    prop  line          the display line. Reads: _plus (canAndOr), _menu (canAndClause, deleteId).
    prop  hasOpenDraft  drafts are a singleton (#561) — hides the `or` ghost + disables the adds.
    emit  plus / and-clause / and-filter / delete-line
-->
<template>
  <span class="line-tail">
    <span v-if="line._plus && line._plus.canAndOr" class="line-plus-wrap">
      <button type="button" class="line-plus" :class="{ 'line-plus--off': hasOpenDraft }"
        @click.stop="$emit('plus')" @mousedown.stop>
        or
        <v-tooltip activator="parent" location="bottom" :open-delay="150">add or term</v-tooltip>
      </button>
    </span>
    <span v-if="line._menu" class="line-menu-wrap">
      <v-menu location="bottom end" offset="4">
        <template #activator="{ props: mp }">
          <button type="button" class="line-menu" v-bind="mp" @click.stop @mousedown.stop>
            <v-icon size="18">mdi-menu-down</v-icon>
            <v-tooltip activator="parent" location="bottom" :open-delay="150">add / delete</v-tooltip>
          </button>
        </template>
        <v-card min-width="190" class="menu-card">
          <v-list density="compact" class="py-0">
            <v-list-item :disabled="!line._menu.canAndClause || hasOpenDraft" prepend-icon="mdi-ampersand"
              title="AND clause" @click="$emit('and-clause')" />
            <v-divider />
            <v-list-item :disabled="hasOpenDraft" prepend-icon="mdi-filter-plus" title="AND filter"
              @click="$emit('and-filter')" />
            <v-list-item prepend-icon="mdi-filter-plus-outline" title="OR filter"
              subtitle="coming soon" disabled />
            <v-divider />
            <v-list-item prepend-icon="mdi-delete-outline" title="Delete line"
              :disabled="!line._menu.deleteId" @click="$emit('delete-line')" />
          </v-list>
        </v-card>
      </v-menu>
    </span>
  </span>
</template>

<script setup>
defineProps({
  line: { type: Object, required: true },
  hasOpenDraft: { type: Boolean, default: false },
});
defineEmits(["plus", "and-clause", "and-filter", "delete-line"]);
</script>

<style scoped>
/* The whole tail travels as one no-wrap unit (#523 round 6). */
.line-tail { display: inline-flex; flex-wrap: nowrap; align-items: center; gap: var(--gx, 2px); }
.line-plus-wrap,
.line-menu-wrap { display: inline-flex; align-items: center; }
/* Per-line `or` insert (#523 round 3): the same size/shape/mono font + pale-periwinkle fill
   as a real value connector chip, so revealing it reads as "drop another `or` term here".
   A ghost: invisible at rest → faint TEXT on row hover → solid background on its own hover. */
.line-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  min-width: var(--chip-w, 26px);
  padding: 0 6px;
  margin-left: 2px;
  border: none;
  border-radius: 4px;
  color: var(--vconn-fg, #1f6feb);
  background: transparent;
  font-family: "JetBrains Mono", monospace;
  font-size: var(--brick-fs, 0.8125rem);
  text-transform: lowercase;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s ease, background 0.1s ease;
}
.bline:hover .line-plus { opacity: 0.55; }
.line-plus:hover { opacity: 1; background: var(--vconn-bg, #dbe7ff); color: var(--vconn-fg, #1f6feb); }
/* Inert while a draft chip is open — drafts are a singleton (#561). */
.line-plus.line-plus--off { opacity: 0; pointer-events: none; }
/* End-of-line dropdown trigger (#523 round 4): a faint chevron right after the `or` button.
   Same ghost reveal; neutral (grey) hue — a structural control, not a value/filter connector. */
.line-menu {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 0 0 auto;
  height: 26px;
  width: 22px;
  min-width: 22px;
  padding: 0;
  margin-left: 1px;
  border: none;
  border-radius: 4px;
  color: var(--bl-muted, #6b7280);
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.1s ease, background 0.1s ease;
}
.bline:hover .line-menu { opacity: 0.55; }
.line-menu:hover,
.line-menu[aria-expanded="true"] { opacity: 1; background: var(--bl-hover-bg, #eceff3); color: var(--bl-fg, #1a1a1a); }
.menu-card { overflow: hidden; }
</style>
