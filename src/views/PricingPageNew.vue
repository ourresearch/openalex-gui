<template>
  <div class="pricing-page">
    <!-- Hero Section -->
    <section class="hero">
      <h1 class="hero-headline">Simple, transparent pricing</h1>
      <p class="hero-subhead">
        Start free, scale as you grow. No surprises.
      </p>
    </section>

    <!-- Context Toggle -->
    <section class="section toggle-section">
      <div class="context-toggle">
        <button
          class="toggle-btn"
          :class="{ active: context === 'developers' }"
          @click="handleDevToggle($event)"
        >
          For Developers
        </button>
        <button
          class="toggle-btn"
          :class="{ active: context === 'institutions' }"
          @click="setContext('institutions')"
        >
          For Institutions
        </button>
      </div>
    </section>

    <!-- Pricing Cards -->
    <section class="section cards-section">
      <div class="pricing-cards">
        <template v-if="context === 'developers'">
          <!-- Free Tier -->
          <div class="pricing-card">
            <div class="card-header">
              <h3 class="tier-name">Free</h3>
              <div class="tier-price">
                <span class="price-amount">$0</span>
                <span class="price-period">/month</span>
              </div>
              <p class="tier-description">For personal projects and exploration</p>
            </div>
            <div class="card-body">
              <ul class="feature-list">
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> 10,000 credits/day</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Full API access</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Community support</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> No credit card required</li>
              </ul>
            </div>
            <div class="card-footer">
              <router-link to="/signup" class="cta-btn cta-secondary">Get Started</router-link>
            </div>
          </div>

          <!-- Pro Tier -->
          <div class="pricing-card highlighted">
            <div class="popular-badge">Most Popular</div>
            <div class="card-header">
              <h3 class="tier-name">Pro</h3>
              <div class="tier-price">
                <span class="price-amount">$49</span>
                <span class="price-period">/month</span>
              </div>
              <p class="tier-description">For growing applications and teams</p>
            </div>
            <div class="card-body">
              <ul class="feature-list">
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> 50,000 credits/day</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Full API access</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Community support</li>
              </ul>
            </div>
            <div class="card-footer">
              <router-link to="/signup" class="cta-btn cta-primary">Upgrade to Pro</router-link>
            </div>
          </div>

          <!-- Enterprise Tier -->
          <div class="pricing-card">
            <div class="card-header">
              <h3 class="tier-name">Enterprise</h3>
              <div class="tier-price">
                <span class="price-amount">$10k+</span>
                <span class="price-period">/year</span>
              </div>
              <p class="tier-description">For large-scale production systems</p>
            </div>
            <div class="card-body">
              <ul class="feature-list">
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> 1M+ credits/day</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Ticket support</li>
                <li><v-icon size="18" class="check-icon">mdi-check</v-icon> Custom SLA</li>
              </ul>
            </div>
            <div class="card-footer">
              <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Contact Sales</a>
            </div>
          </div>
        </template>

        <template v-else>
          <!-- Member Tier -->
          <div class="pricing-card">
            <div class="card-header">
              <h3 class="tier-name">Member</h3>
              <div class="tier-price">
                <span class="price-amount">$5k</span>
                <span class="price-period">/year</span>
              </div>
              <p class="tier-description">For institutions committed to open research</p>
            </div>
            <div class="card-body">
              <ul class="feature-list-detailed">
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Admin dashboard</strong>
                    <span>OpenAlex usage data for your institution</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Affiliation editor</strong>
                    <span>Curate author affiliations (training resources provided)</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong><em>Unsub</em> access</strong>
                    <span>Data-driven journal subscription decisions</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Nomination rights</strong>
                    <span>For our Community Advisory Board</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Quarterly meetings</strong>
                    <span>With the product team</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="card-footer">
              <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Become a Member</a>
            </div>
          </div>

          <!-- Member+ Tier -->
          <div class="pricing-card highlighted">
            <div class="popular-badge">Most Popular</div>
            <div class="card-header">
              <h3 class="tier-name">Member<sup class="plus-superscript">+</sup></h3>
              <div class="tier-price">
                <span class="price-amount">$10k</span>
                <span class="price-period">/year</span>
              </div>
              <p class="tier-description">For Members using lots of OpenAlex data</p>
            </div>
            <div class="card-body">
              <ul class="feature-list-detailed">
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Everything in Member</strong>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>1 million API credits/day</strong>
                    <span>On a single API key</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Data Sync Service</strong>
                    <span>Get changes in the data every day</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="card-footer">
              <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Get Member<sup class="plus-superscript">+</sup></a>
            </div>
          </div>

          <!-- Partner Tier -->
          <div class="pricing-card">
            <div class="card-header">
              <h3 class="tier-name">Partner</h3>
              <div class="tier-price">
                <span class="price-amount">$20k+</span>
                <span class="price-period">/year</span>
              </div>
              <p class="tier-description">For institutions driving open infrastructure</p>
            </div>
            <div class="card-body">
              <ul class="feature-list-detailed">
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>Everything in Member+</strong>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>5 high-usage researcher accounts</strong>
                    <span>Give select researchers at your institution extra-high API limits</span>
                  </div>
                </li>
                <li>
                  <v-icon size="18" class="check-icon">mdi-check</v-icon>
                  <div>
                    <strong>5hr consulting/year</strong>
                    <span>Custom integrations, analysis, or training</span>
                  </div>
                </li>
              </ul>
            </div>
            <div class="card-footer">
              <a href="mailto:sales@openalex.org" class="cta-btn cta-secondary">Become a Partner</a>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Add-ons Section (API only) -->
    <section v-if="context === 'developers'" class="section addons-section">
      <h2 class="section-header">Add-ons</h2>

      <div class="addons-grid">
        <div class="addon-card">
          <div class="addon-icon">
            <v-icon size="32">mdi-sync</v-icon>
          </div>
          <h3 class="addon-name">Sync Service</h3>
          <div class="addon-price">$10,000<span>/year</span></div>
          <p class="addon-description">
            Keep a complete, local copy of OpenAlex with daily incremental updates.
            Perfect for data warehouses and offline analysis.
          </p>
          <a href="mailto:sales@openalex.org" class="addon-link">Learn more →</a>
        </div>

        <div class="addon-card">
          <div class="addon-icon">
            <v-icon size="32">mdi-package-variant</v-icon>
          </div>
          <h3 class="addon-name">Credit Pack</h3>
          <div class="addon-price">$50,000<span> for 5B credits</span></div>
          <p class="addon-description">
            Bulk credits at 90% off list price. Ideal for high-volume applications.
            Credits expire after 1 year.
          </p>
          <a href="mailto:sales@openalex.org" class="addon-link">Learn more →</a>
        </div>

        <div class="addon-card">
          <div class="addon-icon">
            <v-icon size="32">mdi-file-pdf-box</v-icon>
          </div>
          <h3 class="addon-name">PDF Archive</h3>
          <div class="addon-price">$50,000<span> one-time</span></div>
          <p class="addon-description">
            Download all 60M full-text PDFs via direct storage access.
            Includes 30-day access to sync the complete archive.
          </p>
          <a href="https://docs.openalex.org/download-all-data/full-text-pdfs" class="addon-link">Learn more →</a>
        </div>
      </div>
    </section>

    <!-- Credit System Section (API only) -->
    <section v-if="context === 'developers'" class="section credits-section">
      <h2 class="section-header">How credits work</h2>
      <p class="section-subhead">
        Credits reset daily. Different endpoints cost different amounts based on computational complexity.
      </p>

      <div class="credits-table-wrapper">
        <table class="credits-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Credits</th>
              <th>Effective Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="endpoint-cell">
                  <v-icon size="20" class="endpoint-icon">mdi-identifier</v-icon>
                  <div>
                    <span class="endpoint-name">Get</span>
                    <span class="endpoint-desc">Retrieve by OpenAlex ID</span>
                  </div>
                </div>
              </td>
              <td><span class="credit-free">FREE</span></td>
              <td>$0</td>
            </tr>
            <tr>
              <td>
                <div class="endpoint-cell">
                  <v-icon size="20" class="endpoint-icon">mdi-format-list-bulleted</v-icon>
                  <div>
                    <span class="endpoint-name">List / Filter</span>
                    <span class="endpoint-desc">Query and filter entities</span>
                  </div>
                </div>
              </td>
              <td>1 credit</td>
              <td>$0.0001</td>
            </tr>
            <tr>
              <td>
                <div class="endpoint-cell">
                  <v-icon size="20" class="endpoint-icon">mdi-file-pdf-box</v-icon>
                  <div>
                    <span class="endpoint-name">Download</span>
                    <span class="endpoint-desc">Get full-text PDFs</span>
                  </div>
                </div>
              </td>
              <td>100 credits</td>
              <td>$0.01</td>
            </tr>
            <tr>
              <td>
                <div class="endpoint-cell">
                  <v-icon size="20" class="endpoint-icon">mdi-magnify</v-icon>
                  <div>
                    <span class="endpoint-name">Find</span>
                    <span class="endpoint-desc">Semantic / embedding search</span>
                  </div>
                </div>
              </td>
              <td>100 credits</td>
              <td>$0.01</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="credits-note">
        List price: <strong>$0.10 per 1,000 credits</strong>. Pro and Enterprise tiers include significant discounts.
      </p>
    </section>

    <!-- FAQ Section -->
    <section class="section faq-section">
      <h2 class="section-header">Frequently asked questions</h2>
      <div class="faq-list">
        <div
          v-for="(faq, index) in currentFaqs"
          :key="index"
          class="faq-item"
          :class="{ 'is-open': openFaq === index }"
        >
          <button class="faq-question" @click="toggleFaq(index)">
            <span>{{ faq.question }}</span>
            <v-icon class="faq-icon">{{ openFaq === index ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </button>
          <div v-if="openFaq === index" class="faq-answer">
            <p v-html="faq.answer"></p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="section cta-section">
      <div class="final-cta">
        <h2 class="cta-headline">Ready to get started?</h2>
        <p class="cta-subhead">
          {{ context === 'developers' ? 'Start building with the OpenAlex API today.' : 'Join the institutions supporting open research infrastructure.' }}
        </p>
        <div class="cta-buttons">
          <router-link v-if="context === 'developers'" to="/signup" class="cta-btn cta-primary cta-large">
            Create Free Account
          </router-link>
          <a v-else href="mailto:sales@openalex.org" class="cta-btn cta-primary cta-large">
            Contact Sales
          </a>
          <a href="https://docs.openalex.org" target="_blank" class="cta-btn cta-secondary cta-large">
            Read the Docs
          </a>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import { useHead } from '@unhead/vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  initialContext: {
    type: String,
    default: null
  }
});

