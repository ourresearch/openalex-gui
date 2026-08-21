<template>
  <!-- Community Lead listing (oxjob #662 → restructured in #812). Stealth: noindex, not yet
       linked from /jobs. House StaticPage pattern (hero + right-rail TOC), matching the
       Software & Data Engineer page.

       Scope revised 2026-08-18 (Kyle): sales is winding down as a function, so this role
       owns the *relationship* with users and members while the COO leads on deals and the
       new Operations Associate handles paperwork. Dropped the "you'll own everything
       nontechnical" framing -- inaccurate (finance/HR/taxes/legal stay with the CEO+COO)
       and it read as "you are the dumping ground" to senior candidates. Jason<->Kyle redline
       review round 1 finalized 2026-08-20 (record: jobs-redline.yaml git history). -->
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
      <jobs-about-us />
    </static-section>

    <static-section id="about-you" title="About you">
      <jobs-about-you />
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
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';
import JobsAboutUs from '@/components/Jobs/JobsAboutUs.vue';
import JobsAboutYou from '@/components/Jobs/JobsAboutYou.vue';
import StaticBreadcrumbs from '@/components/StaticPage/StaticBreadcrumbs.vue';
import JobApplicationForm from '@/components/Jobs/JobApplicationForm.vue';
import JobHiringProcess from '@/components/Jobs/JobHiringProcess.vue';

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
