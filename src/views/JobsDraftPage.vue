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
      <p class="section-body">
        One trait, above everything: people who are
        <a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">relentlessly resourceful</a>.
      </p>
      <p class="section-body">
        We measure results, not effort, and the bar here is delivering more in a
        week than most people can. You don't clear that bar by grinding; you clear
        it by figuring out which part of the job actually matters and doing only
        that. By finding the clever hack. By
        <a href="https://en.wikipedia.org/wiki/Gordian_Knot" target="_blank" rel="noopener noreferrer">cutting the knot</a>
        instead of untying it. By
        <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">redefining the rules of the game</a>.
        And by knowing where the 20% of effort lives that gets 80% of the results &mdash;
        then calling it
        <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13" target="_blank" rel="noopener noreferrer">done</a>
        and moving on, instead of polishing. Perfectionists are miserable here. So
        are people who love process.
      </p>
      <p class="section-body">
        We're all-in on AI &mdash; not because it's AI, but because it compounds what we
        can get done for the mission: about 10x so far, and climbing. Most of what
        we do all day is manage AI agents. We don't care how the work gets done,
        only that it solves the problem &mdash; and that you understand it deeply. That
        goes for your application, too.
      </p>
      <p class="section-body">
        So here's who thrives at OpenAlex: high-agency people who teach themselves,
        manage themselves, and are energized rather than rattled by fast, high-stakes,
        public work. And here's who doesn't: people who need a settled roadmap, a
        structured ladder, or a room full of colleagues to do their best work. There's
        no shame in the second list &mdash; most great people are on it. But if you're
        squarely on the first, this might be the best job you ever have.
      </p>
    </static-section>

    <static-section id="open-positions" title="Open positions">
      <p class="section-body">
        We're hiring for two roles &mdash; postings and applications land right here soon.
      </p>
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
  { id: 'open-positions', label: 'Open positions' },
];
</script>