defineOptions({ name: 'PricingPageNew' });

useHead({
  title: 'Pricing - OpenAlex',
  meta: [
    { name: 'description', content: 'Simple, transparent pricing for the OpenAlex API. Start free, scale as you grow.' }
  ]
});

const route = useRoute();
const router = useRouter();
const defaultContext = props.initialContext || (route.path.endsWith('/institutions') ? 'institutions' : 'developers');
const context = ref(defaultContext);
const openFaq = ref(null);

function handleDevToggle(event) {
  if (event.metaKey || event.ctrlKey) {
    setContext('developers');
  }
}

function setContext(newContext) {
  context.value = newContext;
  const targetPath = newContext === 'institutions' ? '/pricing/institutions' : '/pricing/developers';
  if (route.path !== targetPath) {
    router.replace(targetPath);
  }
}

// Reset FAQ state when context changes
watch(context, () => {
  openFaq.value = null;
});

const developerFaqs = [
  {
    question: 'What are credits and how do they work?',
    answer: 'Credits are our unit of API usage. Different endpoints cost different amounts based on computational complexity. Your credits reset every day at midnight UTC. Free accounts get 10,000 credits/day, Pro accounts get 50,000 credits/day.'
  },
  {
    question: 'What happens if I run out of credits?',
    answer: 'When you exhaust your daily credits, API requests will return a rate limit error until your credits reset at midnight UTC. You can upgrade to a higher tier for more daily credits, or contact sales for custom volume pricing.'
  },
  {
    question: 'Can I try Pro before committing?',
    answer: 'Yes! Start with our free tier to explore the API. When you\'re ready to scale, upgrading to Pro takes just a few clicks. You can downgrade at any time.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Pro subscriptions can be cancelled at any time. We don\'t offer refunds for partial months, but you\'ll retain access until the end of your billing period. Enterprise contracts have custom terms.'
  },
  {
    question: 'What\'s the difference between Get and List endpoints?',
    answer: 'Get endpoints retrieve a single entity by its OpenAlex ID and are completely free. List endpoints let you query, filter, and paginate through multiple entities—these cost 1 credit per call.'
  }
];

