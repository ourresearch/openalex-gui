<template>
  <div>
    <v-menu location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn icon variant="plain" v-bind="props">
          <v-icon>mdi-monitor-dashboard</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="(option, index) in uiOptions"
          :key="index"
          class="ui-variant-option"
          @click="setUiVariant(option.value)"
        >
          <template v-slot:prepend>
            <v-icon v-if="uiVariant === option.value" color="primary">mdi-check</v-icon>
            <v-icon v-else class="invisible-icon">mdi-check</v-icon>
          </template>
          <v-list-item-title>{{ option.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'UiVariantSelector' });

const store = useStore();

const uiOptions = ref([
  { value: 'sentence-worksfirst', text: 'Works First Sentence' },
  { value: 'sentence-entityfirst', text: 'Entity First Sentence' },
  { value: 'sentence-group', text: 'Group Button Sentence' },
  { value: 'top', text: 'Top Columns' },
  { value: 'side', text: 'Side (Entity First)' },
  { value: 'worksfirst', text: 'Side (Works First)' }
]);

const uiVariant = computed(() => store.state.uiVariant);
const setUiVariant = (val) => store.commit('setUiVariant', val);
</script>


<style scoped>
.ui-variant-option {
  cursor: pointer;
  padding: 0px 15px;
}
.invisible-icon {
  opacity: 0;
}
</style>