<template>
  <div>
    <!-- Back button -->
    <div class="mb-4">
      <v-btn
        variant="text"
        prepend-icon="mdi-arrow-left"
        class="text-none"
        @click="goBack"
      >
        {{ backButtonLabel }}
      </v-btn>
    </div>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>
    
    <div v-else-if="user">
      <!-- User header -->
      <div class="d-flex align-center mb-6">
        <v-avatar size="72" class="mr-4" :color="getAvatarColor(user)">
          <v-img 
            v-if="user.gravatar_url" 
            :src="user.gravatar_url"
            :alt="user.name"
          />
          <span v-else class="text-white text-h4 font-weight-medium">
            {{ getInitial(user) }}
          </span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="text-h4 font-weight-bold">{{ user.name || 'No name' }}</h1>
            <v-chip
              v-if="user.is_admin"
              size="small"
              color="amber-darken-2"
              variant="tonal"
            >
              <v-icon start size="small">mdi-crown</v-icon>
              Admin
            </v-chip>
          </div>
          <div class="text-body-1 text-medium-emphasis">{{ user.email || 'No email' }}</div>
        </div>
      </div>
      
      <v-card flat variant="outlined" class="bg-white">
        <v-card-text>
          <!-- Key-value pairs -->
          <div class="user-details">
            <div v-for="field in userFields" :key="field.key" class="detail-row d-flex py-3">
              <div class="detail-key text-medium-emphasis">{{ field.label }}</div>
              <div class="detail-value">
                <template v-if="field.type === 'chip'">
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
                <template v-else-if="field.type === 'boolean'">
                  <v-icon v-if="field.value" color="success" size="small">mdi-check-circle</v-icon>
                  <v-icon v-else color="grey" size="small">mdi-close-circle</v-icon>
                </template>
                <template v-else-if="field.type === 'date'">
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
                <template v-else-if="field.type === 'api_key'">
                  <div 
                    v-if="field.value" 
                    class="api-key-wrapper"
                    @click="copyToClipboard(field.value)"
                  >
                    <code class="api-key-code">{{ field.value }}</code>
                    <v-icon size="x-small" class="ml-2 copy-icon">mdi-content-copy</v-icon>
                  </div>
                  <span v-else class="text-medium-emphasis">—</span>
                </template>
                <template v-else-if="field.type === 'organization'">
                  <div v-if="field.value" class="d-flex align-center ga-2">
                    <router-link :to="`/admin/organizations/${field.orgId}`" class="text-primary">
                      {{ field.value }}
                    </router-link>
                    <v-chip
                      v-if="field.isOwner"
                      size="x-small"
                      color="primary"
                      variant="outlined"
                    >
                      Owner
                    </v-chip>
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
    </div>
    
    <v-alert v-else-if="error" type="error" density="compact">{{ error }}</v-alert>
    
    <!-- Copy snackbar -->
    <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="black" location="top">
      API key copied
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminUserDetail' });

const route = useRoute();
const router = useRouter();

// Dynamic back button label based on where user came from
const backButtonLabel = computed(() => {
  const fromOrg = route.query.from_org;
  if (fromOrg) {
    return `Back to ${fromOrg}`;
  }
  return 'Back to Users';
});

function goBack() {
  router.back();
}

const user = ref(null);
const organization = ref(null);
const loading = ref(false);
const error = ref('');
const showCopySnackbar = ref(false);

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopySnackbar.value = true;
  } catch (e) {
    console.error('Failed to copy:', e);
  }
}

// Avatar colors
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

onMounted(() => {
  fetchUser();
});

async function fetchUser() {
  const userId = route.params.userId;
  if (!userId) {
    error.value = 'No user ID provided';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/users/${userId}`,
      axiosConfig({ userAuth: true })
    );
    user.value = res.data;
    
    // Fetch organization if user has one
    if (res.data.organization_id) {
      fetchOrganization(res.data.organization_id);
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load user.';
    user.value = null;
  } finally {
    loading.value = false;
  }
}

async function fetchOrganization(orgId) {
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${orgId}`,
      axiosConfig({ userAuth: true })
    );
    organization.value = res.data;
  } catch (e) {
    console.error('Failed to fetch organization:', e);
    organization.value = null;
  }
}

function getInitial(user) {
  if (user.name) return user.name.charAt(0).toUpperCase();
  if (user.email) return user.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(user) {
  const str = user.id || user.email || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
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

function formatPlan(plan) {
  const planLabels = {
    'starter': 'Starter',
    '1M-daily': '1M Daily',
    '2M-daily': '2M Daily',
    'academic-waiver': 'Waiver',
  };
  return planLabels[plan] || plan;
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


function getListCount(val) {
  if (Array.isArray(val)) return val.length;
  return null;
}

const userFields = computed(() => {
  if (!user.value) return [];
  
  const u = user.value;
  const fields = [];
  
  // Organization
  fields.push({ 
    key: 'organization', 
    label: 'Organization', 
    value: organization.value?.name || null,
    orgId: u.organization_id,
    isOwner: u.organization_role === 'owner',
    type: 'organization'
  });
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Plan', 
    value: u.plan ? formatPlan(u.plan) : null, 
    type: 'chip',
    color: getPlanColor(u.plan)
  });
  
  // Plan expires (only show if there's a plan)
  if (u.plan) {
    fields.push({ 
      key: 'plan_expires_at', 
      label: 'Plan Expires', 
      value: u.plan_expires_at ? formatAge(u.plan_expires_at) : null,
      raw: u.plan_expires_at,
      type: 'date'
    });
  }
  
  // API Key
  fields.push({ key: 'api_key', label: 'API Key', value: u.api_key, type: 'api_key' });
  
  // Last seen
  fields.push({ 
    key: 'last_seen', 
    label: 'Last Seen', 
    value: u.last_seen ? formatAge(u.last_seen) : null,
    raw: u.last_seen,
    type: 'date'
  });
  
  // Created
  fields.push({ 
    key: 'created', 
    label: 'Created', 
    value: u.created ? formatAge(u.created) : null,
    raw: u.created,
    type: 'date'
  });
  
  // Updated
  if (u.updated) {
    fields.push({ 
      key: 'updated', 
      label: 'Updated', 
      value: formatAge(u.updated),
      raw: u.updated,
      type: 'date'
    });
  }
  
  // List fields - show count
  const listFields = [
    { key: 'exports', label: 'Exports' },
    { key: 'saved_searches', label: 'Saved Searches' },
    { key: 'corrections', label: 'Corrections' },
    { key: 'collections', label: 'Collections' },
  ];
  
  for (const lf of listFields) {
    const count = getListCount(u[lf.key]);
    if (count !== null) {
      fields.push({ key: lf.key, label: lf.label, value: `${count} item${count !== 1 ? 's' : ''}` });
    }
  }
  
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
  
  &:hover {
    border-color: rgba(0, 0, 0, 0.4);
    
    .copy-icon {
      opacity: 1;
    }
  }
  
  &:active {
    border-color: rgb(var(--v-theme-primary));
  }
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
