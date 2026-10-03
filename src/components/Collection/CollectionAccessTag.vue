<!--
  A collection's access as a tag: Public, Private or Shared by link (oxjob #1532).
  `prominent` on the /collections list, where every row says it (Jason, 2026-10-03);
  the default is the very small, low-key tag pickers and lists use.
-->
<template>
  <span
    class="collection-access-tag"
    :class="[`access-${access || 'private'}`, { prominent }]"
    :title="info.help"
  >
    <v-icon :size="prominent ? 14 : 11" aria-hidden="true">{{ info.icon }}</v-icon>
    {{ info.label }}
  </span>
</template>

<script setup>
import { computed } from "vue";
import { accessInfo } from "@/collectionAccess";

defineOptions({ name: "CollectionAccessTag" });

const props = defineProps({
  access: { type: String, default: "private" },
  prominent: { type: Boolean, default: false },
});

const info = computed(() => accessInfo(props.access));
</script>

<style scoped>
.collection-access-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  font-size: 11px;
  line-height: 16px;
  padding: 0 5px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  color: rgba(0, 0, 0, 0.62);
  vertical-align: middle;
}
.collection-access-tag.prominent {
  font-size: 13px;
  line-height: 20px;
  padding: 1px 8px;
  font-weight: 500;
}
/* Public is the one worth noticing; private and shared stay neutral. Colors pass
   WCAG AA (4.5:1) on white. */
.collection-access-tag.access-public {
  color: #1b5e20;
  border-color: rgba(27, 94, 32, 0.35);
  background: rgba(46, 125, 50, 0.06);
}
.collection-access-tag.access-shared_by_link {
  color: #0d47a1;
  border-color: rgba(13, 71, 161, 0.3);
}
</style>
