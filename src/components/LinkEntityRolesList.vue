<template>
  <span>
    <v-menu>
      <template v-slot:activator="{props: menuProps}">
        <v-btn
          variant="text"
          rounded
          class="font-weight-regular"
          v-bind="menuProps"
        >
          <template #prepend>
            <v-icon>{{ selectedRoleConfig.icon }}</v-icon>
          </template>
          {{ filters.capitalize(selectedRoleConfig.nameSingular) }}
          <template #append>
            <v-icon>mdi-menu-down</v-icon>
          </template>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="role in rolesToShow"
          :key="role.id"
          :to="filters.entityZoomLink(role.id)"
        >
          <template #prepend>
            <v-icon>{{ getEntityConfig(role.role).icon }}</v-icon>
          </template>
          <v-list-item-title>{{ role.role }}</v-list-item-title>
          <template #append>
            <v-icon v-if="role.role === selected">mdi-check</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </span>
</template>

<script setup>
import { computed } from 'vue';

import filters from '@/filters';
import { getEntityConfig } from '@/entityConfigs';

defineOptions({ name: 'LinkEntityRolesList' });

// Props
const { roles, hideRole, selected } = defineProps({
  roles: Array,
  hideRole: String,
  selected: String
});

const rolesToShow = computed(() => {
  return roles.filter(r => r.role !== hideRole);
});

const selectedRoleConfig = computed(() => {
  return getEntityConfig(selected);
});

</script>