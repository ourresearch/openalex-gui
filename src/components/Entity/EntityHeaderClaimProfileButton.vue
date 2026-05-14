<template>
  <span v-if="showButton">
    <v-btn
      variant="text"
      rounded
      class="ml-3"
      @click="clickClaim"
    >
      Claim profile
    </v-btn>

    <!-- Logged-out users get an honest "under construction" message rather
         than a login CTA, since the actual claim flow doesn't reliably work
         for most users (only verified academic/gov domains auto-approve). -->
    <v-dialog rounded max-width="360" v-model="isUnderConstructionDialogOpen">
      <v-card rounded>
        <v-card-title>Claim profile</v-card-title>
        <div class="pa-4">
          This feature is under construction.
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            rounded
            variant="text"
            @click="isUnderConstructionDialogOpen = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      rounded
      max-width="640"
      v-model="isEvidenceDialogOpen"
      :persistent="isLoading"
    >
      <v-card rounded :loading="isLoading">
        <v-card-title>{{ resultMessage ? 'Claim submitted' : 'Claim this profile' }}</v-card-title>
        <div class="pa-4">
          <template v-if="resultMessage">
            <p>{{ resultMessage }}</p>
          </template>
          <template v-else>
            <p class="mb-3">
              Tell us why you are the author of this profile. Include a link to
              a faculty page, CV, ORCID, or similar so the team can verify.
            </p>
            <v-textarea
              v-model="evidence"
              :counter="2000"
              :rows="6"
              auto-grow
              placeholder="I am this author. See my faculty page at https://example.edu/~me which lists this OpenAlex profile."
              variant="outlined"
              hide-details="auto"
            />
            <div class="text-caption mt-1" :class="counterColor">
              {{ trimmedLength }} / 2000
            </div>
            <div v-if="errorMessage" class="text-error mt-2">
              {{ errorMessage }}
            </div>
          </template>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded
            variant="text"
            :disabled="isLoading"
            @click="closeEvidenceDialog"
          >
            {{ resultMessage ? 'Close' : 'Cancel' }}
          </v-btn>
          <v-btn
            v-if="!resultMessage"
            color="primary"
            rounded
            variant="text"
            :disabled="!canSubmit || isLoading"
            @click="submitClaim"
          >
            Submit claim
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase } from '@/apiConfig.js';

defineOptions({ name: 'EntityHeaderClaimProfileButton' });

const props = defineProps({
  authorId: { type: String, required: true },
});

const store = useStore();

const userId = computed(() => store.getters['user/userId']);
const hasAnyClaim = computed(() => store.getters['user/hasAnyClaim']);

const isUnderConstructionDialogOpen = ref(false);
const isEvidenceDialogOpen = ref(false);
const isLoading = ref(false);
const evidence = ref('');
const errorMessage = ref('');
const resultMessage = ref('');
const claimStatusKnown = ref(false);
const claimedByOther = ref(false);

// Strip HTML before counting so users don't game the 50-char minimum with tags.
const trimmedLength = computed(() => evidence.value.replace(/<[^>]*>/g, '').trim().length);
const canSubmit = computed(() => trimmedLength.value >= 50 && trimmedLength.value <= 2000);
const counterColor = computed(() => (canSubmit.value ? 'text-medium-emphasis' : 'text-error'));

const showButton = computed(() =>
  claimStatusKnown.value
  && !claimedByOther.value
  && !hasAnyClaim.value
);

async function fetchClaimStatus() {
  if (!props.authorId) return;
  claimStatusKnown.value = false;
  try {
    const resp = await axios.get(`${urlBase.userApi}/authors/${props.authorId}/claim-status`);
    claimedByOther.value = !!resp.data?.claimed;
  } catch (e) {
    claimedByOther.value = false;  // Fail open — better to show button than block.
  } finally {
    claimStatusKnown.value = true;
  }
}

onMounted(fetchClaimStatus);
watch(() => props.authorId, fetchClaimStatus);

function clickClaim() {
  errorMessage.value = '';
  resultMessage.value = '';
  evidence.value = '';
  if (!userId.value) {
    isUnderConstructionDialogOpen.value = true;
  } else {
    isEvidenceDialogOpen.value = true;
  }
}

function closeEvidenceDialog() {
  isEvidenceDialogOpen.value = false;
}

async function submitClaim() {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const data = await store.dispatch('user/setAuthorId', {
      authorId: props.authorId,
      evidence: evidence.value,
    });
    resultMessage.value = data?.message
      || (data?.auto_approved
        ? 'Claim accepted — this is now your profile.'
        : 'Thanks, your claim is being reviewed.');
  } catch (err) {
    const status = err?.response?.status;
    if (status === 409) {
      errorMessage.value = err?.response?.data?.message
        || 'This author is already claimed, or you already have a claim on file.';
    } else if (status === 400) {
      errorMessage.value = err?.response?.data?.message
        || 'Evidence must be 50–2000 characters after HTML is stripped.';
    } else {
      errorMessage.value = 'Could not submit claim. Please try again later.';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>


<style scoped lang="scss">
</style>
