<template>
  <div>
    <!-- Breadcrumbs -->
    <DashboardBreadcrumbs :items="breadcrumbItems" />
    
    <div v-if="loading" class="flex justify-center items-center h-[300px]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
    
    <div v-else-if="user">
      <!-- User header -->
      <div class="flex items-center mb-6">
        <Avatar class="h-[72px] w-[72px] mr-4" :style="{ backgroundColor: getAvatarColor(user) }">
          <AvatarImage 
            v-if="user.gravatar_url" 
            :src="user.gravatar_url"
            :alt="user.display_name"
          />
          <AvatarFallback class="text-white text-2xl font-medium">
            {{ getInitial(user) }}
          </AvatarFallback>
        </Avatar>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold">{{ user.display_name || 'No name' }}</h1>
            <Badge
              v-if="user.is_admin"
              variant="secondary"
              class="bg-amber-100 text-amber-700"
            >
              <Crown class="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <div class="text-base text-muted-foreground">{{ user.email || 'No email' }}</div>
        </div>
      </div>
      
      <Card>
        <CardContent class="pt-6">
          <!-- Key-value pairs -->
          <div>
            <div v-for="field in userFields" :key="field.key" class="flex py-3 border-b border-border last:border-b-0">
              <div class="w-[160px] flex-shrink-0 text-sm text-muted-foreground">{{ field.label }}</div>
              <div class="flex-1 text-[15px] break-words">
                <template v-if="field.type === 'chip'">
                  <Badge v-if="field.value" variant="secondary">
                    {{ field.value }}
                  </Badge>
                  <span v-else class="text-muted-foreground">—</span>
                </template>
                <template v-else-if="field.type === 'boolean'">
                  <CheckCircle v-if="field.value" class="h-4 w-4 text-green-500" />
                  <XCircle v-else class="h-4 w-4 text-muted-foreground" />
                </template>
                <template v-else-if="field.type === 'date'">
                  <Tooltip v-if="field.value">
                    <TooltipTrigger>
                      <span>{{ field.value }}</span>
                    </TooltipTrigger>
                    <TooltipContent>{{ formatDateTime(field.raw) }}</TooltipContent>
                  </Tooltip>
                  <span v-else class="text-muted-foreground">—</span>
                </template>
                <template v-else-if="field.type === 'code'">
                  <code v-if="field.value" class="bg-muted px-2 py-0.5 rounded text-sm">{{ field.value }}</code>
                  <span v-else class="text-muted-foreground">—</span>
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
        </CardContent>
      </Card>
    </div>
    
    <Alert v-else-if="error" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { format } from 'timeago.js';

import { Crown, CheckCircle, XCircle, AlertCircle } from 'lucide-vue-next';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { urlBase, axiosConfig } from '@/apiConfig';
import ApiKeyDisplay from '@/components/ApiKeyDisplay.vue';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';

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

const user = ref(null);

const breadcrumbItems = computed(() => [
  { text: 'Settings', to: '/settings/org-profile' },
  { text: 'Members', to: '/settings/org-members' },
  { text: user.value?.display_name || user.value?.email || 'Member' }
]);
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
/* Styles handled via Tailwind classes */
</style>
