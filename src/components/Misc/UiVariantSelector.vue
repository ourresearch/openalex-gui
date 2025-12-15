<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <LayoutDashboard class="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          v-for="(option, index) in uiOptions"
          :key="index"
          class="cursor-pointer"
          @click="setUiVariant(option.value)"
        >
          <Check v-if="uiVariant === option.value" class="h-4 w-4 mr-2" />
          <span v-else class="w-4 mr-2" />
          {{ option.text }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { LayoutDashboard, Check } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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