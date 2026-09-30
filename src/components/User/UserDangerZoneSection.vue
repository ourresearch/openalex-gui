<template>
  <SettingsSection title="Danger zone">
    <SettingsRow
      label="Throttled"
      description="When on, this user's API key is limited to 1 request per second. Distinct from the 'throttled' plan (daily zero-cap)."
    >
      <v-switch
        v-model="throttled"
        :loading="throttleSaving"
        :disabled="throttleSaving"
        color="error"
        density="compact"
        hide-details
        inset
        @update:model-value="onThrottleChange"
      />
    </SettingsRow>

    <SettingsRow
      label="Delete user"
      description="Permanently remove this user, all their data, and all their curations"
    >
      <v-btn variant="text" class="settings-action text-error" @click="openDeleteDialog">
        Delete
      </v-btn>
    </SettingsRow>
  </SettingsSection>

  <DeleteAccountDialog v-model="deleteDialogOpen" :user-id="user.id" @deleted="onDeleted" />
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import DeleteAccountDialog from '@/components/User/DeleteAccountDialog.vue';

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  redirectTo: {
    type: String,
    default: '/admin/users'
  }
});

const emit = defineEmits(['deleted', 'updated']);

const store = useStore();
const router = useRouter();

const deleteDialogOpen = ref(false);

const throttled = ref(false);
const throttleSaving = ref(false);

watch(() => props.user?.rate_throttled, (v) => {
  throttled.value = !!v;
}, { immediate: true });

async function onThrottleChange(newValue) {
  if (newValue === !!props.user?.rate_throttled) return;
  throttleSaving.value = true;
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${props.user.id}`,
      { rate_throttled: newValue },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', newValue ? 'User throttled' : 'User unthrottled');
    emit('updated');
  } catch (e) {
    console.error('Failed to update rate_throttled:', e);
    store.commit('snackbar', 'Failed to update throttle');
    throttled.value = !!props.user?.rate_throttled;
  } finally {
    throttleSaving.value = false;
  }
}

function openDeleteDialog() {
  deleteDialogOpen.value = true;
}

function onDeleted(resp) {
  const n = resp?.deleted_curations || 0;
  store.commit('snackbar', n ? `User deleted, with ${n.toLocaleString()} curations` : 'User deleted');
  emit('deleted');
  router.push(props.redirectTo);
}
</script>

<style scoped>
.settings-action {
  text-transform: none;
  font-weight: 500;
  padding: 0 8px;
  min-width: auto;
  height: auto;
}
</style>
