<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">Organization Profile</h1>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <!-- Error state -->
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <template v-else-if="organization">
      <SettingsSection title="Organization Details">
        <!-- Name -->
        <SettingsRow
          label="Name"
          description="Your organization's display name"
          full-width
        >
          <template v-if="canEdit">
            <input
              v-model="editableName"
              type="text"
              class="settings-text-input settings-text-input--full"
              placeholder="Enter organization name"
              @blur="saveName"
              @keydown.enter="$event.target.blur()"
            />
          </template>
          <span v-else class="text-body-2">{{ organization.name }}</span>
        </SettingsRow>

        <!-- Domains -->
        <SettingsRow
          label="Domains"
          description="Base web addresses for your organization (eg: harvard.edu)"
          full-width
        >
          <template v-if="canEdit">
            <input
              v-model="editableDomains"
              type="text"
              class="settings-text-input settings-text-input--full"
              placeholder="Set domains"
              @blur="saveDomains"
              @keydown.enter="$event.target.blur()"
            />
          </template>
          <span v-else class="text-body-2">{{ organization.domains?.join(', ') || '—' }}</span>
        </SettingsRow>

        <!-- ROR ID -->
        <SettingsRow
          label="ROR ID"
          description="Research Organization Registry identifier"
        >
          <a v-if="organization.ror_id" :href="organization.ror_id" target="_blank" class="text-body-2">
            {{ organization.ror_id }}
          </a>
          <span v-else class="text-medium-emphasis">—</span>
        </SettingsRow>

        <!-- Members count -->
        <SettingsRow
          label="Members"
          description="Members are automatically associated with your organization by matching their email address to your domains"
        >
          <span class="text-body-2">
            {{ organization.members ? `${organization.members.length} member${organization.members.length !== 1 ? 's' : ''}` : '0 members' }}
          </span>
        </SettingsRow>

        <!-- Created -->
        <SettingsRow
          label="Created"
        >
          <v-tooltip v-if="organization.created" :text="formatDateTime(organization.created)" location="top">
            <template #activator="{ props }">
              <span v-bind="props" class="text-body-2">{{ formatAge(organization.created) }}</span>
            </template>
          </v-tooltip>
          <span v-else class="text-medium-emphasis">—</span>
        </SettingsRow>
      </SettingsSection>
    </template>

    <!-- No organization -->
    <v-alert v-else type="info" variant="tonal">
      You are not part of an organization.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useHead } from '@unhead/vue';
import { format } from 'timeago.js';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

defineOptions({ name: 'SettingsOrgProfile' });

useHead({ title: 'Organization Profile' });

const store = useStore();

const organization = ref(null);
const loading = ref(true);
const error = ref('');

const organizationId = computed(() => store.state.user.organizationId);
const organizationRole = computed(() => store.state.user.organizationRole);
const isAdmin = computed(() => store.getters['user/isAdmin']);
const canEdit = computed(() => isAdmin.value || organizationRole.value === 'owner');

// Editable fields
const editableName = ref('');
const editableDomains = ref('');

watch(() => organization.value?.name, (newVal) => {
  editableName.value = newVal || '';
});

watch(() => organization.value?.domains, (newVal) => {
  editableDomains.value = newVal?.join(', ') || '';
});

async function fetchOrganization() {
  if (!organizationId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
    editableName.value = res.data.name || '';
    editableDomains.value = res.data.domains?.join(', ') || '';
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    organization.value = null;
  } finally {
    loading.value = false;
  }
}

async function saveName() {
  const trimmed = editableName.value.trim();
  if (!trimmed || trimmed === organization.value?.name) {
    editableName.value = organization.value?.name || '';
    return;
  }

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      { name: trimmed },
      axiosConfig({ userAuth: true })
    );
    organization.value.name = trimmed;
    store.commit('snackbar', 'Name updated');
  } catch (err) {
    console.error('Failed to update name:', err);
    store.commit('snackbar', 'Failed to update name');
    editableName.value = organization.value?.name || '';
  }
}

async function saveDomains() {
  const trimmed = editableDomains.value.trim();
  const currentDomains = organization.value?.domains?.join(', ') || '';
  if (trimmed === currentDomains) return;

  const domainsArray = trimmed
    ? trimmed.split(',').map(d => d.trim()).filter(d => d)
    : [];

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${organizationId.value}`,
      { domains: domainsArray },
      axiosConfig({ userAuth: true })
    );
    organization.value.domains = domainsArray;
    store.commit('snackbar', 'Domains updated');
  } catch (err) {
    console.error('Failed to update domains:', err);
    const errorMessage = err.response?.data?.message || err.response?.data?.error || '';
    if (errorMessage.includes('already associated with organization')) {
      store.commit('snackbar', errorMessage);
    } else {
      store.commit('snackbar', 'Failed to update domains');
    }
    editableDomains.value = organization.value?.domains?.join(', ') || '';
  }
}

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
    dateStr = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(dateStr);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseUTCDate(dateStr);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function formatAge(dateStr) {
  if (!dateStr) return null;
  return format(parseUTCDate(dateStr));
}

onMounted(() => {
  fetchOrganization();
});
</script>

<style scoped>
.settings-text-input {
  font-size: 14px;
  padding: 8px 12px;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A1A1A;
  min-width: 200px;
  outline: none;
  transition: border-color 0.15s;
}

.settings-text-input:hover {
  border-color: #D0D0D0;
}

.settings-text-input:focus {
  border-color: #1A1A1A;
}

.settings-text-input::placeholder {
  color: #9CA3AF;
}

.settings-text-input--full {
  width: 100%;
}
</style>
