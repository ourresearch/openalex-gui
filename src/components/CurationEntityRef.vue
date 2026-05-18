<template>
  <!-- Stacked: name link on top, OX id as grey subtitle below -->
  <div v-if="stacked" class="entity-stacked">
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
       Link (new tab) when the ref resolves to an OpenAlex entity. For
       resolved entities the tooltip always shows the full name + id in
       parens; for free text it shows the full string only when clipped. -->
  <span v-else class="cer-inline">
    <v-icon v-if="icon" :icon="icon" size="small" class="cer-icon" />

    <!-- Unresolved resolvable ref → raw short id as code -->
    <code v-if="isUnresolved" class="value-text">{{ short }}</code>

    <v-tooltip v-else location="top" :disabled="tooltipDisabled" :text="tooltipText">
      <template #activator="{ props: tipProps }">
        <a
          v-if="oxUrl"
          ref="trunc"
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
          ref="trunc"
          v-bind="tipProps"
          class="cer-trunc"
          :class="textClass"
          :style="{ maxWidth }"
        >{{ displayText }}</span>
      </template>
    </v-tooltip>
  </span>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { shortId, oxEntityUrl } from '@/composables/useCurationDescriptor';

const props = defineProps({
  entityRef: { type: Object, required: true },
  entityMap: { type: Object, default: () => ({}) },
  textClass: { type: String, default: '' },
  stacked: { type: Boolean, default: false },
  maxWidth: { type: String, default: '320px' },
  icon: { type: String, default: '' },
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

// Resolved entities always surface the full name + OX id in parens; free-text
// refs only need the tooltip when the rendered text is actually clipped.
const tooltipText = computed(() =>
  isText.value
    ? displayText.value
    : (name.value ? `${name.value} (${short.value})` : displayText.value)
);
const tooltipDisabled = computed(() =>
  isText.value ? !isTruncated.value : false
);

// Show the tooltip only when the single-line text is clipped by ellipsis.
const trunc = ref(null);
const isTruncated = ref(false);
function measure() {
  const el = trunc.value;
  if (!el) { isTruncated.value = false; return; }
  isTruncated.value = el.scrollWidth > el.clientWidth + 1;
}
let ro = null;
onMounted(() => {
  nextTick(measure);
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(measure);
    if (trunc.value) ro.observe(trunc.value);
  }
});
onBeforeUnmount(() => { if (ro) ro.disconnect(); });
watch(displayText, () => nextTick(measure));
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
</style>
