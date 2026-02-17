<template>
  <div class="pricing-page">
    <!-- Table of Contents (right margin, large screens only) -->
    <nav class="page-toc">
      <div class="page-toc-heading">
        <v-icon size="16">mdi-text-box-outline</v-icon>
        On this page
      </div>
      <ul>
        <li v-for="s in sections" :key="s.id">
          <a
            :href="'#' + s.id"
            :class="{ active: activeSection === s.id }"
            @click.prevent="scrollToSection(s.id)"
          >
            {{ s.label }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <h1 class="hero-headline">Pricing</h1>
      <p class="hero-body">
        The OpenAlex API uses credits to meter usage. Every account gets
        <strong>10,000 credits per day for free</strong> — enough for most research and
        personal projects. If you need more, there are a few ways to get them:
        <a href="#credit-packs">buy credit packs</a>,
        get an <a href="#subscriptions">annual subscription</a>,
        or purchase the <a href="#pdf-archive">PDF archive</a>.
        For details on how credits map to API calls, see the
        <a href="https://docs.openalex.org" target="_blank">API documentation</a>.
      </p>
    </section>

    <!-- ==================== CREDIT PACKS ==================== -->
    <section id="credit-packs" class="section compact-section">
      <h2 class="section-header">
        Credit packs
        <a href="#credit-packs" class="permalink"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        Need a burst of extra credits? Buy them one-time at
        <strong>10,000 credits for $1</strong>. Purchased credits are only used after your
        free daily credits run out, and they expire 3 months after your most recent purchase.
      </p>
      <v-btn
        color="black"
        size="large"
        rounded="lg"
        variant="flat"
        class="text-none mt-4"
        @click="buyCredits"
      >
        Buy credit packs
      </v-btn>

      <!-- Quantity Picker Dialog -->
      <v-dialog v-model="showQuantityDialog" max-width="420">
        <v-card class="pa-6" rounded="lg">
          <v-card-title class="text-h6 font-weight-bold pa-0 mb-2">Buy API Credits</v-card-title>
          <v-card-text class="pa-0">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Each pack includes 10,000 credits. Purchased credits expire 3 months after your most recent purchase.
            </p>

            <v-text-field
              v-model.number="creditPacks"
              type="number"
              label="Number of packs"
              :min="1"
              variant="outlined"
              density="compact"
              hide-details="auto"
              class="mb-3"
            />

            <div class="d-flex justify-space-between text-body-2 mb-1">
              <span class="text-medium-emphasis">Credits</span>
              <span class="font-weight-medium">{{ (creditPacks * 10000).toLocaleString() }}</span>
            </div>
            <div class="d-flex justify-space-between text-body-2 mb-4">
              <span class="text-medium-emphasis">Total</span>
              <span class="font-weight-bold">${{ creditPacks }}.00</span>
            </div>

            <v-alert v-if="purchaseError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ purchaseError }}
            </v-alert>
          </v-card-text>
          <v-card-actions class="pa-0 pt-2">
            <v-spacer />
            <v-btn variant="text" @click="showQuantityDialog = false" :disabled="purchaseLoading">Cancel</v-btn>
            <v-btn
              color="black"
              variant="flat"
              @click="startCheckout"
              :loading="purchaseLoading"
              :disabled="!creditPacks || creditPacks < 1"
            >
              Continue to Checkout
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>

    <!-- ==================== SUBSCRIPTIONS ==================== -->
    <section id="subscriptions" class="section subscriptions-section">
      <div class="subscriptions-intro">
        <h2 class="section-header">
          Subscriptions
          <a href="#subscriptions" class="permalink"><v-icon size="18">mdi-link-variant</v-icon></a>
        </h2>
        <p class="section-subhead">
          Annual subscriptions give you a much larger daily credit allowance, priority support,
          and a range of other benefits — while directly supporting OpenAlex as
          open infrastructure for research.
        </p>
      </div>

      <div class="org-grid-wrapper">
        <table class="org-grid">
          <thead>
            <tr>
              <th class="feature-col"></th>
              <th class="plan-col">
                <div class="plan-header">
                  <span class="plan-name">Member</span>
                  <span class="plan-price">$5k</span>
                  <span class="plan-period">Annual</span>
                </div>
              </th>
              <th class="plan-col">
                <div class="plan-header">
                  <span class="plan-name">Member+</span>
                  <span class="plan-price">$10k</span>
                  <span class="plan-period">Annual</span>
                </div>
              </th>
              <th class="plan-col">
                <div class="plan-header">
                  <span class="plan-name">Partner</span>
                  <span class="plan-price">$20k</span>
                  <span class="plan-period">
                    Annual (starting)
                    <v-tooltip location="top" max-width="280">
                      <template #activator="{ props }">
                        <v-icon v-bind="props" size="13" class="info-hint">mdi-information-outline</v-icon>
                      </template>
                      The cheapest Partner plan starts at $20,000 annually but can be more expensive depending on your exact needs and use case.
                    </v-tooltip>
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Everyone swimlane -->
            <tr class="swimlane-header">
              <td colspan="4">For everyone</td>
            </tr>
            <tr>
              <td class="feature-label">API credits/day</td>
              <td>200,000</td>
              <td>1,000,000</td>
              <td>2,000,000+</td>
            </tr>
            <tr>
              <td class="feature-label">
                Savings vs. credit packs
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  How much you save compared with buying individual credit packs to fulfill the same amount of daily usage.
                </v-tooltip>
              </td>
              <td><span class="savings-value">32%</span></td>
              <td><span class="savings-value">73%</span></td>
              <td><span class="savings-value">73%</span></td>
            </tr>
            <tr>
              <td class="feature-label">Support</td>
              <td>
                Community
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Post to our public forum and ask for help from community members (same as without this plan).
                </v-tooltip>
              </td>
              <td>
                Basic
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Help with critical API bugs that have clear resolution. No support for data issues.
                </v-tooltip>
              </td>
              <td>
                Full
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Full ticket-based support for all issues.
                </v-tooltip>
              </td>
            </tr>
            <tr>
              <td class="feature-label">
                Data Sync Service
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Access to a feed of daily change files so that you can run your own local, synced copy of OpenAlex.
                </v-tooltip>
              </td>
              <td><span class="dash">—</span></td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">
                Admin dashboard
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Manage your organization's users and billing.
                </v-tooltip>
              </td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">
                Community representation
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Nominate members of our advisory board and attend our quarterly members roundtable.
                </v-tooltip>
              </td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>

            <!-- Academic & Government swimlane -->
            <tr class="swimlane-header">
              <td colspan="4">For academic & government<span class="swimlane-sub">, everything above, plus:</span></td>
            </tr>
            <tr>
              <td class="feature-label">
                Affiliation editor
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Curate the way OpenAlex matches author affiliation statements to your institution.
                </v-tooltip>
              </td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">
                <em>Unsub</em> access
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Free subscription to Unsub, our tool for forecasting and supporting toll-access journal cancellations — used by hundreds of libraries worldwide.
                </v-tooltip>
              </td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">
                5 power user accounts
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Grant extra-high API limits to 5 users in your organization.
                </v-tooltip>
              </td>
              <td><span class="dash">—</span></td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">
                5hr consulting/year
                <v-tooltip location="top" max-width="280">
                  <template #activator="{ props }">
                    <v-icon v-bind="props" size="14" class="info-hint">mdi-information-outline</v-icon>
                  </template>
                  Get 5 hours of expert advice, training, and exploration customized to your needs.
                </v-tooltip>
              </td>
              <td><span class="dash">—</span></td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="subscriptions-cta">
        <p class="subscriptions-cta-text">
          Interested in a subscription? Let's find the right plan for you.
        </p>
        <v-btn
          href="mailto:sales@openalex.org"
          color="black"
          size="large"
          rounded="lg"
          variant="flat"
          class="text-none"
        >
          Contact Sales
        </v-btn>
      </div>

    </section>

    <!-- ==================== PDF ARCHIVE ==================== -->
    <section id="pdf-archive" class="section compact-section">
      <h2 class="section-header">
        PDF archive
        <a href="#pdf-archive" class="permalink"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        Get all 60 million of our cached open-access full-text PDFs delivered straight to
        your S3 bucket. Perfect for building search indexes, training models, or running
        large-scale text mining.
        <a href="mailto:sales@openalex.org">Contact sales</a> to learn more.
      </p>
    </section>

    <!-- ==================== FAQ ==================== -->
    <section id="faq" class="section compact-section">
      <h2 class="section-header">
        Frequently asked questions
        <a href="#faq" class="permalink"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <v-expansion-panels variant="accordion" class="faq-panels">
        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            If OpenAlex is free, why are you charging money?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            Our data is open and free to share, remix, and use as you wish. And you can
            <a href="https://docs.openalex.org/download-all-data" target="_blank">download the entire dataset for free</a>.
            However, the services on top of the data — the API, search, sync, and support — are
            expensive for us to provide, and so we charge for those services in order to keep
            OpenAlex sustainably open.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            What happens when I run out of credits?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            If you want, you can just wait till the next day. Your free 10,000 daily credits
            reset every midnight UTC, or you can buy more one-time credit packs anytime to
            keep going. If you have no more daily credits or purchased credits, your API
            requests will return a rate-limit error.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            Do purchased credit packs expire?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            Yes. Purchased credits expire 3 months after purchase.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            How do I get an API key?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            Just create a free OpenAlex account — you'll get an API key automatically. No
            credit card required. Your key comes with 10,000 free credits per day, which is
            enough for most research and personal projects.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            Can we trial membership models before purchasing?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            Unfortunately, we are not able to provide free trials for our membership tiers at this time. If you have questions about your institution's needs or would like to discuss which membership option is right for you, please contact us at <a href="mailto:sales@openalex.org">sales@openalex.org</a>.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            I have an existing Premium/Institutional contract—what do these changes mean for me?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            If you have an existing Premium or Institutional contract, your contract will be honored. Additionally, you now receive all the newly introduced Member benefits—including the admin dashboard, affiliation editor, Unsub access, advisory board nomination rights, and quarterly meetings—at no extra cost.
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title class="faq-question">
            How do the Member benefits work and how do I activate them?
          </v-expansion-panel-title>
          <v-expansion-panel-text class="faq-answer">
            For detailed information about each Member benefit and step-by-step activation instructions, please visit our <a href="/members">Members page</a>.
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useHead } from '@unhead/vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'PricingPageNewer' });