const institutionFaqs = [
  {
    question: 'What is Membership and how is that different from a paid database?',
    answer: 'Our data is always free under CC0 license. Our membership options include paid services and tools for institutions and this revenue ensures we can sustainably operate completely openly.'
  },
  {
    question: 'Can we trial membership models before purchasing?',
    answer: 'Some of the services and tools included in our membership options can be trialed (e.g., higher credit API keys), but others cannot (e.g., consulting hours). If you aren\'t sure yet and want to discuss with our sales team or set up a trial, contact <a href="mailto:sales@openalex.org">sales@openalex.org</a>.'
  },
  {
    question: 'I have an existing Premium/Institutional contract—what do these changes mean for me?',
    answer: 'Previous contracts will be honored, plus you now get all newly introduced Member benefits (dashboard, affiliation editor, Unsub, advisory board rights, quarterly meetings).'
  },
  {
    question: 'Why is Partner "$20k+"?',
    answer: 'The base Partner package is expandable. For instance, some institutions may want to purchase additional researcher accounts, more consulting hours, or custom feature development.'
  },
  {
    question: 'How do the Member benefits work and how do I activate them?',
    answer: 'For details on each benefit, how they work, and how to activate them check out <a href="/members">openalex.org/members</a>.'
  }
];

const currentFaqs = computed(() => {
  return context.value === 'developers' ? developerFaqs : institutionFaqs;
});

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}
</script>


