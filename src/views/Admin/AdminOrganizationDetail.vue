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
        Back to Organizations
      </v-btn>
    </div>
    
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>
    
    <div v-else-if="org">
      <!-- Organization header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-bold">{{ org.name || 'Unnamed Organization' }}</h1>
        <div v-if="org.domains && org.domains.length" class="text-body-1 text-medium-emphasis">
          {{ org.domains.join(', ') }}
        </div>
      </div>
      
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
                <template v-else-if="field.type === 'plan'">
                  <div v-if="editingPlan" class="d-flex align-center" style="width: 100%;">
                    <v-select
                      v-model="selectedPlan"
                      :items="plans"
                      item-title="name"
                      item-value="name"
                      placeholder="Select plan..."
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="max-width: 200px;"
                    >
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props" :title="formatPlan(item.raw.name)" />
                      </template>
                      <template #selection="{ item }">
                        {{ formatPlan(item.raw.name) }}
                      </template>
                    </v-select>
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
                      <v-chip :color="field.color" size="small">{{ field.value }}</v-chip>
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
      
      <!-- Members section -->
      <div v-if="org.members && org.members.length">
        <h2 class="text-h6 font-weight-bold mb-3">Members ({{ org.members.length }})</h2>
        <v-card flat variant="outlined" class="bg-white">
          <v-list density="comfortable">
            <v-list-item
              v-for="member in org.members"
              :key="member.id"
              :to="{ path: `/admin/users/${member.id}`, query: { from_org: org.name } }"
            >
              <template #prepend>
                <v-avatar size="36" class="mr-3" :color="getAvatarColor(member)">
                  <span class="text-white font-weight-medium text-body-2">
                    {{ getInitial(member) }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ member.display_name || member.email }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ member.email }}</v-list-item-subtitle>
              <template #append>
                <v-chip
                  v-if="member.organization_role === 'owner'"
                  size="x-small"
                  color="primary"
                  variant="outlined"
                >
                  Owner
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
      <div v-else class="text-medium-emphasis">
        No members in this organization.
      </div>

      <!-- Delete Organization Button -->
      <div class="mt-6">
        <v-btn
          color="error"
          variant="text"
          @click="openDeleteDialog"
        >
          <v-icon start>mdi-trash-can-outline</v-icon>
          Delete Organization
        </v-btn>
      </div>
    </div>
    
    <v-alert v-else-if="error" type="error" density="compact">{{ error }}</v-alert>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialogOpen" max-width="400">
      <v-card :loading="deleteLoading" :disabled="deleteLoading" flat rounded>
        <v-card-title>Delete Organization?</v-card-title>
        <v-card-text>This action can't be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteDialog" :disabled="deleteLoading">Cancel</v-btn>
          <v-btn 
            color="error"
            variant="flat"
            @click="deleteOrganization" 
            :disabled="deleteLoading"
          >
            Delete Organization
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
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { format } from 'timeago.js';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminOrganizationDetail' });

const store = useStore();
const route = useRoute();
const router = useRouter();

function goBack() {
  router.back();
}

const org = ref(null);
const loading = ref(false);
const error = ref('');
const showCopySnackbar = ref(false);

// Delete organization
const deleteDialogOpen = ref(false);
const deleteLoading = ref(false);

// Plan editing
const editingPlan = ref(false);
const selectedPlan = ref(null);
const plans = computed(() => store.getters.plans);

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
  fetchOrganization();
});

async function fetchOrganization() {
  const orgId = route.params.orgId;
  if (!orgId) {
    error.value = 'No organization ID provided';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.get(
      `${urlBase.userApi}/organizations/${orgId}`,
      axiosConfig({ userAuth: true })
    );
    org.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load organization.';
    org.value = null;
  } finally {
    loading.value = false;
  }
}

// Delete organization functions
function openDeleteDialog() {
  deleteDialogOpen.value = true;
}

function closeDeleteDialog() {
  deleteDialogOpen.value = false;
}

async function deleteOrganization() {
  deleteLoading.value = true;
  
  try {
    await axios.delete(
      `${urlBase.userApi}/organizations/${org.value.id}`,
      axiosConfig({ userAuth: true })
    );
    
    closeDeleteDialog();
    store.commit('snackbar', 'Organization deleted.');
    router.push('/admin/organizations');
  } catch (e) {
    console.error('Failed to delete organization:', e);
    error.value = e?.response?.data?.message || 'Failed to delete organization.';
    closeDeleteDialog();
  } finally {
    deleteLoading.value = false;
  }
}

// Plan editing functions
function openPlanEdit() {
  editingPlan.value = true;
  selectedPlan.value = org.value?.plan || null;
}

function cancelPlanEdit() {
  editingPlan.value = false;
  selectedPlan.value = null;
}

async function submitPlanEdit() {
  if (selectedPlan.value) {
    await updateOrgPlan(selectedPlan.value);
  }
}

async function deletePlan() {
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${org.value.id}`,
      { plan: null },
      axiosConfig({ userAuth: true })
    );
    await fetchOrganization();
    editingPlan.value = false;
    store.commit('snackbar', 'Plan removed.');
  } catch (e) {
    console.error('Failed to delete plan:', e);
    error.value = e?.response?.data?.message || 'Failed to remove plan.';
  }
}

async function updateOrgPlan(planName) {
  try {
    await axios.patch(
      `${urlBase.userApi}/organizations/${org.value.id}`,
      { plan: planName },
      axiosConfig({ userAuth: true })
    );
    await fetchOrganization();
    editingPlan.value = false;
    store.commit('snackbar', 'Plan changed.');
  } catch (e) {
    console.error('Failed to update plan:', e);
    error.value = e?.response?.data?.message || 'Failed to update plan.';
  }
}

function getInitial(member) {
  if (member.display_name) return member.display_name.charAt(0).toUpperCase();
  if (member.email) return member.email.charAt(0).toUpperCase();
  return '?';
}

function getAvatarColor(member) {
  const str = member.id || member.email || '';
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

const orgFields = computed(() => {
  if (!org.value) return [];
  
  const o = org.value;
  const fields = [];
  
  // ROR ID
  fields.push({ key: 'ror_id', label: 'ROR ID', value: o.ror_id, type: 'link' });
  
  // Plan
  fields.push({ 
    key: 'plan', 
    label: 'Plan', 
    value: o.plan ? formatPlan(o.plan) : null, 
    rawPlan: o.plan,
    type: 'plan',
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
