<template>
  <span v-if="canShowCuration" class="curation-affordance">
    <!-- Show "correction submitted" chip if there's a pending correction -->
    <v-chip
      v-if="hasPending"
      size="small"
      color="orange"
      variant="tonal"
      class="ml-2"
      @click="goToCorrections"
      style="cursor: pointer;"
    >
      <v-icon size="x-small" start>mdi-clock-outline</v-icon>
      correction submitted
    </v-chip>

    <!-- Show pencil icon if no pending correction -->
    <boolean-inline-editor
      v-else-if="isBooleanType"
      :entity="entity"
      :entity-type="entityType"
      :property="property"
      :facet-config="facetConfig"
      @updated="onCorrectionSubmitted"
    />
    <property-inline-editor
      v-else
      :entity="entity"
      :entity-type="entityType"
      :property="property"
      :facet-config="facetConfig"
      @updated="onCorrectionSubmitted"
    />
  </span>
</template>

<script setup>
import { computed, unref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import PropertyInlineEditor from './PropertyInlineEditor.vue';
import BooleanInlineEditor from './BooleanInlineEditor.vue';

defineOptions({ name: 'CurationEditButton' });

const props = defineProps({
  entity: {
    type: Object,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  property: {
    type: String,
    required: true,
  },
  facetConfig: {
    type: [Object, Function],
    default: null,
  },
});

const store = useStore();
const router = useRouter();

const canCurate = computed(() => 
  store.getters['user/isLibrarian'] || store.getters['user/isAdmin']
);

const entityId = computed(() => {
  const id = props.entity?.id;
  if (!id) return null;
  return id.startsWith('https://openalex.org/') 
    ? id.replace('https://openalex.org/', '') 
    : id;
});

const hasPending = computed(() => 
  store.getters['user/hasPendingCorrection'](entityId.value, props.property)
);

const canShowCuration = computed(() => 
  canCurate.value && entityId.value && props.property
);

const isBooleanType = computed(() => {
  const config = unref(props.facetConfig);
  return config?.type === 'boolean';
});

const goToCorrections = () => {
  router.push('/me/corrections');
};

const onCorrectionSubmitted = async (newValue) => {
  // Refresh corrections to update pending status
  await store.dispatch('user/fetchCorrections');
};
</script>

<style scoped>
.curation-affordance {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
</style>
