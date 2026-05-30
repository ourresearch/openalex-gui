<template>
  <div>
    <div class="selection-toolbar d-flex align-center">
      <v-checkbox-btn
        v-if="selectable"
        class="master-checkbox"
        density="compact"
        :model-value="masterChecked"
        :indeterminate="masterIndeterminate"
        :disabled="disableMaster"
        @update:model-value="onMasterClick"
      />
      <slot name="trailing" />
    </div>
    <selection-banner v-if="selectable && !disableMaster" />
  </div>
</template>

<script setup>
import SelectionBanner from '@/components/SelectionBanner.vue';
import { useMasterSelection } from '@/composables/useMasterSelection';

defineOptions({ name: 'SelectionToolbar' });

defineProps({
  disableMaster: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
});

const { masterChecked, masterIndeterminate, onMasterClick } = useMasterSelection();
</script>

<style scoped>
.selection-toolbar {
  padding: 4px 12px;
  min-height: 48px;
}
.master-checkbox {
  flex: 0 0 auto;
  width: auto;
  margin-left: -4px;
}
</style>
