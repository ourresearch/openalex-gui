<template>
  <SettingsSection title="Danger zone">
    <SettingsRow
      label="Delete user"
      description="Permanently remove this user and all their data"
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
        <DialogTitle>Delete User?</DialogTitle>
      </DialogHeader>
      <div class="py-4">This action can't be undone.</div>
      <DialogFooter>
        <Button variant="ghost" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</Button>
        <Button 
          variant="destructive"
          @click="deleteUser" 
          :disabled="deleteLoading"
        >
          <Loader2 v-if="deleteLoading" class="h-4 w-4 mr-2 animate-spin" />
          Delete User
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
