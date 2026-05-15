<template>
  <span>
    <!-- Claimed (approved) by another user -->
    <v-tooltip v-if="showClaimedBadge" location="bottom" :text="claimedTooltip">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          color="primary"
          size="large"
          :class="{ 'admin-claim-link': adminCanOpen }"
          @click="adminCanOpen ? openClaimerAdmin() : null"
        >
          mdi-check-decagram
        </v-icon>
      </template>
    </v-tooltip>

    <!-- This user's claim for this profile is awaiting review -->
    <v-tooltip
      v-else-if="showPendingBadge"
      location="bottom"
      text="Your claim is under review"
    >
      <template v-slot:activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          color="warning"
          variant="flat"
          size="small"
          label
        >
          Claim pending
        </v-chip>
      </template>
    </v-tooltip>

    <!-- Unclaimed — offer the Claim button -->
    <v-tooltip
      v-else-if="showButton"
      location="bottom"
      text="Take ownership of this author profile"
    >
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
      max-width="560"
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
            <p class="mb-2 text-body-2">
              To prove you're this author, please link to a webpage or paper
              that includes both
            </p>
            <ol class="mb-3 ml-5 text-body-2">
              <li>your OpenAlex account email ({{ userEmail }}), and</li>
              <li>the name on this author profile.</li>
            </ol>
            <v-textarea
              v-model="evidence"
              :rows="5"
              auto-grow
              maxlength="2000"
              :placeholder="evidencePlaceholder"
              variant="outlined"
              hide-details="auto"
            />
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
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig.js';

defineOptions({ name: 'EntityHeaderClaimProfileButton' });

const props = defineProps({
  authorId: { type: String, required: true },
});

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const userEmail = computed(() => store.getters['user/userEmail']);
const hasAnyClaim = computed(() => store.getters['user/hasAnyClaim']);
const pendingClaim = computed(() => store.getters['user/pendingClaim']);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const claimedByUser = ref(null);

const evidencePlaceholder = "here's my departmental webpage: example.edu/~me";

const isUnderConstructionDialogOpen = ref(false);
const isEvidenceDialogOpen = ref(false);
const isLoading = ref(false);
const evidence = ref('');
const errorMessage = ref('');
const resultMessage = ref('');
const claimStatusKnown = ref(false);
const claimedByOther = ref(false);
// A pending (submitted, not-yet-approved) claim by ANYONE on this author.
const pendingByAnyone = ref(false);

// No minimum length; just require non-empty (after stripping any tags) and
// within the 2000-char cap.
const trimmedLength = computed(() => evidence.value.replace(/<[^>]*>/g, '').trim().length);
const canSubmit = computed(() => trimmedLength.value > 0 && trimmedLength.value <= 2000);

const showClaimedBadge = computed(() =>
  claimStatusKnown.value && claimedByOther.value
);
// Only site admins get a clickable badge that deep-links to the claimant's
// admin record; everyone else sees a plain, non-interactive indicator.
const adminCanOpen = computed(() =>
  showClaimedBadge.value && isAdmin.value && !!claimedByUser.value?.user_id
);
const claimedTooltip = computed(() =>
  adminCanOpen.value
    ? `Claimed by ${claimedByUser.value.display_name || claimedByUser.value.email || 'a user'} — open admin`
    : 'A user has claimed this profile'
);
// Compare OpenAlex ids regardless of URL shape / casing
// (https://openalex.org/A123, https://openalex.org/authors/a123, A123 …).
const shortId = (x) => (x || '').split('/').pop().toLowerCase();

// Shown to EVERYONE while a claim on this profile is awaiting review:
// either anyone's pending claim (from claim-status) or — for immediate
// post-submit feedback before claim-status is refetched — the current
// user's own pending claim for this author.
const ownPendingHere = computed(() =>
  !!pendingClaim.value
  && shortId(pendingClaim.value.author_id) === shortId(props.authorId)
);
const showPendingBadge = computed(() =>
  claimStatusKnown.value
  && !claimedByOther.value
  && (pendingByAnyone.value || ownPendingHere.value)
);
// A pending claim now hides the button for everyone (the badge takes its
// slot), which also prevents competing claims through the UI.
const showButton = computed(() =>
  claimStatusKnown.value
  && !claimedByOther.value
  && !pendingByAnyone.value
  && !ownPendingHere.value
  && !hasAnyClaim.value
);

async function fetchClaimStatus() {
  if (!props.authorId) return;
  claimStatusKnown.value = false;
  claimedByUser.value = null;
  try {
    const resp = await axios.get(`${urlBase.userApi}/authors/${props.authorId}/claim-status`);
    claimedByOther.value = !!resp.data?.claimed;
    pendingByAnyone.value = !!resp.data?.pending;
  } catch (e) {
    claimedByOther.value = false;  // Fail open — better to show button than block.
    pendingByAnyone.value = false;
  } finally {
    claimStatusKnown.value = true;
  }
  maybeFetchClaimedBy();
}

// Admin-only: resolve which user claimed this author so the badge can deep-link.
async function maybeFetchClaimedBy() {
  if (!props.authorId || !claimedByOther.value || !isAdmin.value) return;
  if (claimedByUser.value) return;
  try {
    const resp = await axios.get(
      `${urlBase.userApi}/authors/${props.authorId}/claimed-by`,
      axiosConfig({ userAuth: true })
    );
    claimedByUser.value = resp.data || null;
  } catch (e) {
    claimedByUser.value = null;  // Non-admin / unclaimed — fall back to plain badge.
  }
}

function openClaimerAdmin() {
  if (!claimedByUser.value?.user_id) return;
  router.push({ name: 'admin-user-detail', params: { userId: claimedByUser.value.user_id } });
}

onMounted(fetchClaimStatus);
watch(() => props.authorId, fetchClaimStatus);
// isAdmin can resolve after mount (user loads async) — fetch claimant then.
watch(isAdmin, maybeFetchClaimedBy);

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
    // Immediate confirmation that survives the dialog/button swap.
    store.commit('snackbar', {
      msg: resultMessage.value,
      color: data?.auto_approved ? 'success' : 'warning',
    });
    // Refresh public status so the pending/claimed state is coherent here
    // without a reload (and for anyone who lands on this page next).
    fetchClaimStatus();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 409) {
      errorMessage.value = err?.response?.data?.message
        || 'This author is already claimed, or you already have a claim on file.';
    } else if (status === 400) {
      errorMessage.value = err?.response?.data?.message
        || 'Could not submit claim. Please check your evidence and try again.';
    } else {
      errorMessage.value = 'Could not submit claim. Please try again later.';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>


<style scoped lang="scss">
.admin-claim-link {
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
}
</style>
