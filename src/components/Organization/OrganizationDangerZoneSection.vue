<template>
  <SettingsSection title="Danger zone">
    <SettingsRow
      label="Delete organization"
      description="Permanently delete this organization. Members will be unlinked but not deleted."
    >
      <Button variant="ghost" class="text-destructive" @click="openDeleteDialog">
        Delete
      </Button>
    </SettingsRow>
  </SettingsSection>

  <!-- Delete Confirmation Dialog -->
  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent class="max-w-[400px]">
      <DialogHeader>
        <DialogTitle>Delete Organization?</DialogTitle>
      </DialogHeader>
      <div class="py-4">
        This action cannot be undone. All members will be unlinked from this organization.
      </div>
      <DialogFooter>
        <Button variant="ghost" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</Button>
        <Button 
          variant="destructive"
          @click="deleteOrganization" 
          :disabled="deleteLoading"
        >
          <Loader2 v-if="deleteLoading" class="h-4 w-4 mr-2 animate-spin" />
          Delete Organization
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
