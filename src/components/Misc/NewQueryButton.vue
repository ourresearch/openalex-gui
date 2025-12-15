<template>
  <Button 
    v-bind="$attrs"
    @click="onClick"
  >
    <template v-if="!goTo">
      <Plus v-if="icon === 'mdi-plus'" class="h-4 w-4 mr-1" />
      {{ buttonText }}
    </template>
    <template v-else>
      {{ buttonText }}
      <ChevronRight class="h-4 w-4 ml-1" />
    </template>
  </Button>   
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { Plus, ChevronRight } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

defineOptions({ name: 'NewQueryButton', inheritAttrs: false });

defineProps({
  buttonText: {
    type: String,
    default: 'New Query'
  },
  icon: {
    type: String,
    default: 'mdi-plus'
  },
  goTo: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'small'
  }
});

const store = useStore();
const route = useRoute();
const router = useRouter();

const isBaseQuery = computed(() => store.getters['search/isBaseQuery']);
const userId = computed(() => store.getters['user/userId']);
const createNewSearch = () => store.dispatch('search/createNewSearch');

const onClick = () => {
  if (route.name === 'Results' && isBaseQuery.value) {
    return;
  }

  if (!userId.value) {
    router.push({
      name: 'Login',
      query: { redirect: '/analytics' }
    });
    return;
  }

  createNewSearch();
};
</script>

