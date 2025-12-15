<template>
  <span v-if="canShowCuration" class="inline-flex items-center align-middle">
    <!-- Show "correction submitted" chip if there's a pending correction -->
    <Tooltip v-if="hasPending">
      <TooltipTrigger>
        <Badge
          variant="outline"
          class="ml-2 cursor-pointer bg-orange-50 text-orange-700 border-orange-200"
          @click="goToCorrections"
        >
          <Clock class="h-3 w-3 mr-1" />
          correction submitted
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Corrections take up to one week to go live.
      </TooltipContent>
    </Tooltip>

    <!-- Show pencil icon if no pending correction -->
    <boolean-inline-editor
      v-else-if="isBooleanType"
      :entity="entity"
      :entity-type="entityType"
      :property="property"
      :facet-config="facetConfig"
      :size="size"
      @updated="onCorrectionSubmitted"
    />
    <property-inline-editor
      v-else
      :entity="entity"
      :entity-type="entityType"
      :property="property"
      :facet-config="facetConfig"
      :size="size"
      @updated="onCorrectionSubmitted"
    />
  </span>
</template>

<script setup>
import { computed, unref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

import { Clock } from 'lucide-vue-next';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  size: {
    type: String,
    default: 'small',
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
/* Styles handled via Tailwind classes */
</style>
