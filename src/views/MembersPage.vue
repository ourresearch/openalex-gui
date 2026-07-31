<template>
  <static-page title="Institutional supporters" :sections="tocSections">
    <template #intro>
      OpenAlex is a nonprofit, and subscriptions are how we cover our costs.
      Alongside our enterprise customers, we're proud to be sustained by a community of
      academic institutions, libraries, and government agencies — this page is about them.
      For these institutional supporters, a subscription is more than a purchase: it's
      joining a movement of organizations united by shared values — openness, and a deep
      commitment to inquiry and knowledge. Institutional support comes in three tiers:
      <a href="#member" @click.prevent="scrollToTier('member')">Member</a>,
      <a href="#member-plus" @click.prevent="scrollToTier('member-plus')">Member+</a>, and
      <a href="#partner" @click.prevent="scrollToTier('partner')">Partner</a>.
    </template>

    <static-section
      v-for="tier in tierConfigs"
      :key="tier.id"
      :id="tier.id"
      :title="tier.label"
    >
      <template #aside>{{ tier.price }} annually</template>

      <p v-if="tier.priceNote" class="section-body tier-price-note">{{ tier.priceNote }}</p>

      <h3 class="subsection-header">Benefits</h3>
      <p v-if="tier.lead" class="section-body tier-lead">{{ tier.lead }}</p>
      <ul class="section-list">
        <li v-for="benefit in tier.benefits" :key="benefit.title">
          <a v-if="benefit.href" :href="benefit.href" target="_blank" rel="noopener noreferrer">
            <span v-html="benefit.title" />
          </a>
          <strong v-else v-html="benefit.title" />
          — {{ benefit.description }}
        </li>
      </ul>

      <h3 class="subsection-header">{{ tier.orgsHeading }}</h3>
      <div v-if="orgsFor(tier.apiKey).length" class="member-columns">
        <div v-for="name in orgsFor(tier.apiKey)" :key="name" class="member-name">
          {{ name }}
        </div>
      </div>
      <p v-else-if="membersError || orgsLoaded" class="section-body">
        This list is taking a break —
        <a href="mailto:sales@openalex.org">contact us</a> and we'll happily tell you who's on board.
      </p>
      <v-progress-circular v-else indeterminate size="20" class="mt-2" />
    </static-section>

    <static-section id="join" title="Become a supporter">
      <p class="section-body">
        Join the institutions sustaining open research infrastructure.
      </p>
      <div class="join-buttons">
        <v-btn
          color="black"
          size="large"
          rounded="lg"
          variant="flat"
          class="text-none"
          href="mailto:sales@openalex.org"
        >
          Contact sales
        </v-btn>
        <v-btn
          size="large"
          rounded="lg"
          variant="outlined"
          class="text-none"
          to="/pricing/institutions"
        >
          View pricing
        </v-btn>
      </div>
    </static-section>
  </static-page>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useHead } from '@unhead/vue';
import { urlBase } from '@/apiConfig';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';

defineOptions({ name: 'MembersPage' });

// Rail = the three tier sections + the join CTA.
const tocSections = [
  { id: 'member', label: 'Member' },
  { id: 'member-plus', label: 'Member+' },
  { id: 'partner', label: 'Partner' },
  { id: 'join', label: 'Become a supporter' },
];

useHead({
  title: 'Institutional supporters',
  meta: [
    { name: 'description', content: 'The academic institutions, libraries, and government agencies supporting OpenAlex as open research infrastructure — Member, Member+, and Partner tiers, benefits, and pricing.' }
  ]
});

// Benefit how-tos live in the new help center (oxjob #354).
// TODO(#354 cutover): flip to https://help.openalex.org when the new KB takes over the domain.
const HELP_BASE = 'https://openalex-help.pages.dev/help';

