<template>
  <div class="pricing-page">
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
      <h2 class="section-header">Credit packs</h2>
      <p class="section-body">
        Need a burst of extra credits? Buy them one-time at
        <strong>10,000 credits for $1</strong>. Purchased credits are only used after your
        free daily credits run out, and they expire 3 months after your most recent purchase.
        <a href="#" @click.prevent="buyCredits">Buy credit packs</a>.
      </p>

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
        <h2 class="section-header">Subscriptions</h2>
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
                  <span class="plan-price">$5k<span class="plan-period">/year</span></span>
                </div>
              </th>
              <th class="plan-col">
                <div class="plan-header">
                  <span class="plan-name">Member+</span>
                  <span class="plan-price">$10k<span class="plan-period">/year</span></span>
                </div>
              </th>
              <th class="plan-col">
                <div class="plan-header">
                  <span class="plan-name">Partner</span>
                  <span class="plan-price">$20k+<span class="plan-period">/year</span></span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Everyone swimlane -->
            <tr class="swimlane-header">
              <td colspan="4">Everyone</td>
            </tr>
            <tr>
              <td class="feature-label">API credits/day</td>
              <td>250,000</td>
              <td>1,000,000</td>
              <td>2,000,000+</td>
            </tr>
            <tr>
              <td class="feature-label">Savings vs. credit packs</td>
              <td><span class="savings-value">45%</span></td>
              <td><span class="savings-value">73%</span></td>
              <td><span class="savings-value">73%</span></td>
            </tr>
            <tr>
              <td class="feature-label">Support</td>
              <td>Community</td>
              <td>Basic</td>
              <td>Ticket</td>
            </tr>
            <tr>
              <td class="feature-label">Admin dashboard</td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">Nomination rights</td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">Quarterly meetings</td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">Data Sync Service</td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">5 power user accounts</td>
              <td><span class="dash">—</span></td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>

            <!-- Academic & Government swimlane -->
            <tr class="swimlane-header">
              <td colspan="4">Academic & Government</td>
            </tr>
            <tr>
              <td class="feature-label">Affiliation editor</td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label"><em>Unsub</em> access</td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
            <tr>
              <td class="feature-label">5hr consulting/year</td>
              <td><span class="dash">—</span></td>
              <td><span class="dash">—</span></td>
              <td><v-icon size="18" class="check-icon">mdi-check</v-icon></td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td></td>
              <td>
                <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Become a Member</a>
              </td>
              <td>
                <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Get Member+</a>
              </td>
              <td>
                <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Become a Partner</a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

    </section>

    <!-- ==================== PDF ARCHIVE ==================== -->
    <section id="pdf-archive" class="section compact-section">
      <h2 class="section-header">PDF archive</h2>
      <p class="section-body">
        Get all 60 million of our cached open-access full-text PDFs delivered straight to
        your S3 bucket. Perfect for building search indexes, training models, or running
        large-scale text mining.
        <a href="mailto:sales@openalex.org">Contact sales</a> to learn more.
      </p>
    </section>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue';
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

// Hero Section
.hero {
  padding: 80px 24px 20px;
  max-width: 720px;
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
  max-width: 720px;
}

.section-header {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 12px 0;
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
  background: #FAFAFA;
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

  &.cta-secondary {
    background: #fff;
    color: #0A0A0A;
    border: 1px solid #E4E4E7;

    &:hover {
      border-color: #A1A1AA;
      background: #FAFAFA;
    }
  }
}

// Organization Grid
.org-grid-wrapper {
  max-width: 1000px;
  margin: 0 auto;
  overflow-x: auto;
}

.org-grid {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #E4E4E7;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;

  th, td {
    padding: 14px 20px;
    text-align: center;
    border-bottom: 1px solid #E4E4E7;
    font-size: 15px;
    color: #3F3F46;
  }

  .feature-col {
    width: 220px;
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

  tfoot td {
    padding: 24px 20px;
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
  font-size: 14px;
  font-weight: 400;
  color: #71717A;
}

.feature-label {
  text-align: left !important;
  font-weight: 500;
  color: #0A0A0A !important;
}

.swimlane-header td {
  background: #F4F4F5;
  font-size: 13px !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717A !important;
  text-align: left !important;
  padding: 10px 20px !important;
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
  max-width: 720px;
  margin: 0 auto 40px;
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
