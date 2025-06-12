<template>
  <span>
    <slot v-if="!active"></slot>
    <div v-else class="hover-menu-wrapper">
      <v-menu
        v-model="showMenu"
        :close-on-content-click="false"
        :open-on-hover="true"
        :close-delay="300"
        :open-delay="300"
        location="bottom"
        width="auto"
        :offset="[0, 4]"
        max-width="auto"
        content-class="auto-width-menu"
      >
        <template v-slot:activator="{ props }">
          <span v-bind="props">
            <slot></slot>
          </span>
        </template>
        <v-list density="compact" class="compact-menu py-0">
          <v-list-item @click="$emit('action-click')" density="compact" class="py-1 px-2">
            <template #prepend>
              <v-icon size="small" class="centered-icon mr-2 ml-0 my-0 pa-0" style="min-width: 24px;">
                {{ actionIcon }}
              </v-icon>
            </template>
            <v-list-item-title class="text-body-2 pr-2">{{ actionText }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </span>
</template>

<script setup>
import { ref } from 'vue';

defineOptions({ name: 'HoverMenuWrapper' });

const props = defineProps({
  active: Boolean,
  actionText: {
    type: String,
    default: 'Remove Filter'
  },
  actionIcon: {
    type: String,
    default: 'mdi-close'
  }
});

const showMenu = ref(false);
</script>

<style scoped>
.hover-menu-wrapper {
  display: inline-block;
}

.compact-menu {
  min-width: 0 !important;
}

.compact-menu .v-list-item {
  min-height: 24px !important;
}

/* Override Vuetify's default padding */
:deep(.v-menu__content) {
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
}

/* Make menu only as wide as its content */
:deep(.auto-width-menu) {
  width: auto !important;
  display: inline-block !important;
}

:deep(.v-list) {
  width: auto !important;
  white-space: nowrap !important;
}

:deep(.v-list-item__icon) {
  margin: 0 !important;
  padding: 0 !important;
}

:deep(.v-list-item__content) {
  padding: 0 !important;
}

.centered-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
