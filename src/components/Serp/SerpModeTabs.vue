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
/* Tab idiom (#611 r5, Jason — replacing the #441 underline bar): ALL tab labels
   are black — grey unselected labels read as disabled. Weight separates selected
   (600) from unselected (500), and the selected tab gets a WHITE fill so it reads
   as an actual tab against the grey page background. */
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
  color: rgba(0, 0, 0, 0.87) !important;
}
/* Too-complex-for-basic: strike the label through — reads as "not available for
   this query" more clearly than grey alone (#598 r5). */
.pill--strike {
  text-decoration: line-through;
}
/* An unavailable tab keeps a TRANSPARENT bg (#611 r5): Vuetify paints a disabled
   button grey TWO ways — a fill on the button itself AND the .v-btn__overlay
   child (which background-color rules on the button never touch) — and the grey
   box read confusingly against the grey page. Kill both; reduced opacity + the
   strikethrough are the whole "unavailable" story. */
.pill.v-btn--disabled {
  background-color: transparent !important;
}
.pill.v-btn--disabled :deep(.v-btn__overlay) {
  opacity: 0 !important;
}
.pill--active {
  font-weight: 600 !important; /* !important: Vuetify's .v-btn weight otherwise wins */
  background-color: #fff !important; /* the white fill IS the active marker (#611 r5) */
  color: rgba(0, 0, 0, 0.87) !important;
}
</style>