useHead({
  title: 'Pricing - OpenAlex',
  meta: [
    { name: 'description', content: 'Simple, transparent pricing for the OpenAlex API. Start free, scale as you grow.' }
  ]
});

const store = useStore();
const showQuantityDialog = ref(false);
const creditPacks = ref(1);
const purchaseLoading = ref(false);
const purchaseError = ref('');

const isLoggedIn = computed(() => !!store.state.user);

// Table of contents
const sections = [
  { id: 'credit-packs', label: 'Credit packs' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'pdf-archive', label: 'PDF archive' },
  { id: 'faq', label: 'FAQ' },
];
const activeSection = ref('credit-packs');
let observer = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  );
  sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}

async function buyCredits() {
  if (!isLoggedIn.value) {
    store.commit('setLoginDialogIsOpen', true);
    return;
  }
  showQuantityDialog.value = true;
  creditPacks.value = 1;
  purchaseError.value = '';
}

async function startCheckout() {
  purchaseLoading.value = true;
  purchaseError.value = '';

  try {
    const resp = await axios.post(
      `${urlBase.userApi}/checkout/create-session`,
      { quantity: creditPacks.value },
      axiosConfig({ userAuth: true })
    );
    window.location.href = resp.data.checkout_url;
  } catch (e) {
    purchaseError.value = e.response?.data?.message || 'Failed to start checkout. Please try again.';
    purchaseLoading.value = false;
  }
}
</script>


