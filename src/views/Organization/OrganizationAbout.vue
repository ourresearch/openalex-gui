<template>
  <div>
    <SettingsSection title="Organization Details">
      <!-- Name (editable) -->
      <SettingsRow
        label="Name"
        description="Your organization's display name"
        full-width
      >
        <input
          v-model="editableName"
          type="text"
          class="settings-text-input settings-text-input--full"
          placeholder="Enter organization name"
          @blur="saveName"
          @keydown.enter="$event.target.blur()"
        />
      </SettingsRow>

      <!-- Domains (editable) -->
      <SettingsRow
        label="Domains"
        description="Base web addresses for your organization (eg: harvard.edu)"
        full-width
      >
        <input
          v-model="editableDomains"
          type="text"
          class="settings-text-input settings-text-input--full"
          placeholder="Set domains"
          @blur="saveDomains"
          @keydown.enter="$event.target.blur()"
        />
      </SettingsRow>

      <!-- Other fields -->
      <SettingsRow
        v-for="field in orgFields"
        :key="field.key"
        :label="field.label"
        :description="field.description"
      >
        <!-- Date type -->
        <template v-if="field.type === 'date'">
          <Tooltip v-if="field.value">
            <TooltipTrigger>
              <span class="text-sm">{{ field.value }}</span>
            </TooltipTrigger>
            <TooltipContent>{{ formatDateTime(field.raw) }}</TooltipContent>
          </Tooltip>
          <span v-else class="text-muted-foreground">—</span>
        </template>

        <!-- Code type -->
        <template v-else-if="field.type === 'code'">
          <code v-if="field.value" class="settings-value">{{ field.value }}</code>
          <span v-else class="text-muted-foreground">—</span>
        </template>

        <!-- Link type -->
        <template v-else-if="field.type === 'link'">
          <a v-if="field.value" :href="field.value" target="_blank" class="text-body-2">
            {{ field.value }}
          </a>
          <span v-else class="text-muted-foreground">—</span>
        </template>

        <!-- Plan type -->
        <template v-else-if="field.type === 'plan'">
          <span v-if="field.value" class="settings-value">{{ field.value }}</span>
          <span v-else class="text-muted-foreground">—</span>
        </template>

        <!-- Code list type (API keys) -->
        <template v-else-if="field.type === 'code_list'">
          <div v-if="field.value && field.value.length" class="flex flex-col items-start gap-2">
            <ApiKeyDisplay 
              v-for="(item, idx) in field.value" 
              :key="idx" 
              :api-key="item"
            />
          </div>
          <span v-else class="text-muted-foreground">—</span>
        </template>

        <!-- Default type -->
        <template v-else>
          <span class="text-sm">{{ field.value || '—' }}</span>
        </template>
      </SettingsRow>
    </SettingsSection>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { format } from 'timeago.js';
import axios from 'axios';

import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

import { urlBase, axiosConfig } from '@/apiConfig';
import SettingsSection from '@/components/Settings/SettingsSection.vue';
import SettingsRow from '@/components/Settings/SettingsRow.vue';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'OrganizationAbout' });

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updated']);

const store = useStore();

// Editable name
const currentName = computed(() => props.organization?.name || '');
const editableName = ref(currentName.value);

watch(currentName, (newVal) => {
  editableName.value = newVal;
});

async function saveName() {
  const trimmed = editableName.value.trim();
  if (!trimmed || trimmed === currentName.value) {
    editableName.value = currentName.value;
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
    editableName.value = currentName.value;
  }
}

// Editable domains
const currentDomains = computed(() => 
  props.organization?.domains?.join(', ') || ''
);
const editableDomains = ref(currentDomains.value);

watch(currentDomains, (newVal) => {
  editableDomains.value = newVal;
});

async function saveDomains() {
  const trimmed = editableDomains.value.trim();
  if (trimmed === currentDomains.value) return;
  
  // Parse comma-separated domains into array
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
    
    // Check for domain conflict error
    const errorMessage = err.response?.data?.message || err.response?.data?.error || '';
    if (errorMessage.includes('already associated with organization')) {
      store.commit('snackbar', errorMessage);
    } else {
      store.commit('snackbar', 'Failed to update domains');
    }
    editableDomains.value = currentDomains.value;
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

function getPlanDisplayName(planName) {
  const allPlans = store.getters.plans || [];
  const plan = allPlans.find(p => p.name === planName);
  return plan?.display_name || planName || '';
}

function getPlanColor(plan) {
  const planColors = {
    'starter': 'grey',
    '1M-daily': 'primary',
    '2M-daily': 'primary',
    'academic-waiver': 'info',
  };
  return planColors[plan] || 'grey';
}

const orgFields = computed(() => {
  if (!props.organization) return [];
  
  const o = props.organization;
  const fields = [];
  
  // ROR ID
  fields.push({ 
    key: 'ror_id', 
    label: 'ROR ID', 
    description: '<a href="https://ror.org" target="_blank" rel="noopener">Research Organization Registry</a> identifier',
    value: o.ror_id, 
    type: 'link' 
  });
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Plan', 
    description: 'Your subscription to OpenAlex',
    value: o.plan ? getPlanDisplayName(o.plan) : null, 
    type: 'plan'
  });
  
  // Plan expires (only show if there's a plan)
  if (o.plan) {
    fields.push({ 
      key: 'plan_expires_at', 
      label: 'Plan Expires', 
      value: o.plan_expires_at ? formatAge(o.plan_expires_at) : null,
      raw: o.plan_expires_at,
      type: 'date'
    });
  }
  
  // API Keys
  fields.push({ 
    key: 'api_keys', 
    label: 'API Keys', 
    description: 'Use these to get higher rate limits in the <a href="https://docs.openalex.org" target="_blank" rel="noopener">OpenAlex API</a>',
    value: o.api_keys && o.api_keys.length ? o.api_keys : null,
    type: 'code_list'
  });
  
  // Members count
  fields.push({ 
    key: 'members_count', 
    label: 'Members', 
    description: 'Members are automatically associated with your organization by matching their email address to your domains',
    value: o.members ? `${o.members.length} member${o.members.length !== 1 ? 's' : ''}` : '0 members'
  });
  
  // Created
  fields.push({ 
    key: 'created', 
    label: 'Created', 
    value: o.created ? formatAge(o.created) : null,
    raw: o.created,
    type: 'date'
  });
  
  return fields;
});
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
