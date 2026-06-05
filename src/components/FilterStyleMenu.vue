<template>
  <v-menu location="bottom end">
    <template #activator="{ props: menuProps }">
      <v-btn icon variant="text" size="small" v-bind="menuProps">
        <v-icon size="18" color="grey-darken-1">mdi-dots-vertical</v-icon>
      </v-btn>
    </template>
    <v-list density="compact">
      <v-list-subheader>Filter style</v-list-subheader>
      <!-- Basic is disabled when the current query can't be shown as chips
           (#353 round 4): a repeated field, an un-chip-able field, or a negated
           entity/range. A tooltip explains why instead of leaving it a dead item. -->
      <v-tooltip location="start" :disabled="!basicDisabled" text="This search is too complex for basic filters — it uses options the chips can't show (e.g. the same filter more than once, or a custom field).">
        <template #activator="{ props: tipProps }">
          <div v-bind="tipProps">
            <v-list-item :disabled="basicDisabled" @click="!basicDisabled && $emit('set-mode', 'basic')">
              <v-list-item-title>Basic</v-list-item-title>
              <template #append>
                <v-icon v-if="filterMode === 'basic'">mdi-check</v-icon>
              </template>
            </v-list-item>
          </div>
        </template>
      </v-tooltip>
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
defineProps({
  filterMode: String,
  basicDisabled: { type: Boolean, default: false },
});
defineEmits(['set-mode']);
</script>
