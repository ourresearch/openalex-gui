<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">About</h1>
    
    <v-card flat variant="outlined" class="bg-white mb-6">
      <v-card-text>
        <!-- Key-value pairs -->
        <div class="org-details">
          <div v-for="field in orgFields" :key="field.key" class="detail-row d-flex py-3">
            <div class="detail-key text-medium-emphasis">{{ field.label }}</div>
            <div class="detail-value">
              <template v-if="field.type === 'date'">
                <v-tooltip v-if="field.value" :text="formatDateTime(field.raw)" location="top">
                  <template #activator="{ props }">
                    <span v-bind="props">{{ field.value }}</span>
                  </template>
                </v-tooltip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-else-if="field.type === 'code'">
                <code v-if="field.value" class="text-body-2">{{ field.value }}</code>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-else-if="field.type === 'link'">
                <a v-if="field.value" :href="field.value" target="_blank" class="text-primary">
                  {{ field.value }}
                </a>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-else-if="field.type === 'chip'">
                <v-chip
                  v-if="field.value"
                  size="small"
                  :color="field.color"
                  variant="tonal"
                >
                  {{ field.value }}
                </v-chip>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-else-if="field.type === 'code_list'">
                <div v-if="field.value && field.value.length" class="d-flex flex-column align-start ga-2">
                  <div 
                    v-for="(item, idx) in field.value" 
                    :key="idx" 
                    class="api-key-wrapper"
                    @click="copyToClipboard(item)"
                  >
                    <code class="api-key-code">{{ item }}</code>
                    <v-icon size="x-small" class="ml-2 copy-icon">mdi-content-copy</v-icon>
                  </div>
                </div>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template v-else>
                {{ field.value || '—' }}
              </template>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Copy snackbar -->
    <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="black" location="top">
      API key copied
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { format } from 'timeago.js';

defineOptions({ name: 'OrganizationAbout' });

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const store = useStore();
const showCopySnackbar = ref(false);

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopySnackbar.value = true;
  } catch (e) {
    console.error('Failed to copy:', e);
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
  
  // Domains
  fields.push({ 
    key: 'domains', 
    label: 'Domains', 
    value: o.domains && o.domains.length ? o.domains.join(', ') : null
  });
  
  // ROR ID
  fields.push({ key: 'ror_id', label: 'ROR ID', value: o.ror_id, type: 'link' });
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Plan', 
    value: o.plan ? getPlanDisplayName(o.plan) : null, 
    type: 'chip',
    color: getPlanColor(o.plan)
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
    value: o.api_keys && o.api_keys.length ? o.api_keys : null,
    type: 'code_list'
  });
  
  // Members count
  fields.push({ 
    key: 'members_count', 
    label: 'Members', 
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
.detail-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-key {
  width: 160px;
  flex-shrink: 0;
  font-size: 14px;
}

.detail-value {
  flex: 1;
  font-size: 15px;
  word-break: break-word;
}

code {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.api-key-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  transition: border-color 0.15s;
}

.api-key-wrapper:hover {
  border-color: rgba(0, 0, 0, 0.4);
}

.api-key-wrapper:hover .copy-icon {
  opacity: 1;
}

.api-key-wrapper:active {
  border-color: rgb(var(--v-theme-primary));
}

.api-key-code {
  font-family: 'Courier New', Courier, monospace !important;
  font-size: 13px;
  background: none;
  padding: 0;
  user-select: all;
}

.copy-icon {
  opacity: 0.5;
  transition: opacity 0.15s;
}
</style>
