<template>
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

    <!-- OpenAlex ID (admin view only) -->
    <SettingsRow
      v-if="adminView"
      label="OpenAlex ID"
      description="OpenAlex institution identifier"
    >
      <input
        v-model="editableOpenalexId"
        type="text"
        class="settings-text-input"
        placeholder="https://openalex.org/I..."
        @blur="saveOpenalexId"
        @keydown.enter="$event.target.blur()"
      />
    </SettingsRow>

    <!-- Created (admin view only) -->
    <SettingsRow v-if="adminView" label="Created" description="When this organization was created in our system">
      <v-tooltip v-if="organization.created" :text="formatDateTime(organization.created)" location="top">
        <template #activator="{ props }">
          <span v-bind="props" class="text-body-2">{{ formatAge(organization.created) }}</span>
        </template>
      </v-tooltip>
      <span v-else class="text-medium-emphasis">—</span>
    </SettingsRow>

    <!-- Members -->
    <SettingsRow
      label="Members"
      description="Manage organization members"
      clickable
      @click="goToMembers"
    >
      <div class="d-flex align-center ga-2">
        <span class="text-body-2 text-medium-emphasis">{{ memberCountText }}</span>
        <v-icon size="18" color="grey">mdi-chevron-right</v-icon>
      </div>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { format } from 'timeago.js';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  organization: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  adminView: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['updated']);

const store = useStore();
const router = useRouter();

const memberCountText = computed(() => {
  const count = props.organization?.members?.length || 0;
  return count === 1 ? '1 member' : `${count} members`;
});

function goToMembers() {
  if (props.adminView) {
    // Admin view - navigate to admin members page
    router.push(`/admin/organizations/${props.organization.id}/members`);
  } else {
    router.push('/settings/org-members');
  }
}

// Editable fields
const editableName = ref('');
const editableDomains = ref('');
const editableOpenalexId = ref('');

watch(() => props.organization?.name, (newVal) => {
  editableName.value = newVal || '';
}, { immediate: true });

watch(() => props.organization?.domains, (newVal) => {
  editableDomains.value = newVal?.join(', ') || '';
}, { immediate: true });

watch(() => props.organization?.openalex_id, (newVal) => {
  editableOpenalexId.value = newVal || '';
}, { immediate: true });

async function saveName() {
  const trimmed = editableName.value.trim();
  if (!trimmed || trimmed === props.organization?.name) {
    editableName.value = props.organization?.name || '';
    return;
  }

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { name: trimmed },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Name updated');
    emit('updated');
  } catch (err) {
    console.error('Failed to update name:', err);
    store.commit('snackbar', 'Failed to update name');
    editableName.value = props.organization?.name || '';
  }
}

async function saveDomains() {
  const trimmed = editableDomains.value.trim();
  const currentDomains = props.organization?.domains?.join(', ') || '';
  if (trimmed === currentDomains) return;

  const domainsArray = trimmed
    ? trimmed.split(',').map(d => d.trim()).filter(d => d)
    : [];

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { domains: domainsArray },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'Domains updated');
    emit('updated');
  } catch (err) {
    console.error('Failed to update domains:', err);
    const errorMessage = err.response?.data?.message || err.response?.data?.error || '';
    if (errorMessage.includes('already associated with organization')) {
      store.commit('snackbar', errorMessage);
    } else {
      store.commit('snackbar', 'Failed to update domains');
    }
    editableDomains.value = props.organization?.domains?.join(', ') || '';
  }
}

async function saveOpenalexId() {
  const trimmed = editableOpenalexId.value.trim();
  if (trimmed === (props.organization?.openalex_id || '')) return;

  // Validate OpenAlex ID format if not empty
  if (trimmed && !trimmed.startsWith('https://openalex.org/I')) {
    store.commit('snackbar', 'OpenAlex ID must start with https://openalex.org/I');
    editableOpenalexId.value = props.organization?.openalex_id || '';
    return;
  }

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { openalex_id: trimmed || null },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'OpenAlex ID updated');
    emit('updated');
  } catch (err) {
    console.error('Failed to update OpenAlex ID:', err);
    store.commit('snackbar', 'Failed to update OpenAlex ID');
    editableOpenalexId.value = props.organization?.openalex_id || '';
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
</script>

<style scoped>
.settings-text-input {
  font-size: 14px;
  padding: 0 12px;
  height: 32px;
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
