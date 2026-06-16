<!--
  OqlConnChip — the connector (and / or) chip in the OQL builder (oxjob #467). It joins
  sibling filters/clauses; toggling it flips the owning group's conjunction.

  Converged onto the same interaction model as the value chips, per Jason (2026-06-16):
    • SINGLE-CLICK opens a dropdown with TWO options — `and` / `or` — each with a
      checkbox in front so it's clear which is active. Picking the other one flips the
      connector; picking the active one is a no-op.
    • DOUBLE-CLICK toggles directly (and ⇄ or), skipping the menu.
  The dropdown shape is shared with the boolean value chip so the two read as one
  pattern.

  PURELY PRESENTATIONAL — owns no query state. It reads the `conn` layout token and
  emits a single intent; the parent maps it onto `edit.toggleJoin` and re-renders.
  Since the connector is binary, "set to X" is expressed as a toggle (emit only when X
  differs from the current join), so no new parent op is needed.

  Contract:
    prop  tok          the `conn` token. Reads: id, label/text ("and"|"or").
    emit  toggle-join  () — flip the owning group's conjunction (and ⇄ or).
-->
<template>
  <v-menu v-model="menuOpen" :open-on-click="false" location="bottom start" offset="6">
    <template #activator="{ props: mp }">
      <span v-bind="mp" class="val-chip conn-chip" :class="{ selected: menuOpen }"
        tabindex="0" @click="onClick" @dblclick="onDblclick" @keydown="onKeydown">
        {{ chipLabel }}
      </span>
    </template>
    <v-card min-width="140" class="menu-card chip-menu" @keydown="onKeydown">
      <v-list density="compact" class="py-0">
        <v-list-item v-for="opt in ['and', 'or']" :key="opt" @click="pick(opt)">
          <template #prepend>
            <v-icon size="16" class="mi-check" :class="{ on: join === opt }">
              {{ join === opt ? "mdi-checkbox-marked" : "mdi-checkbox-blank-outline" }}
            </v-icon>
          </template>
          <v-list-item-title>{{ opt }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed } from "vue";
import { useChipShortcuts } from "@/components/Oql/useChipShortcuts";
import "@/components/Oql/oqlChip.css"; // shared .val-chip / .chip-menu / .mi-check styles

const props = defineProps({
  tok: { type: Object, required: true },
});
const emit = defineEmits(["toggle-join"]);

const join = computed(() => (props.tok.label || props.tok.text || "and").trim().toLowerCase());
// The chip shows a compact glyph: "and" → "&" (per Jason); "or" stays "or". The dropdown
// keeps the full words so picking is unambiguous.
const chipLabel = computed(() => (join.value === "and" ? "&" : join.value));

// Single-click → menu (dbl-click disambiguated); double-click → toggle. No delete /
// new / enter — a connector is purely a 2-state structural toggle.
const { menuOpen, onClick, onDblclick, onKeydown } = useChipShortcuts({
  idRef: () => props.tok.id,
  onDouble: () => emit("toggle-join"),
});

// Pick an option: only emit when it differs from the current join (binary → "set" is a
// toggle). Picking the already-active one just closes the menu.
const pick = (opt) => {
  menuOpen.value = false;
  if (opt !== join.value) emit("toggle-join");
};
</script>

<!-- chip + menu styles live in the shared oqlChip.css (imported in the script). -->
