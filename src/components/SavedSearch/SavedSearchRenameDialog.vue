<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Rename saved search</DialogTitle>
      </DialogHeader>
      <div class="py-4">
        <Input
          autofocus
          placeholder="New name"
          v-model="renameString"
          @keydown.enter="rename"
          class="w-full"
        />
        <p class="text-xs text-muted-foreground mt-1">{{ renameString.length }}/25 characters</p>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="isOpen = false">Cancel</Button>
        <Button @click="rename" :disabled="isLoading">
          <span v-if="isLoading" class="animate-spin mr-2">⏳</span>
          Rename
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';

defineOptions({ name: 'SavedSearchRenameDialog' });

defineProps({
  id: String,
});

const store = useStore();

const renameString = ref('');
const isLoading = ref(false);

const renameId = computed(() => store.getters['user/renameId']);

const isOpen = computed({
  get() {
    return !!renameId.value;
  },
  set(val) {
    store.commit('user/setRenameId', val);
  },
});

const updateSearchName = (payload) => store.dispatch('user/updateSearchName', payload);

async function rename() {
  console.log('rename search', renameId.value, renameString.value);
  isLoading.value = true;
  await updateSearchName({ id: renameId.value, name: renameString.value });
  renameString.value = '';
  isLoading.value = false;
  isOpen.value = false;
}
</script>