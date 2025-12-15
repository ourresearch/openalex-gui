<template>
  <div>
    <!-- Test tube icon button (shown when Walden is NOT active) -->
    <Button
      v-if="!isWaldenActive"
      variant="ghost"
      size="icon"
      @click="handleTestTubeClick"
    >
      <TestTube class="h-5 w-5" />
    </Button>

    <!-- Orange Walden label (shown when Walden IS active) -->
    <Badge
      v-else
      class="walden-chip bg-orange-500 text-white cursor-pointer px-3 py-1"
      @click="showDeactivateDialog = true"
    >
      <TestTube class="h-3 w-3 mr-1" />
      Walden
      <X
        class="h-3 w-3 ml-1 cursor-pointer"
        @click.stop="deactivateWalden"
      />
    </Badge>

    <!-- Dialog -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="text-xl mb-2">Use Walden Data?</DialogTitle>
        </DialogHeader>
        <Alert class="mb-4">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            <strong>Caution:</strong> This feature is in beta; there will be errors.
          </AlertDescription>
        </Alert>
        <div class="py-2">
          <p class="mb-3">
            We're <a target="_blank" href="https://blog.openalex.org/were-rebuilding-openalex-while-its-running-heres-whats-changing/" class="text-primary underline">rolling out a new version of OpenAlex</a> codenamed <a target="_blank" href="https://www.reddit.com/r/minimalism/comments/3h7ot4/a_passage_from_henry_david_thoreaus_walden/" class="text-primary underline">Walden</a>. It's based on a fully rewritten codebase and adds over 100M new works. Walden is in beta through October 2025.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="showDialog = false">Cancel</Button>
          <Button @click="activateWalden">Use Walden data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Deactivation Dialog -->
    <Dialog v-model:open="showDeactivateDialog">
      <DialogContent class="max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="text-xl mb-2">Using Walden data</DialogTitle>
        </DialogHeader>
        <Alert class="mb-4">
          <InfoIcon class="h-4 w-4" />
          <AlertDescription>
            You're currently using Walden beta data.
          </AlertDescription>
        </Alert>
        <div class="py-2">
          <p class="mb-3">
            We're <a target="_blank" href="https://blog.openalex.org/were-rebuilding-openalex-while-its-running-heres-whats-changing/" class="text-primary underline">rolling out a new version of OpenAlex</a> codenamed <a target="_blank" href="https://www.reddit.com/r/minimalism/comments/3h7ot4/a_passage_from_henry_david_thoreaus_walden/" class="text-primary underline">Walden</a>. It's based on a fully rewritten codebase and adds over 100M new works. Walden is in beta through October 2025.
          </p>
          <p>
            You're using Walden data right now, but you can switch back to standard data any time.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="showDeactivateDialog = false">Cancel</Button>
          <Button @click="deactivateWaldenFromDialog">Go back to standard data</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

import { TestTube, X, AlertTriangle, Info as InfoIcon } from 'lucide-vue-next';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

const store = useStore();
const router = useRouter();
const route = useRoute();

const showDialog = ref(false);
const showDeactivateDialog = ref(false);

const isWaldenActive = computed(() => store.state.useV2);

const handleTestTubeClick = (event) => {
  // If Cmd (Mac) or Ctrl (Windows/Linux) is pressed, activate immediately
  if (event.metaKey || event.ctrlKey) {
    activateWalden();
  } else {
    // Otherwise, show the dialog
    showDialog.value = true;
  }
};

const activateWalden = () => {
  // Close dialog
  showDialog.value = false;
  
  // Update store
  store.commit('setUseV2', true);
  
  // Update URL with data-version parameter
  const query = { ...route.query, 'data-version': '2' };
  router.replace({ 
    name: route.name,
    params: route.params,
    query 
  });
};

const deactivateWalden = () => {
  // Update store
  store.commit('setUseV2', false);
  
  // Remove data-version parameter from URL
  const query = { ...route.query };
  delete query['data-version'];
  router.replace({ 
    name: route.name,
    params: route.params,
    query 
  });
};

const deactivateWaldenFromDialog = () => {
  // Close dialog
  showDeactivateDialog.value = false;
  
  // Deactivate Walden
  deactivateWalden();
};
</script>

<style scoped>
.walden-chip {
  font-weight: 600;
}
</style>