<style lang="scss" scoped>
.pricing-page {
  background: #fff;
}

// Table of Contents (right margin)
.page-toc {
  position: fixed;
  top: 140px;
  left: calc(50% + 460px);
  width: 180px;
  z-index: 10;

  .page-toc-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #71717A;
    margin-bottom: 12px;
    letter-spacing: 0.01em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border-left: 1px solid #E4E4E7;
  }

  li a {
    display: block;
    padding: 8px 0 8px 16px;
    font-size: 14px;
    color: #A1A1AA;
    text-decoration: none;
    border-left: 2px solid transparent;
    margin-left: -1px;
    transition: all 0.15s ease;

    &:hover {
      color: #52525B;
    }

    &.active {
      color: #0A0A0A;
      border-left-color: #0A0A0A;
      font-weight: 500;
    }
  }
}

@media (max-width: 1300px) {
  .page-toc {
    display: none;
  }
}

// Hero Section
.hero {
  padding: 80px 24px 20px;
  max-width: 848px;
  margin: 0 auto;
}

.hero-headline {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #0A0A0A;
  margin: 0 0 20px 0;
}

.hero-body {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.7;
  color: #52525B;
  margin: 0;

  a {
    color: #0A0A0A;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #52525B;
    }
  }
}

// Sections
.section {
  padding: 60px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.compact-section {
  max-width: 848px;
}

.section-header {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 12px 0;

  .permalink {
    opacity: 0;
    transition: opacity 0.15s ease;
    color: #C4C4C9;
    margin-left: 6px;
    vertical-align: middle;

    &:hover {
      color: #71717A;
    }
  }

  &:hover .permalink {
    opacity: 1;
  }
}

.section-subhead {
  font-size: 16px;
  line-height: 1.7;
  color: #52525B;
  margin: 0 0 40px 0;
  max-width: 640px;
}

.section-body {
  font-size: 16px;
  line-height: 1.7;
  color: #52525B;
  margin: 0;

  a {
    color: #0A0A0A;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #52525B;
    }
  }
}

