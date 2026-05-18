<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Author claims</h1>

    <!-- Controls -->
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-select
        v-model="decisionFilter"
        :items="decisionOptions"
        variant="outlined"
        density="compact"
        hide-details
        label="Decision"
        class="filter-select"
      />
      <span class="text-body-2 text-medium-emphasis">
        {{ totalCount }} {{ decisionFilter }} claim{{ totalCount === 1 ? '' : 's' }}
      </span>
    </div>

    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Bulk action bar -->
    <v-slide-y-transition>
      <div v-if="selectedIds.length" class="bulk-bar d-flex align-center ga-3 mb-4 px-4 py-2">
        <v-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected && !allSelected"
          hide-details
          density="compact"
          @update:model-value="toggleSelectAll"
        />
        <span class="text-body-2 font-weight-medium">
          {{ selectedIds.length }} selected
        </span>
        <v-spacer />
        <v-btn
          color="success"
          variant="flat"
          size="small"
          :loading="bulkBusy"
          prepend-icon="mdi-check"
          @click="bulkDecide('approve')"
        >
          Approve selected
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          :loading="bulkBusy"
          prepend-icon="mdi-close"
          @click="openDenyDialog(null)"
        >
          Deny selected
        </v-btn>
      </div>
    </v-slide-y-transition>

    <div v-if="claims.length || loading">
      <!-- Select-all header (when nothing selected yet) -->
      <div v-if="!selectedIds.length && claims.length" class="d-flex align-center ga-2 mb-2 px-1">
        <v-checkbox
          :model-value="false"
          hide-details
          density="compact"
          label="Select all on this page"
          @update:model-value="toggleSelectAll(true)"
        />
      </div>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />

      <!-- Claim cards -->
      <v-card
        v-for="claim in claims"
        :key="claim.id"
        variant="outlined"
        class="claim-card mb-3"
        :class="{ 'claim-card--selected': isSelected(claim.id) }"
      >
        <div class="d-flex">
          <!-- Selection -->
          <div class="pa-3 pt-4">
            <v-checkbox
              :model-value="isSelected(claim.id)"
              hide-details
              density="compact"
              @update:model-value="toggleOne(claim.id)"
            />
          </div>

          <div class="flex-grow-1 pa-3">
            <!-- Identity row: claimant <-> claimed author -->
            <div class="d-flex flex-wrap align-start ga-6 mb-3">
              <!-- Claimant -->
              <div class="identity-col">
                <div class="text-overline text-medium-emphasis">Claimant</div>
                <router-link
                  :to="`/admin/users/${claim.user.id}`"
                  class="identity-name"
                >{{ claim.user.display_name || claim.user.id }}</router-link>
                <div class="d-flex flex-wrap ga-1 mt-1">
                  <v-tooltip
                    v-for="em in claim.signals.emails"
                    :key="em.email"
                    location="bottom"
                    :text="emailTooltip(em)"
                  >
                    <template #activator="{ props: tp }">
                      <v-chip
                        v-bind="tp"
                        size="x-small"
                        :color="emailColor(em.domain_class)"
                        variant="flat"
                        class="email-chip"
                      >
                        <v-icon
                          v-if="!em.verified"
                          start
                          size="x-small"
                          icon="mdi-alert-circle-outline"
                        />
                        {{ em.email }}
                      </v-chip>
                    </template>
                  </v-tooltip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ ageLine(claim) }}
                </div>
              </div>

              <!-- Claimed author -->
              <div class="identity-col">
                <div class="text-overline text-medium-emphasis">Claimed profile</div>
                <a
                  :href="authorUrl(claim.author_id)"
                  target="_blank"
                  rel="noopener"
                  class="identity-name"
                >
                  {{ authorInfo(claim.author_id).display_name || shortAuthorId(claim.author_id) }}
                  <v-icon size="x-small" icon="mdi-open-in-new" class="ml-1" />
                </a>
                <div class="text-caption text-medium-emphasis mt-1">
                  <template v-if="authorInfo(claim.author_id).works_count != null">
                    {{ authorInfo(claim.author_id).works_count.toLocaleString() }} works
                  </template>
                  <template v-if="authorInstitution(claim.author_id)">
                    · {{ authorInstitution(claim.author_id) }}
                  </template>
                </div>
              </div>

              <v-spacer />

              <!-- Decision state / actions -->
              <div class="text-right">
                <template v-if="claim.decision === 'pending'">
                  <div class="d-flex ga-2">
                    <v-btn
                      color="success"
                      variant="flat"
                      size="small"
                      :loading="rowBusy === claim.id"
                      prepend-icon="mdi-check"
                      @click="decideOne(claim.id, 'approve')"
                    >
                      Approve
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="outlined"
                      size="small"
                      :loading="rowBusy === claim.id"
                      prepend-icon="mdi-close"
                      @click="openDenyDialog(claim.id)"
                    >
                      Deny
                    </v-btn>
                  </div>
                </template>
                <template v-else>
                  <v-chip
                    :color="claim.decision === 'approved' ? 'success' : 'error'"
                    size="small"
                    variant="flat"
                  >
                    {{ claim.decision }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ formatRelativeShort(claim.decided_at) }}
                    <template v-if="claim.decision_note"> · "{{ claim.decision_note }}"</template>
                  </div>
                </template>
              </div>
            </div>

            <!-- Evidence (prominent) -->
            <div class="evidence-block">
              <div class="text-overline text-medium-emphasis mb-1">Evidence</div>
              <div class="evidence-text">{{ claim.evidence || '—' }}</div>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Pagination -->
      <div class="d-flex justify-end align-center mt-4">
        <v-btn icon variant="text" size="small" :disabled="page <= 1" @click="prevPage">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-body-2 mx-2">Page {{ page }} of {{ totalPages }}</span>
        <v-btn icon variant="text" size="small" :disabled="page >= totalPages" @click="nextPage">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center text-medium-emphasis py-8">
      No {{ decisionFilter }} claims.
    </div>

    <!-- Deny note dialog -->
    <v-dialog v-model="denyDialog" max-width="480">
      <v-card>
        <v-card-title>Deny {{ denyTargetId ? 'claim' : `${selectedIds.length} claims` }}</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Denial is final — the user can't re-claim from the UI (help-ticket path).
            An optional note is stored for the record.
          </p>
          <v-textarea
            v-model="denyNote"
            label="Note (optional)"
            variant="outlined"
            rows="3"
            auto-grow
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="denyDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="bulkBusy || rowBusy" @click="confirmDeny">
            Deny
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatRelativeShort } from '@/composables/useCurationDescriptor';

