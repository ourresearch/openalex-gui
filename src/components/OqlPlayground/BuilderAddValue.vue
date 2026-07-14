<template>
  <!-- The add-a-value affordance for a value group (oxjob #428 iter 20): an entity
       autocomplete/list picker, or a bare `+` for scalar values. Hidden for
       single-value (inequality) operators. Used by BOTH the inline and the
       SubclauseBox (block) layouts. Controlled `open` so the group's paren-menu
       "Add value" can pop the picker. -->
  <!-- TYPE-ON-CHIP mode (oxjob #561): when `externalSearch` is set, the query is typed on the
       draft chip itself, so the menu has NO search box — just options + the "not" footer. The
       chip input is also the menu's ACTIVATOR (with open-on-click off) so Vuetify's
       click-outside dismiss ignores clicks/typing on the input; clicking anywhere else still
       closes the menu (→ abandon), same as before. -->
  <!-- #603 r22: the anchor is re-resolved to a LIVE element on every open (liveTarget) —
       a selector string handed straight to Vuetify gets resolved ONCE and cached, and the
       chip element it found is REPLACED when the chip flips display↔type-on-input
       (editingEntityId), so every open after the first positioned against a detached node
       at viewport (0,0). -->
  <v-menu v-if="isPicker" v-model="open" location="bottom start" offset="4" :close-on-content-click="false"
    :activator="ext ? (liveTarget || undefined) : undefined" :open-on-click="!ext"
    :target="liveTarget || undefined">
    <template #activator="{ props: mp }">
      <!-- anchor-only (block mode): a zero-size attach point, opened from the paren
           menu's "Add value"; otherwise a visible + button (inline value lists) -->
      <span v-if="anchorOnly" v-bind="ext ? {} : mp" class="picker-anchor"></span>
      <v-btn v-else v-bind="mp" class="add-val-btn" icon size="x-small" variant="text" density="comfortable">
        <v-icon size="16">mdi-plus</v-icon>
        <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
      </v-btn>
    </template>
    <v-card min-width="300" max-width="380" class="menu-card" :style="menuCardStyle">
      <template v-if="!ext">
        <v-text-field v-model="search" autofocus density="compact" variant="plain" hide-details
          prepend-inner-icon="mdi-magnify" :placeholder="`Search ${autocompleteEntity || 'values'}`" class="px-2 pt-1" />
        <v-divider />
      </template>
      <div class="menu-list">
        <v-list density="compact" class="py-0">
          <v-list-item v-if="loading" class="text-center py-3">
            <v-progress-circular indeterminate size="18" width="2" color="grey" />
          </v-list-item>
          <v-list-item v-for="(r, i) in results" :key="r.id || r.value" :title="r.display_name || r.value"
            :subtitle="r.hint" :active="ext && i === hl" @click="pick(r)" />
          <v-list-item v-if="!loading && !results.length && (ext ? externalSearch : search)"
            class="text-medium-emphasis text-center py-3">No matches</v-list-item>
        </v-list>
      </div>
      <!-- "not" footer (oxjob #507, Jason 2026-06-25): a checkbox toggle that negates the
           value(s) picked from this dropdown — `not Stanford University`. -->
      <v-divider />
      <button type="button" class="not-footer" :class="{ 'not-footer--on': negate }"
        @click.stop="onToggleNegate">
        <v-icon size="18">{{ negate ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline' }}</v-icon>
        <span>not</span>
      </button>
    </v-card>
  </v-menu>
  <v-btn v-else class="add-val-btn" icon size="x-small" variant="text" density="comfortable" @click="$emit('add')">
    <v-icon size="16">mdi-plus</v-icon>
    <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
  </v-btn>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { debounce } from "lodash";
import { api } from "@/api";
import { getEnumValues } from "@/components/OqlPlayground/oqlEditorApi";

defineOptions({ name: "BuilderAddValue" });

const props = defineProps({
  valueKind: { type: String, default: "text" },
  autocompleteEntity: { type: String, default: null },
  listVocab: { type: Boolean, default: false },
  // slug-id entity on the AUTOCOMPLETE path (keywords, #603 r20): results carry
  // prefixed short_ids ("keywords/machine-learning") but the OQO value is the bare
  // slug — tail-ify on pick.
  slugValues: { type: Boolean, default: false },
  // render only a zero-size picker anchor (block mode); opened via openPicker()
  anchorOnly: { type: Boolean, default: false },
  // optional positioning anchor for the dropdown (a CSS selector / element). When set, the
  // menu opens under THIS element instead of the (zero-width) activator span — used by the
  // draft entity picker so the dropdown lands under the "new <entity>" placeholder chip
  // rather than offset to its right (the zero-width anchor sits after the placeholder). #494
  anchorTarget: { type: [String, Object], default: null },
  // current negation state of the value being EDITED (committed re-pick): seeds the "not" footer
  // so it reflects reality, and lets a footer toggle apply LIVE via `set-negate`. (#523 round 3.)
  negated: { type: Boolean, default: false },
  // TYPE-ON-CHIP mode (oxjob #561): non-null = the autocomplete query is typed on the draft
  // chip itself and passed in here; the menu renders NO search box (options + "not" footer
  // only). The parent drives result navigation via the exposed moveHl()/pickHl().
  externalSearch: { type: String, default: null },
});
const emit = defineEmits(["add", "pick", "abandon", "set-negate"]);

// The menu matches the FIELD-chip picker's recipe (#603 round 10, Jason: the all-blue
// card is gone) — default white background, with the chip family's tint only on the
// hover/keyboard-highlighted row. Inline (not CSS vars) — the card teleports to <body>,
// outside the .builder ancestor that carries the palette vars.
const menuCardStyle = {
  backgroundColor: "#fff",
  // --menu-hl: highlight rows in the house light grey (#603 round 11 monochrome pass —
  // the round-10 periwinkle highlight went with the rest of the colours).
  "--menu-hl": "#f0f0f0",
};

const isPicker = computed(() => props.valueKind === "entity");
// Live anchor element (#603 r22): re-resolved from the anchorTarget selector at every
// open, so the menu always positions against the chip element CURRENTLY in the DOM
// (the chip is replaced when it flips into its type-on input and back).
const liveTarget = ref(null);
const resolveTarget = () => {
  const t = props.anchorTarget;
  liveTarget.value = (typeof t === "string" ? document.querySelector(t) : t) || null;
};
const ext = computed(() => props.externalSearch != null); // type-on-chip mode (#561)
const open = ref(false);
const search = ref("");
const results = ref([]);
const loading = ref(false);
// Keyboard highlight for type-on-chip mode (#561): the chip input keeps focus, so the menu
// list is navigated remotely (moveHl/pickHl below); `hl` is the highlighted result index.
const hl = ref(0);
const negate = ref(false); // "not" footer toggle (oxjob #507): negate picked values
// Toggle the "not" footer: flip locally, AND emit `set-negate` so a committed value being
// re-edited negates IMMEDIATELY (the footer used to only modify the NEXT pick — checking it on
// an already-placed value did nothing). The new state still rides the next `pick` payload. (#523)
const onToggleNegate = () => { negate.value = !negate.value; emit("set-negate", negate.value); };

const pick = (r) => {
  const raw = props.listVocab ? r.value : (r.short_id || r.id || r.value);
  const id = props.slugValues ? String(raw).split("/").pop() : raw;
  emit("pick", { value: id, label: r.display_name || id, negate: negate.value });
  search.value = ""; results.value = [];
};

const run = debounce(async (q) => {
  if (!isPicker.value || !props.autocompleteEntity) { results.value = []; return; }
  loading.value = true;
  try {
    if (props.listVocab) {
      const all = await getEnumValues(props.autocompleteEntity);
      const needle = (q || "").toLowerCase();
      results.value = needle
        ? all.filter((v) => v.display_name.toLowerCase().includes(needle) ||
                            String(v.value).toLowerCase().includes(needle))
        : all;
    } else {
      results.value = (await api.getAutocomplete(props.autocompleteEntity, { q })) || [];
    }
  } catch { results.value = []; }
  finally { loading.value = false; }
}, 250);

watch(search, (q) => { if (isPicker.value) run(q); });
// type-on-chip mode: the query lives on the chip; each keystroke re-runs the autocomplete.
watch(() => props.externalSearch, (q) => {
  if (ext.value && open.value) { hl.value = 0; run(q || ""); }
});
watch(results, () => { if (hl.value >= results.value.length) hl.value = 0; });
watch(open, (o) => {
  if (o) {
    if (!liveTarget.value || !liveTarget.value.isConnected) resolveTarget();
    negate.value = !!props.negated; hl.value = 0;
    if (isPicker.value && ext.value) run(props.externalSearch || "");
    else if (isPicker.value && !results.value.length) run("");
  }
  else { negate.value = false; emit("abandon"); }
});

// let the parent pop the picker (from the paren menu's "Add value") or close it (after a
// committed-value RE-PICK, where the clause id is stable so the picker isn't unmounted —
// oxjob #428 entity edit). moveHl/pickHl: remote keyboard nav for type-on-chip mode (#561) —
// the chip input keeps focus, so Arrow/Enter keydowns are forwarded here by the builder.
defineExpose({
  openPicker: () => { resolveTarget(); open.value = true; },
  closePicker: () => { open.value = false; },
  moveHl: (d) => {
    const n = results.value.length;
    if (n) hl.value = ((hl.value + d) % n + n) % n;
  },
  pickHl: () => {
    const r = results.value[hl.value] || results.value[0];
    if (r) pick(r);
  },
});
</script>

<style scoped>
/* demoted in the hierarchy: bare + icon, dimmed via the inner icon (App.vue's
   ghost-variant reset forces button opacity to 1 !important) */
.add-val-btn :deep(.v-icon) { opacity: 0.55; }
.add-val-btn:hover :deep(.v-icon) { opacity: 1; }
/* display:none (#603 r17, Jason): even at 0x0 the span was a FLEX ITEM in the value
   row, so it contributed an extra 2px flex-gap after some entity chips ("increase in
   the right margin... only sometimes"). It's kept (not deleted) because it is the
   v-menu's activator mount; positioning comes from anchorTarget, so hiding is safe. */
.picker-anchor { display: none; }
.menu-card { overflow: hidden; }
.menu-list { max-height: 320px; overflow-y: auto; }
/* White card (#603 round 10 — the #561 all-blue tint is gone); the chip family's colour
   survives only as the highlight: hover + keyboard-highlight rows use the value chips'
   light periwinkle (--menu-hl, set inline on the card) instead of Vuetify's grey
   on-surface overlay — the value-chip analogue of the field picker's peach highlight. */
.menu-card :deep(.v-list) { background: transparent; color: inherit; }
.menu-card :deep(.v-list-item-title) { font-size: 0.8125rem; }
.menu-card :deep(.v-list-item__overlay) { display: none; }
/* !important: App.vue ships a global `.v-list-item.v-list-item--active { background: #f0f0f0
   !important }` house rule that would otherwise grey out the highlight (the #440 footgun). */
.menu-card :deep(.v-list-item:hover),
.menu-card :deep(.v-list-item--active) { background: var(--menu-hl, rgba(0, 0, 0, 0.08)) !important; }
/* "not" footer (oxjob #507): a full-width checkbox row, Linear-minimal. Inherits the
   menu's chip colouring (#561). */
.not-footer {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 12px;
  font-size: 0.8125rem; color: inherit;
  background: transparent; border: 0; cursor: pointer; text-align: left;
}
.not-footer:hover { background: var(--menu-hl, rgba(0, 0, 0, 0.06)); }
.not-footer .v-icon { opacity: 0.55; }
.not-footer--on { color: #1a1a1a; }
.not-footer--on .v-icon { opacity: 1; }
</style>
