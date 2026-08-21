<template>
  <!-- Software & Data Engineer listing (oxjob #812). Stealth: noindex, not yet linked
       from /jobs. House StaticPage pattern (hero + right-rail TOC), same as /about, so it
       reads as a first-class static page. Role description + role-specific bullets:
       Claude draft (2026-08-19, from Rohan's 2026-07-01 offer letter = Jason's SWE job
       description), Jason red-pen round 1 applied 2026-08-20; pending Casey red-pen.
       (This page is Jason's copy — no redline overlay here; that's only for the two
       Kyle-authored pages, see jobs-redline.yaml.) -->
  <static-page title="Software & Data Engineer" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>
    <!-- Compensation as a subtitle under the title (Jason, 2026-08-19) rather than its own section. -->
    <template #intro>
      <span class="job-meta">$150&ndash;200k USD &middot; Full-time &middot; Remote</span>
    </template>

    <static-section id="the-role" title="The role">
      <p class="section-body">
        You'll work across the whole backend stack, and you'll own what you touch. You'll
        report to our CTO and work closely with the rest of our small team and our users.
      </p>
      <p class="section-body">Your main areas of work:</p>
      <ul class="section-list">
        <li>
          <strong>The ETL.</strong> Harvesting metadata from thousands of repositories and
          idiosyncratic indexes and cleaning it into shape &mdash; the
          <a href="https://www.databricks.com/glossary/medallion-architecture" target="_blank" rel="noopener noreferrer">bronze and silver layers</a>
          of our Databricks pipeline.
        </li>
        <li>
          <strong>The AI and ML that make the data good.</strong> Author name
          disambiguation, topic classification, institution disambiguation, full-text
          extraction from PDFs &mdash; the gold layer.
        </li>
        <li>
          <strong>The API and the app.</strong> Elasticsearch, Python, Cloudflare Workers:
          everything except the actual front-end code, serving millions of people and a
          growing number of agents every day.
        </li>
        <li>
          <strong>Our users.</strong> Our support queue is shared across the team; the hard
          technical questions land on the engineer who understands the system, and
          answering them is how you find out what to build next.
        </li>
      </ul>
      <p class="section-body">
        There's no platform team beneath you and no product team above you: you'll notice
        what's missing, propose it, build it, ship it, and answer the tickets about it.
      </p>
      <p class="section-body">
        We're an AI-native shop: agents write all our code, and increasingly managing them
        <em>is</em> the job &mdash; not typing, but good judgment and high agency. Knowing
        what to build, knowing when it's right, and knowing when it's done.
      </p>
    </static-section>

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
      </p>
      <p class="section-body">
        You play <strong>jazz, not classical:</strong> you're confident in your skills,
        love improvising with a team, and can embrace ambiguity and imperfection in
        service of emergent, collaborative creativity.
      </p>
      <p class="section-body">
        You <strong>believe in our mission</strong> and you care about openness and open
        culture. That extends to how you communicate: with skill, empathy, and clarity.
      </p>
      <p class="section-body">And for this role specifically:</p>
      <ul class="section-list">
        <!-- Role-specific bullets — Jason red-pen round 1 (2026-08-20); pending Casey red-pen. -->
        <li>
          You've built and run data systems at real scale using Python and SQL. Bonus:
          Spark and Databricks.
        </li>
        <li>
          You're comfortable anywhere in the backend stack, moving smoothly between data,
          code, models, and APIs.
        </li>
        <li>
          You love working with messy data &mdash; that's the only kind we get.
        </li>
      </ul>
    </static-section>

    <static-section id="process" title="The process">
      <p class="section-body">Our hiring process has five steps:</p>
      <job-hiring-process />
    </static-section>

    <static-section id="application" title="Application">
      <p class="section-body">If you're interested, we'd love to hear from you.</p>
      <job-application-form role="software-data-engineer" />
    </static-section>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';
import JobApplicationForm from '@/components/Jobs/JobApplicationForm.vue';
import JobHiringProcess from '@/components/Jobs/JobHiringProcess.vue';

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
  { id: 'process', label: 'The process' },
  { id: 'application', label: 'Application' },
];
</script>
