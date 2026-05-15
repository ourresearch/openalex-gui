<template>
  <SettingsSection v-if="isEligible" title="High-volume user keys">
    <template #subtitle>
      <div class="text-body-2 text-medium-emphasis mb-2">
        Raise selected members' personal API keys to a <strong>$25/day</strong> cost cap.
        Members must already have an OpenAlex account and an email on one of your
        organization's domains. Assignments take effect within ~60 seconds.
      </div>
    </template>

    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate size="32" />
    </div>

    <template v-else>
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="text-body-2">
          <strong>{{ filledCount }}</strong> of <strong>{{ slotCount }}</strong> slots assigned
        </div>
      </div>

      <div class="slot-list">
        <div v-for="slot in slots" :key="slot.slot_index" class="slot-row">
          <div class="slot-row-main">
            <div class="slot-label">Slot {{ slot.slot_index }}</div>

            <div v-if="slot.filled" class="slot-assignee">
              <div class="font-weight-medium">
                {{ slot.assignment.assigned_user?.display_name || slot.assignment.assigned_user?.email }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ slot.assignment.assigned_user?.email }}
                · assigned {{ formatDate(slot.assignment.assigned_at) }}
              </div>
            </div>
            <div v-else class="text-medium-emphasis font-italic">Unassigned</div>
          </div>

          <div class="slot-row-usage">
            <SlotUsageBar
              v-if="slot.filled"
              :organization-id="organization.id"
              :slot-index="slot.slot_index"
              :refresh-token="usageRefreshToken"
            />
          </div>

          <div class="slot-row-actions">
            <v-btn
              v-if="!slot.filled"
              size="small"
              variant="tonal"
              color="primary"
              @click="openPicker(slot.slot_index)"
            >
              Assign
            </v-btn>
            <template v-else>
              <v-btn size="small" variant="text" @click="openPicker(slot.slot_index)">
                Reassign
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                @click="confirmRevoke(slot.slot_index)"
              >
                Revoke
              </v-btn>
            </template>
          </div>
        </div>
      </div>

      <!-- Recent changes -->
      <div v-if="auditEntries.length" class="audit-list mt-6">
        <div class="audit-header">Recent changes</div>
        <div v-for="entry in auditEntries" :key="entry.id" class="audit-entry">
          <span class="audit-action">{{ entry.action }}</span>
          <span> slot {{ entry.slot_index }} </span>
          <span v-if="entry.target_display_name || entry.target_email">
            ·
            <span class="audit-target">
              {{ entry.target_display_name || entry.target_email }}
            </span>
          </span>
          <span v-if="entry.actor_display_name">
            · by {{ entry.actor_display_name }}
          </span>
          <span class="audit-time">{{ formatDate(entry.happened_at) }}</span>
        </div>
      </div>
    </template>

    <!-- Picker dialog -->
    <v-dialog v-model="pickerOpen" max-width="520">
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="text-h6 font-weight-bold mb-1">
            Assign slot {{ activeSlotIndex }}
          </div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Type to search members on your organization's domains.
          </div>
          <v-autocomplete
            v-model="pickedUserId"
            :items="eligibleUsers"
            :loading="pickerLoading"
            :search="pickerQuery"
            @update:search="onPickerSearch"
            item-title="label"
            item-value="id"
            label="Member"
            variant="outlined"
            density="compact"
            no-filter
            :menu-props="{ maxHeight: 320 }"
            hide-no-data
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="pickerOpen = false" :disabled="assigning">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="assigning"
            :disabled="!pickedUserId"
            @click="submitAssignment"
          >
            Assign
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Revoke confirm -->
    <v-dialog v-model="revokeOpen" max-width="420">
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="text-h6 font-weight-bold mb-3">Revoke slot {{ revokeSlotIndex }}?</div>
          <div class="text-body-2 text-medium-emphasis">
            The assigned member's daily cost cap will drop back to the default
            within ~60 seconds.
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="revokeOpen = false" :disabled="revoking">
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="revoking"
            @click="submitRevoke"
          >
            Revoke
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </SettingsSection>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SlotUsageBar from '@/components/Organization/SlotUsageBar.vue';

const props = defineProps({
  organization: {
    type: Object,
    required: true,
  },
});

const store = useStore();

const loading = ref(true);
const slots = ref([]);
const slotCount = ref(0);
const filledCount = ref(0);
const auditEntries = ref([]);
const usageRefreshToken = ref(0);

const pickerOpen = ref(false);
const activeSlotIndex = ref(null);
const pickerQuery = ref('');
const eligibleUsers = ref([]);
const pickerLoading = ref(false);
const pickedUserId = ref(null);
const assigning = ref(false);

const revokeOpen = ref(false);
const revokeSlotIndex = ref(null);
const revoking = ref(false);