// Subscriptions Section
.subscriptions-section {
  background: #fff;
  max-width: none;
  padding: 80px 24px;
}

// CTA Buttons
.cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  width: 100%;

  &.cta-primary {
    background: #0A0A0A;
    color: #fff;

    &:hover {
      background: #27272A;
    }
  }

  &.cta-secondary {
    background: #fff;
    color: #0A0A0A;
    border: 1px solid #E4E4E7;

    &:hover {
      border-color: #A1A1AA;
      background: #FAFAFA;
    }
  }

  &.cta-large {
    padding: 16px 40px;
    font-size: 16px;
    width: auto;
  }
}

// Organization Grid
.org-grid-wrapper {
  max-width: 800px;
  margin: 0 auto;
  overflow: hidden;
  border: 1px solid #C4C4C9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.org-grid {
  width: 100%;
  border-collapse: collapse;
  background: #fff;

  th, td {
    padding: 14px 20px;
    text-align: center;
    border-bottom: 1px solid #E4E4E7;
    font-size: 15px;
    color: #3F3F46;
  }

  .feature-col {
    width: 260px;
    text-align: left;
  }

  .plan-col {
    width: 200px;
  }

  thead th {
    background: #fff;
    border-bottom: 2px solid #E4E4E7;
    padding: 24px 20px;
    vertical-align: bottom;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
}

.plan-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.plan-name {
  font-size: 20px;
  font-weight: 600;
  color: #0A0A0A;
}

.plan-price {
  font-size: 28px;
  font-weight: 700;
  color: #0A0A0A;
  letter-spacing: -0.02em;
}

.plan-period {
  font-size: 13px;
  font-weight: 400;
  color: #71717A;
}

.feature-label {
  text-align: left !important;
  font-weight: 500;
  color: #0A0A0A !important;
  white-space: nowrap;
}

.swimlane-header td {
  background: #fff;
  font-size: 13px !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717A !important;
  text-align: left !important;
  padding: 50px 20px 10px !important;
}

.info-hint {
  color: #C4C4C9;
  margin-left: 4px;
  vertical-align: middle;
  cursor: help;
  opacity: 0.8;
  transition: opacity 0.15s ease, color 0.15s ease;

  &:hover {
    opacity: 1;
    color: #71717A;
  }
}

.swimlane-sub {
  text-transform: none;
  font-weight: 400;
  color: inherit;
  letter-spacing: 0;
}

.savings-value {
  color: #15803D;
  font-weight: 600;
}

.check-icon {
  color: #16A34A;
  flex-shrink: 0;
}

.dash {
  color: #D4D4D8;
  font-size: 18px;
}

.subscriptions-intro {
  max-width: 800px;
  margin: 0 auto 40px;
}

.subscriptions-cta {
  max-width: 800px;
  margin: 40px auto 0;
  text-align: center;
}

.subscriptions-cta-text {
  font-size: 17px;
  color: #52525B;
  margin: 0 0 20px 0;
}

// FAQ Section
.faq-panels {
  margin-top: 24px;
}

.faq-question {
  font-size: 16px;
  font-weight: 500;
  color: #0A0A0A;
}

.faq-answer {
  font-size: 15px;
  line-height: 1.7;
  color: #52525B;

  a {
    color: #0A0A0A;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #52525B;
    }
  }
}

// Responsive
@media (max-width: 960px) {
  .hero-headline {
    font-size: 40px;
  }

  .section-header {
    font-size: 24px;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 60px 20px 20px;
  }

  .hero-headline {
    font-size: 32px;
  }

  .section {
    padding: 48px 20px;
  }


  .org-grid-wrapper {
    margin: 0 -20px;
    padding: 0 20px;
  }
}
</style>
