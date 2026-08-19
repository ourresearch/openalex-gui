<template>
  <!-- Operations Associate listing (oxjob #812, added 2026-08-18). Stealth: noindex, not
       yet linked from /jobs. House StaticPage pattern (hero + right-rail TOC), mirroring
       the Community Lead and Software & Data Engineer pages.

       Entry-level ops/admin role created alongside the Community Lead rescope: as sales
       winds down and membership paperwork grows, this person absorbs the forms, portals
       and questionnaires currently done in the margins of other people's calendars.
       Reports to the COO. Finance/HR/legal stay with the CEO+COO -- this role supports
       that work, it doesn't carry it. HR admin is explicitly OUT of scope. -->
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
        OpenAlex is a lean team &mdash; fewer than ten people, even after these new hires
        &mdash; serving millions of users. The math only works because we refuse to let
        overhead grow with scale. This role is how we keep refusing.
      </p>
      <p class="section-body">
        Every institution that joins us arrives with paperwork. A procurement portal that
        needs an account. A security questionnaire with 140 questions. A vendor form, a tax
        exemption certificate, a purchase order, a government invoicing system that only
        accepts submissions one particular way. Multiply that by a growing membership and
        you get a real job, currently being done badly in the margins of other people's
        calendars.
      </p>
      <p class="section-body">You'll own it:</p>
      <ul class="section-list">
        <li>
          <strong>Forms, portals, and questionnaires.</strong> Vendor registration,
          procurement systems, security and compliance questionnaires, tax and exemption
          paperwork, purchase orders. You'll learn what we can answer from a template and
          what needs a human, and you'll build the templates.
        </li>
        <li>
          <strong>Member paperwork.</strong> Contracts out for signature, invoices raised
          and chased, records kept straight across our systems so nobody has to ask "did
          that one ever get paid?"
        </li>
        <li>
          <strong>Team logistics.</strong> Conference travel, event registrations, speaking
          logistics, the occasional team gathering. Making sure the people going somewhere
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
        <strong>This is an entry-level role and we mean it.</strong> We're not looking for
        someone who has done this before. We're looking for someone who will be very good at
        it, quickly, and who wants a first job where the work visibly matters.
      </p>
      <p class="section-body">
        It's also a genuine foot in the door. Maybe you love this work and want to do it for
        years &mdash; that's a great outcome. Maybe you use it as a springboard instead:
        into a different role here as we grow, or out into the wider open-science community,
        where you'll have spent a couple of years meeting most of the people who run it.
        That's a great outcome too, and we'll help you get there.
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
          You're organized in a way other people can see. Things you're responsible for
          don't get lost, and you don't need a system imposed on you to make that true.
        </li>
        <li>
          You write clearly and professionally to people you've never met &mdash; including
          when the answer is "not yet" or "we can't."
        </li>
        <li>
          Details don't bore you. A form filled out correctly the first time is genuinely
          satisfying, and you notice when a number doesn't match the number on the other
          document.
        </li>
        <li>
          You're comfortable being new. You'll ask the question rather than guess, and
          you'll only need to ask it once.
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
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';
import JobApplicationForm from '@/components/Jobs/JobApplicationForm.vue';
import JobHiringProcess from '@/components/Jobs/JobHiringProcess.vue';

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
