<template>
  <div>
    <!-- Test tube icon button (shown when Walden is NOT active) -->
    <v-btn
      v-if="!isWaldenActive"
      icon
      variant="plain"
      @click="handleTestTubeClick"
    >
      <v-icon>mdi-test-tube</v-icon>
    </v-btn>

    <!-- Orange Walden label (shown when Walden IS active) -->
    <v-chip
      v-else
      color="orange"
      variant="flat"
      class="walden-chip"
      @click="showDeactivateDialog = true"
      style="cursor: pointer;"
    >
      <v-icon start size="small">mdi-test-tube</v-icon>
      Walden
      <v-icon
        end
        size="small"
        @click.stop="deactivateWalden"
        style="cursor: pointer;"
      >
        mdi-close
      </v-icon>
    </v-chip>

    <!-- Dialog -->
    <v-dialog v-model="showDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 mb-2">
          Use Walden Data?
        </v-card-title>
        <v-alert
            type="warning"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            <strong>Caution:</strong> This feature is in beta; there will be errors.
          </v-alert>
        <v-card-text>
          
          
          <p class="mb-3">
            We're <a target="_blank" href="https://blog.openalex.org/were-rebuilding-openalex-while-its-running-heres-whats-changing/">rolling out a new version of OpenAlex</a> codenamed <a target="_blank" href="https://www.reddit.com/r/minimalism/comments/3h7ot4/a_passage_from_henry_david_thoreaus_walden/">Walden</a>. It's based on a fully rewritten codebase and adds over 100M new works. Walden is in beta through October 2025.
          </p>
          
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="activateWalden"
          >
            Use Walden data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Deactivation Dialog -->
    <v-dialog v-model="showDeactivateDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h5 mb-2">
          Using Walden data
        </v-card-title>
        <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            density="compact"
          >
            You're currently using Walden beta data.
          </v-alert>
        <v-card-text>
          
          <p class="mb-3">
            We're <a target="_blank" href="https://blog.openalex.org/were-rebuilding-openalex-while-its-running-heres-whats-changing/">rolling out a new version of OpenAlex</a> codenamed <a target="_blank" href="https://www.reddit.com/r/minimalism/comments/3h7ot4/a_passage_from_henry_david_thoreaus_walden/">Walden</a>. It's based on a fully rewritten codebase and adds over 100M new works. Walden is in beta through October 2025.
          </p>
          <p>
            You're using Walden data right now, but you can switch back to standard data any time.
          </p>
          
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeactivateDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="deactivateWaldenFromDialog"
          >
            Go back to standard data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

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
  
  // Update URL with v2 parameter
  const query = { ...route.query, v2: true };
  router.replace({ ...route, query });
};

const deactivateWalden = () => {
  // Update store
  store.commit('setUseV2', false);
  
  // Remove v2 parameter from URL
  const query = { ...route.query };
  delete query.v2;
  router.replace({ ...route, query });
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
