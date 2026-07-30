<template>
  <static-page title="Members and partners" :sections="tocSections">
    <template #intro>
      Institutions committed to sustaining open research infrastructure.
    </template>

    <static-section id="benefits" title="Member benefits">
      <p class="section-body">
        All OpenAlex Membership tiers include the core benefits below.
        <router-link to="/pricing/institutions">Member+ and Partner tiers</router-link>
        include these benefits and additional services. For details on activating each
        benefit, see the <a href="https://help.openalex.org/" target="_blank" rel="noopener noreferrer">help center</a>
        or <a href="mailto:kyle@openalex.org">contact us</a>.
      </p>

      <div class="benefits-grid">
        <div v-for="benefit in benefits" :key="benefit.title" class="benefit-card">
          <v-icon class="benefit-icon" size="22">{{ benefit.icon }}</v-icon>
          <div class="benefit-title" v-html="benefit.title" />
          <div class="benefit-description">{{ benefit.description }}</div>
        </div>
      </div>
    </static-section>

    <static-section id="members" title="Our members and partners">
      <p class="section-body">
        These institutions are helping keep OpenAlex free and open for everyone.
      </p>

      <div v-if="membersError" class="section-body">
        The member list is taking a break —
        <a href="mailto:sales@openalex.org">contact us</a> and we'll happily tell you
        who's on board.
      </div>
      <v-progress-circular v-else-if="!tiers.length" indeterminate size="24" class="mt-4" />

      <div v-for="tier in tiers" :key="tier.label" class="member-tier">
        <h3 class="subsection-header">{{ tier.label }}</h3>
        <div class="member-columns">
          <div v-for="name in sorted(tier.names)" :key="name" class="member-name">
            {{ name }}
          </div>
        </div>
      </div>
    </static-section>

    <static-section id="join" title="Become a member or partner">
      <p class="section-body">
        Join the institutions supporting open research infrastructure.
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

const tocSections = [
  { id: 'benefits', label: 'Member benefits' },
  { id: 'members', label: 'Members and partners' },
  { id: 'join', label: 'Join us' },
];

useHead({
  title: 'Members and partners',
  meta: [
    { name: 'description', content: 'OpenAlex institutional members and partners supporting open research infrastructure. Learn about member benefits and how to join.' }
  ]
});

// Marketing blurbs only — activation how-tos live in the help center (#354).
const benefits = [
  {
    icon: 'mdi-view-dashboard-outline',
    title: 'Admin Dashboard',
    description: "See how many users at your institution are using OpenAlex and track your research community's API usage.",
  },
  {
    icon: 'mdi-account-edit-outline',
    title: 'Affiliation Editor',
    description: 'Curate the affiliation strings OpenAlex matches to your institution — live in OpenAlex within 2 days.',
  },
  {
    icon: 'mdi-book-open-variant',
    title: '<em>Unsub</em> access',
    description: 'Data-driven forecasts of the true cost and value of your journal packages, to guide subscription decisions.',
  },
  {
    icon: 'mdi-account-group-outline',
    title: 'Advisory Board nominations',
    description: "Nominate candidates for the 12-member Community Advisory Board that helps guide OpenAlex's direction.",
  },
  {
    icon: 'mdi-calendar-account-outline',
    title: 'Quarterly member meetings',
    description: 'Open-forum meetings to discuss priorities for future development roadmaps directly with our product team.',
  },
];

// Live member lists from the users API (see users-api public_members.py for
// the listing policy: legacy-plan -> tier mapping, commercial exclusions,
// display names). Expired plans drop off automatically.
const tierDefs = [
  { key: 'partner', label: 'Partner' },
  { key: 'member_plus', label: 'Member+' },
  { key: 'member', label: 'Member' },
];
const tiers = ref([]);
const membersError = ref(false);

onMounted(async () => {
  try {
    const resp = await axios.get(`${urlBase.userApi}/organizations/public-members`);
    tiers.value = tierDefs
      .map(t => ({ label: t.label, names: resp.data[t.key] || [] }))
      .filter(t => t.names.length);
    if (!tiers.value.length) { membersError.value = true; }
  } catch (e) {
    membersError.value = true;
  }
});

// Proper alphabetical order (É with E, case-insensitive)
function sorted(names) {
  return [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
}
</script>


<style lang="scss" scoped>
// Benefit cards — small, scannable; marketing, not how-to
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 28px;
}

@media (max-width: 960px) {
  .benefits-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .benefits-grid { grid-template-columns: 1fr; }
}

.benefit-card {
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 18px;
  background: #fff;
}

.benefit-icon {
  color: #0A0A0A;
  margin-bottom: 10px;
}

.benefit-title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0A0A0A;
  margin-bottom: 6px;
}

.benefit-description {
  font-size: 13.5px;
  line-height: 1.55;
  color: #52525B;
}

// Member name lists — multi-column, quiet
.member-tier {
  margin-top: 8px;
}

.member-columns {
  column-count: 3;
  column-gap: 32px;
  margin-top: 4px;
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
