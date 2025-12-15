<template>
  <SettingsSection title="Profile">
    <!-- Name -->
    <SettingsRow
      label="Name"
      description="Display name"
    >
      <template v-if="canEdit">
        <input
          v-model="editableName"
          type="text"
          class="settings-text-input"
          placeholder="Enter name"
          @blur="saveName"
          @keydown.enter="$event.target.blur()"
        />
      </template>
      <span v-else class="text-body-2">{{ user.display_name || '—' }}</span>
    </SettingsRow>

    <!-- Email -->
    <SettingsRow
      label="Email"
      description="Account email address"
    >
      <span class="text-body-2">{{ user.email || '—' }}</span>
    </SettingsRow>

    <!-- Created -->
    <SettingsRow
      label="Created"
      description="When this account was created"
    >
      <Tooltip v-if="user.created">
        <TooltipTrigger>
          <span class="text-sm">{{ formatAge(user.created) }}</span>
        </TooltipTrigger>
        <TooltipContent>{{ formatDateTime(user.created) }}</TooltipContent>
      </Tooltip>
      <span v-else class="text-muted-foreground">—</span>
    </SettingsRow>

    <!-- Last seen -->
    <SettingsRow
      v-if="isAdmin"
      label="Last seen"
      description="Most recent activity"
    >
      <Tooltip v-if="user.last_seen">
        <TooltipTrigger>
          <span class="text-sm">{{ formatAge(user.last_seen) }}</span>
        </TooltipTrigger>
        <TooltipContent>{{ formatDateTime(user.last_seen) }}</TooltipContent>
      </Tooltip>
      <span v-else class="text-muted-foreground">—</span>
    </SettingsRow>
  </SettingsSection>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { format } from 'timeago.js';
import axios from 'axios';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';

const props = defineProps({
  user: {
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

const editableName = ref('');

watch(() => props.user?.display_name, (newVal) => {
  editableName.value = newVal || '';
}, { immediate: true });

async function saveName() {
  const trimmed = editableName.value.trim();
  if (trimmed === (props.user?.display_name || '')) return;

  try {
    if (props.isAdmin) {
      await axios.patch(
        `${urlBase.userApi}/admin/users/${props.user.id}`,
        { display_name: trimmed || null },
        axiosConfig({ userAuth: true })
      );
    } else {
      await store.dispatch('user/updateName', trimmed);
    }
    store.commit('snackbar', 'Name updated');
    emit('updated');
  } catch (err) {
    console.error('Failed to update name:', err);
    store.commit('snackbar', 'Failed to update name');
    editableName.value = props.user?.display_name || '';
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
</style>
