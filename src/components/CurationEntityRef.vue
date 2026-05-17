<template>
  <!-- Plain string (RAS affiliation text, new display name, etc.) -->
  <span v-if="entityRef.type === 'text'" :class="textClass">{{ entityRef.text || '—' }}</span>

  <!-- Stacked: name link on top, OX id as grey subtitle below -->
  <div v-else-if="stacked" class="entity-stacked">
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

  <!-- Inline (list card): resolved → name + subtitle, else raw code -->
  <div
    v-else-if="resolved"
    class="entity-info"
    @click.stop="openEntity"
  >
    <span class="entity-name">{{ resolved.display_name }}</span>
    <span class="text-medium-emphasis entity-sub">
      <template v-if="resolved.subtitle">{{ resolved.subtitle }} </template>({{ short }})
    </span>
  </div>
  <code v-else class="value-text">{{ entityRef.id }}</code>
</template>

<script setup>
import { computed } from 'vue';
import { shortId, oxEntityUrl } from '@/composables/useCurationDescriptor';

const props = defineProps({
  entityRef: { type: Object, required: true },
  entityMap: { type: Object, default: () => ({}) },
  textClass: { type: String, default: '' },
  stacked: { type: Boolean, default: false },
});

const resolved = computed(() =>
  props.entityRef.id ? props.entityMap[props.entityRef.id] : null
);
const short = computed(() => shortId(props.entityRef.id));
const oxUrl = computed(() => oxEntityUrl(props.entityRef));
const name = computed(() => resolved.value?.display_name || '');
const mainText = computed(() => name.value || short.value || '—');

function openEntity() {
  if (oxUrl.value) window.open(oxUrl.value, '_blank');
}
</script>

<style scoped>
.entity-info {
  min-width: 0;
  cursor: pointer;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}

.entity-info:hover .entity-name {
  text-decoration: underline;
}

.entity-name {
  font-size: 14px;
  font-weight: 500;
}

.entity-sub {
  font-size: 14px;
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
