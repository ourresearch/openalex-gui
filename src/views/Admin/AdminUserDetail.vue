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
                  <div v-if="editingOrg" class="d-flex align-center ga-2" style="min-width: 300px;">
                    <v-autocomplete
                      ref="orgAutocomplete"
                      v-model="selectedOrg"
                      :items="orgSearchResults"
                      :loading="orgSearchLoading"
                      item-title="name"
                      item-value="id"
                      return-object
                      placeholder="Search organizations..."
                      density="compact"
                      variant="outlined"
                      hide-details
                      autofocus
                      no-filter
                      style="flex: 1;"
                      @update:search="onOrgSearch"
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #subtitle>
                            <span v-if="item.raw.domains && item.raw.domains.length">
                              {{ item.raw.domains.join(', ') }}
                            </span>
                          </template>
                        </v-list-item>
                      </template>
                    </v-autocomplete>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="cancelOrgEdit"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="success"
                      :disabled="!selectedOrg"
                      @click="submitOrgEdit"
                    >
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                  </div>
                  <div v-else class="d-flex align-center" style="width: 100%;">
                    <template v-if="field.value">
                      <router-link :to="`/admin/organizations/${field.orgId}`" class="text-primary">
                        {{ field.value }}
                      </router-link>
                      <v-spacer />
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="openOrgEditDialog"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="deleteOrganization"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </template>
                    <template v-else>
                      <span class="text-medium-emphasis">—</span>
                      <v-spacer />
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="openOrgEditDialog"
                      >
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </template>
                  </div>
                </template>
                <template v-else-if="field.type === 'plan'">
                  <div v-if="editingPlan" class="d-flex align-center" style="width: 100%;">
                    <v-select
                      v-model="selectedPlan"
                      :items="planItems"
                      placeholder="Select plan..."
                      density="compact"
                      variant="outlined"
                      hide-details
                      clearable
                      style="min-width: 220px;"
                    />
                    <v-spacer />
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click="cancelPlanEdit"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="success"
                      :disabled="!selectedPlan"
                      @click="submitPlanEdit"
                    >
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                  </div>
                  <div v-else class="d-flex align-center" style="width: 100%;">
                    <template v-if="field.value">
                      <span>{{ field.value }}</span>
                      <v-spacer />
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="openPlanEdit"
                      >
                        <v-icon>mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="deletePlan"
                      >
                        <v-icon>mdi-trash-can-outline</v-icon>
                      </v-btn>
                    </template>
                    <template v-else>
                      <span class="text-medium-emphasis">—</span>
                      <v-spacer />
                      <v-btn
                        icon
                        size="small"
                        variant="text"
                        @click="openPlanEdit"
                      >
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </template>
                  </div>
                </template>
                <template v-else>
                  {{ field.value || '—' }}
                </template>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Delete User Button -->
      <div class="mt-6">
        <v-btn
          color="error"
          variant="text"
          @click="openDeleteDialog"
        >
          <v-icon start>mdi-trash-can-outline</v-icon>
          Delete User
        </v-btn>
      </div>
    </div>
    
    <v-alert v-else-if="error" type="error" density="compact">{{ error }}</v-alert>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card :loading="deleteLoading" :disabled="deleteLoading" flat rounded>
        <v-card-title>Delete User?</v-card-title>
        <v-card-text>This action can't be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</v-btn>
          <v-btn 
            color="error"
            variant="flat"
            @click="deleteUser" 
            :disabled="deleteLoading"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Copy snackbar -->
    <v-snackbar v-model="showCopySnackbar" :timeout="2000" color="black" location="top">
      API key copied
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminUserDetail' });

const route = useRoute();
const router = useRouter();
const store = useStore();

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
const loading = ref(false);
const error = ref('');
const showCopySnackbar = ref(false);

// Organization editing
const editingOrg = ref(false);
const orgSearchQuery = ref('');
const orgSearchResults = ref([]);
const orgSearchLoading = ref(false);
const selectedOrg = ref(null);
const orgAutocomplete = ref(null);
let orgSearchTimer = null;

// Plan editing
const editingPlan = ref(false);
const selectedPlan = ref(null);
const planItems = computed(() => {
  const allPlans = store.getters.plans || [];
  const filtered = allPlans.filter(p => p.for && p.for.includes('user'));
  return filtered.map(p => ({
    title: p.display_name,
    value: p.name
  }));
});

// Delete user
const deleteDialogOpen = ref(false);
const deleteLoading = ref(false);

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
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load user.';
    user.value = null;
  } finally {
    loading.value = false;
  }
}


function openOrgEditDialog() {
  editingOrg.value = true;
  // Pre-populate with current org if exists
  if (user.value?.organization_id && user.value?.organization_name) {
    selectedOrg.value = {
      id: user.value.organization_id,
      name: user.value.organization_name
    };
  } else {
    selectedOrg.value = null;
  }
  // Select all text in the input after it renders
  setTimeout(() => {
    const input = orgAutocomplete.value?.$el?.querySelector('input');
    if (input) {
      input.select();
    }
  }, 50);
}

