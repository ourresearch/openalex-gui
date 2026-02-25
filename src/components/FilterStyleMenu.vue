<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menuProps }">
      <v-btn icon variant="text" size="small" v-bind="menuProps">
        <v-icon size="18" color="grey-darken-1">mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-subheader>Filter style</v-list-subheader>
      <v-list-item @click="$emit('set-mode', 'basic')">
        <v-list-item-title>Basic</v-list-item-title>
        <template #append>
          <v-icon v-if="filterMode === 'basic'">mdi-check</v-icon>
        </template>
      </v-list-item>
      <v-list-item @click="$emit('set-mode', 'advanced')">
        <v-list-item-title>Advanced</v-list-item-title>
        <template #append>
          <v-icon v-if="filterMode === 'advanced'">mdi-check</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
defineOptions({ name: 'FilterStyleMenu' });
defineProps({ filterMode: String });
defineEmits(['set-mode']);
</script>
