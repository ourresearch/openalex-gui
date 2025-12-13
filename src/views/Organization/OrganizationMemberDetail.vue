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
        Back to Members
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
            :alt="user.display_name"
          />
          <span v-else class="text-white text-h4 font-weight-medium">
            {{ getInitial(user) }}
          </span>
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <h1 class="text-h4 font-weight-bold">{{ user.display_name || 'No name' }}</h1>
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
                  <ApiKeyDisplay :api-key="field.value" />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';

defineOptions({ name: 'OrganizationMemberDetail' });

const props = defineProps({
  organization: {
    type: Object,
    required: true
  }
});

const route = useRoute();
const router = useRouter();
const store = useStore();

function goBack() {
  router.back();
}

const user = ref(null);
const loading = ref(false);
const error = ref('');

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
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load user.';
    user.value = null;
  } finally {
    loading.value = false;
  }
}

function getInitial(user) {
  if (user.display_name) return user.display_name.charAt(0).toUpperCase();
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

function getListCount(val) {
  if (Array.isArray(val)) return val.length;
  return null;
}

const userFields = computed(() => {
  if (!user.value) return [];
  
  const u = user.value;
  const fields = [];
  
  // Organization Role
  if (u.organization_role) {
    fields.push({ 
      key: 'organization_role', 
      label: 'Role', 
      value: u.organization_role.charAt(0).toUpperCase() + u.organization_role.slice(1),
      type: u.organization_role === 'owner' ? 'chip' : undefined,
      color: u.organization_role === 'owner' ? 'primary' : undefined
    });
  }
  
  // Organization Plan (only show if user has an organization)
  if (u.organization_id) {
    fields.push({ 
      key: 'organization_plan', 
      label: 'Organization Plan', 
      value: u.organization_plan ? getPlanDisplayName(u.organization_plan) : null
    });
  }
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Individual Plan', 
    value: u.plan ? getPlanDisplayName(u.plan) : null,
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
</style>
