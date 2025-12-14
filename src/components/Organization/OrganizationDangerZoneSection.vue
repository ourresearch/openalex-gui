<template>
  <SettingsSection title="Danger zone">
    <SettingsRow
      label="Delete organization"
      description="Permanently delete this organization. Members will be unlinked but not deleted."
    >
      <v-btn variant="text" class="settings-action text-error" @click="openDeleteDialog">
        Delete
      </v-btn>
    </SettingsRow>
  </SettingsSection>

  <!-- Delete Confirmation Dialog -->
  <v-dialog v-model="deleteDialogOpen" max-width="400">
    <v-card :loading="deleteLoading" :disabled="deleteLoading" flat rounded>
      <v-card-title>Delete Organization?</v-card-title>
      <v-card-text>
        This action cannot be undone. All members will be unlinked from this organization.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</v-btn>
        <v-btn 
          color="error"
          variant="flat"
          @click="deleteOrganization" 
          :disabled="deleteLoading"
        >
          Delete Organization
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
  organization: {
    type: Object,
    required: true
  },
  redirectTo: {
    type: String,
    default: '/admin/organizations'
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

async function deleteOrganization() {
  deleteLoading.value = true;
  
  try {
    await axios.delete(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      axiosConfig({ userAuth: true })
    );
    
    closeDeleteDialog();
    store.commit('snackbar', 'Organization deleted');
    emit('deleted');
    router.push(props.redirectTo);
  } catch (e) {
    console.error('Failed to delete organization:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to delete organization');
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
