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

    <!-- ROR ID -->
    <SettingsRow
      label="ROR ID"
      description="Research Organization Registry identifier"
    >
      <template v-if="isAdmin">
        <input
          v-model="editableRorId"
          type="text"
          class="settings-text-input"
          placeholder="https://ror.org/..."
          @blur="saveRorId"
          @keydown.enter="$event.target.blur()"
        />
      </template>
      <template v-else>
        <a v-if="organization.ror_id" :href="organization.ror_id" target="_blank" class="text-body-2">
          {{ organization.ror_id }}
        </a>
        <span v-else class="text-medium-emphasis">—</span>
      </template>
    </SettingsRow>

    <!-- Created -->
    <SettingsRow label="Created" description="When this organization was created in our system">
      <Tooltip v-if="organization.created">
        <TooltipTrigger>
          <span class="text-sm">{{ formatAge(organization.created) }}</span>
        </TooltipTrigger>
        <TooltipContent>{{ formatDateTime(organization.created) }}</TooltipContent>
      </Tooltip>
      <span v-else class="text-muted-foreground">—</span>
    </SettingsRow>

    <!-- Members -->
    <SettingsRow
      label="Members"
      description="Manage organization members"
      clickable
      @click="goToMembers"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground">{{ memberCountText }}</span>
        <ChevronRight class="h-4 w-4 text-muted-foreground" />
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

import { ChevronRight } from 'lucide-vue-next';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

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
  isAdmin: {
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
  if (props.isAdmin) {
    // Admin view - could navigate to a members section or stay on page
    // For now, scroll to members or navigate to org members page
    router.push(`/admin/organizations/${props.organization.id}/members`);
  } else {
    router.push('/settings/org-members');
  }
}

// Editable fields
const editableName = ref('');
const editableDomains = ref('');
const editableRorId = ref('');

watch(() => props.organization?.name, (newVal) => {
  editableName.value = newVal || '';
}, { immediate: true });

watch(() => props.organization?.domains, (newVal) => {
  editableDomains.value = newVal?.join(', ') || '';
}, { immediate: true });

watch(() => props.organization?.ror_id, (newVal) => {
  editableRorId.value = newVal || '';
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

async function saveRorId() {
  const trimmed = editableRorId.value.trim();
  if (trimmed === (props.organization?.ror_id || '')) return;

  // Validate ROR ID format if not empty
  if (trimmed && !trimmed.startsWith('https://ror.org/')) {
    store.commit('snackbar', 'ROR ID must start with https://ror.org/');
    editableRorId.value = props.organization?.ror_id || '';
    return;
  }

  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${props.organization.id}`,
      { ror_id: trimmed || null },
      axiosConfig({ userAuth: true })
    );
    store.commit('snackbar', 'ROR ID updated');
    emit('updated');
  } catch (err) {
    console.error('Failed to update ROR ID:', err);
    store.commit('snackbar', 'Failed to update ROR ID');
    editableRorId.value = props.organization?.ror_id || '';
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
