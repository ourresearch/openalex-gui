<template>
  <!-- Plain string target (RAS affiliation text, new display name) -->
  <span v-if="entityRef.type === 'text'" :class="textClass">{{ entityRef.text || '—' }}</span>

  <!-- Resolved OX entity → linked name + subtitle -->
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

  <!-- Unresolved OX id → raw code fallback -->
  <code v-else class="value-text">{{ entityRef.id }}</code>
</template>

<script setup>
import { computed } from 'vue';
import { shortId, oxEntityUrl } from '@/composables/useCurationDescriptor';

const props = defineProps({
  entityRef: { type: Object, required: true },
  entityMap: { type: Object, default: () => ({}) },
  textClass: { type: String, default: '' },
});

const resolved = computed(() =>
  props.entityRef.id ? props.entityMap[props.entityRef.id] : null
);
const short = computed(() => shortId(props.entityRef.id));

function openEntity() {
  const url = oxEntityUrl(props.entityRef);
  if (url) window.open(url, '_blank');
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

.value-text {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 13px;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
