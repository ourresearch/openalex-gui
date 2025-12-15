<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">Plans</h1>
    </div>

    <!-- Error alert -->
    <Alert v-if="error" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- Plans grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="plan in plans"
        :key="plan.name"
      >
        <CardHeader>
          <CardTitle>{{ plan.display_name || plan.name }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-3">
            <!-- Display all plan fields dynamically -->
            <div
              v-for="field in getPlanFields(plan)"
              :key="field.key"
              class="pb-2 border-b border-border last:border-b-0 last:pb-0"
            >
              <!-- For field (users/orgs) - display as comma-separated text -->
              <template v-if="field.key === 'for' && field.isArray">
                <div class="flex justify-between items-center">
                  <span class="text-muted-foreground text-sm min-w-[140px]">{{ field.label }}</span>
                  <span class="font-medium text-right text-sm max-w-[180px] break-words">
                    {{ field.value.join(', ') || '—' }}
                  </span>
                </div>
              </template>

              <!-- Benefits as bullet list with checkmarks -->
              <template v-else-if="field.isBenefits">
                <div class="flex justify-between items-start">
                  <span class="text-muted-foreground text-sm min-w-[140px]">{{ field.label }}</span>
                </div>
                <ul v-if="field.value.length" class="list-none p-0 m-0 mt-2">
                  <li v-for="(item, idx) in field.value" :key="idx" class="flex items-start py-1">
                    <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span class="text-sm">{{ item }}</span>
                  </li>
                </ul>
                <div v-else class="text-muted-foreground text-sm mt-1">—</div>
              </template>

              <!-- Regular array values - display as comma-separated text -->
              <template v-else-if="field.isArray">
                <div class="flex justify-between items-start">
                  <span class="text-muted-foreground text-sm min-w-[140px]">{{ field.label }}</span>
                  <span class="font-medium text-right text-sm max-w-[180px] break-words">
                    {{ field.value.join(', ') || '—' }}
                  </span>
                </div>
              </template>

              <!-- Regular scalar values -->
              <template v-else>
                <div class="flex justify-between items-start">
                  <span class="text-muted-foreground text-sm min-w-[140px]">{{ field.label }}</span>
                  <span 
                    class="font-medium text-right text-sm max-w-[180px] break-words"
                    :class="{ 'font-mono text-xs': field.isMono }"
                  >
                    {{ field.displayValue }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Empty state -->
    <div v-if="!loading && plans.length === 0" class="text-center text-muted-foreground py-8">
      No plans found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

import { Check, AlertCircle } from 'lucide-vue-next';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

<style scoped>
/* Styles handled via Tailwind classes */
</style>
