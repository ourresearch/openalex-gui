<template>
  <v-btn 
    class="new-query-button" 
    variant="flat"
    v-bind="$attrs"
    @click="onClick"
  >
    <template v-if="!goTo">
      <v-icon 
        v-if="icon" 
        v-bind="{[size]: true}" 
        :color="$attrs.color === 'primary' ? undefined : 'primary'"
      >
        {{ icon }}
      </v-icon>
      {{ buttonText }}
    </template>
    <template v-else>
      {{ buttonText }}
      <v-icon end v-bind="{[size]: true}">mdi-chevron-right</v-icon>
    </template>
  </v-btn>   
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

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

