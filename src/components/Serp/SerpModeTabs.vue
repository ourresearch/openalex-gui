<template>
  <!-- Left-aligned pill tabs that pick the search mode (oxjob #440 round 2).
       Replaces the old SerpModeMenu dropdown. Three tabs: Basic / Advanced / OQL.
       OQL is the raw query-language view, promoted from the old "view code" dialog
       to a top-level tab. Basic is disabled (with a tooltip) when the current query
       can't be shown as basic chips. -->
  <div class="serp-mode-tabs-wrap d-flex align-center">
    <div class="serp-mode-tabs" role="tablist">
    <template v-for="opt in options" :key="opt.value">
      <!-- A disabled tab (Basic too-complex-for-chips, or Advanced too-complex-for-
           the-grid, #523) renders greyed with an explanatory tooltip. -->
      <v-tooltip
        v-if="disabledTip(opt.value)"
        location="bottom"
        :text="disabledTip(opt.value)"
      >
        <template #activator="{ props: tipProps }">
          <span v-bind="tipProps">
            <v-btn
              class="pill"
              :class="{ 'pill--strike': opt.value === 'basic' }"
              size="small"
              variant="text"
              rounded="pill"
              disabled
            >{{ opt.label }}</v-btn>
          </span>
        </template>
      </v-tooltip>
      <!-- Selected = quiet gray, unselected = clear (#440 r8 — the old primary-
           black pill read as a heavyweight action button, not a tab). -->
      <v-btn
        v-else
        class="pill"
        :class="{ 'pill--active': opt.value === modelValue }"
        size="small"
        variant="text"
        rounded="pill"
        role="tab"
        :aria-selected="opt.value === modelValue"
        @click="select(opt.value)"
      >{{ opt.label }}</v-btn>
    </template>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'SerpModeTabs' });

const props = defineProps({
  // 'basic' | 'advanced' | 'oql'
  modelValue: { type: String, default: 'basic' },
  // True when the current query can't be represented as basic chips → Basic is
  // greyed out with a tooltip.
  basicDisabled: { type: Boolean, default: false },
  // True when the current query is too complex for the 2D grid builder → Advanced
  // is greyed out with a tooltip and the user edits in OQL instead (#523).
  advancedDisabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue']);

const options = [
  { value: 'basic', label: 'Basic' },
  // #603 round 10 (Jason): the V2 outline builder IS Advanced now — the experiment's
  // side-by-side "Advanced v2" tab is gone and the V1 grid builder is unmounted.
  { value: 'advanced', label: 'Advanced' },
  { value: 'oql', label: 'OQL' },
];

// The tooltip for a disabled tab, or '' when the tab is enabled. OQL can always
// represent any query, so it is never disabled.
function disabledTip(value) {
  if (value === 'basic' && props.basicDisabled) {
    return 'This query is too complex to show as basic filters.';
  }
  if (value === 'advanced' && props.advancedDisabled) {
    return 'This query is too complex to edit visually — use OQL.';
  }
  return '';
}

function select(value) {
  if (value === props.modelValue) return;
  emit('update:modelValue', value);
}
</script>

<style scoped>
/* Underline tabs (oxjob #441): the active tab is marked by a 2px bar underneath +
   bolder/darker text, NOT a filled pill. The old gray-chip fill read as one of the
   builder's gray filled "bricks" right below it — same shape, visually confusing.
   No fill here keeps "active tab" and "filter chip" in clearly different idioms. */
.serp-mode-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
/* !important: a GLOBAL app rule (`.v-btn--variant-text { background-color:
   transparent !important; color: #1a1a1a !important }`) otherwise wins. */
.pill {
  position: relative;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
  min-width: 0;
  height: 30px;
  border-radius: 6px !important; /* slightly rounded, like the app's other buttons (#598 r5) */
  color: rgba(0, 0, 0, 0.5) !important;
}
/* Too-complex-for-basic: strike the label through — reads as "not available for
   this query" more clearly than grey alone (#598 r5). */
.pill--strike {
  text-decoration: line-through;
}
.pill--active {
  font-weight: 600 !important; /* !important: Vuetify's .v-btn weight otherwise wins */
  background-color: transparent !important; /* no fill — the underline is the marker */
  color: rgba(0, 0, 0, 0.87) !important;
}
/* the 2px indicator bar, inset slightly from the tab's edges */
.pill--active::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 0;
  height: 2px !important;
  border-radius: 1px;
  background-color: currentColor; /* near-black, matches the active label */
}
</style>
