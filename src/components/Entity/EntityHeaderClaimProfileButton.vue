<template>
  <span>
    <!-- Claimed (approved): by the viewer, or by another user -->
    <v-tooltip v-if="showClaimedBadge" location="bottom" :text="claimedTooltip">
      <template v-slot:activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          color="primary"
          :class="{ 'admin-claim-link': adminCanOpen }"
          @click="adminCanOpen ? openClaimerAdmin() : null"
        >
          mdi-check-decagram
        </v-icon>
      </template>
    </v-tooltip>

    <!-- A claim on this profile is awaiting review (shown to everyone) -->
    <v-tooltip
      v-else-if="showPendingBadge"
      location="bottom"
      :text="pendingTooltip"
    >
      <template v-slot:activator="{ props: tooltipProps }">
        <v-chip
          v-bind="tooltipProps"
          color="warning"
          variant="flat"
          size="small"
          label
          prepend-icon="mdi-check-decagram-outline"
          :class="{ 'admin-claim-link': adminCanOpenPending }"
          @click="adminCanOpenPending ? openClaimerAdmin() : null"
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
          prepend-icon="mdi-check-decagram-outline"
          @click="clickClaim"
        >
          Claim
        </v-btn>
      </template>
    </v-tooltip>

    <!-- Logged-out users are prompted to log in, since claiming a profile
         requires an account. -->
    <v-dialog rounded max-width="360" v-model="isLoginPromptDialogOpen">
      <v-card rounded>
        <v-card-title>Claim profile</v-card-title>
        <div class="pa-4">
          Log in to claim your profile.
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded
            variant="text"
            @click="isLoginPromptDialogOpen = false"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            rounded
            variant="text"
            @click="goToLogin"
          >
            Log in
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- One dialog whose content swaps by screen (stacked v-dialogs drop
         closes in Vuetify 3). Words: ./claimCopy.js (#1466). -->
    <v-dialog
      rounded
      max-width="600"
      v-model="isEvidenceDialogOpen"
      :persistent="isLoading"
    >
      <v-card rounded :loading="isLoading || orcidLoading || view === 'checking'">
        <v-card-title>{{ copy.title }}</v-card-title>
        <div class="pa-4 pt-1 text-body-2 claim-dialog">

          <!-- University email on the account: one click -->
          <template v-if="view === 'instant'">
            <p>{{ copy.instant.body(eligibleEmail) }}</p>
          </template>

          <!-- The linked ORCID iD is this profile's iD: one click (#1475) -->
          <template v-else-if="view === 'orcid'">
            <p class="d-flex align-center ga-2">
              <OrcidIcon :size="18" />
              <span>{{ copy.orcidLinked.body(profileOrcid) }}</span>
            </p>
          </template>

          <!-- Being checked right now -->
          <template v-else-if="view === 'checking'">
            <p v-if="!pollTimedOut">{{ orcidMatch ? copy.checkingOrcid : copy.checking }}</p>
            <p v-else>{{ copy.stillChecking }}</p>
          </template>

          <!-- Approved -->
          <template v-else-if="view === 'approved'">
            <p>{{ copy.approved }}</p>
          </template>

          <!-- Not yet: reason, fastest fix, send a new link -->
          <template v-else-if="view === 'needs_evidence'">
            <p class="font-weight-medium">{{ copy.notYet }}</p>
            <p style="white-space: pre-line;">{{ reason }}</p>
            <div class="claim-option best">
              <p>{{ copy.fastestFix }}</p>
              <v-btn size="small" rounded color="primary" variant="flat" @click="goToEmails">
                {{ copy.universityEmail.button }}
              </v-btn>
            </div>
            <div v-if="orcidOffer" class="claim-option">
              <p>{{ copy.orcid.body(profileOrcid) }}</p>
              <v-btn size="small" rounded variant="outlined" color="primary" :href="orcidUrl">
                <OrcidIcon :size="14" class="mr-2" />{{ copy.orcid.button }}
              </v-btn>
            </div>
            <p class="mt-4 mb-1">{{ copy.sendNewLink }}</p>
            <v-text-field
              v-model="evidence"
              :placeholder="copy.link.placeholder"
              variant="outlined"
              density="compact"
              hide-details="auto"
              maxlength="2000"
              @keydown.enter="canSubmit && submitClaim()"
            />
          </template>

          <!-- The form: university email, ORCID, or a link -->
          <template v-else>
            <div class="claim-option best">
              <div class="font-weight-bold mb-1">{{ copy.universityEmail.title }}</div>
              <p>{{ copy.universityEmail.body }}</p>
              <v-btn size="small" rounded color="primary" variant="flat" @click="goToEmails">
                {{ copy.universityEmail.button }}
              </v-btn>
            </div>
            <div v-if="orcidOffer" class="claim-option">
              <div class="font-weight-bold mb-1">{{ copy.orcid.title }}</div>
              <p>{{ copy.orcid.body(profileOrcid) }}</p>
              <v-btn size="small" rounded variant="outlined" color="primary" :href="orcidUrl">
                <OrcidIcon :size="14" class="mr-2" />{{ copy.orcid.button }}
              </v-btn>
            </div>
            <div class="claim-option">
              <div class="font-weight-bold mb-1">{{ copy.link.title }}</div>
              <p class="mb-1">{{ copy.link.intro }} <span class="claim-email">{{ userEmail }}</span></p>
              <ul class="claim-evidence">
                <li class="yes">{{ copy.link.good[0] }}</li>
                <li class="yes">{{ copy.link.good[1](userEmail) }}</li>
                <li class="no">{{ copy.link.bad[0] }}</li>
                <li class="no">{{ copy.link.bad[1] }}</li>
              </ul>
              <p><b>{{ copy.link.whyTitle }}</b> {{ copy.link.why }}</p>
              <v-text-field
                v-model="evidence"
                :placeholder="copy.link.placeholder"
                variant="outlined"
                density="compact"
                hide-details="auto"
                maxlength="2000"
                @keydown.enter="canSubmit && submitClaim()"
              />
              <p class="text-medium-emphasis mt-2 mb-0">{{ copy.link.after }}</p>
            </div>
          </template>

          <div v-if="errorMessage" class="text-error mt-2">
            {{ errorMessage }}
          </div>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn
            rounded
            variant="text"
            :disabled="isLoading"
            @click="closeEvidenceDialog"
          >
            {{ ['form', 'needs_evidence', 'instant', 'orcid'].includes(view) ? 'Cancel' : 'Close' }}
          </v-btn>
          <v-btn
            v-if="view === 'instant'"
            color="primary"
            rounded
            variant="flat"
            :disabled="isLoading"
            @click="submitClaim"
          >
            {{ copy.instant.button }}
          </v-btn>
          <v-btn
            v-else-if="view === 'orcid'"
            color="primary"
            rounded
            variant="flat"
            :disabled="isLoading"
            @click="submitClaim"
          >
            {{ copy.orcidLinked.button }}
          </v-btn>
          <v-btn
            v-else-if="view === 'form' || view === 'needs_evidence'"
            color="primary"
            rounded
            variant="flat"
            :disabled="!canSubmit || isLoading"
            @click="submitClaim"
          >
            {{ copy.link.button }}
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
import {
  copy, reasonText, claimView, claimBadge, ownsProfile, orcidAuthorizeUrl, sameOrcid, bareOrcid, shortId, ORCID_CLIENT_ID,
} from './claimCopy.js';
import OrcidIcon from '@/components/Orcid/OrcidIcon.vue';

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
const userClaim = computed(() => store.getters['user/userClaim']);
const userAuthorId = computed(() => store.getters['user/userAuthorId']);
const claimEligibility = computed(() => store.getters['user/claimEligibility']);
const claimedByUser = ref(null);
const pollTimedOut = ref(false);
const profileOrcid = ref(null);
const orcidLoading = ref(false);
const verifiedOrcid = computed(() => store.getters['user/verifiedOrcid']);
const orcidMatch = computed(() => sameOrcid(verifiedOrcid.value, profileOrcid.value));

// The trusted email that makes the claim instant (else the account email).
const eligibleEmail = computed(() => {
  const emails = store.state.user?.emails || [];
  const verified = emails.filter((e) => e.is_verified || e.verified_at).map((e) => e.email);
  return verified.find((e) => e && e !== userEmail.value) || userEmail.value;
});
const view = computed(() => claimView({
  claim: userClaim.value,
  eligibility: claimEligibility.value,
  authorId: props.authorId,
  orcidMatch: orcidMatch.value,
}));
const reason = computed(() => reasonText(userClaim.value?.feedback_code, {
  email: userEmail.value,
  link: userClaim.value?.feedback_link,
}));
const orcidOffer = computed(() => !!ORCID_CLIENT_ID && !!profileOrcid.value && !orcidMatch.value);
const orcidUrl = computed(() => orcidAuthorizeUrl({
  origin: window.location.origin,
  authorId: props.authorId,
}));

const isLoginPromptDialogOpen = ref(false);
const isEvidenceDialogOpen = ref(false);
const isLoading = ref(false);
const evidence = ref('');
const errorMessage = ref('');
const claimStatusKnown = ref(false);
// Approved claim by ANYONE on this author (public claim-status), which
// can't tell the viewer's own claim from a stranger's: ownsHere does.
const claimedByAnyone = ref(false);
// A pending (submitted, not-yet-approved) claim by ANYONE on this author.
const pendingByAnyone = ref(false);

// A link is required on the review path; the server decides if it's good.
const trimmedLength = computed(() => evidence.value.replace(/<[^>]*>/g, '').trim().length);
const canSubmit = computed(() => trimmedLength.value > 3 && trimmedLength.value <= 2000);

// The viewer's own pending claim for this author — immediate post-submit
// feedback before claim-status is refetched.
const ownPendingHere = computed(() =>
  !!pendingClaim.value
  && shortId(pendingClaim.value.author_id) === shortId(props.authorId)
);
const ownsHere = computed(() => ownsProfile(userAuthorId.value, props.authorId));
// A pending claim hides the button for everyone (the badge takes its slot),
// which also prevents competing claims through the UI.
const badge = computed(() => claimBadge({
  known: claimStatusKnown.value,
  owns: ownsHere.value,
  claimed: claimedByAnyone.value,
  pending: pendingByAnyone.value,
  ownPending: ownPendingHere.value,
  hasAnyClaim: hasAnyClaim.value,
}));
const showClaimedBadge = computed(() => ['owner', 'claimed'].includes(badge.value));
const showPendingBadge = computed(() => badge.value === 'pending');
const showButton = computed(() => badge.value === 'claim');

// Only site admins get a clickable badge that deep-links to the claimant's
// admin record; everyone else sees a plain, non-interactive indicator.
const adminCanOpen = computed(() =>
  showClaimedBadge.value && isAdmin.value && !!claimedByUser.value?.user_id
);
const claimedTooltip = computed(() => {
  if (adminCanOpen.value) {
    return `Claimed by ${claimedByUser.value.display_name || claimedByUser.value.email || 'a user'} — open admin`;
  }
  return badge.value === 'owner' ? copy.badge.owner : copy.badge.claimed;
});

// Admins get a clickable "Claim pending" badge that deep-links to the
// (pending) claimant's admin record — same behaviour as the claimed icon.
const adminCanOpenPending = computed(() =>
  showPendingBadge.value && isAdmin.value && !!claimedByUser.value?.user_id
);
const pendingTooltip = computed(() => {
  if (adminCanOpenPending.value) {
    const who = claimedByUser.value.display_name
      || claimedByUser.value.email || 'a user';
    return `Claim pending by ${who} — open admin`;
  }
  return ownPendingHere.value
    ? 'We are checking your claim'
    : 'A claim on this profile is being checked';
});

async function fetchClaimStatus() {
  if (!props.authorId) return;
  claimStatusKnown.value = false;
  claimedByUser.value = null;
  try {
    const resp = await axios.get(`${urlBase.userApi}/authors/${props.authorId}/claim-status`);
    claimedByAnyone.value = !!resp.data?.claimed;
    pendingByAnyone.value = !!resp.data?.pending;
  } catch (e) {
    claimedByAnyone.value = false;  // Fail open — better to show button than block.
    pendingByAnyone.value = false;
  } finally {
    claimStatusKnown.value = true;
  }
  maybeFetchClaimedBy();
}

// Admin-only: resolve which user claimed (or has a pending claim on) this
// author so either badge can deep-link to their admin record.
async function maybeFetchClaimedBy() {
  if (!props.authorId || !isAdmin.value) return;
  if (!claimedByAnyone.value && !pendingByAnyone.value) return;
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

async function fetchProfileOrcid() {
  if (!ORCID_CLIENT_ID || !props.authorId) return;
  orcidLoading.value = true;
  try {
    const resp = await axios.get(`${urlBase.api}/authors/${shortId(props.authorId)}?select=orcid`);
    profileOrcid.value = bareOrcid(resp.data?.orcid) || null;
  } catch (e) {
    profileOrcid.value = null;
  } finally {
    orcidLoading.value = false;
  }
}

function clickClaim() {
  errorMessage.value = '';
  evidence.value = '';
  pollTimedOut.value = false;
  if (!userId.value) {
    isLoginPromptDialogOpen.value = true;
  } else {
    isEvidenceDialogOpen.value = true;
    fetchProfileOrcid();
  }
}

function goToEmails() {
  isEvidenceDialogOpen.value = false;
  router.push({ name: 'settings-profile', hash: '#emails' });
}

function goToLogin() {
  isLoginPromptDialogOpen.value = false;
  router.push({ name: 'Login' });
}

function closeEvidenceDialog() {
  isEvidenceDialogOpen.value = false;
}

async function submitClaim() {
  errorMessage.value = '';
  isLoading.value = true;
  pollTimedOut.value = false;
  try {
    const data = await store.dispatch('user/setAuthorId', {
      authorId: props.authorId,
      evidence: ['instant', 'orcid'].includes(view.value) ? '' : evidence.value,
    });
    evidence.value = '';
    isLoading.value = false;
    if (!data?.auto_approved) {
      // The verifier answers within about a minute; the view follows the claim.
      const claim = await store.dispatch('user/pollClaim', { timeoutMs: 120000 });
      if (claim?.decision === 'pending') pollTimedOut.value = true;
    }
    if (store.getters['user/userAuthorId']) {
      store.commit('snackbar', { msg: 'Your claim is approved.', color: 'success' });
    }
    // Refresh public status so the pending/claimed state is coherent here.
    fetchClaimStatus();
  } catch (err) {
    const status = err?.response?.status;
    if (status === 409 || status === 400 || status === 429) {
      errorMessage.value = err?.response?.data?.message
        || 'Could not send your claim. Please try again.';
    } else {
      errorMessage.value = 'Could not send your claim. Please try again later.';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>


<style scoped lang="scss">
.claim-dialog p {
  margin-bottom: 8px;
}
.claim-option {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 12px 14px;
  margin: 10px 0;

  &.best {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.04);
  }
}
.claim-email {
  font-family: ui-monospace, Menlo, monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 5px;
  border-radius: 4px;
}
.claim-evidence {
  list-style: none;
  padding: 0;
  margin: 6px 0 10px;

  li {
    padding: 2px 0 2px 24px;
    position: relative;
  }
  li.yes::before {
    content: "✓";
    color: rgb(var(--v-theme-success));
    position: absolute;
    left: 4px;
    font-weight: 700;
  }
  li.no::before {
    content: "✗";
    color: rgb(var(--v-theme-error));
    position: absolute;
    left: 4px;
    font-weight: 700;
  }
}
.admin-claim-link {
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
}
</style>
