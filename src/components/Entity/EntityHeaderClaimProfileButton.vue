<template>
  <span v-if="showClaimedBadge">
    <v-tooltip location="bottom" text="A user has claimed this profile">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          color="primary"
          size="large"
        >
          mdi-check-decagram
        </v-icon>
      </template>
    </v-tooltip>
  </span>
  <span v-else-if="showButton">
    <v-tooltip location="bottom" text="Take ownership of this author profile">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-btn
          v-bind="tooltipProps"
          variant="outlined"
          rounded
          size="small"
          @click="clickClaim"
        >
          Claim
        </v-btn>
      </template>
    </v-tooltip>

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
      max-width="960"
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
            <v-row>
              <v-col cols="12" md="5" class="text-body-2">
                <p class="mb-3">
                  How can we know you're the author described in this profile?
                  Ideally include a link to something which shows both:
                </p>
                <ol class="mb-3 ml-5">
                  <li>your verified OpenAlex account email, and</li>
                  <li>the name on this author profile.</li>
                </ol>
                <p class="mb-3">Examples:</p>
                <ul class="mb-3 ml-5">
                  <li>A departmental webpage that shows your email and name</li>
                  <li>A paper that shows your email and name</li>
                </ul>
                <p class="mb-3">
                  If you don't have that, include links to whatever you think
                  makes the case best.
                </p>
                <p class="text-medium-emphasis">
                  Sorry for the friction — we want to make sure no one but you
                  claims your profile. We usually decide within a few days.
                </p>
              </v-col>
              <v-col cols="12" md="7">
                <v-textarea
                  v-model="evidence"
                  :counter="2000"
                  :rows="12"
                  auto-grow
                  :placeholder="evidencePlaceholder"
                  variant="outlined"
                  hide-details="auto"
                />
                <div class="text-caption mt-1" :class="counterColor">
                  {{ trimmedLength }} / 2000
                </div>
                <div v-if="errorMessage" class="text-error mt-2">
                  {{ errorMessage }}
                </div>
              </v-col>
            </v-row>
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
const userEmail = computed(() => store.getters['user/userEmail']);
const hasAnyClaim = computed(() => store.getters['user/hasAnyClaim']);

const evidencePlaceholder = computed(() => {
  const email = userEmail.value || 'me@example.com';
  return `See my name and OpenAlex account email (${email}) here on my departmental webpage: https://example.edu/~me`;
});

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

const showClaimedBadge = computed(() =>
  claimStatusKnown.value && claimedByOther.value
);
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
