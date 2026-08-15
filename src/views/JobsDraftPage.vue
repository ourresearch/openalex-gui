<template>
  <!-- Jobs pitch-page DRAFT (oxjob #792), parked at the unlinked /jobs/draft while /jobs
       stays on the coming-soon placeholder. Red-pen surface; noindex, not announced.
       Uses the house StaticPage pattern (hero + right-rail TOC), same as /about etc. -->
  <static-page title="Build the future of science" :sections="sections">
    <template #intro>
      Today's problems require tomorrow's <strong>research ecosystem</strong>: a network
      of humans and agents collaborating without seams or silos. That ecosystem needs
      soil to grow. That's OpenAlex: inspired by the ancient Library of Alexandria,
      we're building a universal research library that gathers, organizes, and shares
      <em>all</em> research products&mdash;without paywalls. We'd love your help.
    </template>

    <static-section id="what-rocks" title="What rocks about this job">
      <ul class="section-list">
        <li>
          <strong>United by mission:</strong> We sell services, but our data is free,
          because we're driven by making a difference, not profits. And we do make a
          difference: our data reaches millions of downstream users in enterprise,
          government, and academic settings worldwide. Your favorite AI company probably
          uses our data; your favorite university definitely does.
        </li>
        <li>
          <strong>Freedom to create:</strong> We're a small, hand-picked team punching
          way above our weight. Why? Because we hire exceptional people and give them
          exceptional flexibility and autonomy. No bureaucracy, no turf wars, no
          rituals. The mission sets the roadmap, and the route's up to you. And we move
          really fast.
        </li>
        <li>
          <strong>Great comp and perks:</strong> We pay well, with benefits to match.
          Perks include travel, fully remote work, top-of-the-line equipment, and
          working with a smart, fun, dedicated team.
        </li>
      </ul>
    </static-section>

    <static-section id="whats-hard" title="What's hard about this job">
      <ul class="section-list">
        <li>
          <strong>Remote isolation:</strong> Remote's a double-edged sword. We get the
          whole team together every few months, but it's not the same.
        </li>
        <li>
          <strong>Intense, chaotic workload:</strong> In a small, high-performing team,
          everyone does everything and priorities change fast. You'll need flexibility,
          communication, and a lot of self-awareness.
        </li>
        <li>
          <strong>You'll ship mistakes in public:</strong> With millions of downstream
          users, when we make mistakes, people notice. And we make plenty&mdash;we're
          moving fast and building something really audacious. We value craft, but
          perfectionists need not apply.
        </li>
      </ul>
    </static-section>

    <static-section id="who-were-looking-for" title="Who we're looking for">
      <p class="section-body"><em>Draft in progress &mdash; this section is coming.</em></p>
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
  { id: 'what-rocks', label: 'What rocks about this job' },
  { id: 'whats-hard', label: "What's hard about this job" },
  { id: 'who-were-looking-for', label: "Who we're looking for" },
];
</script>
