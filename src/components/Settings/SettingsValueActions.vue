<template>
  <!-- The right side of a settings row whose value can be set (oxjob #1475).
       One fixed width in every state, so stacked rows line up whether each is
       set or not. Unset: the default slot (a full-width button). Set: "✓ Linked"
       plus a ⋮ menu (Copy, Open, then the red undo), shaped like the Emails
       rows' menu; the undo asks first, in a dialog. -->
  <div class="value-control">
    <slot v-if="!isSet" />
    <template v-else>
      <v-chip size="small" color="success" variant="tonal" label prepend-icon="mdi-check" class="value-badge">
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
    </template>

    <v-dialog v-model="confirming" max-width="420" :persistent="busy">
      <v-card rounded>
        <v-card-title>{{ confirmTitle }}</v-card-title>
        <v-card-text>{{ confirmBody }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn rounded variant="text" :disabled="busy" @click="confirming = false">Cancel</v-btn>
          <v-btn rounded variant="flat" color="error" :loading="busy" @click="$emit('remove')">
            {{ removeLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';

defineOptions({ name: 'SettingsValueActions' });

const props = defineProps({
  isSet: { type: Boolean, required: true },
  label: { type: String, required: true },        // the row's name, for the menu's aria-label
  badge: { type: String, default: '' },           // Linked | Claimed
  value: { type: String, default: '' },           // what Copy puts on the clipboard
  copyLabel: { type: String, default: '' },
  openLabel: { type: String, default: '' },
  openHref: { type: String, default: undefined }, // another site, new tab
  openTo: { type: String, default: undefined },   // a page in the app
  removeLabel: { type: String, default: '' },
  confirmTitle: { type: String, default: '' },
  confirmBody: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
defineEmits(['remove']);

const store = useStore();
const confirming = ref(false);
// The parent clears `busy` when the undo finishes: close the dialog then.
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
/* One width for every state of every row: fits "✓ Claimed" + ⋮ and "Link ORCID". */
.value-control {
  width: 150px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.value-badge {
  flex: 1;
  justify-content: center;
}
.value-control :deep(.v-btn--block) {
  text-transform: none;
  letter-spacing: normal;
}
</style>
