<template>
  <div class="pricing-page">
    <v-container class="py-12">
      <!-- Header -->
      <div class="text-center mb-16">
        <h1 class="text-h3 font-weight-bold mb-6">Simple, transparent pricing</h1>
        <p class="text-h6 text-grey-darken-1 mb-8">Start free – pay only for what you use.</p>
        
        <!-- Free Tier Banner -->
        <v-alert
          type="info"
          variant="tonal"
          class="mx-auto"
          max-width="600"
        >
          <div class="text-subtitle-1">
            <strong>Includes 50,000 free credits each month</strong>
            <div class="text-body-2 mt-1">≈ 500k list queries or 500 PDFs</div>
          </div>
        </v-alert>
      </div>

      <!-- Pricing Table -->
      <div class="mx-auto" style="max-width: 1000px; margin-bottom: 144px;">
        <div class="mb-6">
          <h2 class="text-h4 font-weight-bold">Endpoint Pricing</h2>
        </div>
        
        <v-card variant="outlined" :elevation="0">
          <v-table>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th class="text-right monospace">Price/call</th>
                <th class="text-right monospace">Credits/call</th>
                <th class="text-right monospace" style="width: 150px;">Your usage (est)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="endpoint in endpoints" :key="endpoint.id" class="endpoint-row">
                <td>
                  <div class="d-flex align-center">
                    <v-icon :icon="endpoint.icon" size="large" class="mr-3" />
                    <div>
                      <span class="endpoint-name">{{ endpoint.name }}</span><span class="endpoint-description">: {{ endpoint.description }}</span>
                    </div>
                  </div>
                </td>
                <td v-if="endpoint.id === 'get'" colspan="3" class="text-center special-pricing">
                  Free (max 1M/day)
                </td>
                <td v-else-if="endpoint.id === 'sync'" colspan="3" class="text-center special-pricing">
                  Contact Sales
                </td>
                <template v-else>
                  <td class="text-right price-cell">
                    <span class="monospace" v-html="formatPriceWithAlignment(endpoint.priceCents)"></span>
                  </td>
                  <td class="text-right">
                    <span class="monospace" v-if="endpoint.priceCents === 0">—</span>
                    <span class="monospace" v-else>{{ getCredits(endpoint.priceCents).toLocaleString() }}</span>
                  </td>
                  <td class="text-right">
                    <v-text-field
                      v-if="endpoint.priceCents > 0"
                      v-model.number="usage[endpoint.id]"
                      type="number"
                      min="0"
                      density="compact"
                      variant="outlined"
                      hide-details
                      class="usage-input"
                      style="max-width: 130px; margin-left: auto;"
                    />
                    <span v-else class="text-grey">—</span>
                  </td>
                </template>
              </tr>
              <tr class="total-row">
                <td colspan="3" class="text-right font-weight-bold">
                  <div class="d-flex align-center justify-end gap-2">
                    <span>Estimated total on</span>
                    <v-menu>
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          variant="outlined"
                          size="large"
                        >
                          {{ selectedPackName }}
                          <v-icon end>mdi-menu-down</v-icon>
                        </v-btn>
                      </template>
                      <v-list density="comfortable">
                        <v-list-subheader>Pack size</v-list-subheader>
                        <v-list-item
                          v-for="pack in creditPacks"
                          :key="pack.id"
                          :value="pack.id"
                          @click="tableSelectedPack = pack.id"
                          :active="tableSelectedPack === pack.id"
                        >
                          <template v-slot:prepend>
                            <v-icon v-if="pack.id === 'standard'">mdi-package-variant</v-icon>
                            <v-icon v-else-if="pack.id === 'big'">mdi-package-variant-closed</v-icon>
                            <v-icon v-else-if="pack.id === 'enterprise'">mdi-office-building</v-icon>
                          </template>
                          <v-list-item-title>{{ pack.name }}</v-list-item-title>
                          <v-list-item-subtitle v-if="pack.id === 'standard'">
                            Base rate
                          </v-list-item-subtitle>
                          <v-list-item-subtitle v-else-if="pack.id === 'big'" class="text-success" style="opacity: 1;">
                            <strong>50</strong>% discount
                          </v-list-item-subtitle>
                          <v-list-item-subtitle v-else-if="pack.id === 'enterprise'" class="text-success" style="opacity: 1;">
                            <strong>90</strong>% discount
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                    <span v-if="packDiscountPercent > 0" class="text-caption text-grey font-weight-regular">
                      ({{ packDiscountPercent }}% discount)
                    </span>
                  </div>
                </td>
                <td class="text-right">
                  <div class="total-amount">
                    ${{ (totalCostCents / 100).toFixed(2) }}
                  </div>
                  <div class="text-caption text-grey mt-1 monospace">
                    {{ creditsRequired.toLocaleString() }} credits
                  </div>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </div>

      <!-- Credit Pack Ladder -->
      <div ref="packsSection" class="mx-auto" style="max-width: 1000px; margin-bottom: 144px;">
        <h2 class="text-h4 font-weight-bold mb-6">Credit Packs</h2>
        
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
      <div class="mx-auto mb-16" style="max-width: 1000px;">
        <h2 class="text-h4 font-weight-bold mb-6">Frequently Asked Questions</h2>
        
        <v-card variant="outlined" :elevation="0">
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
        </v-card>
      </div>

    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

defineOptions({ name: 'PricingPage' });

const showInDollars = ref(true);
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
    icon: 'mdi-download-outline',
  },
  {
    id: 'list',
    name: 'List',
    description: 'Query works, authors, sources',
    priceCents: 0.01,
    icon: 'mdi-format-list-bulleted',
  },
  {
    id: 'download',
    name: 'Download',
    description: 'Get full-text PDFs',
    priceCents: 1,
    icon: 'mdi-file-pdf-box',
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Semantic / embedding search',
    priceCents: 10,
    icon: 'mdi-magnify',
  },
  {
    id: 'sync',
    name: 'Sync',
    description: 'Keep a local copy of OpenAlex',
    priceCents: null,
    icon: 'mdi-sync',
  }
];

// Credit pack data
const creditPacks = [
  {
    id: 'standard',
    name: 'Starter Pack',
    credits: 10000,
    price: 10,
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
    credits: 1000000,
    price: 500,
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
    credits: 100000000,
    price: 10000,
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
  thead {
    background-color: #f5f5f5;
  }

  th {
    font-weight: 600 !important;
  }

  td, th {
    padding: 16px 12px !important;
  }

  .endpoint-row {
    height: 72px;
    
    td {
      vertical-align: middle;
      height: 72px;
    }
  }

  .endpoint-name {
    font-size: 18px;
    font-weight: 700;
  }

  .endpoint-description {
    font-size: 15px;
  }

  .special-pricing {
    color: #666;
    font-weight: 500;
    font-style: italic;
    height: 72px;
    padding: 16px 12px !important;
  }

  .monospace {
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
  }

  .price-cell {
    white-space: pre;
  }

  .total-row {
    border-top: 2px solid #ddd;
    background-color: #f9f9f9;

    td {
      padding-top: 20px !important;
      padding-bottom: 20px !important;
      font-size: 16px;
    }
  }

  .total-amount {
    font-size: 24px;
    font-weight: 700;
    color: rgb(var(--v-theme-primary));
    font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
    font-variant-numeric: tabular-nums;
  }
}

.cents-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 500;
  opacity: 0.6;
  margin-right: 16px;
}

.usage-input :deep(input) {
  text-align: right;
  font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
  font-variant-numeric: tabular-nums;
}
</style>
