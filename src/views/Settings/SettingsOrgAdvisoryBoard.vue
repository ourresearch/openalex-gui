<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">Community Advisory Board</h1>
      <v-btn variant="text" href="https://openalex.org/team" target="_blank">
        Meet the Board
        <v-icon end size="small">mdi-open-in-new</v-icon>
      </v-btn>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <template v-else>
      <!-- Not a member org -->
      <v-alert v-if="benefits && !benefits.benefits_eligible" type="info" variant="tonal" class="mb-6">
        Nominating and voting for the Community Advisory Board is an OpenAlex membership benefit.
        <router-link to="/pricing/institutions">Learn about membership</router-link>.
      </v-alert>

      <!-- About the board (always shown) -->
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <div class="text-subtitle-1 font-weight-bold mb-2">How it works</div>
          <p class="text-body-2 mb-2">
            The Community Advisory Board helps guide OpenAlex's direction and priorities.
            Board members serve two-year terms, staggered so roughly half the seats turn over
            each January.
          </p>
          <p class="text-body-2 mb-0">
            Each year, every member organization can nominate <strong>one candidate</strong>
            (anyone in the community — they don't need to work at a member institution) and cast
            <strong>three votes</strong>, each for a different candidate. The sitting board makes
            the final selection informed by the vote.
          </p>
        </v-card-text>
      </v-card>

      <!-- No election / draft -->
      <v-alert v-if="!election" type="info" variant="tonal">
        There's no election underway right now. We'll email member contacts when the next
        call for nominations opens.
      </v-alert>

      <template v-else>
        <!-- Election schedule -->
        <v-card variant="outlined" class="mb-6">
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1 font-weight-bold">{{ election.year }} election</div>
              <v-chip size="small" class="ml-3" :color="phaseChip.color" variant="tonal">
                {{ phaseChip.label }}
              </v-chip>
            </div>
            <div v-if="election.seats_open" class="text-body-2 mb-1">
              <strong>{{ election.seats_open }}</strong> seats are opening this cycle.
            </div>
            <div v-if="election.perspectives_sought" class="text-body-2 mb-2">
              Perspectives we'd especially value: {{ election.perspectives_sought }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              <span v-if="election.nominations_close_at">
                Nominations close {{ formatDate(election.nominations_close_at) }}.
              </span>
              <span v-if="election.voting_open_at && election.voting_close_at">
                Voting runs {{ formatDate(election.voting_open_at) }} to
                {{ formatDate(election.voting_close_at) }}.
              </span>
            </div>
          </v-card-text>
        </v-card>

        <!-- ============ NOMINATIONS PHASE ============ -->
        <template v-if="election.phase === 'nominations' && benefits?.benefits_eligible">
          <!-- Existing nomination status -->
          <v-card v-if="nomination && nomination.status !== 'withdrawn' && !showForm" variant="outlined" class="mb-6">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <div class="text-subtitle-1 font-weight-bold">Your organization's nomination</div>
                <v-chip size="small" class="ml-3" :color="nominationChip.color" variant="tonal">
                  {{ nominationChip.label }}
                </v-chip>
              </div>
              <div class="text-body-1 mb-1">
                {{ nomination.nominee_name }}
                <span class="text-medium-emphasis">— {{ nomination.nominee_affiliation }}</span>
              </div>
              <div v-if="nomination.nominee_role" class="text-body-2 text-medium-emphasis mb-2">
                {{ nomination.nominee_role }}
              </div>
              <p class="text-body-2 mb-3">{{ nomination.candidate_statement }}</p>
              <div v-if="nomination.status === 'pending_confirmation'" class="text-body-2 text-medium-emphasis mb-3">
                We've emailed {{ nomination.nominee_email }} to confirm they're willing to stand.
                They'll join the ballot once they confirm.
              </div>
              <template v-if="canEdit">
                <v-btn variant="outlined" size="small" class="mr-2" @click="openForm(nomination)">
                  Edit nomination
                </v-btn>
                <v-btn variant="text" size="small" color="error" :loading="withdrawing" @click="withdrawDialog = true">
                  Withdraw
                </v-btn>
              </template>
            </v-card-text>
          </v-card>

          <!-- Nomination form -->
          <v-card v-if="canEdit && (showForm || !nomination || nomination.status === 'withdrawn')" variant="outlined" class="mb-6">
            <v-card-text>
              <div class="text-subtitle-1 font-weight-bold mb-1">
                {{ nomination && nomination.status !== 'withdrawn' ? 'Update your nomination' : 'Nominate a candidate' }}
              </div>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Please talk to your nominee first: board membership means a quarterly 90-minute
                meeting, readings in advance of each meeting, and possibly serving on specific
                working groups. We'll email them to confirm before they appear on the ballot.
                <span v-if="nomination && nomination.status !== 'withdrawn'">
                  Submitting replaces your current nomination.
                </span>
              </p>
              <v-text-field v-model="form.nominee_name" label="Nominee name" variant="outlined" density="compact" class="mb-2" />
              <v-text-field v-model="form.nominee_email" label="Nominee email" type="email" variant="outlined" density="compact" class="mb-2" />
              <v-text-field v-model="form.nominee_affiliation" label="Nominee affiliation (institution or organization)" variant="outlined" density="compact" class="mb-2" />
              <v-text-field v-model="form.nominee_role" label="Nominee role / title (optional)" variant="outlined" density="compact" class="mb-2" />
              <v-textarea
                v-model="form.candidate_statement"
                label="Candidate statement (published on the ballot)"
                variant="outlined"
                rows="4"
                :counter-value="wordCount"
                :counter="200"
                persistent-counter
                class="mb-2"
              />
              <v-text-field
                v-model="form.perspective"
                label="What perspective would they add to the board? (optional, helps the board balance seats)"
                variant="outlined" density="compact" class="mb-2"
              />
              <v-checkbox v-model="form.consent_confirmed" density="compact" hide-details
                label="I've confirmed this person consents to stand for election." />
              <v-checkbox v-model="form.capacity_confirmed" density="compact" class="mb-2"
                label="I've shared the time commitment with them and they confirm they have capacity." />
              <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-3">
                {{ formError }}
              </v-alert>
              <v-btn color="primary" variant="flat" :loading="submitting" @click="submitNomination">
                Submit nomination
              </v-btn>
              <v-btn v-if="showForm && nomination && nomination.status !== 'withdrawn'" variant="text" class="ml-2" @click="showForm = false">
                Cancel
              </v-btn>
            </v-card-text>
          </v-card>

          <v-alert v-if="!canEdit" type="info" variant="tonal" density="compact">
            Only your organization's owner accounts can submit a nomination.
          </v-alert>
        </template>

        <!-- ============ VOTING PHASE ============ -->
        <template v-if="election.phase === 'voting'">
          <v-card variant="outlined" class="mb-6">
            <v-card-text>
              <div class="text-subtitle-1 font-weight-bold mb-1">Cast your organization's votes</div>
              <p class="text-body-2 text-medium-emphasis mb-4">
                Select up to three candidates — each vote must go to a different person. Any owner
                of your organization can update this ballot until voting closes. Ballots are
                counted per organization and shared with the sitting board alongside candidate
                information; individual ballots aren't published.
              </p>

              <v-alert v-if="!benefits?.benefits_eligible" type="info" variant="tonal" density="compact" class="mb-4">
                Voting is open to member organizations.
              </v-alert>
              <v-alert v-else-if="!canEdit" type="info" variant="tonal" density="compact" class="mb-4">
                Only your organization's owner accounts can cast its ballot.
              </v-alert>
              <v-alert v-else-if="ballot" type="success" variant="tonal" density="compact" class="mb-4">
                Your organization's ballot is in — you can change it until voting closes.
              </v-alert>

              <div v-for="candidate in shuffledSlate" :key="candidate.id" class="candidate-row">
                <v-checkbox
                  v-model="selectedIds"
                  :value="candidate.id"
                  :disabled="!canVote || (selectedIds.length >= 3 && !selectedIds.includes(candidate.id))"
                  density="compact"
                  hide-details
                >
                  <template #label>
                    <div class="ml-1">
                      <div class="text-body-1 font-weight-medium">
                        {{ candidate.nominee_name }}
                        <span class="text-medium-emphasis font-weight-regular">— {{ candidate.nominee_affiliation }}</span>
                      </div>
                      <div v-if="candidate.nominee_role" class="text-body-2 text-medium-emphasis">
                        {{ candidate.nominee_role }}
                      </div>
                      <div class="text-body-2 mt-1">{{ candidate.candidate_statement }}</div>
                    </div>
                  </template>
                </v-checkbox>
                <v-divider class="my-3" />
              </div>

              <v-alert v-if="ballotError" type="error" variant="tonal" density="compact" class="mb-3">
                {{ ballotError }}
              </v-alert>
              <v-btn
                v-if="canVote"
                color="primary"
                variant="flat"
                :disabled="selectedIds.length === 0"
                :loading="savingBallot"
                @click="saveBallot"
              >
                {{ ballot ? 'Update ballot' : 'Cast ballot' }} ({{ selectedIds.length }}/3)
              </v-btn>
            </v-card-text>
          </v-card>
        </template>

        <!-- ============ CLOSED ============ -->
        <v-alert v-if="election.phase === 'closed'" type="info" variant="tonal">
          Voting has closed. The sitting Advisory Board reviews the results and the new board
          is announced in December. Thanks for participating!
        </v-alert>
      </template>
    </template>

    <!-- Withdraw confirmation -->
    <v-dialog v-model="withdrawDialog" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="text-h6 font-weight-bold mb-2">Withdraw nomination?</div>
          <div class="text-body-2 text-medium-emphasis">
            This withdraws {{ nomination?.nominee_name }} as your organization's nominee.
            You can nominate someone else while nominations are open.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="withdrawDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="withdrawing" @click="withdrawNomination">Withdraw</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'SettingsOrgAdvisoryBoard' });

useHead({ title: 'Community Advisory Board' });

const store = useStore();

const benefits = ref(null);
const election = ref(null);
const slate = ref([]);
const loading = ref(true);
const error = ref('');

const showForm = ref(false);
const submitting = ref(false);
const formError = ref('');
const form = ref(emptyForm());

const withdrawDialog = ref(false);
const withdrawing = ref(false);

const selectedIds = ref([]);
const savingBallot = ref(false);
const ballotError = ref('');
const shuffledSlate = ref([]);

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const canEdit = computed(() => organizationRole.value === 'owner');
const nomination = computed(() => benefits.value?.nomination || null);
const ballot = computed(() => benefits.value?.ballot || null);
const canVote = computed(() => canEdit.value && benefits.value?.benefits_eligible);

const phaseChip = computed(() => ({
  nominations: { color: 'primary', label: 'Nominations open' },
  voting: { color: 'success', label: 'Voting open' },
  closed: { color: 'grey', label: 'Voting closed' },
}[election.value?.phase] || { color: 'grey', label: election.value?.phase }));

const nominationChip = computed(() => ({
  pending_confirmation: { color: 'warning', label: 'Awaiting nominee confirmation' },
  confirmed: { color: 'success', label: 'Confirmed — on the ballot' },
  declined: { color: 'error', label: 'Nominee declined' },
  withdrawn: { color: 'grey', label: 'Withdrawn' },
}[nomination.value?.status] || { color: 'grey', label: nomination.value?.status }));

function emptyForm() {
  return {
    nominee_name: '', nominee_email: '', nominee_affiliation: '', nominee_role: '',
    candidate_statement: '', perspective: '',
    consent_confirmed: false, capacity_confirmed: false,
  };
}

function wordCount(value) {
  return value ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function openForm(existing) {
  form.value = existing
    ? {
        nominee_name: existing.nominee_name || '',
        nominee_email: existing.nominee_email || '',
        nominee_affiliation: existing.nominee_affiliation || '',
        nominee_role: existing.nominee_role || '',
        candidate_statement: existing.candidate_statement || '',
        perspective: existing.perspective || '',
        consent_confirmed: false,
        capacity_confirmed: false,
      }
    : emptyForm();
  formError.value = '';
  showForm.value = true;
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function fetchAll() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const [benefitsRes, electionRes] = await Promise.all([
      axios.get(`${urlBase.userApi}/organizations/${organizationId.value}/benefits`, axiosConfig({ userAuth: true })),
      axios.get(`${urlBase.userApi}/cab/election`, axiosConfig({ userAuth: true })),
    ]);
    benefits.value = benefitsRes.data;
    election.value = electionRes.data.election;
    slate.value = electionRes.data.slate || [];
    // Randomize ballot order per page load so early nominations get no edge.
    shuffledSlate.value = shuffle(slate.value);
    selectedIds.value = [...(benefits.value?.ballot?.nomination_ids || [])];
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load advisory board information.';
  } finally {
    loading.value = false;
  }
}

async function submitNomination() {
  submitting.value = true;
  formError.value = '';
  const body = { ...form.value };
  if (window.location.hostname === 'localhost') body.localhost = window.location.port || '8080';
  try {
    await axios.post(
      `${urlBase.userApi}/organizations/${organizationId.value}/cab/nomination`,
      body,
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', `Nomination submitted — we've emailed ${form.value.nominee_name} to confirm.`);
    showForm.value = false;
    await fetchAll();
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Failed to submit nomination.';
  } finally {
    submitting.value = false;
  }
}

async function withdrawNomination() {
  withdrawing.value = true;
  try {
    await axios.delete(
      `${urlBase.userApi}/organizations/${organizationId.value}/cab/nomination`,
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Nomination withdrawn.');
    withdrawDialog.value = false;
    await fetchAll();
  } catch (e) {
    store.commit('snackbar', e?.response?.data?.message || 'Failed to withdraw nomination.');
  } finally {
    withdrawing.value = false;
  }
}

async function saveBallot() {
  savingBallot.value = true;
  ballotError.value = '';
  try {
    await axios.put(
      `${urlBase.userApi}/organizations/${organizationId.value}/cab/ballot`,
      { nomination_ids: selectedIds.value },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Ballot saved — you can change it until voting closes.');
    await fetchAll();
  } catch (e) {
    ballotError.value = e?.response?.data?.message || 'Failed to save ballot.';
  } finally {
    savingBallot.value = false;
  }
}

onMounted(() => {
  fetchAll();
});
</script>

<style scoped>
.candidate-row :deep(.v-selection-control) {
  align-items: flex-start;
}
</style>
