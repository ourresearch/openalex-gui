<template>
  <!-- Software & Data Engineer listing (oxjob #812). Stealth: noindex, not yet linked
       from /jobs. House StaticPage pattern (hero + right-rail TOC), same as /about, so it
       reads as a first-class static page. Role description + role-specific bullets are
       lorem-ipsum placeholders (real copy pending); mirror the Community Lead page. -->
  <static-page title="Software & Data Engineer" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>
    <!-- TODO(#812): salary band undecided (Jason + Casey) — placeholder until then. -->
    <!-- Compensation as a subtitle under the title (Jason, 2026-08-19) rather than its own section. -->
    <template #intro>
      <span class="job-meta">$XXX,000 &ndash; $XXX,000 USD &middot; Full-time &middot; Remote</span>
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
      <p class="section-body">And for this role specifically:</p>
      <ul class="section-list">
        <!-- Role-specific bullets — lorem-ipsum placeholders. -->
        <li>Lorem ipsum: deep experience with Python and large-scale data systems.</li>
        <li>Nulla porttitor: comfortable across the stack, from SQL to production services.</li>
        <li>Curabitur: you sweat data quality the way others sweat pixels.</li>
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
