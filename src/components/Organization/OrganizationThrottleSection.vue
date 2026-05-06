<template>
  <SettingsSection title="Rate throttle">
    <SettingsRow
      label="Throttled"
      description="When on, all of this organization's API keys share a single 1 request per second budget. Distinct from the 'throttled' plan (daily zero-cap)."
    >
      <v-switch
        v-model="throttled"
        :loading="saving"
        :disabled="saving"
        color="error"
        density="compact"
        hide-details
        inset
        @update:model-value="onChange"
      />
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  organization: { type: Object, required: true }
});
const emit = defineEmits(['updated']);
const store = useStore();

const saving = ref(false);
const throttled = ref(false);

watch(() => props.organization?.rate_throttled, (v) => {
  throttled.value = !!v;
}, { immediate: true });

async function onChange(newValue) {
  if (newValue === !!props.organization?.rate_throttled) return;
  saving.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { rate_throttled: newValue },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', newValue ? 'Organization throttled' : 'Organization unthrottled');
    emit('updated');
  } catch (e) {
    console.error('Failed to update rate_throttled:', e);
    store.commit('snackbar', 'Failed to update throttle');
    throttled.value = !!props.organization?.rate_throttled;
  } finally {
    saving.value = false;
  }
}
</script>
