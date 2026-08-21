<template>
  <!-- Operations Associate listing (oxjob #812, added 2026-08-18). Stealth: noindex, not
       yet linked from /jobs. House StaticPage pattern (hero + right-rail TOC), mirroring
       the Community Lead and Software & Data Engineer pages.

       Entry-level ops/admin role created alongside the Community Lead rescope: as sales
       winds down and membership paperwork grows, this person absorbs the forms, portals
       and questionnaires currently done in the margins of other people's calendars.
       Reports to the COO. Finance/HR/legal stay with the CEO+COO -- this role supports
       that work, it doesn't carry it. HR admin is explicitly OUT of scope.

       ⚠️ REDLINE REVIEW IN PROGRESS (oxjob #812). This page's copy is under live
       Jason<->Kyle review. If you change ANY user-visible copy in this file you MUST,
       in the SAME commit, record the change in
       src/components/Jobs/jobs-redline.yaml (instructions at the top of that file:
       verbatim RENDERED text, stable R-ids, comments, accept/reject statuses).
       The live page overlays that YAML as a redline (JobRedline.vue below).
       A git commit alone is NOT a review record — the YAML is. -->
  <static-page title="Operations Associate" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>
    <!-- Compensation as a subtitle under the title (Jason, 2026-08-19) rather than its own section. -->
    <template #intro>
      <span class="job-meta">$50&ndash;60k USD &middot; Full-time &middot; Remote (US or Canada)</span>
    </template>

    <static-section id="the-role" title="The role">
      <p class="section-body">
        We're growing quickly, and as we grow, handling operations is becoming a full-time
        job. This is that job.
      </p>
      <p class="section-body">In specific terms, here's what you'll own:</p>
      <ul class="section-list">
        <li>
          <strong>Forms, portals, and questionnaires.</strong> Vendor registration,
          procurement systems, security and compliance questionnaires, tax and exemption
          paperwork, purchase orders.
        </li>
        <li>
          <strong>Member paperwork.</strong> Contracts out for signature, invoices raised
          and chased, records kept straight across our systems so nobody has to ask "did
          that one ever get paid?"
        </li>
        <li>
          <strong>Team logistics.</strong> Conference travel, event registrations, speaking
          logistics, team gatherings. Making sure the people going somewhere
          have what they need to get there.
        </li>
        <li>
          <strong>The small things that unblock everyone else.</strong> A surprising amount
          of this job is noticing that something has been stuck for three weeks, and
          unsticking it.
        </li>
      </ul>
      <p class="section-body">
        You'll report to our COO. Finance, HR, and legal stay with our CEO and COO; you'll
        support that work, not carry it.
      </p>
      <p class="section-body">
        <strong>This is an entry-level role.</strong> We're not looking for
        someone who has done this before. We're looking for someone who will be very good at
        it, quickly, and who wants a first job where the work visibly matters.
      </p>
      <p class="section-body">
        It's also a genuine foot in the door: you'll be at a well-respected organization in
        an exciting field, and you'll get to know practically everyone in open science.
        Whether that leads to a bigger role here as we grow or a great job somewhere else,
        we'll help you get there.
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
        <li>
          You're organized and self-managing, and you sweat the details. You get a real
          kick out of an empty inbox, a tracker with nothing overdue, and a form that's
          right the first time &mdash; and you're the one who notices when two numbers
          don't match.
        </li>
        <li>
          You write clearly and professionally to people you've never met &mdash; including
          when the answer is "not yet" or "we can't."
        </li>
        <li>
          You're comfortable working with AI all day, including managing AI agents. You're
          always finding new ways to streamline your processes with it &mdash; and you know
          when something needs the human touch.
        </li>
        <li>
          You love a new challenge and you love to learn. You'll ask the question rather
          than guess, and you'll only need to ask it once.
        </li>
      </ul>
      <p class="section-body">
        You don't need a degree in anything particular, experience in scholarly publishing,
        or to have held a job before this one.
      </p>
    </static-section>

    <static-section id="process" title="The process">
      <p class="section-body">Our hiring process has five steps:</p>
      <job-hiring-process />
    </static-section>

    <static-section id="application" title="Application">
      <p class="section-body">If you're interested, we'd love to hear from you.</p>
      <job-application-form role="operations-associate" />
    </static-section>

    <job-redline page="operations-associate" />
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';
import JobApplicationForm from '@/components/Jobs/JobApplicationForm.vue';
import JobHiringProcess from '@/components/Jobs/JobHiringProcess.vue';
import JobRedline from '@/components/Jobs/JobRedline.vue';

defineOptions({ name: 'JobsOperationsAssociatePage' });

useHead({
  title: 'Operations Associate',
  meta: [
    // Stealth until the listings launch announcement - keep out of the index for now.
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
