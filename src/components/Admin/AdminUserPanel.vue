<template>
  <v-navigation-drawer
    :model-value="!!userId"
    location="right"
    temporary
    width="450"
    @update:model-value="onClose"
  >
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    
    <div v-else-if="user" class="pa-4">
      <!-- Header with expand button -->
      <div class="d-flex align-center mb-4">
        <v-btn
          icon
          variant="text"
          size="small"
          :to="`/admin/users/${user.id}`"
          class="mr-2"
        >
          <v-icon>mdi-arrow-expand</v-icon>
          <v-tooltip activator="parent" location="bottom">Open full page</v-tooltip>
        </v-btn>
        <v-spacer />
        <v-btn
          icon
          variant="text"
          size="small"
          @click="onClose"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      
      <!-- User header -->
      <div class="d-flex align-center mb-6">
        <v-avatar size="56" class="mr-4" :color="getAvatarColor(user)">
          <v-img 
            v-if="user.gravatar_url" 
            :src="user.gravatar_url"
            :alt="user.name"
          />
          <span v-else class="text-white text-h5 font-weight-medium">
            {{ getInitial(user) }}
          </span>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold">{{ user.name || 'No name' }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ user.email || 'No email' }}</div>
        </div>
      </div>
      
      <v-divider class="mb-4" />
      
      <!-- Key-value pairs -->
      <div class="user-details">
        <div v-for="field in userFields" :key="field.key" class="detail-row d-flex py-2">
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
            <template v-else>
              {{ field.value || '—' }}
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="error" class="pa-4">
      <v-alert type="error" density="compact">{{ error }}</v-alert>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminUserPanel' });

const props = defineProps({
  userId: String,
});

const emit = defineEmits(['close']);

const user = ref(null);
const loading = ref(false);
const error = ref('');

// Avatar colors
const avatarColors = [
  '#1976D2', '#388E3C', '#D32F2F', '#7B1FA2', 
  '#C2185B', '#0097A7', '#F57C00', '#5D4037'
];

// Watch for userId changes
watch(() => props.userId, async (newId) => {
  if (newId) {
    await fetchUser(newId);
  } else {
    user.value = null;
  }
}, { immediate: true });

async function fetchUser(id) {
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/users/${id}`,
      axiosConfig({ userAuth: true })
    );
    user.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load user.';
    user.value = null;
  } finally {
    loading.value = false;
  }
}

function onClose() {
  emit('close');
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

function getRole(user) {
  if (user.is_admin) return 'Admin';
  if (user.is_librarian) return 'Librarian';
  return 'User';
}

function getRoleColor(user) {
  if (user.is_admin) return 'error';
  if (user.is_librarian) return 'info';
  return 'default';
}

function getListCount(val) {
  if (Array.isArray(val)) return val.length;
  return null;
}

const userFields = computed(() => {
  if (!user.value) return [];
  
  const u = user.value;
  const fields = [];
  
  // ID
  fields.push({ key: 'id', label: 'ID', value: u.id, type: 'code' });
  
  // Organization
  fields.push({ key: 'org_name', label: 'Organization', value: u.org_name });
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Plan', 
    value: u.plan ? formatPlan(u.plan) : null, 
    type: 'chip',
    color: getPlanColor(u.plan)
  });
  
  // Plan expires
  fields.push({ 
    key: 'plan_expires_at', 
    label: 'Plan Expires', 
    value: u.plan_expires_at ? formatAge(u.plan_expires_at) : null,
    raw: u.plan_expires_at,
    type: 'date'
  });
  
  // API Key
  fields.push({ key: 'api_key', label: 'API Key', value: u.api_key, type: 'code' });
  
  // Role
  fields.push({ 
    key: 'role', 
    label: 'Role', 
    value: getRole(u), 
    type: 'chip',
    color: getRoleColor(u)
  });
  
  // Author ID
  fields.push({ key: 'author_id', label: 'Author ID', value: u.author_id, type: 'code' });
  
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
  width: 140px;
  flex-shrink: 0;
  font-size: 13px;
}

.detail-value {
  flex: 1;
  font-size: 14px;
  word-break: break-word;
}

code {
  background-color: rgba(0, 0, 0, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
