<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">Plans</h1>
    </div>

    <!-- Error alert -->
    <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>

    <!-- Loading state -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Plans grid -->
    <div v-else class="plans-grid">
      <v-card
        v-for="plan in plans"
        :key="plan.name"
        variant="outlined"
        rounded="lg"
        class="plan-card"
      >
        <v-card-title class="text-h6">{{ plan.display_name || plan.name }}</v-card-title>
        <v-card-text>
          <div class="d-flex flex-column ga-3">
            <!-- Display all plan fields dynamically -->
            <div
              v-for="field in getPlanFields(plan)"
              :key="field.key"
              class="plan-field"
            >
              <!-- For field (users/orgs) - display as comma-separated text -->
              <template v-if="field.key === 'for' && field.isArray">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-medium-emphasis field-label">{{ field.label }}</span>
                  <span class="font-weight-medium text-right field-value">
                    {{ field.value.join(', ') || '—' }}
                  </span>
                </div>
              </template>

              <!-- Benefits as bullet list with checkmarks -->
              <template v-else-if="field.isBenefits">
                <div class="d-flex justify-space-between align-start">
                  <span class="text-medium-emphasis field-label">{{ field.label }}</span>
                </div>
                <ul v-if="field.value.length" class="benefits-list mt-2">
                  <li v-for="(item, idx) in field.value" :key="idx" class="benefit-item">
                    <v-icon size="16" color="success" class="mr-2">mdi-check</v-icon>
                    <span class="text-body-2">{{ item }}</span>
                  </li>
                </ul>
                <div v-else class="text-medium-emphasis text-body-2 mt-1">—</div>
              </template>

              <!-- Regular array values - display as comma-separated text -->
              <template v-else-if="field.isArray">
                <div class="d-flex justify-space-between align-start">
                  <span class="text-medium-emphasis field-label">{{ field.label }}</span>
                  <span class="font-weight-medium text-right field-value">
                    {{ field.value.join(', ') || '—' }}
                  </span>
                </div>
              </template>

              <!-- Regular scalar values -->
              <template v-else>
                <div class="d-flex justify-space-between align-start">
                  <span class="text-medium-emphasis field-label">{{ field.label }}</span>
                  <span 
                    class="font-weight-medium text-right field-value"
                    :class="{ 'text-mono': field.isMono }"
                  >
                    {{ field.displayValue }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && plans.length === 0" class="text-center text-medium-emphasis py-8">
      No plans found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'AdminPlans' });

const plans = ref([]);
const loading = ref(false);
const error = ref('');

// Field configuration for display
const fieldConfig = {
  name: { label: 'Internal name', isMono: true, skip: true },
  display_name: { label: 'Display name', skip: true }, // Already shown in title
  segment: { label: 'Segment' },
  for: { label: 'For', isArray: true },
  api_max_per_day: { label: 'API limit (per day)', format: 'number' },
  member_api_max_per_day: { label: 'Member API limit (per day)', format: 'number' },
  daily_requests: { label: 'Daily requests', format: 'number' },
  monthly_requests: { label: 'Monthly requests', format: 'number' },
  price: { label: 'Price', format: 'price' },
  user_count: { label: 'Users on plan', format: 'number' },
  org_count: { label: 'Organizations on plan', format: 'number' },
  benefits: { label: 'Benefits', isArray: true, isBenefits: true },
  member_benefits: { label: 'Member benefits', isArray: true, isBenefits: true },
  created: { label: 'Created', format: 'date' },
  updated: { label: 'Updated', format: 'date' },
};

function getSegmentIcon(segment) {
  const s = (segment || '').toLowerCase();
  if (s.includes('enterprise') || s.includes('business') || s.includes('commercial')) {
    return 'mdi-domain';
  }
  if (s.includes('academ') || s.includes('education') || s.includes('university') || s.includes('institution')) {
    return 'mdi-school';
  }
  return 'mdi-tag-outline';
}

function getForIcon(item) {
  const i = (item || '').toLowerCase();
  if (i.includes('user') || i.includes('individual') || i.includes('person')) {
    return 'mdi-account-outline';
  }
  if (i.includes('org') || i.includes('team') || i.includes('company') || i.includes('institution')) {
    return 'mdi-domain';
  }
  return 'mdi-tag-outline';
}

function getPlanFields(plan) {
  const fields = [];
  
  // First, add configured fields in order
  for (const [key, config] of Object.entries(fieldConfig)) {
    if (config.skip) continue;
    if (plan[key] !== undefined && plan[key] !== null) {
      fields.push({
        key,
        label: config.label,
        value: plan[key],
        displayValue: formatValue(plan[key], config.format),
        isArray: config.isArray || false,
        isBenefits: config.isBenefits || false,
        isMono: config.isMono || false,
      });
    }
  }
  
  // Then, add any unknown fields that weren't in our config
  for (const [key, value] of Object.entries(plan)) {
    if (fieldConfig[key] || value === null || value === undefined) continue;
    
    const isArray = Array.isArray(value);
    fields.push({
      key,
      label: formatFieldName(key),
      value,
      displayValue: isArray ? '' : formatValue(value),
      isArray,
      isBenefits: false,
      isMono: false,
    });
  }
  
  return fields;
}

function formatFieldName(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value, format) {
  if (value === null || value === undefined) return '—';
  
  switch (format) {
    case 'number':
      if (value === -1 || value === Infinity) return 'Unlimited';
      return typeof value === 'number' ? value.toLocaleString() : value;
    case 'price':
      if (value === 0) return 'Free';
      return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
    case 'date':
      try {
        return new Date(value).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return value;
      }
    default:
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
  }
}

async function fetchPlans() {
  loading.value = true;
  error.value = '';

  try {
    const res = await axios.get(
      `${urlBase.userApi}/plans`,
      axiosConfig({ userAuth: true })
    );
    plans.value = res.data.results || [];
    console.log('Plans data:', plans.value); // Log to see all available fields
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to fetch plans.';
    plans.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped lang="scss">
.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.plan-card {
  background-color: white;
}

.plan-field {
  padding-bottom: 8px;
  border-bottom: 1px solid #F0F0F0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.field-label {
  font-size: 13px;
  min-width: 140px;
}

.field-value {
  font-size: 14px;
  max-width: 180px;
  word-break: break-word;
}

.text-mono {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 13px;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  
  .v-icon {
    flex-shrink: 0;
    margin-top: 2px;
  }
}
</style>
