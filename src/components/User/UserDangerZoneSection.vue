<template>
  <SettingsSection title="Danger zone">
    <SettingsRow
      label="Delete user"
      description="Permanently remove this user and all their data"
    >
      <v-btn variant="text" class="settings-action text-error" @click="openDeleteDialog">
        Delete
      </v-btn>
    </SettingsRow>
  </SettingsSection>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialogOpen" max-width="400">
    <v-card :loading="deleteLoading" :disabled="deleteLoading" flat rounded>
      <v-card-title>Delete User?</v-card-title>
      <v-card-text>This action can't be undone.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</v-btn>
        <v-btn 
          color="error"
          variant="flat"
          @click="deleteUser" 
          :disabled="deleteLoading"
        >
          Delete User
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

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

const emit = defineEmits(['deleted']);

const store = useStore();
const router = useRouter();

const deleteDialogOpen = ref(false);
const deleteLoading = ref(false);

function openDeleteDialog() {
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
}

async function deleteUser() {
  deleteLoading.value = true;
  
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${props.user.id}`,
      axiosConfig({ userAuth: true })
    );
    
    closeDeleteDialog();
    store.commit('snackbar', 'User deleted');
    emit('deleted');
    router.push(props.redirectTo);
  } catch (e) {
    console.error('Failed to delete user:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to delete user');
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
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
