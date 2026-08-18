<template>
  <!-- Community Lead listing (oxjob #662 → restructured in #812). Stealth: noindex, not yet
       linked from /jobs. House StaticPage pattern (hero + right-rail TOC), matching the
       Software & Data Engineer page. The role + "about you" prose is PRESERVED from the
       original #662 copy (Jason: don't lorem-ipsum what we already have). -->
  <static-page title="Community Lead" :sections="sections">
    <template #eyebrow>
      <static-breadcrumbs :crumbs="crumbs" />
    </template>

    <static-section id="the-role" title="The role">
      <p class="section-body">
        OpenAlex is a technical organization whose product is, increasingly, relationships.
        The data is free; what institutions join and support is a relationship with us
        &mdash; and today those relationships are held together by our founders, one
        conversation at a time. That doesn't scale. This role is where it starts to.
      </p>
      <p class="section-body">
        The honest headline: <strong>you'll own everything nontechnical.</strong> Put
        another way, you'll own working with all the people who aren't us:
      </p>
      <ul class="section-list">
        <li>
          Being a public face and voice of OpenAlex &mdash; webinars, conference talks,
          community calls.
        </li>
        <li>
          Building relationships with the institutions that support us: onboarding new
          members, keeping current ones happy, and yes, owning the contracts and renewals
          that come with them. (This is not a sales job. But in a small org, the person who
          owns the relationship owns the paperwork too.)
        </li>
        <li>
          Running the machinery of community: our advisory board, governance and elections,
          user groups, meetups.
        </li>
        <li>
          Whatever else needs doing that doesn't require writing code. Some weeks that's a
          launch webinar; some weeks it's untangling a member's billing question. If that
          grab-bag sounds chaotic, this is the wrong job. If it sounds like ownership, keep
          reading.
        </li>
      </ul>
      <p class="section-body">
        This is not the community-manager role you've seen at other scholarly-infrastructure
        organizations. We're not looking for someone to schedule the webinars and keep the
        community from being a problem. We're looking for someone who sees a
        once-in-a-generation shakeup of how research works &mdash; open data, AI, the fall of
        the old gatekeepers &mdash; and wants to be the person lighting fires in the middle of
        it: a leader, an evangelist, an organizer. The kind of person who makes promises to a
        community and keeps them.
      </p>
      <p class="section-body">
        Community work has a reputation as the soft side of the org chart &mdash; the place
        where effort is the product, where a full calendar of well-attended webinars counts
        as a good quarter. Not here. Results in this job look like a community that's
        measurably bigger, warmer, and more committed: the member who was drifting away
        renews because you heard what was actually bothering them and fixed it; the advisory
        board meeting that used to be a status readout produces a decision; the conference
        talk turns into three new member conversations because you followed up the same day
        &mdash; not a longer list of things you did.
      </p>
      <p class="section-body">
        And in this job, patience <em>is</em> resourcefulness. Relationships compound the way
        ideas do: slowly, then suddenly. Staying warm with a member who's being difficult,
        following up in month six of a conversation that won't pay off until next year
        &mdash; that's not the opposite of moving fast; it's how this kind of work gets
        results. You like people, including difficult ones. This job is 90% people.
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
          You write and speak in a way people remember &mdash; enthusiasm that's contagious
          rather than exhausting.
        </li>
      </ul>
      <p class="section-body">
        You don't need a PhD (our CEO doesn't have one), a bench-research past, or to have
        ever had "community" in your job title.
      </p>
    </static-section>

    <static-section id="application" title="Application">
      <p class="section-body">
        We'd love to learn a bit more about you. Our process is short: apply below, a
        conversation or two, then a paid work trial &mdash; about $1,000/day.
      </p>

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
  { id: 'application', label: 'Application' },
];
</script>
