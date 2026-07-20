<template>
  <!-- The add-a-value affordance for a value group (oxjob #428 iter 20): an entity
       autocomplete/list picker, or a bare `+` for scalar values. Hidden for
       single-value (inequality) operators. Used by BOTH the inline and the
       SubclauseBox (block) layouts. Controlled `open` so the group's paren-menu
       "Add value" can pop the picker. -->
  <!-- TYPE-ON-CHIP mode (oxjob #561): when `externalSearch` is set, the query is typed on the
       draft chip itself, so the menu has NO search box — just the options list. The
       chip input is also the menu's ACTIVATOR (with open-on-click off) so Vuetify's
       click-outside dismiss ignores clicks/typing on the input; clicking anywhere else still
       closes the menu (→ abandon), same as before. -->
  <!-- #603 r28 (Jason): the "not" checkbox footer is GONE ("always awkward") — negation is
       TYPED: a query starting `not ` negates the pick, and the autocomplete stays quiet
       while the input is still just a prefix of "not" (see notPrefix.js). -->
  <!-- #603 r22: the anchor is re-resolved to a LIVE element on every open (liveTarget) —
       a selector string handed straight to Vuetify gets resolved ONCE and cached, and the
       chip element it found is REPLACED when the chip flips display↔type-on-input
       (editingEntityId), so every open after the first positioned against a detached node
       at viewport (0,0). -->
  <!-- content-class (#603 r29): while suppressed the ENTIRE overlay content hides — the
       v-overlay__content wrapper itself carries a white bg + shadow, so hiding only the
       card left a shadow sliver under the chip. -->
  <v-menu v-if="isPicker" v-model="open" location="bottom start" offset="4" :close-on-content-click="false"
    :activator="ext ? (liveTarget || undefined) : undefined" :open-on-click="!ext"
    :target="liveTarget || undefined"
    :content-class="ext && suppressed ? 'bav-suppressed' : undefined">
    <template #activator="{ props: mp }">
      <!-- anchor-only (block mode): a zero-size attach point, opened from the paren
           menu's "Add value"; otherwise a visible + button (inline value lists) -->
      <span v-if="anchorOnly" v-bind="ext ? {} : mp" class="picker-anchor"></span>
      <v-btn v-else v-bind="mp" class="add-val-btn" icon size="x-small" variant="text" density="comfortable">
        <v-icon size="16">mdi-plus</v-icon>
        <v-tooltip activator="parent" location="top">Add a value</v-tooltip>
      </v-btn>
    </template>
    <!-- v-show, not a menu close (#603 r29): while the typed input is a bare "n"/"no"/"not"
         the WHOLE card hides — Jason: "there should be nothing, nothing at all there" (an
         empty card rendered as a white stub). Closing the menu instead would fire `abandon`
         and cull the draft, so the menu stays logically open, just invisible. ext-only: the
         internal-search variant keeps its card (the search box lives inside it). -->
    <v-card v-show="!ext || !suppressed" min-width="300" max-width="380" class="menu-card" :style="menuCardStyle">
      <template v-if="!ext">
        <v-text-field v-model="search" autofocus density="compact" variant="plain" hide-details
          prepend-inner-icon="mdi-magnify" :placeholder="`Search ${autocompleteEntity || 'values'}`" class="px-2 pt-1" />
        <v-divider />
      </template>
      <div class="menu-list">
        <v-list density="compact" class="py-0">
          <!-- No loading spinner (#648): fetches are fast enough that a spinner just
               makes typing feel jerky — prior results stay put until new ones land.
               `loading` still gates "No matches" below so it can't flash mid-fetch. -->
          <v-list-item v-for="(r, i) in results" :key="r.id || r.value" :title="r.display_name || r.value"
            :subtitle="r.hint" :active="ext && i === hl" @click="pick(r)" />
          <!-- suppressed = the input is a bare "n"/"no"/"not" (#603 r28): show NOTHING —
               "No matches" would read as a failed search when we simply aren't searching. -->
          <v-list-item v-if="!loading && !results.length && !suppressed && (ext ? externalSearch : search)"
            class="text-medium-emphasis text-center py-3">No matches</v-list-item>
        </v-list>
      </div>
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
import { parseNotQuery } from "@/components/OqlPlayground/notPrefix";

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
  // current negation state of the value being EDITED (committed re-pick): a re-pick keeps the
  // node's negation unless the user types a fresh `not ` (#523 round 3; footer gone in #603 r28).
  negated: { type: Boolean, default: false },
  // TYPE-ON-CHIP mode (oxjob #561): non-null = the autocomplete query is typed on the draft
  // chip itself and passed in here; the menu renders NO search box (options only). The
  // parent drives result navigation via the exposed moveHl()/pickHl().
  externalSearch: { type: String, default: null },
});
const emit = defineEmits(["add", "pick", "abandon"]);

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
// Negation carried into the pick (#603 r28): seeded from the edited value's current state
// (a re-pick keeps an existing `not`); a typed `not ` prefix ORs in on top. The checkbox
// footer that used to drive this is gone.
const negate = ref(false);
// The query string currently in force — the chip input (type-on mode) or the internal box.
const activeQuery = () => (ext.value ? (props.externalSearch || "") : search.value);
// Bare "n"/"no"/"not" → the autocomplete is OFF (#603 r28; see notPrefix.js).
const suppressed = computed(() => parseNotQuery(activeQuery()).suppress);

const pick = (r) => {
  const raw = props.listVocab ? r.value : (r.short_id || r.id || r.value);
  const id = props.slugValues ? String(raw).split("/").pop() : raw;
  const typedNeg = parseNotQuery(activeQuery()).negate;
  emit("pick", { value: id, label: r.display_name || id, negate: negate.value || typedNeg });
  search.value = ""; results.value = [];
};

// Ticket + abort: drop a slow older response so it can't overwrite a newer one.
let runTicket = 0;
let runAbort = null;
const run = debounce(async (rawQ) => {
  if (!isPicker.value || !props.autocompleteEntity) { results.value = []; return; }
  // strip a typed `not ` prefix — the search runs on the real query (#603 r28)
  const q = parseNotQuery(rawQ).query;
  const ticket = ++runTicket;
  runAbort?.abort();
  const ctrl = new AbortController();
  runAbort = ctrl;
  loading.value = true;
  try {
    if (props.listVocab) {
      const all = await getEnumValues(props.autocompleteEntity);
      if (ticket !== runTicket) return;
      const needle = (q || "").toLowerCase();
      results.value = needle
        ? all.filter((v) => v.display_name.toLowerCase().includes(needle) ||
                            String(v.value).toLowerCase().includes(needle))
        : all;
    } else {
      const r = (await api.getAutocomplete(props.autocompleteEntity, { q }, { signal: ctrl.signal })) || [];
      if (ticket !== runTicket) return;
      results.value = r;
    }
  } catch (e) { if (e?.code === "ERR_CANCELED" || ticket !== runTicket) return; results.value = []; }
  finally { if (ticket === runTicket) loading.value = false; }
}, 150);

// Suppression must be INSTANT (not on the debounce): stale results sitting under an armed
// Enter while the user types "n…" would pick something they never searched for. (#603 r28)
const applyQuery = (rawQ) => {
  if (parseNotQuery(rawQ).suppress) { run.cancel(); results.value = []; loading.value = false; return; }
  run(rawQ);
};

watch(search, (q) => { if (isPicker.value) applyQuery(q); });
// type-on-chip mode: the query lives on the chip; each keystroke re-runs the autocomplete.
watch(() => props.externalSearch, (q) => {
  if (ext.value && open.value) { hl.value = 0; applyQuery(q || ""); }
});
watch(results, () => { if (hl.value >= results.value.length) hl.value = 0; });
watch(open, (o) => {
  if (o) {
    if (!liveTarget.value || !liveTarget.value.isConnected) resolveTarget();
    negate.value = !!props.negated; hl.value = 0;
    if (isPicker.value && ext.value) applyQuery(props.externalSearch || "");
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
/* (the "not" checkbox footer is gone — #603 r28: negation is typed, `not <query>`) */
</style>

<!-- UNSCOPED on purpose: the v-menu content teleports to <body>, outside this component's
     scope attr. .bav-suppressed is set via content-class while the typed input is a bare
     "n"/"no"/"not" (#603 r29) — the wrapper itself paints a white bg + shadow, so it must
     hide wholesale, not just the card inside it. -->
<style>
.bav-suppressed { display: none !important; }
</style>
