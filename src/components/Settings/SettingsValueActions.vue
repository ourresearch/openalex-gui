<template>
  <!-- A set value's state and actions (oxjob #1475): "✓ Linked" plus a ⋮ menu
       (Copy, Open, then the red undo), shaped like the Emails rows' menu.
       The undo asks first, in the row: no browser dialog. -->
  <div v-if="confirming" class="value-actions text-body-2">
    <span>{{ confirmText }}</span>
    <v-btn size="small" variant="text" class="settings-action" :disabled="busy" @click="confirming = false">
      Cancel
    </v-btn>
    <v-btn size="small" variant="flat" rounded color="error" :loading="busy" @click="$emit('remove')">
      {{ removeLabel }}
    </v-btn>
  </div>
  <div v-else class="value-actions">
    <v-chip size="small" color="success" variant="tonal" label prepend-icon="mdi-check">
      {{ badge }}
    </v-chip>
    <v-menu location="bottom end">
      <template v-slot:activator="{ props: menuProps }">
        <v-btn icon variant="plain" size="small" v-bind="menuProps" :aria-label="`${label} actions`">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>
      <v-list density="compact" min-width="200">
        <v-list-item @click="copy">
          <v-list-item-title>{{ copyLabel }}</v-list-item-title>
        </v-list-item>
        <v-list-item :href="openHref" :to="openTo" :target="openHref ? '_blank' : undefined">
          <v-list-item-title>{{ openLabel }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="confirming = true">
          <v-list-item-title class="text-error">{{ removeLabel }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'SettingsValueActions' });

const props = defineProps({
  label: { type: String, required: true },       // the row's name, for the menu's aria-label
  badge: { type: String, required: true },       // Linked | Claimed
  value: { type: String, required: true },       // what Copy puts on the clipboard
  copyLabel: { type: String, required: true },
  openLabel: { type: String, required: true },
  openHref: { type: String, default: undefined }, // another site, new tab
  openTo: { type: String, default: undefined },   // a page in the app
  removeLabel: { type: String, required: true },
  confirmText: { type: String, required: true },
  busy: { type: Boolean, default: false },
});
defineEmits(['remove']);

const store = useStore();
const confirming = ref(false);
// The parent clears `busy` when the undo finishes: close the confirm then.
watch(() => props.busy, (now, before) => { if (before && !now) confirming.value = false; });

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value);
    store.commit('snackbar', 'Copied');
  } catch (e) {
    store.commit('snackbar', 'Could not copy');
  }
}
</script>

<style scoped>
.value-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
