<template>
  <span>
    <Button
      v-if="!userAuthorId"
      variant="ghost"
      class="ml-3"
      @click="clickClaim"
    >
      Claim profile
    </Button>
    <div
      v-if="userAuthorId && userAuthorId === authorId"
      class="ml-3 text-primary font-bold flex items-center"
      @click.alt="deleteAuthorId"
    >
      <BadgeCheck class="h-5 w-5 mr-1 text-primary" />
      claimed
    </div>

    <Dialog v-model:open="isLoginRequiredDialogOpen">
      <DialogContent class="max-w-[300px]">
        <div class="p-4">
          Please log in to claim this profile.
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="isLoginRequiredDialogOpen = false">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isConfirmDialogOpen">
      <DialogContent class="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{{ userAuthorId ? "Profile claimed" : "Claim this profile?" }}</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <template v-if="userAuthorId">
            <p class="mb-2">
              Congratulations, you've claimed your author profile!
            </p>
            <p>
              We've submitted your claim for moderation; once that's done (it may take a week or so), you'll be able to edit your profile.
            </p>
          </template>
          <template v-else>
            <p class="mb-2">
              This lets you remove works, or move new ones here from other profiles. You can only claim one profile, so claim the one that matches you best.
            </p>
            <p>
              Do you want to claim this author profile?
            </p>
          </template>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="isConfirmDialogOpen = false">
            {{ userAuthorId ? "Close" : "Cancel" }}
          </Button>
          <Button
            v-if="!userAuthorId"
            @click="doClaim"
            :disabled="isLoading"
          >
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            Yes, claim profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </span>
</template>


<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';

import { BadgeCheck, Loader2 } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

defineOptions({ name: 'EntityHeaderClaimProfileButton' });

const props = defineProps({
  authorId: String
});

const store = useStore();

// Vuex state
const userId = computed(() => store.getters['user/userId']);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);

// Local state
const isLoading = ref(false);
const isLoginRequiredDialogOpen = ref(false);
const isConfirmDialogOpen = ref(false);

// Vuex actions/mutations
const setAuthorId = (id) => store.dispatch('user/setAuthorId', id);
const deleteAuthorId = () => store.dispatch('user/deleteAuthorId');
const snackbar = (val) => store.commit('snackbar', val);

// Methods
const clickClaim = () => {
  if (!userId.value) {
    isLoginRequiredDialogOpen.value = true;
  } else {
    isConfirmDialogOpen.value = true;
  }
};

const doClaim = async () => {
  isLoading.value = true;
  await setAuthorId(props.authorId);
  isLoading.value = false;
};
</script>


<style scoped lang="scss">

</style>