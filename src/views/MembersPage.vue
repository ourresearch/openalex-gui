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
      <a href="#partner" @click.prevent="scrollToTier('partner')">Partner</a> —
      see <a href="/pricing">pricing</a> and the
      <a :href="`${HELP_DOCS_BASE}/pricing/`" target="_blank" rel="noopener noreferrer">pricing docs</a>
      for what each includes.
    </template>

    <static-section
      v-for="tier in tierConfigs"
      :key="tier.id"
      :id="tier.id"
      :title="tier.label"
    >
      <template #aside>{{ tier.price }} annually</template>

      <p class="section-body tier-docs-link">
        <a :href="`${HELP_DOCS_BASE}/${tier.docsSlug}/`" target="_blank" rel="noopener noreferrer">
          Benefits and details for {{ tier.label }} →
        </a>
      </p>

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

// Benefits content lives in ONE place now: the help center's Pricing docs
// (oxjob #750) — this page is just the supporters lists + join CTA, so there's
// no benefit matrix to keep in sync with /pricing anymore.
// TODO(#354 cutover): flip to https://help.openalex.org when the new KB takes over the domain.
const HELP_DOCS_BASE = 'https://openalex-help.pages.dev/access';

const tierConfigs = [
  {
    id: 'member',
    apiKey: 'member',
    label: 'Member',
    price: '$5,000',
    docsSlug: 'member',
    orgsHeading: 'Institutional members',
  },
  {
    id: 'member-plus',
    apiKey: 'member_plus',
    label: 'Member+',
    price: '$10,000',
    docsSlug: 'member-plus',
    orgsHeading: 'Institutional member+ subscribers',
  },
  {
    id: 'partner',
    apiKey: 'partner',
    label: 'Partner',
    price: 'Starts at $20,000',
    docsSlug: 'partner',
    orgsHeading: 'Institutional partners',
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
.tier-docs-link {
  margin-bottom: 12px;
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
