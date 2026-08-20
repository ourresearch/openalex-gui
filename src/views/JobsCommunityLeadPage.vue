<template>
  <!-- Community Lead listing (oxjob #662 → restructured in #812). Stealth: noindex, not yet
       linked from /jobs. House StaticPage pattern (hero + right-rail TOC), matching the
       Software & Data Engineer page.

       Scope revised 2026-08-18 (Kyle): sales is winding down as a function, so this role
       owns the *relationship* with users and members while the COO leads on deals and the
       new Operations Associate handles paperwork. Dropped the "you'll own everything
       nontechnical" framing -- inaccurate (finance/HR/taxes/legal stay with the CEO+COO)
       and it read as "you are the dumping ground" to senior candidates.

       ⚠️ REDLINE REVIEW IN PROGRESS (oxjob #812). This page's copy is under live
       Jason<->Kyle review. If you change ANY user-visible copy in this file you MUST,
       in the SAME commit, record the change in
       src/components/Jobs/jobs-redline.yaml (instructions at the top of that file:
       verbatim RENDERED text, stable R-ids, comments, accept/reject statuses).
       The live page overlays that YAML as a redline (JobRedline.vue below).
       A git commit alone is NOT a review record — the YAML is. -->
  <static-page title="Community Lead" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>
    <!-- Compensation as a subtitle under the title (Jason, 2026-08-19) rather than its own section. -->
    <template #intro>
      <span class="job-meta">$100&ndash;150k USD &middot; Full-time &middot; Remote</span>
    </template>

    <static-section id="the-role" title="The role">
      <p class="section-body">
        You'll own our relationships with users and members: the people who use OpenAlex
        every day, and the institutions whose support keeps it running.
      </p>
      <p class="section-body">That means you will:</p>
      <ul class="section-list">
        <li>
          Be a public face and voice of OpenAlex &mdash; webinars, conference talks,
          community calls.
        </li>
        <li>
          Build relationships with the institutions that support us: onboarding new
          members, keeping current ones happy, and growing the membership.
        </li>
        <li>
          Run the machinery of community: our Community Advisory Board, governance and
          elections, members meetings, user groups, meetups.
        </li>
        <li>
          Help users directly. Our support queue is shared with the tech team; answering
          real users' questions is how you stay close to what the community actually
          needs.
        </li>
      </ul>
      <p class="section-body">
        What you <em>won't</em> own: engineering, the back-office functions (finance, HR,
        taxes, legal) that stay with our CEO and COO, and sales &mdash; you'll be involved,
        since you hold the relationship, but deal-making and sales paperwork aren't yours.
        This role has a clear edge to it.
      </p>
      <p class="section-body">
        The mix shifts week to week. Some weeks it's a launch webinar; some weeks it's month
        six of a conversation with a member who still hasn't decided. If that sounds
        chaotic, this is the wrong job. If it sounds like ownership, keep reading.
      </p>
      <p class="section-body">
        We're not looking for someone to just schedule the webinars and keep things running
        smoothly. We're looking for someone who sees a once-in-a-generation shakeup
        of how research works &mdash; open data, AI, the fall of the old gatekeepers &mdash;
        and wants to be the person lighting fires in the middle of it: a leader, an
        evangelist, an organizer.
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
        <!-- Role-specific bullets — preserved from the #662 "You probably have" copy. -->
        <li>
          You've spent years in the scholarly-communication world &mdash; a library, a
          research office, a publisher, a funder, research support. You know what the REF is,
          you have opinions about research evaluation, and when a librarian vents about
          metadata, you can vent along knowledgeably.
        </li>
        <li>
          You have a track record of making things happen without being asked: programs you
          started, events you willed into existence, communities that exist because of you.
        </li>
        <li>
          You're a clear, enthusiastic, compelling writer and speaker.
        </li>
        <li>
          You're comfortable when a relationship has money in it. This isn't a sales role,
          but we are always hustling; <a href="/pricing">paid services</a> keep our
          nonprofit alive.
        </li>
      </ul>
      <p class="section-body">
        You don't need a PhD (our CEO doesn't have one), a bench-research past, or to have
        ever had "community" in your job title.
      </p>
    </static-section>

    <static-section id="process" title="The process">
      <p class="section-body">Our hiring process has five steps:</p>
      <job-hiring-process />
    </static-section>

    <static-section id="application" title="Application">
      <p class="section-body">If you're interested, we'd love to hear from you.</p>
      <job-application-form role="community-lead" />
    </static-section>

    <job-redline page="community-lead" />
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

defineOptions({ name: 'JobsCommunityLeadPage' });

useHead({
  title: 'Community Lead',
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
