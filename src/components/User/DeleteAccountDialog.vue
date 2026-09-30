<template>
  <v-dialog v-model="open" max-width="440">
    <v-card :loading="deleteLoading" :disabled="deleteLoading" flat rounded>
      <v-card-title>{{ selfService ? 'Delete your account?' : 'Delete user?' }}</v-card-title>
      <v-card-text>
        <p class="mb-3">
          <template v-if="selfService">
            This permanently deletes your OpenAlex account, your API key, and your saved searches and collections.
          </template>
          <template v-else>
            This permanently deletes this user and all their data.
          </template>
        </p>
        <p v-if="countLoading" class="text-medium-emphasis">Counting curations…</p>
        <p v-else-if="curationCount === null" class="font-weight-bold">
          {{ selfService ? 'Any curations you made' : 'Any curations they made' }}
          will also be deleted, and the changes they made to OpenAlex will be undone.
        </p>
        <p v-else-if="curationCount > 0" class="font-weight-bold">
          This will also delete {{ selfService ? 'your' : 'their' }}
          {{ curationCount.toLocaleString() }} {{ curationCount === 1 ? 'curation' : 'curations' }},
          and the changes {{ curationCount === 1 ? 'it' : 'they' }} made to OpenAlex will be undone.
        </p>
        <p class="mt-3">This can't be undone.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false" :disabled="deleteLoading">Cancel</v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="deleteAccount"
          :disabled="deleteLoading || countLoading"
        >
          {{ selfService ? 'Delete account' : 'Delete user' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'DeleteAccountDialog' });

// Deleting an account also deletes every curation it made (oxjob #1436),
// so the dialog fetches that count first and says so.
const props = defineProps({
  userId: { type: String, required: true },
  selfService: { type: Boolean, default: false },
});

const emit = defineEmits(['deleted']);
const open = defineModel({ type: Boolean, default: false });

const store = useStore();

const curationCount = ref(null);
const countLoading = ref(false);
const deleteLoading = ref(false);

watch(open, async (isOpen) => {
  if (!isOpen) return;
  curationCount.value = null;
  countLoading.value = true;
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/users/${props.userId}/curations?per_page=1`,
      axiosConfig({ userAuth: true })
    );
    curationCount.value = resp.data?.meta?.total_count ?? null;
  } catch (e) {
    console.error('Failed to count curations:', e);
    curationCount.value = null;
  } finally {
    countLoading.value = false;
  }
});

async function deleteAccount() {
  deleteLoading.value = true;
  try {
    const resp = await axios.delete(
      `${urlBase.userApi}/users/${props.userId}`,
      axiosConfig({ userAuth: true })
    );
    open.value = false;
    emit('deleted', resp.data);
  } catch (e) {
    console.error('Failed to delete account:', e);
    store.commit('snackbar', e?.response?.data?.message || 'Failed to delete account');
    open.value = false;
  } finally {
    deleteLoading.value = false;
  }
}
</script>
