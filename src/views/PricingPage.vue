<template>
  <div class="pricing-page">
    <v-container class="py-12">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-h3 font-weight-bold mb-4">Simple, transparent pricing</h1>
        <p class="text-h6 text-grey-darken-1 mb-6">Start free – pay only for what you use.</p>
        
        <!-- Free Tier Banner -->
        <v-alert
          type="info"
          variant="tonal"
          class="mx-auto mb-6"
          max-width="600"
        >
          <div class="text-subtitle-1">
            <strong>Includes 50,000 free credits each month</strong>
            <div class="text-body-2 mt-1">≈ 500k list queries or 500 PDFs</div>
          </div>
        </v-alert>

        <div class="d-flex justify-center gap-3">
          <v-btn
            color="primary"
            size="large"
            @click="scrollToPacks"
          >
            Buy Credits
          </v-btn>
          <v-btn
            variant="outlined"
            size="large"
            href="mailto:sales@openalex.org"
          >
            Contact Sales
          </v-btn>
        </div>
      </div>

      <!-- Pricing Table -->
      <v-card class="mb-8 mx-auto" max-width="1000" variant="outlined" :elevation="0">
        <v-card-title class="d-flex justify-space-between align-center flex-wrap">
          <span class="text-h5">Endpoint Pricing</span>
          <div class="d-flex gap-2">
            <!-- Pack Size Menu -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  size="small"
                >
                  {{ selectedPackName }}
                  <v-icon end size="small">mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-subheader>Pack size</v-list-subheader>
                <v-list-item
                  v-for="pack in creditPacks"
                  :key="pack.id"
                  :value="pack.id"
                  @click="tableSelectedPack = pack.id"
                  :active="tableSelectedPack === pack.id"
                >
                  <v-list-item-title>{{ pack.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- Currency Units Menu -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  size="small"
                >
                  {{ showInDollars ? 'Dollars' : 'Cents' }}
                  <v-icon end size="small">mdi-menu-down</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-subheader>Currency units</v-list-subheader>
                <v-list-item
                  @click="showInDollars = false"
                  :active="!showInDollars"
                >
                  <v-list-item-title>Cents</v-list-item-title>
                </v-list-item>
                <v-list-item
                  @click="showInDollars = true"
                  :active="showInDollars"
                >
                  <v-list-item-title>Dollars</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th class="text-right">Price/call</th>
                <th class="text-right">Credits/call</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="endpoint in endpoints" :key="endpoint.id">
                <td>
                  <span class="font-weight-bold">{{ endpoint.name }}</span>: {{ endpoint.description }}
                </td>
                <td class="text-right monospace price-cell">
                  <span v-html="formatPriceWithAlignment(endpoint.priceCents)"></span>
                </td>
                <td class="text-right monospace">
                  <span v-if="endpoint.priceCents === 0">—</span>
                  <span v-else>{{ getCredits(endpoint.priceCents).toLocaleString() }}</span>
                </td>
                <td class="text-grey">{{ endpoint.notes }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- Pricing Calculator -->
      <v-card class="mb-12 mx-auto" max-width="1000" variant="outlined" :elevation="0">
        <v-card-title class="text-h5">Pricing Calculator</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-4">Monthly Usage</h3>
              
              <v-text-field
                v-for="endpoint in endpoints.filter(e => e.id !== 'a')"
                :key="endpoint.id"
                v-model.number="usage[endpoint.id]"
                :label="endpoint.name"
                type="number"
                min="0"
                variant="outlined"
                density="compact"
                class="mb-2"
                :suffix="endpoint.id === 'a' ? '(Free)' : 'calls'"
              />

              <v-select
                v-model="selectedPack"
                :items="creditPacks"
                item-title="name"
                item-value="id"
                label="Credit Pack"
                variant="outlined"
                density="compact"
                class="mt-4"
              />

              <v-btn
                variant="text"
                size="small"
                @click="resetCalculator"
                class="mt-2"
              >
                Reset
              </v-btn>
            </v-col>

            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-4">Estimated Cost</h3>
              
              <v-card variant="tonal" color="primary" class="pa-4">
                <div class="text-h4 font-weight-bold mb-2">
                  ${{ (totalCostCents / 100).toFixed(2) }}
                </div>
                <div class="text-subtitle-2 text-grey-darken-1 mb-4">
                  USD per month
                </div>
                
                <v-divider class="my-3" />
                
                <div class="text-body-2">
                  <div class="d-flex justify-space-between mb-1">
                    <span>Credits required:</span>
                    <span class="font-weight-bold">{{ creditsRequired.toLocaleString() }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Pack discount:</span>
                    <span class="font-weight-bold">{{ packDiscountPercent }}%</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Effective rate:</span>
                    <span class="font-weight-bold">{{ effectiveRate }}</span>
                  </div>
                </div>
              </v-card>

              <p class="text-caption text-grey mt-4">
                * Estimates only; rounded to nearest cent.
              </p>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Credit Pack Ladder -->
      <div ref="packsSection" class="mx-auto" style="max-width: 1000px;">
        <h2 class="text-h4 font-weight-bold text-center mb-8">Credit Packs</h2>
        
        <v-row>
          <v-col
            v-for="pack in creditPacks"
            :key="pack.id"
            cols="12"
            sm="4"
            md="4"
          >
            <v-card
              :class="['pack-card', { 'recommended': pack.id === 'big' }]"
              variant="outlined"
              :elevation="0"
            >
              <v-chip
                v-if="pack.id === 'big'"
                color="primary"
                size="small"
                class="pack-badge"
              >
                Most Popular
              </v-chip>

              <v-card-title class="text-h5 text-center pt-6">
                {{ pack.name }}
              </v-card-title>

              <v-card-text class="text-center d-flex flex-column" style="height: 100%;">
                <div class="text-h3 font-weight-bold my-4">
                  ${{ pack.price.toLocaleString() }}
                </div>
                
                <div class="text-h6 mb-4">
                  {{ pack.credits.toLocaleString() }} credits
                </div>

                <v-divider class="my-4" />

                <div class="text-body-2 text-grey-darken-1 mb-2">
                  Effective rate: <strong>{{ pack.effectiveRate }}</strong>
                </div>

                <div v-if="pack.discount" class="text-body-2 text-success mb-4">
                  <v-icon size="small">mdi-tag</v-icon>
                  {{ pack.discount }}
                </div>

                <v-spacer />

                <div>
                  <v-btn
                    :variant="pack.id === 'big' ? 'flat' : 'text'"
                    :color="pack.id === 'big' ? 'primary' : 'default'"
                    size="large"
                    :href="pack.id === 'enterprise' ? 'mailto:sales@openalex.org' : '#'"
                  >
                    {{ pack.buttonText }}
                    <v-icon end>mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- FAQ Section -->
      <v-card class="mt-12 mx-auto" max-width="1000" variant="outlined" :elevation="0">
        <v-card-title class="text-h5">Frequently Asked Questions</v-card-title>
        <v-card-text>
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title>What are credits?</v-expansion-panel-title>
              <v-expansion-panel-text>
                1 credit = 0.01¢ (one hundredth of a cent). Credits are used to pay for API calls across all endpoints. Different endpoints consume different amounts of credits per call.
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>Do credits expire?</v-expansion-panel-title>
              <v-expansion-panel-text>
                Yes, credits expire after 12 months from the date of purchase. Make sure to use them before they expire!
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>What happens when I run out of credits?</v-expansion-panel-title>
              <v-expansion-panel-text>
                Your API access will be paused until you top up your credits. You can manually purchase more credits or enable auto-recharge to automatically buy credits when your balance gets low.
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title>Can I get a refund?</v-expansion-panel-title>
              <v-expansion-panel-text>
                Due to the nature of API credits, we generally don't offer refunds. However, if you have special circumstances, please contact our sales team at sales@openalex.org.
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>

    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'PricingPage' });

const showInDollars = ref(false);
const selectedPack = ref('standard');
const tableSelectedPack = ref('standard');
const packsSection = ref(null);

// Watch tableSelectedPack and sync it with calculator's selectedPack
watch(tableSelectedPack, (newVal) => {
  selectedPack.value = newVal;
});

// Endpoint data
const endpoints = [
  {
    id: 'get',
    name: 'Get',
    description: 'Retrieve by OpenAlex ID',
    priceCents: 0,
    notes: 'Limit: 1M/day'
  },
  {
    id: 'list',
    name: 'List',
    description: 'Query works, authors, sources',
    priceCents: 0.01,
    notes: 'Up to 100 results/page'
  },
  {
    id: 'download',
    name: 'Download',
    description: 'Get full-text PDFs',
    priceCents: 1,
    notes: 'Up to 25 MB each'
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Semantic / embedding search',
    priceCents: 10,
    notes: 'Top 50 results included'
  }
];

// Credit pack data
const creditPacks = [
  {
    id: 'standard',
    name: 'Standard Pack',
    credits: 1000,
    price: 1,
    multiplier: 1,
    effectiveRate: '$0.001 / credit',
    discount: null,
    buttonText: 'Buy Now',
    examples: [
      '100k list queries',
      '1k PDF downloads',
      '100 vector searches'
    ]
  },
  {
    id: 'big',
    name: 'Big Pack',
    credits: 100000,
    price: 50,
    multiplier: 0.5,
    effectiveRate: '$0.0005 / credit',
    discount: '50% discount',
    buttonText: 'Buy Now',
    examples: [
      '500M list queries',
      '5M PDF downloads',
      '500K vector searches'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 10000000,
    price: 1000,
    multiplier: 0.1,
    effectiveRate: '$0.0001 / credit',
    discount: '90% discount',
    buttonText: 'Contact Sales',
    examples: [
      '10B list queries',
      '100M PDF downloads',
      '10M vector searches'
    ]
  }
];

// Usage tracking
const usage = ref({
  get: 0,
  list: 0,
  download: 0,
  search: 0
});

// Computed values
const packMultiplier = computed(() => {
  const pack = creditPacks.find(p => p.id === selectedPack.value);
  return pack ? pack.multiplier : 1;
});

const tablePackMultiplier = computed(() => {
  const pack = creditPacks.find(p => p.id === tableSelectedPack.value);
  return pack ? pack.multiplier : 1;
});

const packDiscountPercent = computed(() => {
  return Math.round((1 - packMultiplier.value) * 100);
});

const baseCostCents = computed(() => {
  return (
    usage.value.list * 0.01 +
    usage.value.download * 1 +
    usage.value.search * 10
  );
});

const totalCostCents = computed(() => {
  return baseCostCents.value * packMultiplier.value;
});

const creditsRequired = computed(() => {
  // 1 credit = 0.01¢
  return Math.ceil(baseCostCents.value / 0.01);
});

const effectiveRate = computed(() => {
  const pack = creditPacks.find(p => p.id === selectedPack.value);
  return pack ? pack.effectiveRate : '$0.001 / credit';
});

const selectedPackName = computed(() => {
  const pack = creditPacks.find(p => p.id === tableSelectedPack.value);
  return pack ? pack.name : 'Standard Pack';
});

// Methods
const formatPrice = (cents) => {
  if (showInDollars.value) {
    return `$${(cents / 100).toFixed(4)}`;
  }
  // Only show decimals when necessary (for values < 1¢)
  if (cents < 1) {
    return `${cents.toFixed(2)}¢`;
  }
  return `${Math.round(cents)}¢`;
};

const formatPriceWithMultiplier = (cents) => {
  const adjustedCents = cents * tablePackMultiplier.value;
  if (showInDollars.value) {
    return `$${(adjustedCents / 100).toFixed(4)}`;
  }
  // Only show decimals when necessary (for values < 1¢)
  if (adjustedCents < 1) {
    return `${adjustedCents.toFixed(2)}¢`;
  }
  return `${Math.round(adjustedCents)}¢`;
};

const resetCalculator = () => {
  usage.value = { get: 0, list: 0, download: 0, search: 0 };
  selectedPack.value = 'standard';
  tableSelectedPack.value = 'standard';
};

const scrollToPacks = () => {
  packsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const getCredits = (cents) => {
  // 1 credit = 0.01¢
  const adjustedCents = cents * tablePackMultiplier.value;
  return Math.round(adjustedCents / 0.01);
};

const formatPriceWithAlignment = (cents) => {
  const adjustedCents = cents * tablePackMultiplier.value;
  if (showInDollars.value) {
    return `$${(adjustedCents / 100).toFixed(4)}`;
  }
  
  // Split into whole and decimal parts
  const formatted = adjustedCents.toFixed(2);
  const [whole, decimal] = formatted.split('.');
  
  // Right-pad whole number to 2 digits
  const wholePadded = whole.padStart(2, '\u00A0'); // non-breaking space
  
  // Only show decimal if it's not .00
  if (decimal === '00') {
    // Hide the decimal point and digits but keep them for alignment
    return `${wholePadded}<span style="visibility:hidden">.${decimal}</span>¢`;
  }
  return `${wholePadded}.${decimal}¢`;
};
</script>

<style scoped lang="scss">
.pricing-page {
  background: #ffffff;
  min-height: 100vh;
}

.gap-3 {
  gap: 12px;
}

.gap-2 {
  gap: 8px;
}

.pack-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  &.recommended {
    border: 2px solid rgb(var(--v-theme-primary));
  }

  .v-card-text {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.pack-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.v-table {
  th {
    font-weight: 600 !important;
  }

  td, th {
    padding: 16px 12px !important;
  }

  .monospace {
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
  }

  .price-cell {
    white-space: pre;
  }
}
</style>