defineOptions({ name: 'AdminAuthorClaims' });

const claims = ref([]);
const error = ref('');
const loading = ref(false);
const decisionFilter = ref('pending');
const decisionOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
  { title: 'All', value: 'all' },
];

const page = ref(1);
const perPage = ref(25);
const totalCount = ref(0);
const totalPages = ref(1);

const selectedIds = ref([]);
const rowBusy = ref(null);
const bulkBusy = ref(false);

const denyDialog = ref(false);
const denyNote = ref('');
const denyTargetId = ref(null);

const snackbar = ref({ show: false, text: '', color: 'success' });
function notify(text, color = 'success') {
  snackbar.value = { show: true, text, color };
}

// --- Author resolution (OpenAlex API, one batched call per page) ---
const authorMap = ref({});

function shortAuthorId(id) {
  if (!id) return '';
  return String(id).split('/').pop();
}
function authorUrl(id) {
  return `https://openalex.org/${shortAuthorId(id)}`;
}
function authorInfo(id) {
  return authorMap.value[shortAuthorId(id).toUpperCase()] || {};
}
function authorInstitution(id) {
  return authorInfo(id).last_known_institutions?.[0]?.display_name || '';
}

async function resolveAuthors(rows) {
  const ids = [...new Set(
    rows.map((c) => shortAuthorId(c.author_id).toUpperCase()).filter(Boolean),
  )].filter((sid) => !authorMap.value[sid]);
  if (!ids.length) return;
  try {
    const res = await axios.get(
      `https://api.openalex.org/authors?filter=openalex:${ids.join('|')}` +
      `&select=id,display_name,works_count,last_known_institutions&per_page=${ids.length}`,
    );
    for (const a of res.data.results || []) {
      authorMap.value[shortAuthorId(a.id).toUpperCase()] = a;
    }
  } catch (e) {
    console.warn('Failed to resolve claimed authors:', e);
  }
}

// --- Signals presentation ---
function emailColor(cls) {
  return cls === 'disposable' ? 'error' : 'warning';
}
function emailTooltip(em) {
  const parts = [em.domain_class];
  parts.push(em.verified ? 'verified' : 'UNVERIFIED');
  if (em.is_primary) parts.push('primary');
  return parts.join(' · ');
}

function humanizeDuration(seconds) {
  if (seconds == null) return 'unknown';
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 365) return `${d}d`;
  return `${(d / 365).toFixed(1)}y`;
}

function ageLine(claim) {
  const days = claim.signals.account_age_days;
  const delta = claim.signals.signup_to_claim_seconds;
  const age = days == null
    ? 'account age unknown'
    : `account ${humanizeDuration(days * 86400)} old`;
  const since = delta == null
    ? ''
    : ` · claimed ${humanizeDuration(delta)} after signup`;
  return age + since;
}

