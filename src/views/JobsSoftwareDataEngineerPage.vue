<template>
  <!-- Software & Data Engineer listing (oxjob #812). Stealth: noindex, not yet linked
       from /jobs. Structure mirrors the Community Lead page (About Us / About You /
       Application) so the two read as siblings. Role description + role-specific bullets
       are LOREM IPSUM placeholders per Jason (we don't have the real copy yet). -->
  <static-page>
    <article class="joblp">
      <header class="joblp-hero">
        <p class="joblp-eyebrow">Working at OpenAlex</p>
        <h1 class="joblp-headline">Software&nbsp;&amp;&nbsp;Data&nbsp;Engineer</h1>
        <p class="joblp-meta">
          <span class="joblp-tag">Competitive salary</span>
          <span class="joblp-tag">Full-time</span>
          <span class="joblp-tag">Remote, anywhere with reasonable hours overlap</span>
        </p>
        <p class="joblp-note">
          Draft note: hero meta (comp band, reporting line) is placeholder — confirm before launch.
        </p>
      </header>

      <section>
        <h2>The role</h2>
        <p class="joblp-note">
          Draft note: role description is lorem ipsum — real copy pending.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer et libero eget
          nunc dignissim porttitor. Sed vitae velit at arcu tincidunt commodo. You'll own
          Praesent feugiat, ligula ut faucibus dignissim, justo urna volutpat nisl, nec
          venenatis odio metus a lacus.
        </p>
        <ul>
          <li>Curabitur pretium tincidunt lacus — building and running data pipelines at scale.</li>
          <li>Nulla facilisi. Donec ac quam vitae — shipping product features end to end.</li>
          <li>Etiam porta sem malesuada — owning reliability, performance, and cost.</li>
          <li>Whatever else needs doing that requires writing code and thinking clearly.</li>
        </ul>
        <p>
          Vestibulum id ligula porta felis euismod semper. Cras mattis consectetur purus
          sit amet fermentum. This is not the engineering role you've seen elsewhere:
          Maecenas sed diam eget risus varius blandit sit amet non magna.
        </p>
      </section>

      <section>
        <h2>About us</h2>
        <p>
          OpenAlex is building a universal research library that gathers, organizes, and
          shares <em>all</em> research products&mdash;without paywalls. Our data is free; we
          sell services to sustain it. And it already reaches millions of downstream users
          across enterprise, government, and academia: your favorite AI company probably
          uses it, and your favorite university definitely does.
        </p>
        <p>
          What's great about working here: we're a small, hand-picked team punching way
          above our weight, with the autonomy to match. No bureaucracy, no turf wars, no
          rituals&mdash;the mission sets the roadmap and the route's up to you. We pay well,
          work fully remote, use top-of-the-line equipment, and move really fast.
        </p>
        <p>
          What's hard about it: it's intense and sometimes chaotic. Everyone does
          everything, priorities shift fast, and remote work can be isolating. And with
          millions of downstream users, when we make mistakes, people notice. We value
          craft, but perfectionists need not apply.
        </p>
        <p class="joblp-pointer">
          The full story&mdash;who we are, how we work, what we look for&mdash;is on our
          <router-link to="/jobs">hiring page</router-link>.
        </p>
      </section>

      <section>
        <h2>About you</h2>
        <p>If this is you, we want you on our team:</p>
        <ul>
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
            You're playing jazz, not classical. That means you're confident in your skills,
            love improvising with a team, and can tolerate ambiguity, imperfection, and a
            dash of chaos.
          </li>
          <li>
            You embrace AI and grok the modern AI toolchain&mdash;not because of hype, but
            because it's leverage to solving bigger problems, faster (see #1).
          </li>
          <li>
            You believe in our mission: to build the future of science on an open, universal
            research library.
          </li>
          <!-- Role-specific bullets — LOREM IPSUM placeholders (Jason: best-guess for now). -->
          <li>Lorem ipsum: deep experience with Python and large-scale data systems.</li>
          <li>Nulla porttitor: comfortable across the stack, from SQL to production services.</li>
          <li>Curabitur: you sweat data quality the way others sweat pixels.</li>
        </ul>
        <p class="joblp-note">
          Draft note: the last three bullets are lorem ipsum role-specific placeholders.
        </p>
      </section>

      <section>
        <h2>Application</h2>
        <p>
          We're looking for exceptional people, so we're looking for exceptional answers to
          these questions. If your answers fit in with everybody else's, then you probably
          fit in with everybody else&mdash;and you're probably not the right fit for this
          role. We encourage you to use AI; but if you use AI the same way everybody else
          does, that's not the kind of person we're looking for.
        </p>

        <h3>The basics</h3>
        <ul>
          <li>Name</li>
          <li>Email</li>
          <li>Location + timezone</li>
          <li>LinkedIn</li>
          <li>GitHub</li>
          <li>Resume (as Markdown &mdash; paste it into any AI and ask for clean Markdown, or use a PDF&rarr;Markdown converter)</li>
          <li>Education (institution + degree; add a row per entry)</li>
          <li>Anything else we should know (free text)</li>
        </ul>

        <h3>Learning questions</h3>
        <ol>
          <li>Why do you want to work here?</li>
          <li>What will you do in your first week?</li>
          <li>What's the coolest thing you've ever built?</li>
        </ol>

        <p class="joblp-note">
          Draft note: the interactive application form (fields above + these questions,
          login-gated via your OpenAlex account) is wired up in oxjob #813 and lands here at launch.
        </p>
      </section>
    </article>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'JobsSoftwareDataEngineerPage' });

useHead({
  title: 'Software & Data Engineer',
  meta: [
    // Stealth until the listings launch announcement — keep out of the index for now.
    { name: 'robots', content: 'noindex' },
  ],
});
</script>


<style scoped lang="scss">
.joblp {
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
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 32px 0 12px 0;
  }

  p, li {
    font-size: 17px;
    line-height: 1.7;
    color: #3F3F46;
  }

  p {
    margin: 0 0 16px 0;
  }

  ul, ol {
    margin: 0 0 16px 0;
    padding-left: 22px;
  }

  li {
    margin-bottom: 6px;
  }
}

.joblp-hero {
  padding-top: 24px;
}

.joblp-eyebrow {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #A1A1AA;
  margin: 0 0 16px 0;
}

.joblp-headline {
  font-size: 48px;
  font-weight: 600;
  line-height: 1.06;
  letter-spacing: -0.03em;
  margin: 0 0 20px 0;
  color: #0A0A0A;
}

.joblp-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
}

.joblp-tag {
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  background: #F4F4F5;
  border-radius: 999px;
  padding: 4px 12px;
}

.joblp-pointer {
  font-style: italic;
  margin-top: 24px;
}

.joblp-note {
  font-size: 14px;
  font-style: italic;
  color: #A1A1AA;
  border: 1px dashed #D4D4D8;
  border-radius: 8px;
  padding: 10px 14px;
}

@media (max-width: 600px) {
  .joblp {
    padding-top: 48px;
  }

  .joblp-headline {
    font-size: 34px;
  }
}
</style>
