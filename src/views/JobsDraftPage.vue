<template>
  <!-- Jobs pitch-page DRAFT (oxjob #792), parked at the unlinked /jobs/draft while /jobs
       stays on the coming-soon placeholder. Red-pen surface; noindex, not announced.
       Uses the house StaticPage pattern (hero + right-rail TOC), same as /about etc. -->
  <static-page title="Build the future of science" :sections="sections">
    <static-section id="about-us" title="About us">
      <p class="section-body">
        Today's problems require tomorrow's <strong>research ecosystem</strong>: a network
        of humans and agents collaborating without seams or silos. That ecosystem needs
        soil to grow. That's OpenAlex: inspired by the ancient Library of Alexandria, we're
        building a universal research library that gathers, organizes, and shares
        <em>all</em> research products&mdash;without paywalls. We'd love your help.
      </p>
      <p class="section-body">
        We sell services, but our data is free&mdash;we're driven by making a difference,
        not profits. And we do make one: our data reaches millions of downstream users
        across enterprise, government, and academia, and your favorite AI company probably
        uses it. We're a small, hand-picked team punching way above our weight, with the
        autonomy to match: no bureaucracy, no turf wars, no rituals&mdash;the mission sets
        the roadmap and the route's up to you. We pay well, work fully remote, use
        top-of-the-line equipment, and move really fast.
      </p>
      <p class="section-body">
        It's not all easy, though: it's intense and sometimes chaotic. Everyone does
        everything, priorities change fast, and remote work can be isolating. And with
        millions of downstream users, when we make mistakes, people notice&mdash;and we make
        plenty; we're moving fast and building something audacious. We value craft, but
        perfectionists need not apply.
      </p>
    </static-section>

    <static-section id="about-you" title="About you">
      <p class="section-body">
        If this is you, we want you on our team:
      </p>
      <ol class="section-list">
        <li>
          You're
          <a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">relentlessly resourceful</a>.
          You've got the smarts to
          <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">outwit the impossible problems</a>,
          the grit to power through the grindy ones, and the wisdom to tell the
          difference. You get things
          <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13" target="_blank" rel="noopener noreferrer">done</a>.
        </li>
        <li>
          You're playing jazz, not classical. That means you're confident in your
          skills, love improvising with a team, and can tolerate ambiguity,
          imperfection, and a dash of chaos.
        </li>
        <li>
          You embrace AI and grok the modern AI toolchain&mdash;not because of hype,
          but because it's leverage to solving bigger problems, faster (see #1).
        </li>
        <li>
          You believe in our mission: to build the future of science on an open,
          universal research library.
        </li>
      </ol>
    </static-section>

    <static-section id="open-positions" title="Open positions">
      <p class="section-body">
        We're hiring for two roles. Read the full posting and apply:
      </p>
      <div class="job-cards">
        <router-link class="job-card" to="/jobs/software-data-engineer">
          <span class="job-card-title">Software &amp; Data Engineer</span>
          <span class="job-card-sub">Full-time &middot; Remote</span>
          <span class="job-card-arrow" aria-hidden="true">&rarr;</span>
        </router-link>
        <router-link class="job-card" to="/jobs/community-lead">
          <span class="job-card-title">Community Lead</span>
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
  margin-top: 20px;
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
