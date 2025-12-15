<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-[300px]">
      <template v-if="userId">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <BellMinus v-if="hasAlert" class="h-5 w-5" />
            <BellPlus v-else class="h-5 w-5" />
            {{ hasAlert ? "Remove alert?" : "Create alert?" }}
          </DialogTitle>
          <DialogDescription>
            <template v-if="hasAlert">
              You'll no longer get emails when new results appear in this search.
            </template>
            <template v-else>
              You'll get an email when new results appear in this search.
            </template>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isOpen = false">Cancel</Button>
          <Button @click="toggleAlerts" :disabled="isLoading">
            {{ hasAlert ? "Remove alert" : "Create alert"}}
          </Button>
        </DialogFooter>
      </template>
      <template v-else>
        <DialogHeader>
          <DialogTitle>Login required</DialogTitle>
          <DialogDescription>
            You have to login to edit alerts.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" as="router-link" to="/login">Log in</Button>
          <Button as="router-link" to="/signup">Sign up</Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { BellMinus, BellPlus } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';

defineOptions({ name: 'SavedSearchEditAlertDialog' });

const store = useStore();

const isLoading = ref(false);

const userId = computed(() => store.getters['user/userId']);
const editAlertId = computed(() => store.getters['user/editAlertId']);
const userSavedSearches = computed(() => store.getters['user/userSavedSearches']);

const isOpen = computed({
  get() {
    return !!editAlertId.value;
  },
  set(to) {
    store.commit('user/setEditAlertId', to);
  },
});

const hasAlert = computed(() => {
  return userSavedSearches.value.find(s => s.id === editAlertId.value)?.has_alert;
});

const updateSearchAlert = (payload) => store.dispatch('user/updateSearchAlert', payload);

async function toggleAlerts() {
  isLoading.value = true;
  console.log('toggle alerts', editAlertId.value);
  await updateSearchAlert({
    id: editAlertId.value,
    has_alert: !hasAlert.value,
  });
  isLoading.value = false;
  isOpen.value = false;
}
</script>


<style scoped>
/* Minimal scoped styles */
</style>