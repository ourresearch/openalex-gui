<template>
  <!-- Temp iteration surface for the real /jobs page (oxjob #662). Replaces /jobs when copy lands. -->
  <static-page>
    <article class="jobsd">
      <header class="jobsd-hero">
        <p class="jobsd-eyebrow">Working at OpenAlex · draft</p>
        <h1 class="jobsd-headline">Help us set research&nbsp;free.</h1>
      </header>

      <section>
        <h2>About us</h2>
        <p>OpenAlex is a comprehensive, open catalog of the world's research.</p>
        <p>
          We're a small team with a big impact, building the foundation of a new,
          AI-powered science ecosystem. Your favorite AI tool probably uses OpenAlex;
          your favorite university definitely does.
        </p>
      </section>

      <section>
        <h2>What's good about working here</h2>
        <p>
          You'll get a mission, enormous room, and a lot of trust — not a playbook, a
          process, or a manager curating your calendar. Everyone here works with AI
          agents every day, on everything. Your coworkers are smart, motivated, and
          shipping constantly — and what we ship is live infrastructure the research
          world runs on, so the impact starts your first week, not after you've paid
          your dues.
        </p>
        <p>
          We work hard and get a lot done, but we keep sane hours: that's how you
          actually get things done long-term, and we're in this for the long haul.
        </p>
        <p>And we take care of people:</p>
        <ul>
          <li>Salary published on every listing</li>
          <li>Work from anywhere with reasonable hours overlap</li>
          <li>Any hardware or home-office gear you need, reimbursed — computer, monitors, desk, chair</li>
          <li>20 days paid time off (rising to 22 in year 3 and 25 in year 5), plus 15 days sick leave you can also use to care for family</li>
          <li>Health insurance and retirement benefits</li>
        </ul>
        <p class="jobsd-note">Draft note: this section gets another pass once the team 360 interviews land.</p>
      </section>

      <section>
        <h2>What's hard about working here</h2>
        <p>
          The best thing and the hard thing are the same thing. All that room and trust
          means nobody hands you a playbook: you'll own problems end to end, decide for
          yourself what matters most, and live with ambiguity a bigger org would
          committee away. We're a small team, so there's no department to hand things
          off to — when something is yours, it's yours.
        </p>
        <p>
          And when the site goes down on a Saturday, we fix it on Saturday. Then we
          make sure that Saturday never happens again.
        </p>
        <p class="jobsd-note">Draft note: more hard things coming from the team 360 interviews.</p>
      </section>

      <section>
        <h2>What we're looking for</h2>
        <p>
          One trait, above everything: people who are
          <a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">relentlessly resourceful</a>.
        </p>
        <p>
          We measure results, not effort — we're card-carrying members of the
          <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13" target="_blank" rel="noopener noreferrer">cult of done</a>
          — and the bar here is delivering more in a week than most people can. You
          don't clear that bar by grinding; you clear it by figuring out which part of
          the job actually matters and doing only that. By finding the clever hack. By
          <a href="https://en.wikipedia.org/wiki/Gordian_Knot" target="_blank" rel="noopener noreferrer">cutting the knot</a>
          instead of untying it. By
          <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">redefining the rules of the game</a>.
          And by knowing where the 20% of effort lives that gets 80% of the results —
          then moving on, instead of polishing. Perfectionists are miserable here. So
          are people who love process.
        </p>
        <p>
          We're all-in on AI — not because it's AI, but because it compounds what we
          can get done for the mission: about 10x so far, and climbing. Most of what we
          do all day is manage AI agents. We don't care how the work gets done, only
          that it's excellent and that you understand it deeply. That goes for your
          application, too.
        </p>
      </section>

      <section>
        <h2>How to apply</h2>
        <p>
          Use whatever AI tools you want, on the application and on the job. We don't
          care whether a human or a model typed the words; we care whether the work
          shows real engagement with what we do. Low-effort applications get filtered
          no matter who — or what — wrote them.
        </p>
        <p>
          Our process: apply with the listing's questions, a conversation or two, then
          a paid work trial — about $1,000/day. Humans read everything you send, and
          we'll always tell you where you stand.
        </p>
        <h3>Open positions</h3>
        <p class="jobsd-note">Draft note: Community Lead posting in progress — $100k–$150k, remote.</p>
      </section>
    </article>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'JobsDraftPage' });

useHead({
  title: 'Jobs (draft)',
  meta: [
    // Iteration surface only — never index.
    { name: 'robots', content: 'noindex' },
  ],
});
</script>


<style scoped lang="scss">
.jobsd {
  max-width: 640px;
  margin: 0 auto;
  padding: 72px 24px 120px;
  color: #0A0A0A;

  section {
    margin-top: 56px;
  }

  h2 {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 16px 0;
  }

  h3 {
    font-size: 17px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 28px 0 12px 0;
  }

  p, li {
    font-size: 17px;
    line-height: 1.7;
    color: #3F3F46;
  }

  p {
    margin: 0 0 16px 0;
  }

  ul {
    margin: 0 0 16px 0;
    padding-left: 22px;
  }

  li {
    margin-bottom: 6px;
  }
}

.jobsd-hero {
  padding-top: 24px;
}

.jobsd-eyebrow {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #A1A1AA;
  margin: 0 0 16px 0;
}

.jobsd-headline {
  font-size: 48px;
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: -0.03em;
  margin: 0;
  color: #0A0A0A;
}

.jobsd-note {
  font-size: 14px;
  font-style: italic;
  color: #A1A1AA;
  border: 1px dashed #D4D4D8;
  border-radius: 8px;
  padding: 10px 14px;
}

@media (max-width: 600px) {
  .jobsd {
    padding-top: 48px;
  }

  .jobsd-headline {
    font-size: 34px;
  }
}
</style>