function cancelOrgEdit() {
  editingOrg.value = false;
  orgSearchQuery.value = '';
  orgSearchResults.value = [];
  selectedOrg.value = null;
}

async function submitOrgEdit() {
  if (selectedOrg.value) {
    await updateUserOrganization(selectedOrg.value.id);
  }
}

async function deleteOrganization() {
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${user.value.id}`,
      { organization_id: null },
      axiosConfig({ userAuth: true })
    );
    await fetchUser();
    store.commit('snackbar', 'Organization removed.');
  } catch (e) {
    console.error('Failed to delete organization:', e);
    error.value = e?.response?.data?.message || 'Failed to remove organization.';
  }
}

// Plan editing functions
function openPlanEdit() {
  editingPlan.value = true;
  // Only set selectedPlan if the user's plan exists in available plans
  const userPlan = user.value?.plan;
  const planExists = userPlan && planItems.value.some(p => p.value === userPlan);
  selectedPlan.value = planExists ? userPlan : null;
}

function cancelPlanEdit() {
  editingPlan.value = false;
  selectedPlan.value = null;
}

async function submitPlanEdit() {
  if (selectedPlan.value) {
    await updateUserPlan(selectedPlan.value);
  }
}

async function deletePlan() {
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${user.value.id}`,
      { plan: null },
      axiosConfig({ userAuth: true })
    );
    await fetchUser();
    editingPlan.value = false;
    store.commit('snackbar', 'Plan removed.');
  } catch (e) {
    console.error('Failed to delete plan:', e);
    error.value = e?.response?.data?.message || 'Failed to remove plan.';
  }
}

async function updateUserPlan(planName) {
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${user.value.id}`,
      { plan: planName },
      axiosConfig({ userAuth: true })
    );
    await fetchUser();
    editingPlan.value = false;
    store.commit('snackbar', 'Plan changed.');
  } catch (e) {
    console.error('Failed to update plan:', e);
    error.value = e?.response?.data?.message || 'Failed to update plan.';
  }
}

// Delete user functions
function openDeleteDialog() {
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
}

async function deleteUser() {
  deleteLoading.value = true;
  
  try {
    await axios.delete(
      `${urlBase.userApi}/users/${user.value.id}`,
      axiosConfig({ userAuth: true })
    );
    
    closeDeleteDialog();
    store.commit('snackbar', 'User deleted.');
    router.push('/admin/users');
  } catch (e) {
    console.error('Failed to delete user:', e);
    error.value = e?.response?.data?.message || 'Failed to delete user.';
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
}

function onOrgSearch(val) {
  orgSearchQuery.value = val || '';
  clearTimeout(orgSearchTimer);
  
  if (!val || !val.trim()) {
    orgSearchResults.value = [];
    orgSearchLoading.value = false;
    return;
  }
  
  orgSearchLoading.value = true;
  
  orgSearchTimer = setTimeout(async () => {
    try {
      const params = new URLSearchParams({
        q: val.trim(),
        per_page: '10',
      });
      const res = await axios.get(
        `${urlBase.userApi}/organizations?${params.toString()}`,
        axiosConfig({ userAuth: true })
      );
      orgSearchResults.value = res.data.results || [];
    } catch (e) {
      console.error('Failed to search organizations:', e);
      orgSearchResults.value = [];
    } finally {
      orgSearchLoading.value = false;
    }
  }, 300);
}

function onOrgSelect(org) {
  if (org) {
    selectedOrg.value = org;
    // Update user's organization
    updateUserOrganization(org.id);
  }
}

async function updateUserOrganization(orgId) {
  try {
    await axios.patch(
      `${urlBase.userApi}/admin/users/${user.value.id}`,
      { organization_id: orgId },
      axiosConfig({ userAuth: true })
    );
    // Refresh user data
    await fetchUser();
    editingOrg.value = false;
    store.commit('snackbar', 'Organization changed.');
  } catch (e) {
    console.error('Failed to update organization:', e);
    error.value = e?.response?.data?.message || 'Failed to update organization.';
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
  
  // Organization
  fields.push({ 
    key: 'organization', 
    label: 'Organization', 
    value: u.organization_name || null,
    orgId: u.organization_id,
    type: 'organization'
  });
  
  // Organization Role
  if (u.organization_role) {
    fields.push({ 
      key: 'organization_role', 
      label: 'Organization Role', 
      value: u.organization_role.charAt(0).toUpperCase() + u.organization_role.slice(1)
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
    label: 'Plan', 
    value: u.plan ? getPlanDisplayName(u.plan) : null,
    rawPlan: u.plan,
    type: 'plan',
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