// Plans that may grant high-volume boost slots. Kept in sync with
// plans.BOOST_ELIGIBLE_ORG_PLANS on the backend and migration 035's
// api_keys_view boost gate.
const BOOST_ELIGIBLE_ORG_PLANS = [
  'partner',
  'institutional',
  'institutional-1M',
  'institutional-2M',
];
const isEligible = computed(() =>
  BOOST_ELIGIBLE_ORG_PLANS.includes(props.organization?.plan)
);

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '';
  }
}

async function fetchSlots() {
  loading.value = true;
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${props.organization.id}/high-volume-slots`,
      axiosConfig({ userAuth: true })
    );
    slots.value = res.data.slots || [];
    slotCount.value = res.data.slot_count || 0;
    filledCount.value = res.data.slots_filled || 0;
  } catch (e) {
    store.commit('snackbar', e?.response?.data?.message || 'Failed to load slots.');
  } finally {
    loading.value = false;
  }
}

async function fetchAudit() {
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${props.organization.id}/high-volume-slots/audit?limit=10`,
      axiosConfig({ userAuth: true })
    );
    auditEntries.value = res.data.entries || [];
  } catch {
    auditEntries.value = [];
  }
}

let searchTimer = null;
function onPickerSearch(q) {
  pickerQuery.value = q || '';
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchEligible(pickerQuery.value), 200);
}

async function fetchEligible(q) {
  pickerLoading.value = true;
  try {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${props.organization.id}/high-volume-slots/eligible-users${params}`,
      axiosConfig({ userAuth: true })
    );
    eligibleUsers.value = (res.data.users || []).map(u => ({
      id: u.id,
      label: u.display_name ? `${u.display_name} (${u.email})` : u.email,
    }));
  } catch {
    eligibleUsers.value = [];
  } finally {
    pickerLoading.value = false;
  }
}

function openPicker(slotIndex) {
  activeSlotIndex.value = slotIndex;
  pickedUserId.value = null;
  pickerQuery.value = '';
  eligibleUsers.value = [];
  pickerOpen.value = true;
  fetchEligible('');
}

async function submitAssignment() {
  if (!pickedUserId.value || !activeSlotIndex.value) return;
  assigning.value = true;
  try {
    const res = await axios.post(
      `${urlBase.userApi}/organizations/${props.organization.id}/high-volume-slots/${activeSlotIndex.value}/assign`,
      { user_id: pickedUserId.value },
      axiosConfig({ userAuth: true })
    );
    slots.value = res.data.slots || [];
    slotCount.value = res.data.slot_count || 0;
    filledCount.value = res.data.slots_filled || 0;
    usageRefreshToken.value++;
    pickerOpen.value = false;
    fetchAudit();
    store.commit('snackbar', 'Slot assigned. Cap takes effect within ~60s.');
  } catch (e) {
    store.commit('snackbar', e?.response?.data?.message || 'Failed to assign slot.');
  } finally {
    assigning.value = false;
  }
}

function confirmRevoke(slotIndex) {
  revokeSlotIndex.value = slotIndex;
  revokeOpen.value = true;
}

async function submitRevoke() {
  if (!revokeSlotIndex.value) return;
  revoking.value = true;
  try {
    const res = await axios.post(
      `${urlBase.userApi}/organizations/${props.organization.id}/high-volume-slots/${revokeSlotIndex.value}/revoke`,
      {},
      axiosConfig({ userAuth: true })
    );
    slots.value = res.data.slots || [];
    slotCount.value = res.data.slot_count || 0;
    filledCount.value = res.data.slots_filled || 0;
    usageRefreshToken.value++;
    revokeOpen.value = false;
    fetchAudit();
    store.commit('snackbar', 'Slot revoked.');
  } catch (e) {
    store.commit('snackbar', e?.response?.data?.message || 'Failed to revoke.');
  } finally {
    revoking.value = false;
  }
}

watch(
  () => props.organization?.id,
  (id) => {
    if (id && isEligible.value) {
      fetchSlots();
      fetchAudit();
    }
  },
);

onMounted(() => {
  if (isEligible.value) {
    fetchSlots();
    fetchAudit();
  } else {
    loading.value = false;
  }
});
</script>

<style scoped>
.slot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slot-row {
  display: grid;
  grid-template-columns: minmax(220px, 1.4fr) minmax(180px, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border: 1px solid #E0E0E0;
  border-radius: 8px;
}
.slot-row-main { display: flex; flex-direction: column; gap: 2px; }
.slot-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.4px; }
.slot-row-actions { display: flex; gap: 4px; justify-content: flex-end; }
.audit-list { font-size: 13px; }
.audit-header { font-weight: 500; margin-bottom: 6px; }
.audit-entry { color: #555; padding: 2px 0; }
.audit-action { font-weight: 500; text-transform: capitalize; }
.audit-target { font-weight: 500; }
.audit-time { color: #888; margin-left: 6px; }
</style>
