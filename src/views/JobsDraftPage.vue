<template>
  <!-- Jobs pitch-page DRAFT (oxjob #792), parked at the unlinked /jobs/draft while /jobs
       stays on the coming-soon placeholder. Red-pen surface; noindex, not announced.
       Uses the house StaticPage pattern (hero + right-rail TOC), same as /about etc. -->
  <static-page title="Build the future of science" :sections="sections">
    <static-section id="about-us" title="About us">
      <p class="section-body">
        Inspired by the ancient Library of Alexandria, we're building a
        <strong><em>universal research library.</em></strong> And by making it open to
        humans and machines, we're supporting a new scientific revolution. We'd love your
        help.
      </p>
      <p class="section-body">
        As a nonprofit, we're driven by mission. As a tech company, <strong>we're working
        at scale:</strong> a billion API calls monthly, and millions of users across
        enterprise, government, and academia. Your favorite AI company probably uses
        OpenAlex; your favorite university definitely does.
      </p>
      <p class="section-body">
        <strong>Our small-team culture</strong> values trust, agency, and impact. The
        tempo's relentless, nothing's ever really done, and no one's holding your hand.
        But the work stays interesting, we have creative autonomy, and <em>we ship.</em>
        Every day.
      </p>
    </static-section>

    <static-section id="about-you" title="About you">
      <p class="section-body">
        You're
        <strong><a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">relentlessly resourceful</a>.</strong>
        You've got the smarts to
        <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">outwit the impossible problems</a>,
        the grit to power through the grindy ones, and the wisdom to tell the
        difference. You get things
        <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13" target="_blank" rel="noopener noreferrer">done</a>.
        That means you're leveraging AI extensively and skillfully, driven by results
        not hype.
      </p>
      <p class="section-body">
        You play <strong>jazz, not classical:</strong> you're confident in your skills,
        love improvising with a team, and can embrace ambiguity, imperfection, and a
        dash of chaos in service of emergent, collaborative creativity.
      </p>
      <p class="section-body">
        You <strong>believe in our mission</strong> and you care about openness and open
        culture. That extends to how you communicate: with skill, empathy, and clarity.
      </p>
    </static-section>

    <static-section id="open-positions" title="Open positions">
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
