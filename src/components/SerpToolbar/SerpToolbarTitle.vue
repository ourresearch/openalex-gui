<template>
  <div>
    <!-- you can only save works searches for now -->
    <div v-if="entityType === 'works'">
      <Button v-if="!userId" variant="ghost" @click="clickTitle">
        Unsaved search
        <ChevronDown class="h-4 w-4 ml-1" />
      </Button>
      <DropdownMenu v-else>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            {{ activeSearchObj?.name || "Unsaved search" }}
            <ChevronDown class="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <saved-search-menu
            :id="$route.query.id"
            @save="$emit('save')"
            @toggle-alert="$emit('toggle-alert')"
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <Dialog v-model:open="isLoginRequiredDialogOpen">
      <DialogContent class="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Login required</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          To save searches, please log in or sign up.
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="clickLogin">Log in</Button>
          <Button @click="clickSignup">Sign up</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <saved-search-save-dialog
      :is-open="isDialogOpen.saveSearch"
      @close="isDialogOpen.saveSearch = false"
    />

  </div>
</template>


<script setup>
import { ref, reactive, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { ChevronDown } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import SavedSearchSaveDialog from '@/components/SavedSearch/SavedSearchSaveDialog.vue';
import SavedSearchMenu from '@/components/SavedSearch/SavedSearchMenu.vue';

defineOptions({ name: 'SerpToolbarTitle' });

const store = useStore();
const route = useRoute();
const router = useRouter();

const isLoginRequiredDialogOpen = ref(false);
const isDialogOpen = reactive({
  saveSearch: false,
});

// Vuex getters
const entityType = computed(() => store.getters['entityType']);
const userId = computed(() => store.getters['user/userId']);
const activeSearchObj = computed(() => store.getters['user/activeSearchObj']);


// Vuex mutations
const setRenameId = (id) => store.commit('user/setRenameId', id);

// Methods
function clickLogin() {
  isLoginRequiredDialogOpen.value = false;
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
}

function clickSignup() {
  isLoginRequiredDialogOpen.value = false;
  router.push({ name: 'Signup', query: { redirect: route.fullPath } });
}

function clickTitle() {
  if (userId.value) {
    if (route.query.id) {
      setRenameId(route.query.id);
    } else {
      isDialogOpen.saveSearch = true;
    }
  } else {
    isLoginRequiredDialogOpen.value = true;
  }
}
</script>