// Marketing blurbs only — activation how-tos live in the help center.
// Prices + benefit matrix mirror /pricing (PricingPageNewer.vue) — keep in sync.
const tierConfigs = [
  {
    id: 'member',
    apiKey: 'member',
    label: 'Member',
    price: '$5,000',
    orgsHeading: 'Institutional members',
    benefits: [
      {
        title: '$20 per day of API usage',
        description: "for your organization's API key — 20× the free daily budget ($7,300 in annual value).",
      },
      {
        title: 'Admin Dashboard',
        href: `${HELP_BASE}/activate-your-admin-dashboard/`,
        description: "see how many users at your institution are using OpenAlex, and track your research community's API usage.",
      },
      {
        title: 'Affiliation Editor',
        href: `${HELP_BASE}/activate-the-affiliation-editor/`,
        description: 'curate the affiliation strings OpenAlex matches to your institution — live in OpenAlex within 2 days.',
      },
      {
        title: '<em>Unsub</em> access',
        href: `${HELP_BASE}/activate-unsub/`,
        description: 'data-driven forecasts of the true cost and value of your journal packages, to guide subscription decisions.',
      },
      {
        title: 'Advisory Board nominations',
        href: `${HELP_BASE}/advisory-board-nominations/`,
        description: "nominate candidates for the 12-member Community Advisory Board that helps guide OpenAlex's direction.",
      },
      {
        title: 'Quarterly supporter meetings',
        href: `${HELP_BASE}/quarterly-supporter-meetings/`,
        description: 'open-forum roundtables on roadmap priorities, directly with our product team.',
      },
    ],
  },
  {
    id: 'member-plus',
    apiKey: 'member_plus',
    label: 'Member+',
    price: '$10,000',
    orgsHeading: 'Institutional member+ subscribers',
    lead: 'Everything in Member, plus:',
    benefits: [
      {
        title: '$100 per day of API usage',
        description: "for your organization's API key ($36,500 in annual value).",
      },
      {
        title: 'Basic support',
        description: 'help with critical API bugs.',
      },
    ],
  },
  {
    id: 'partner',
    apiKey: 'partner',
    label: 'Partner',
    price: 'Starts at $20,000',
    priceNote: 'Partner plans are custom — pricing goes up from $20,000 depending on the level of collaboration you want.',
    orgsHeading: 'Institutional partners',
    lead: 'Everything in Member+, plus:',
    benefits: [
      {
        title: '$200+ per day of API usage',
        description: "for your organization's API key ($73,000+ in annual value).",
      },
      {
        title: 'Full support',
        description: 'ticket-based support for all issues.',
      },
      {
        title: 'Data Sync Service',
        href: 'https://openalex-help.pages.dev/docs/data-feed/',
        description: 'a feed of daily change files, so you can run your own local, synced copy of OpenAlex.',
      },
      {
        title: '3 power-user accounts',
        description: 'your admins can grant extra-high API limits to three individual users at your institution.',
      },
      {
        title: '5 hours of consulting per year',
        description: 'expert advice, training, and exploration customized to your needs.',
      },
    ],
  },
];

// Live supporter lists from the users API (see users-api public_members.py for
// the listing policy: legacy-plan -> tier mapping, commercial exclusions,
// display names). Expired plans drop off automatically.
const orgsByTier = ref({});
const orgsLoaded = ref(false);
const membersError = ref(false);

onMounted(async () => {
  try {
    const resp = await axios.get(`${urlBase.userApi}/organizations/public-members`);
    orgsByTier.value = resp.data || {};
    orgsLoaded.value = true;
    if (!tierConfigs.some(t => (orgsByTier.value[t.apiKey] || []).length)) {
      membersError.value = true;
    }
  } catch (e) {
    membersError.value = true;
  }
});

// Proper alphabetical order (É with E, case-insensitive)
function orgsFor(apiKey) {
  const names = orgsByTier.value[apiKey] || [];
  return [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}

function scrollToTier(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}
</script>


<style lang="scss" scoped>
.tier-price-note {
  font-size: 14.5px;
  margin-bottom: 12px;
}

.tier-lead {
  margin-bottom: 4px;
}

// Supporter name lists — multi-column, quiet
.member-columns {
  column-count: 3;
  column-gap: 32px;
  margin-top: 8px;
}

@media (max-width: 960px) {
  .member-columns { column-count: 2; }
}

@media (max-width: 600px) {
  .member-columns { column-count: 1; }
}

.member-name {
  font-size: 14px;
  line-height: 1.5;
  color: #3F3F46;
  padding: 3px 0;
  break-inside: avoid;
}

.join-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}
</style>
