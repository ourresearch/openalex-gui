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
          <p class="text-body-2 mb-0">
            Your OpenAlex membership includes Unsub access for up to
            <strong>{{ maxUsers }}</strong> people at your institution (typically collections
            librarians). Add them below and we'll create their accounts and email them login
            details, usually within a few business days.
          </p>
        </v-card-text>
      </v-card>

      <!-- Not a member org -->
      <v-alert v-if="benefits && !benefits.benefits_eligible" type="info" variant="tonal" class="mb-6">
        Unsub access is an OpenAlex membership benefit.
        <router-link to="/pricing/institutions">Learn about membership</router-link>.
      </v-alert>

      <template v-else>
        <!-- Existing requests -->
        <v-card v-if="requests.length" variant="outlined" class="mb-6">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-3">
              Your Unsub users ({{ activeCount }}/{{ maxUsers }})
            </div>
            <div v-for="req in requests" :key="req.id" class="d-flex align-center mb-2">
              <div class="flex-grow-1">
                <span class="text-body-2 font-weight-medium">{{ req.person_name }}</span>
                <span class="text-body-2 text-medium-emphasis ml-2">{{ req.person_email }}</span>
              </div>
              <v-chip size="small" variant="tonal" :color="statusColor(req.status)">
                {{ statusLabel(req.status) }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>

        <!-- Request form -->
        <v-card v-if="slotsRemaining > 0" variant="outlined" class="mb-6">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-3">
              Request access ({{ slotsRemaining }} slot{{ slotsRemaining === 1 ? '' : 's' }} remaining)
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

        <v-alert v-else-if="requests.length" type="info" variant="tonal" density="compact" class="mb-6">
          All {{ maxUsers }} Unsub slots are in use. Contact
          <a href="mailto:support@openalex.org">support@openalex.org</a> to change who has access.
        </v-alert>

        <div class="text-body-2 text-medium-emphasis">
          We provide online documentation and shared training videos for Unsub but not direct
          support. If you need consulting for additional analyses, we recommend
          <a href="mailto:SCHARESDATASCIENCE@gmail.com">Eric Schares</a>, an experienced Unsub
          super user.
        </div>
      </template>
    </template>
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

const organizationId = computed(() => store.state.user.organizationId);
const requests = computed(() => benefits.value?.unsub?.requests || []);
const activeCount = computed(() => benefits.value?.unsub?.active_count || 0);
const maxUsers = computed(() => benefits.value?.unsub?.max_users || 3);
const slotsRemaining = computed(() => Math.max(0, maxUsers.value - activeCount.value));
const formComplete = computed(() =>
  people.value.length > 0 && people.value.every(p => p.name.trim() && p.email.trim())
);

function statusColor(status) {
  return { pending: 'warning', completed: 'success', rejected: 'error' }[status] || 'grey';
}

function statusLabel(status) {
  return { pending: 'Being set up', completed: 'Active', rejected: 'Not set up' }[status] || status;
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

onMounted(() => {
  fetchBenefits();
});
</script>
