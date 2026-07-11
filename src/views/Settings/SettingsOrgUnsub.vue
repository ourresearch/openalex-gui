<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">Unsub Access</h1>
      <v-btn variant="text" href="https://unsub.org" target="_blank">
        About Unsub
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
      <v-card variant="outlined" class="mb-6">
        <v-card-text>
          <p class="text-body-2 mb-2">
            <a href="https://unsub.org" target="_blank">Unsub</a> is a data-driven tool that helps
            libraries make smarter journal subscription decisions. It combines your institution's
            usage data, citation patterns, and open access availability to forecast the true cost
            and value of journal packages.
          </p>
          <p class="text-body-2 mb-2">
            Your OpenAlex membership includes Unsub access for up to
            <strong>{{ maxUsers }}</strong> people at your institution (typically collections
            librarians). Manage who has access below — we'll create accounts for new people and
            email them login details, usually within a few business days.
          </p>
          <p class="text-body-2 mb-0">
            New to Unsub? Start with the
            <a href="https://www.youtube.com/watch?v=dztEHqbmt58" target="_blank">latest training video</a>
            and the documentation at <a href="https://unsub.org" target="_blank">unsub.org</a>.
          </p>
        </v-card-text>
      </v-card>

      <!-- Not a member org -->
      <v-alert v-if="benefits && !benefits.benefits_eligible" type="info" variant="tonal" class="mb-6">
        Unsub access is an OpenAlex membership benefit.
        <router-link to="/pricing/institutions">Learn about membership</router-link>.
      </v-alert>

      <template v-else>
        <!-- Current access list -->
        <v-card v-if="visibleRequests.length" variant="outlined" class="mb-6">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-3">
              People with Unsub access ({{ activeCount }}/{{ maxUsers }})
            </div>
            <div v-for="req in visibleRequests" :key="req.id" class="d-flex align-center mb-2">
              <div class="flex-grow-1">
                <span class="text-body-2 font-weight-medium">{{ req.person_name }}</span>
                <span class="text-body-2 text-medium-emphasis ml-2">{{ req.person_email }}</span>
              </div>
              <v-chip size="small" variant="tonal" :color="statusColor(req.status)" class="mr-2">
                {{ statusLabel(req.status) }}
              </v-chip>
              <v-btn
                v-if="['pending', 'completed'].includes(req.status)"
                variant="text" size="small" color="error"
                @click="removeTarget = req"
              >
                Remove
              </v-btn>
            </div>
            <div v-if="activeCount > maxUsers" class="text-body-2 text-medium-emphasis mt-2">
              Your institution has more than {{ maxUsers }} people with access for historical
              reasons — that's fine, and nothing changes for them. New people can be added once
              you're below {{ maxUsers }}.
            </div>
          </v-card-text>
        </v-card>

        <!-- Request form -->
        <v-card v-if="slotsRemaining > 0" variant="outlined" class="mb-6">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-3">
              Add people ({{ slotsRemaining }} slot{{ slotsRemaining === 1 ? '' : 's' }} remaining)
            </div>
            <div v-for="(person, i) in people" :key="i" class="d-flex align-center mb-2" style="gap: 8px;">
              <v-text-field v-model="person.name" label="Name" variant="outlined" density="compact" hide-details />
              <v-text-field v-model="person.email" label="Email" type="email" variant="outlined" density="compact" hide-details />
              <v-btn v-if="people.length > 1" icon="mdi-close" variant="text" size="small" @click="people.splice(i, 1)" />
            </div>
            <v-btn
              v-if="people.length < slotsRemaining"
              variant="text" size="small" prepend-icon="mdi-plus" class="mb-3"
              @click="people.push({ name: '', email: '' })"
            >
              Add another person
            </v-btn>
            <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ formError }}
            </v-alert>
            <div>
              <v-btn color="primary" variant="flat" :loading="submitting" :disabled="!formComplete" @click="submitRequest">
                Request access
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <v-alert v-else type="info" variant="tonal" density="compact" class="mb-6">
          All included Unsub slots are in use. Removing someone above frees a slot for a new person.
        </v-alert>

        <div class="text-body-2 text-medium-emphasis">
          We provide online documentation and shared training videos for Unsub but not direct
          support. If you need consulting for additional analyses, we recommend
          <a href="mailto:SCHARESDATASCIENCE@gmail.com">Eric Schares</a>, an experienced Unsub
          super user.
        </div>
      </template>
    </template>

    <!-- Remove confirmation -->
    <v-dialog :model-value="!!removeTarget" max-width="440" @update:model-value="removeTarget = null">
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="text-h6 font-weight-bold mb-2">Remove Unsub access?</div>
          <div class="text-body-2 text-medium-emphasis">
            <template v-if="removeTarget?.status === 'pending'">
              This cancels the pending request for {{ removeTarget?.person_name }} — no account
              has been created yet.
            </template>
            <template v-else>
              This asks us to deactivate {{ removeTarget?.person_name }}'s Unsub account. They'll
              lose access to your institution's dashboards. The slot frees up right away, so you
              can add someone else immediately.
            </template>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="removeTarget = null">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="removing" @click="confirmRemove">Remove access</v-btn>
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