// --- Selection ---
function isSelected(id) {
  return selectedIds.value.includes(id);
}
const pendingIds = computed(() =>
  claims.value.filter((c) => c.decision === 'pending').map((c) => c.id));
const allSelected = computed(() =>
  pendingIds.value.length > 0 &&
  pendingIds.value.every((id) => selectedIds.value.includes(id)));
const someSelected = computed(() => selectedIds.value.length > 0);

function toggleOne(id) {
  const i = selectedIds.value.indexOf(id);
  if (i === -1) selectedIds.value.push(id);
  else selectedIds.value.splice(i, 1);
}
function toggleSelectAll(val) {
  if (val) selectedIds.value = [...pendingIds.value];
  else selectedIds.value = [];
}

// --- Fetch ---
async function fetchClaims() {
  error.value = '';
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      per_page: String(perPage.value),
      decision: decisionFilter.value,
    });
    const res = await axios.get(
      `${urlBase.userApi}/admin/author-claims?${params.toString()}`,
      axiosConfig({ userAuth: true }),
    );
    claims.value = res.data.results || [];
    totalCount.value = res.data.meta?.total_count || 0;
    totalPages.value = res.data.meta?.total_pages || 1;
    selectedIds.value = [];
    resolveAuthors(claims.value);
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch claims.';
    claims.value = [];
  } finally {
    loading.value = false;
  }
}

// --- Decisions ---
async function decideOne(id, action) {
  rowBusy.value = id;
  try {
    await axios.post(
      `${urlBase.userApi}/admin/author-claims/${id}/${action}`,
      {},
      axiosConfig({ userAuth: true }),
    );
    notify(action === 'approve' ? 'Claim approved.' : 'Claim denied.',
      action === 'approve' ? 'success' : 'warning');
    await fetchClaims();
  } catch (e) {
    notify(e?.response?.data?.message || `Failed to ${action} claim.`, 'error');
  } finally {
    rowBusy.value = null;
  }
}

async function bulkDecide(action, note) {
  if (!selectedIds.value.length) return;
  bulkBusy.value = true;
  try {
    const res = await axios.post(
      `${urlBase.userApi}/admin/author-claims/bulk`,
      { ids: selectedIds.value, action, note },
      axiosConfig({ userAuth: true }),
    );
    const ok = res.data?.succeeded ?? 0;
    const total = res.data?.requested ?? selectedIds.value.length;
    notify(`${action === 'approve' ? 'Approved' : 'Denied'} ${ok}/${total} claims.`,
      ok === total ? 'success' : 'warning');
    await fetchClaims();
  } catch (e) {
    notify(e?.response?.data?.message || `Bulk ${action} failed.`, 'error');
  } finally {
    bulkBusy.value = false;
  }
}

// --- Deny dialog (single or bulk) ---
function openDenyDialog(id) {
  denyTargetId.value = id;
  denyNote.value = '';
  denyDialog.value = true;
}
async function confirmDeny() {
  const note = denyNote.value.trim() || undefined;
  const id = denyTargetId.value;
  denyDialog.value = false;
  if (id) {
    rowBusy.value = id;
    try {
      await axios.post(
        `${urlBase.userApi}/admin/author-claims/${id}/deny`,
        { note },
        axiosConfig({ userAuth: true }),
      );
      notify('Claim denied.', 'warning');
      await fetchClaims();
    } catch (e) {
      notify(e?.response?.data?.message || 'Failed to deny claim.', 'error');
    } finally {
      rowBusy.value = null;
    }
  } else {
    await bulkDecide('deny', note);
  }
}

function prevPage() {
  if (page.value > 1) { page.value--; fetchClaims(); }
}
function nextPage() {
  if (page.value < totalPages.value) { page.value++; fetchClaims(); }
}

watch(decisionFilter, () => { page.value = 1; fetchClaims(); });

onMounted(fetchClaims);
</script>

<style scoped lang="scss">
.filter-select {
  max-width: 160px;
}

.bulk-bar {
  background: rgba(25, 118, 210, 0.06);
  border: 1px solid rgba(25, 118, 210, 0.2);
  border-radius: 6px;
}

.claim-card {
  border-color: rgba(0, 0, 0, 0.1);
  transition: border-color 0.15s ease, background 0.15s ease;

  &--selected {
    border-color: rgba(25, 118, 210, 0.5);
    background: rgba(25, 118, 210, 0.03);
  }
}

.identity-col {
  min-width: 220px;
  max-width: 360px;
}

.identity-name {
  font-size: 15px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.email-chip {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  max-width: 280px;
}

.evidence-block {
  background: rgba(0, 0, 0, 0.025);
  border-left: 3px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  padding: 10px 14px;
}

.evidence-text {
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  color: rgba(0, 0, 0, 0.8);
}
</style>
