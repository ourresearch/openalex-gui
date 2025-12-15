<template>
  <div class="pricing-page bg-white min-h-screen">
    <div class="container mx-auto px-4 py-12">
      <!-- Header -->
      <div class="text-center mb-16">
        <h1 class="text-3xl font-bold mb-6">Simple, transparent pricing</h1>
        <p class="text-lg text-muted-foreground mb-8">Start free – pay only for what you use.</p>
        
        <!-- Options Cards -->
        <div class="mx-auto max-w-[1200px]">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card class="h-full flex flex-col">
              <CardHeader>
                <CardTitle class="text-lg font-bold">Try it now (no key)</CardTitle>
              </CardHeader>
              <CardContent class="flex-grow">
                <p class="text-base mb-4">
                  You get 5,000 free credits daily—no signup. Same production speed (up to 50 req/s).
                </p>
                <p class="text-xs text-muted-foreground">
                  When they're gone, you'll need a free API key to continue.
                </p>
              </CardContent>
            </Card>
            
            <Card class="h-full flex flex-col">
              <CardHeader>
                <CardTitle class="text-lg font-bold">Free API key</CardTitle>
              </CardHeader>
              <CardContent class="flex-grow">
                <p class="text-base mb-4">
                  Get 50k free credits per day.
                </p>
              </CardContent>
              <CardFooter>
                <Button class="w-full">
                  Get a free key
                </Button>
              </CardFooter>
            </Card>
            
            <Card class="h-full flex flex-col">
              <CardHeader>
                <CardTitle class="text-lg font-bold">Buy credits or go enterprise</CardTitle>
              </CardHeader>
              <CardContent class="flex-grow">
                <p class="text-base mb-4">
                  Credit packs start at $5 for 5,000 credits. Enterprise plans add dedicated capacity and support.
                </p>
              </CardContent>
              <CardFooter class="flex flex-col gap-2">
                <Button variant="outline" class="w-full">
                  Buy credits
                </Button>
                <Button variant="ghost" class="w-full">
                  Contact sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <!-- Pricing Table -->
      <div class="mx-auto max-w-[1000px] mb-36">
        <div class="mb-6">
          <h2 class="text-2xl font-bold">Endpoint Pricing</h2>
        </div>
        
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead class="text-right font-mono">Price/call</TableHead>
                <TableHead class="text-right font-mono">Credits/call</TableHead>
                <TableHead class="text-right font-mono w-[150px]">Your usage (est)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="endpoint in endpoints" :key="endpoint.id" class="h-[72px]">
                <TableCell>
                  <div class="flex items-center">
                    <component :is="getEndpointIcon(endpoint.icon)" class="h-6 w-6 mr-3" />
                    <div>
                      <span class="text-lg font-bold">{{ endpoint.name }}</span><span class="text-[15px]">: {{ endpoint.description }}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell v-if="endpoint.id === 'sync'" colspan="3" class="text-center text-muted-foreground italic">
                  Contact Sales
                </TableCell>
                <template v-else>
                  <TableCell class="text-right whitespace-pre">
                    <span class="font-mono" v-html="formatPriceWithAlignment(endpoint.priceCents)"></span>
                  </TableCell>
                  <TableCell class="text-right">
                    <span class="font-mono" v-if="endpoint.priceCents === 0">—</span>
                    <span class="font-mono" v-else>{{ getCredits(endpoint.priceCents).toLocaleString() }}</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <Input
                      v-if="endpoint.priceCents > 0"
                      v-model.number="usage[endpoint.id]"
                      type="number"
                      min="0"
                      class="max-w-[130px] ml-auto text-right font-mono"
                    />
                    <span v-else class="text-muted-foreground">—</span>
                  </TableCell>
                </template>
              </TableRow>
              <TableRow class="border-t-2 bg-muted/50">
                <TableCell colspan="4" class="py-5">
                  <div class="flex items-center text-xl">
                    <span>Estimated total on</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="lg" class="mx-2">
                          {{ selectedPackName }}
                          <ChevronDown class="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Pack size</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          v-for="pack in creditPacks"
                          :key="pack.id"
                          @click="tableSelectedPack = pack.id"
                          class="flex items-center gap-2"
                        >
                          <Sprout v-if="pack.id === 'standard'" class="h-4 w-4" />
                          <Rocket v-else-if="pack.id === 'big'" class="h-4 w-4" />
                          <Building2 v-else-if="pack.id === 'enterprise'" class="h-4 w-4" />
                          <div class="flex-1">
                            <div>{{ pack.name }}</div>
                            <div v-if="pack.id === 'standard'" class="text-xs text-muted-foreground">Base rate</div>
                            <div v-else-if="pack.id === 'big'" class="text-xs text-green-600"><strong>50</strong>% discount</div>
                            <div v-else-if="pack.id === 'enterprise'" class="text-xs text-green-600"><strong>90</strong>% discount</div>
                          </div>
                          <Check v-if="tableSelectedPack === pack.id" class="h-4 w-4" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <span>is</span>
                    <span class="font-bold mx-2">${{ (totalCostCents / 100).toFixed(2) }}</span>
                    <span>({{ creditsRequired.toLocaleString() }} credits)</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </div>

      <!-- Credit Pack Ladder -->
      <div ref="packsSection" class="mx-auto max-w-[1000px] mb-36">
        <h2 class="text-2xl font-bold mb-6">Credit Packs</h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card
            v-for="pack in creditPacks"
            :key="pack.id"
            class="relative flex flex-col h-full"
            :class="{ 'border-2 border-primary': pack.id === 'big' }"
          >
            <Badge
              v-if="pack.id === 'big'"
              class="absolute top-3 right-3"
            >
              Most Popular
            </Badge>

            <CardHeader class="text-center pt-6">
              <CardTitle class="text-xl">{{ pack.name }}</CardTitle>
            </CardHeader>

            <CardContent class="text-center flex flex-col flex-1">
              <div class="text-3xl font-bold my-4">
                ${{ pack.price.toLocaleString() }}
              </div>
              
              <div class="text-lg mb-4">
                {{ pack.credits.toLocaleString() }} credits
              </div>

              <Separator class="my-4" />

              <div class="text-sm text-muted-foreground mb-2">
                Effective rate: <strong>{{ pack.effectiveRate }}</strong>
              </div>

              <div v-if="pack.discount" class="text-sm text-green-600 mb-4 flex items-center justify-center gap-1">
                <Tag class="h-4 w-4" />
                {{ pack.discount }}
              </div>

              <div class="flex-1"></div>

              <div>
                <Button
                  :variant="pack.id === 'big' ? 'default' : 'ghost'"
                  size="lg"
                  :asChild="pack.id === 'enterprise'"
                >
                  <a v-if="pack.id === 'enterprise'" href="mailto:sales@openalex.org">
                    {{ pack.buttonText }}
                    <ArrowRight class="h-4 w-4 ml-1" />
                  </a>
                  <template v-else>
                    {{ pack.buttonText }}
                    <ArrowRight class="h-4 w-4 ml-1" />
                  </template>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="mx-auto max-w-[1000px] mb-16">
        <h2 class="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        
        <Card>
          <Accordion type="single" collapsible class="w-full">
            <AccordionItem value="credits">
              <AccordionTrigger>What are credits?</AccordionTrigger>
              <AccordionContent>
                1 credit = 0.01¢ (one hundredth of a cent). Credits are used to pay for API calls across all endpoints. Different endpoints consume different amounts of credits per call.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="expire">
              <AccordionTrigger>Do credits expire?</AccordionTrigger>
              <AccordionContent>
                Yes, credits expire after 12 months from the date of purchase. Make sure to use them before they expire!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="run-out">
              <AccordionTrigger>What happens when I run out of credits?</AccordionTrigger>
              <AccordionContent>
                Your API access will be paused until you top up your credits. You can manually purchase more credits or enable auto-recharge to automatically buy credits when your balance gets low.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund">
              <AccordionTrigger>Can I get a refund?</AccordionTrigger>
              <AccordionContent>
                Due to the nature of API credits, we generally don't offer refunds. However, if you have special circumstances, please contact our sales team at sales@openalex.org.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

import { ChevronDown, Check, Sprout, Rocket, Building2, Tag, ArrowRight, Download, List, FileText, Search, RefreshCw } from 'lucide-vue-next';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

defineOptions({ name: 'PricingPage' });

function getEndpointIcon(iconName) {
  const iconMap = {
    'mdi-download-outline': Download,
    'mdi-format-list-bulleted': List,
    'mdi-file-pdf-box': FileText,
    'mdi-magnify': Search,
    'mdi-sync': RefreshCw,
  };
  return iconMap[iconName] || FileText;
}

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
    priceCents: 0.01,
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
    credits: 5000,
    price: 5,
    multiplier: 1,
    effectiveRate: '$0.001 / credit',
    discount: null,
    buttonText: 'Buy Now',
    examples: [
      '50k list queries',
      '500 PDF downloads',
      '50 vector searches'
    ]
  },
  {
    id: 'big',
    name: 'Growth Pack',
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
    usage.value.get * 0.01 +
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

<style scoped>
/* Styles handled via Tailwind classes */
</style>