defineOptions({ name: 'SettingsOrgUnsub' });

useHead({ title: 'Unsub Access' });

const store = useStore();

const benefits = ref(null);
const loading = ref(true);
const error = ref('');
const people = ref([{ name: '', email: '' }]);
const submitting = ref(false);
const formError = ref('');
const removeTarget = ref(null);
const removing = ref(false);

const organizationId = computed(() => store.state.user.organizationId);
const requests = computed(() => benefits.value?.unsub?.requests || []);
// The access list: everyone occupying (or awaiting) a seat. Fully-removed and
// rejected rows are history, not access.
const visibleRequests = computed(() =>
  requests.value.filter(r => ['pending', 'completed', 'removal_requested'].includes(r.status))
);
const activeCount = computed(() => benefits.value?.unsub?.active_count || 0);
const maxUsers = computed(() => benefits.value?.unsub?.max_users || 7);
const slotsRemaining = computed(() => Math.max(0, maxUsers.value - activeCount.value));
const formComplete = computed(() =>
  people.value.length > 0 && people.value.every(p => p.name.trim() && p.email.trim())
);

function statusColor(status) {
  return { pending: 'warning', completed: 'success', removal_requested: 'grey' }[status] || 'grey';
}

function statusLabel(status) {
  return { pending: 'Being set up', completed: 'Active', removal_requested: 'Removal requested' }[status] || status;
}

async function fetchBenefits() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}/benefits`,
      axiosConfig({ userAuth: true })
    );
    benefits.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load Unsub access information.';
  } finally {
    loading.value = false;
  }
}

async function submitRequest() {
  submitting.value = true;
  formError.value = '';
  try {
    await axios.post(
      `${urlBase.userApi}/organizations/${organizationId.value}/unsub-access-requests`,
      { people: people.value.map(p => ({ name: p.name.trim(), email: p.email.trim() })) },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', "Request received — we'll email login details once the accounts are ready.");
    people.value = [{ name: '', email: '' }];
    await fetchBenefits();
  } catch (e) {
    formError.value = e?.response?.data?.message || 'Failed to submit request.';
  } finally {
    submitting.value = false;
  }
}

async function confirmRemove() {
  removing.value = true;
  try {
    await axios.post(
      `${urlBase.userApi}/organizations/${organizationId.value}/unsub-access-requests/${removeTarget.value.id}/removal`,
      {},
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', removeTarget.value.status === 'pending'
      ? 'Request cancelled.'
      : 'Removal requested — the slot is free now, so you can add someone else right away.');
    removeTarget.value = null;
    await fetchBenefits();
  } catch (e) {
    store.commit('snackbar', e?.response?.data?.message || 'Failed to request removal.');
  } finally {
    removing.value = false;
  }
}

onMounted(() => {
  fetchBenefits();
});
</script>
