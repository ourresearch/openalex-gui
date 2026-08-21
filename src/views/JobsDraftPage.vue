<template>
  <!-- Jobs pitch-page DRAFT (oxjob #792), parked at the unlinked /jobs/draft while /jobs
       stays on the coming-soon placeholder. Red-pen surface; noindex, not announced.
       Uses the house StaticPage pattern (hero + right-rail TOC), same as /about etc. -->
  <static-page title="Build the future of science" :sections="sections">
    <static-section id="about-us" title="About us">
      <jobs-about-us />
    </static-section>

    <static-section id="about-you" title="About you">
      <jobs-about-you />
    </static-section>

    <static-section id="open-positions" title="Open positions">
      <div class="job-cards">
        <router-link class="job-card" to="/jobs/software-engineer">
          <span class="job-card-title">Software Engineer</span>
          <span class="job-card-sub">Full-time &middot; Remote</span>
          <span class="job-card-arrow" aria-hidden="true">&rarr;</span>
        </router-link>
        <router-link class="job-card" to="/jobs/community-lead">
          <span class="job-card-title">Community Lead</span>
          <span class="job-card-sub">Full-time &middot; Remote</span>
          <span class="job-card-arrow" aria-hidden="true">&rarr;</span>
        </router-link>
        <router-link class="job-card" to="/jobs/operations-associate">
          <span class="job-card-title">Operations Associate</span>
          <span class="job-card-sub">Full-time &middot; Remote</span>
          <span class="job-card-arrow" aria-hidden="true">&rarr;</span>
        </router-link>
      </div>
    </static-section>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import JobsAboutUs from '@/components/Jobs/JobsAboutUs.vue';
import JobsAboutYou from '@/components/Jobs/JobsAboutYou.vue';

defineOptions({ name: 'JobsDraftPage' });

useHead({
  title: 'Jobs (draft)',
  meta: [
    // Unlinked draft surface — keep out of the index.
    { name: 'robots', content: 'noindex' },
  ],
});

const sections = [
  { id: 'about-us', label: 'About us' },
  { id: 'about-you', label: 'About you' },
  { id: 'open-positions', label: 'Open positions' },
];
</script>


<style scoped lang="scss">
.job-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.job-card {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  color: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  // The global App.vue anchor rule (a:not(...):hover) underlines links on hover
  // with specificity (0,5,1) — higher than this scoped rule — so we need
  // !important to keep these cards (not text links) from underlining. The darker
  // border/background hover affordance stays.
  &,
  &:hover {
    text-decoration: none !important;
  }

  &:hover {
    border-color: #A1A1AA;
    background: #FAFAFA;
  }
}

.job-card-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0A0A0A;
}

.job-card-sub {
  font-size: 14px;
  color: #71717A;
}

.job-card-arrow {
  margin-left: auto;
  font-size: 18px;
  color: #A1A1AA;
}
</style>