<style lang="scss" scoped>
.pricing-page {
  background: #fff;
}

// Hero Section
.hero {
  padding: 80px 24px 40px;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-headline {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #0A0A0A;
  margin: 0 0 16px 0;
}

.hero-subhead {
  font-size: 20px;
  font-weight: 400;
  line-height: 1.5;
  color: #52525B;
  margin: 0;
}

// Sections
.section {
  padding: 60px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.section-header {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  text-align: center;
  margin: 0 0 16px 0;
}

.section-subhead {
  font-size: 17px;
  line-height: 1.6;
  color: #52525B;
  text-align: center;
  margin: 0 0 40px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

// Context Toggle
.toggle-section {
  padding-top: 0;
  padding-bottom: 20px;
}

.context-toggle {
  display: inline-flex;
  background: #F4F4F5;
  border-radius: 8px;
  padding: 4px;
  margin: 0 auto;
}

.toggle-btn {
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  color: #52525B;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #0A0A0A;
  }

  &.active {
    background: #fff;
    color: #0A0A0A;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

// Pricing Cards
.cards-section {
  padding-top: 40px;
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.pricing-card {
  position: relative;
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  background: #fff;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #A1A1AA;
  }

  &.highlighted {
    border: 2px solid #0A0A0A;
  }
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #0A0A0A;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 100px;
  white-space: nowrap;
}

.card-header {
  margin-bottom: 24px;
}

.tier-name {
  font-size: 20px;
  font-weight: 600;
  color: #0A0A0A;
  margin: 0 0 8px 0;
}

.plus-superscript {
  font-weight: 700;
  font-size: 0.7em;
  vertical-align: super;
}

.tier-price {
  margin-bottom: 8px;
}

.price-amount {
  font-size: 40px;
  font-weight: 700;
  color: #0A0A0A;
  letter-spacing: -0.02em;
}

.price-period {
  font-size: 16px;
  font-weight: 400;
  color: #71717A;
}

.tier-description {
  font-size: 14px;
  color: #71717A;
  margin: 0;
}

.card-body {
  flex: 1;
  margin-bottom: 24px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    color: #3F3F46;
  }
}

.check-icon {
  color: #16A34A;
  flex-shrink: 0;
}

.feature-list-detailed {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    gap: 10px;
    padding: 10px 0;
    font-size: 14px;
    color: #3F3F46;
    border-bottom: 1px solid #F4F4F5;

    &:last-child {
      border-bottom: none;
    }

    .check-icon {
      margin-top: 2px;
    }

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    strong {
      font-weight: 600;
      color: #0A0A0A;
    }

    span {
      font-size: 13px;
      color: #71717A;
      line-height: 1.4;
    }
  }
}

.card-footer {
  margin-top: auto;
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
    padding: 16px 32px;
    font-size: 16px;
    width: auto;
  }
}

// Credits Section
.credits-section {
  background: #FAFAFA;
  max-width: none;
  padding: 80px 24px;
}

.credits-table-wrapper {
  max-width: 700px;
  margin: 0 auto;
  overflow-x: auto;
}

.credits-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #E4E4E7;

  th, td {
    padding: 16px 20px;
    text-align: left;
    border-bottom: 1px solid #E4E4E7;
  }

  th {
    font-size: 13px;
    font-weight: 600;
    color: #71717A;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #FAFAFA;
  }

  td {
    font-size: 15px;
    color: #3F3F46;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.endpoint-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.endpoint-icon {
  color: #71717A;
}

.endpoint-name {
  font-weight: 600;
  color: #0A0A0A;
  display: block;
}

.endpoint-desc {
  font-size: 13px;
  color: #71717A;
}

.credit-free {
  color: #16A34A;
  font-weight: 600;
}

.credits-note {
  text-align: center;
  font-size: 14px;
  color: #71717A;
  margin-top: 24px;
}

// Add-ons Section
.addons-section {
  padding-top: 80px;
}

.addons-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.addon-card {
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 32px;
  background: #fff;
}

.addon-icon {
  width: 56px;
  height: 56px;
  background: #F4F4F5;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #52525B;
}

.addon-name {
  font-size: 20px;
  font-weight: 600;
  color: #0A0A0A;
  margin: 0 0 8px 0;
}

.addon-price {
  font-size: 24px;
  font-weight: 700;
  color: #0A0A0A;
  margin-bottom: 12px;

  span {
    font-size: 14px;
    font-weight: 400;
    color: #71717A;
  }
}

.addon-description {
  font-size: 15px;
  line-height: 1.6;
  color: #52525B;
  margin: 0 0 16px 0;
}

.addon-link {
  font-size: 14px;
  font-weight: 500;
  color: #0A0A0A;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// FAQ Section
.faq-section {
  padding-top: 80px;
  padding-bottom: 80px;
  max-width: 700px;
}

.faq-list {
  // Container
}

.faq-item {
  border-bottom: 1px solid #E4E4E7;

  &:last-child {
    border-bottom: none;
  }
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 16px;
  font-weight: 500;
  color: #0A0A0A;
  font-family: inherit;

  &:hover {
    color: #000;
  }

  &:focus {
    outline: none;
  }
}

.faq-icon {
  color: #A1A1AA;
  flex-shrink: 0;
  margin-left: 16px;
}

.faq-answer {
  padding-bottom: 24px;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #52525B;
  }
}

// Final CTA Section
.cta-section {
  background: #FAFAFA;
  max-width: none;
  padding: 100px 24px;
}

.final-cta {
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.cta-headline {
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 12px 0;
}

.cta-subhead {
  font-size: 18px;
  color: #52525B;
  margin: 0 0 32px 0;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

// Responsive
@media (max-width: 960px) {
  .hero-headline {
    font-size: 40px;
  }

  .pricing-cards {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .addons-grid {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    font-size: 28px;
  }
}

@media (max-width: 600px) {
  .hero {
    padding: 60px 20px 30px;
  }

  .hero-headline {
    font-size: 32px;
  }

  .hero-subhead {
    font-size: 17px;
  }

  .section {
    padding: 48px 20px;
  }

  .toggle-btn {
    padding: 8px 16px;
    font-size: 14px;
  }

  .pricing-card {
    padding: 24px 20px;
  }

  .price-amount {
    font-size: 32px;
  }

  .credits-table {
    th, td {
      padding: 12px 16px;
    }
  }

  .endpoint-desc {
    display: none;
  }

  .cta-headline {
    font-size: 28px;
  }

  .cta-buttons {
    flex-direction: column;

    .cta-btn {
      width: 100%;
    }
  }
}
</style>
