<template>
  <!-- Software & Data Engineer listing (oxjob #812). Stealth: noindex, not yet linked
       from /jobs. House StaticPage pattern (hero + right-rail TOC), same as /about, so it
       reads as a first-class static page. Role description + role-specific bullets are
       lorem-ipsum placeholders (real copy pending); mirror the Community Lead page. -->
  <static-page title="Software & Data Engineer" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>

    <static-section id="the-role" title="The role">
      <p class="section-body">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer et libero eget
        nunc dignissim porttitor. Sed vitae velit at arcu tincidunt commodo. Praesent
        feugiat, ligula ut faucibus dignissim, justo urna volutpat nisl, nec venenatis odio
        metus a lacus. You'll own:
      </p>
      <ul class="section-list">
        <li>Curabitur pretium tincidunt lacus — building and running data pipelines at scale.</li>
        <li>Nulla facilisi. Donec ac quam vitae — shipping product features end to end.</li>
        <li>Etiam porta sem malesuada — owning reliability, performance, and cost.</li>
        <li>Whatever else needs doing that requires writing code and thinking clearly.</li>
      </ul>
      <p class="section-body">
        Vestibulum id ligula porta felis euismod semper. Cras mattis consectetur purus sit
        amet fermentum. This is not the engineering role you've seen elsewhere: Maecenas sed
        diam eget risus varius blandit sit amet non magna.
      </p>
    </static-section>

    <static-section id="about-us" title="About us">
      <p class="section-body">
        OpenAlex is building a universal research library that gathers, organizes, and
        shares <em>all</em> research products&mdash;without paywalls. Our data is free; we
        sell services to sustain it. And it already reaches millions of downstream users
        across enterprise, government, and academia: your favorite AI company probably uses
        it, and your favorite university definitely does.
      </p>
      <p class="section-body">
        What's great about working here: we're a small, hand-picked team punching way above
        our weight, with the autonomy to match. No bureaucracy, no turf wars, no
        rituals&mdash;the mission sets the roadmap and the route's up to you. We pay well,
        work fully remote, use top-of-the-line equipment, and move really fast.
      </p>
      <p class="section-body">
        What's hard about it: it's intense and sometimes chaotic. Everyone does everything,
        priorities shift fast, and remote work can be isolating. And with millions of
        downstream users, when we make mistakes, people notice. We value craft, but
        perfectionists need not apply.
      </p>
    </static-section>

    <static-section id="about-you" title="About you">
      <p class="section-body">If this is you, we want you on our team:</p>
      <ul class="section-list">
        <li>
          You're
          <a href="https://paulgraham.com/relres.html" target="_blank" rel="noopener noreferrer">relentlessly resourceful</a>.
          You've got the smarts to
          <a href="https://en.wikipedia.org/wiki/Kobayashi_Maru" target="_blank" rel="noopener noreferrer">outwit the impossible problems</a>,
          the grit to power through the grindy ones, and the wisdom to tell the difference.
          You get things
          <a href="https://medium.com/@bre/the-cult-of-done-manifesto-724ca1c2ff13" target="_blank" rel="noopener noreferrer">done</a>.
        </li>
        <li>
          You're playing jazz, not classical. That means you're confident in your skills,
          love improvising with a team, and can tolerate ambiguity, imperfection, and a dash
          of chaos.
        </li>
        <li>
          You embrace AI and grok the modern AI toolchain&mdash;not because of hype, but
          because it's leverage to solving bigger problems, faster (see #1).
        </li>
        <li>
          You believe in our mission: to build the future of science on an open, universal
          research library.
        </li>
        <!-- Role-specific bullets — lorem-ipsum placeholders. -->
        <li>Lorem ipsum: deep experience with Python and large-scale data systems.</li>
        <li>Nulla porttitor: comfortable across the stack, from SQL to production services.</li>
        <li>Curabitur: you sweat data quality the way others sweat pixels.</li>
      </ul>
    </static-section>

    <static-section id="application" title="Application">
      <p class="section-body">We'd love to learn a bit more about you.</p>

      <h3 class="subsection-header">The basics</h3>
      <ul class="section-list">
        <li>Name</li>
        <li>Email</li>
        <li>Location + timezone</li>
        <li>LinkedIn</li>
        <li>GitHub</li>
        <li>Resume (Markdown only &mdash; optional)</li>
        <li>Education (institution + degree; add a row per entry)</li>
        <li>Anything else we should know (free text)</li>
      </ul>

      <h3 class="subsection-header">Beyond the basics</h3>
      <p class="section-body">
        We're looking for exceptional people, so we're looking for exceptional answers to
        these questions. If your answers fit in with everybody else's, then you probably fit
        in with everybody else&mdash;and you're probably not the right fit for this role. We
        encourage you to use AI; but if you use AI the same way everybody else does, that's
        not the kind of person we're looking for.
      </p>
      <ol class="section-list">
        <li>Why do you want to work here?</li>
        <li>What will you do in your first week?</li>
        <li>What's the coolest thing you've ever built?</li>
      </ol>
      <p class="section-body">
        Answer at whatever length you like &mdash; we're looking for thoughtful answers, and
        three to six paragraphs is often a good fit.
      </p>
    </static-section>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';

defineOptions({ name: 'JobsSoftwareDataEngineerPage' });

useHead({
  title: 'Software & Data Engineer',
  meta: [
    // Stealth until the listings launch announcement — keep out of the index for now.
    { name: 'robots', content: 'noindex' },
  ],
});

const crumbs = [
  { label: 'OpenAlex', to: '/' },
  { label: 'Jobs', to: '/jobs' },
];

const sections = [
  { id: 'the-role', label: 'The role' },
  { id: 'about-us', label: 'About us' },
  { id: 'about-you', label: 'About you' },
  { id: 'application', label: 'Application' },
];
</script>
