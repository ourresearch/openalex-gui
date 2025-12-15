<template>
  <Sheet :open="!!userId" @update:open="val => !val && onClose()">
    <SheetContent side="right" class="w-[450px] sm:max-w-[450px]">
      <div v-if="loading" class="flex justify-center items-center h-[200px]">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      
      <div v-else-if="user" class="p-4">
        <!-- Header with expand button -->
        <div class="flex items-center mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                asChild
                class="mr-2"
              >
                <router-link :to="`/admin/users/${user.id}`">
                  <Maximize2 class="h-4 w-4" />
                </router-link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open full page</TooltipContent>
          </Tooltip>
          <div class="flex-1"></div>
          <Button
            variant="ghost"
            size="icon"
            @click="onClose"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        
        <!-- User header -->
        <div class="flex items-center mb-6">
          <Avatar class="h-14 w-14 mr-4" :style="{ backgroundColor: getAvatarColor(user) }">
            <AvatarImage 
              v-if="user.gravatar_url" 
              :src="user.gravatar_url"
              :alt="user.name"
            />
            <AvatarFallback class="text-white text-xl font-medium">
              {{ getInitial(user) }}
            </AvatarFallback>
          </Avatar>
          <div>
            <div class="text-lg font-bold">{{ user.name || 'No name' }}</div>
            <div class="text-sm text-muted-foreground">{{ user.email || 'No email' }}</div>
          </div>
        </div>
        
        <Separator class="mb-4" />
        
        <!-- Key-value pairs -->
        <div class="user-details">
          <div v-for="field in userFields" :key="field.key" class="flex py-2 border-b border-border/50 last:border-0">
            <div class="w-[140px] shrink-0 text-sm text-muted-foreground">{{ field.label }}</div>
            <div class="flex-1 text-sm break-words">
              <template v-if="field.type === 'chip'">
                <Badge
                  v-if="field.value"
                  variant="secondary"
                >
                  {{ field.value }}
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </template>
              <template v-else-if="field.type === 'boolean'">
                <CheckCircle v-if="field.value" class="h-4 w-4 text-green-600" />
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
                <code v-if="field.value" class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ field.value }}</code>
                <span v-else class="text-muted-foreground">—</span>
              </template>
              <template v-else>
                {{ field.value || '—' }}
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="error" class="p-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import axios from 'axios';
import { format } from 'timeago.js';

import { Maximize2, X, CheckCircle, XCircle, AlertCircle } from 'lucide-vue-next';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
/* Styles handled via Tailwind classes */
</style>
