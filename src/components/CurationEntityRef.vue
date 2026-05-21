<template>
  <!-- Stacked: name link on top, OX id as grey subtitle below -->
  <div v-if="stacked" class="entity-stacked" :class="{ 'cer-dimmed': dimmed }">
    <a
      v-if="oxUrl"
      :href="oxUrl"
      target="_blank"
      rel="noopener"
      class="entity-stacked-main"
      @click.stop
    >{{ mainText }}</a>
    <span v-else class="entity-stacked-main">{{ mainText }}</span>
    <span v-if="name" class="entity-stacked-sub">{{ short }}</span>
  </div>

  <!-- Inline table cell: optional entity-type icon + truncated text/name.
       Link (new tab) when the ref resolves to an OpenAlex entity. Hover
       shows a 2-line tooltip (below): full value on top, then the OX id
       (entities) or the word "string" (free text) in grey monospace.
       `dimmed=true` (oxjob #193 R8) applies a muted color + strikethrough
       so the row reads as a diff (previous_value above, new value below). -->
  <span v-else class="cer-inline" :class="{ 'cer-dimmed': dimmed }">
    <v-icon v-if="icon" :icon="icon" size="small" class="cer-icon" />

    <!-- Unresolved resolvable ref → raw short id as code -->
    <code v-if="isUnresolved" class="value-text">{{ short }}</code>

    <v-tooltip v-else location="bottom" max-width="420">
      <template #activator="{ props: tipProps }">
        <a
          v-if="oxUrl"
          v-bind="tipProps"
          :href="oxUrl"
          target="_blank"
          rel="noopener"
          class="cer-trunc cer-link"
          :class="textClass"
          :style="{ maxWidth }"
          @click.stop
        >{{ displayText }}</a>
        <span
          v-else
          v-bind="tipProps"
          class="cer-trunc"
          :class="textClass"
          :style="{ maxWidth }"
        >{{ displayText }}</span>
      </template>
      <CurationTooltipBody :primary="displayText" :secondary="tooltipSecondary" />
    </v-tooltip>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { shortId, oxEntityUrl } from '@/composables/useCurationDescriptor';
import CurationTooltipBody from '@/components/CurationTooltipBody.vue';

const props = defineProps({
  entityRef: { type: Object, required: true },
  entityMap: { type: Object, default: () => ({}) },
  textClass: { type: String, default: '' },
  stacked: { type: Boolean, default: false },
  maxWidth: { type: String, default: '320px' },
  icon: { type: String, default: '' },
  // Renders the ref as a "before" value: muted color + strikethrough.
  // Used to show a curation's `previous_value` above its new `value`
  // (oxjob #193 R8 / #241). Default is the normal "current" rendering.
  dimmed: { type: Boolean, default: false },
});

const isText = computed(() => props.entityRef.type === 'text');
const resolved = computed(() =>
  props.entityRef.id ? props.entityMap[props.entityRef.id] : null
);
// A resolvable ref (author/work/institution) whose name hasn't loaded yet.
const isUnresolved = computed(
  () => !props.stacked && !isText.value && !resolved.value
);
const short = computed(() => shortId(props.entityRef.id));
const oxUrl = computed(() => oxEntityUrl(props.entityRef));
const name = computed(() => resolved.value?.display_name || '');
const mainText = computed(() => name.value || short.value || '—');
const displayText = computed(() =>
  isText.value ? (props.entityRef.text || '—') : (name.value || short.value || '—')
);

// Secondary tooltip line: OX id for resolved entities, the literal type
// "string" for free-text refs (matches the entity tooltip look-and-feel).
const tooltipSecondary = computed(() =>
  isText.value ? 'string' : short.value
);
</script>

<style scoped>
.cer-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
}

.cer-icon {
  color: rgba(0, 0, 0, 0.45);
  flex-shrink: 0;
}

.cer-trunc {
  display: inline-block;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  font-size: 14px;
}

.cer-link {
  color: inherit;
  text-decoration: none;
}

.cer-link:hover {
  text-decoration: underline;
}

.entity-stacked {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.entity-stacked-main {
  font-size: 14px;
  font-weight: 500;
  color: inherit;
  text-decoration: none;
  width: fit-content;
}

a.entity-stacked-main:hover {
  text-decoration: underline;
}

.entity-stacked-sub {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
}

.value-text {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Dimmed = "previous value" rendering. Muted color + strikethrough on the
   text content. The link rules need to beat Vuetify's
   `.v-application a:not(.v-btn):not(.v-list-item):not(.v-tab):not(.novice-link)`
   which has `color: !important` at specificity (0,5,1) — so we prefix
   `.v-application` and stack classes to reach (0,6,1) + !important. */
.cer-dimmed {
  color: rgba(0, 0, 0, 0.5);
}

.cer-dimmed .cer-icon {
  color: rgba(0, 0, 0, 0.3);
}

.v-application .cer-dimmed.cer-inline a.cer-trunc.cer-link {
  color: rgba(0, 0, 0, 0.5) !important;
  text-decoration: line-through !important;
}

.v-application .cer-dimmed.cer-inline a.cer-trunc.cer-link:hover {
  text-decoration: line-through underline !important;
}

.cer-dimmed .cer-trunc {
  text-decoration: line-through;
}

.cer-dimmed .value-text {
  text-decoration: line-through;
  background-color: #ececec;
}

.v-application .cer-dimmed.entity-stacked a.entity-stacked-main {
  color: rgba(0, 0, 0, 0.5) !important;
  text-decoration: line-through !important;
}

.v-application .cer-dimmed.entity-stacked a.entity-stacked-main:hover {
  text-decoration: line-through underline !important;
}

.cer-dimmed .entity-stacked-main {
  text-decoration: line-through;
}
</style>
