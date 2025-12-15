<template>
  <span>
    <v-btn
      variant="text"
      size="x-large"
      v-if="smAndDown"
      :id="myId"
      class="rounded-lg pl-0 pr-0"
    >
      <v-icon>{{ entityTypeConfig.icon }}</v-icon>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>
    <v-btn
      v-else
      class="text-capitalize rounded-lg elevation-0 entity-type-select-btn"
      :id="myId"
      size="x-large"
    >
      <v-icon variant="plain">{{ entityTypeConfig.icon }}</v-icon>
      <span class="ml-2">
        {{ entityTypeConfig.displayName }}
      </span>
      <v-icon>mdi-menu-down</v-icon>
    </v-btn>

    <v-menu
        v-model="isDialogOpen"
        :activator="'#' +  myId"
        class="rounded-lg"
        location="bottom"
    >
      <v-card flat class="rounded-0">
        <v-card-text class="pa-0">
          <v-list>
            <v-list-item
                v-for="entityOption in entityTypeOptions"
                :key="entityOption.name"
                class="my-0 py-0"
                @click="entityType = entityOption.name"
            >
              <template #prepend>
                <v-icon>{{ entityOption.icon }}</v-icon>
              </template>
              <v-list-item-title class="text-capitalize">
                <span>{{ entityOption.displayName }}</span>
              </v-list-item-title>
                <v-list-item-subtitle class="">
                  {{ entityOption.descr }}
                </v-list-item-subtitle>
              
              <template #append>
                <v-icon v-if="entityType === entityOption.name">mdi-check</v-icon>
              </template>

            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>
  </span>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

import { getEntityConfig, getEntityConfigs } from '../entityConfigs';
import { url } from '@/url';

defineOptions({ name: 'EntityTypeSelector' });

defineProps({
  inline: Boolean
});

const route = useRoute();
const router = useRouter();

const { smAndDown } = useDisplay();

const isDialogOpen = ref(false);
const myId = 'my-id-' + Math.random().toString().replace('.', '');

const entityType = computed({
  get() {
    return route.params.entityType;
  },
  set(to) {
    url.pushToRoute(router, {
      name: 'Serp',
      params: { entityType: to }
    });
  }
});

const entityTypeOptions = computed(() => {
  return getEntityConfigs().filter(c => c.hasSerp);
});

const entityTypeConfig = computed(() => {
  return getEntityConfig(entityType.value);
});
</script>


<style lang="scss" scoped>
.card-button {
  background-color: rgba(0, 0, 0, 0.05) !important;

  &:hover {
    background-color: rgba(0, 0, 0, .08) !important;
  }

  &.selected {
    background-color: #444 !important;

  }
}
</style>