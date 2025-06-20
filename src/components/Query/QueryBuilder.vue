<template>

  <v-card flat rounded class="query-builder mb-0 px-6 pt-5 pb-0">
    <template v-if="uiVariant.includes('sentence')">
      <QuerySentence />
    </template>
  </v-card>
  
</template>


<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

import QuerySentence from '@/components/Query/QuerySentence.vue';

defineOptions({ name: 'QueryBuilder' });

const store = useStore();
const uiVariant = computed(() => store.state.uiVariant);
</script>


<style>
.results-box .query-builder {
  border-radius: 15px;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding-bottom: 0 !important;
}
.query-builder-top {
  display: flex;
  align-items: stretch;
}
.query-builder-top > div {
  flex: 1;
}
.query-section-label {
  font-size: 16px;
}
.entity-chip {
  font-weight: bold !important;
  letter-spacing: 0.0125em;
  font-size: 18px !important;
  margin: 0;
  height: 28px !important;
}
.query-builder-chip {
  display: inline-block;
  margin: 0px;
  height: 28px;
}
.query-builder-chip .v-chip,
.query-builder-chip.v-chip {
  font-size: 12px !important;
}
.entity-chip,
.entity-chip.v-chip,
.query-builder-chip.v-chip,
.query-builder-chip .v-chip,
.query-builder-button {
  height: 22px;
  padding: 0px 5px !important;
}
.query-builder .menu-chip {
  cursor: pointer;
  background-color: transparent !important;
  border: none;
  border-bottom: 1px solid;
  border-radius: 0 !important;
  padding: 0px 0px !important;
  margin: 0 3px;
  height: 20px !important;
}
.query-builder .menu-chip .v-icon {
  margin-right: -4px;
}
.query-builder-input.v-text-field .v-input__control .v-input__slot {
    min-height: auto !important;
    display: flex !important;
    align-items: center !important;
    padding: 2px 4px !important;
  }
.query-builder-input.v-text-field .v-input__control .v-input__slot .v-input__append-inner {
  margin-top: 2px;
}
.query-builder-button.tight {
  padding: 0px 0px !important;
  height: 20px !important;
  width: 20px !important;
  min-width: 20px !important;
}
.new-query-button {
  margin-top: 0px;
}
.section-divider {
  border-top: 1px solid #eee;
  margin: 20px 0;
}
.section-divider.clear {
  border: none;
  margin: 20px 0;
}
</style>