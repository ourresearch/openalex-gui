<template>
  <!-- Community Lead listing (oxjob #662). Stealth: noindex, not yet linked from /jobs.
       This file is the template for future listings — copy it for the dev listing. -->
  <static-page>
    <article class="joblp">
      <header class="joblp-hero">
        <p class="joblp-eyebrow">Working at OpenAlex</p>
        <h1 class="joblp-headline">Community&nbsp;Lead</h1>
        <p class="joblp-meta">
          <span class="joblp-tag">$100,000–$150,000 USD</span>
          <span class="joblp-tag">Full-time</span>
          <span class="joblp-tag">Remote, anywhere with reasonable hours overlap</span>
          <span class="joblp-tag">Reports to our COO</span>
        </p>
      </header>

      <p class="joblp-pointer">
        Start with our <router-link to="/jobs">hiring page</router-link> — it covers who
        we are, how we work, and what we look for in everyone we hire. This page is about
        what's different for this role.
      </p>

      <section>
        <h2>The role</h2>
        <p>
          OpenAlex is a technical organization whose product is, increasingly,
          relationships. The data is free; what institutions join and support is a
          relationship with us — and today those relationships are held together by our
          founders, one conversation at a time. That doesn't scale. This role is where it
          starts to.
        </p>
        <p>
          The honest headline: <strong>you'll own everything nontechnical.</strong> Put
          another way, you'll own working with all the people who aren't us:
        </p>
        <ul>
          <li>
            Being a public face and voice of OpenAlex — webinars, conference talks,
            community calls.
          </li>
          <li>
            Building relationships with the institutions that support us: onboarding new
            members, keeping current ones happy, and yes, owning the contracts and
            renewals that come with them. (This is not a sales job. But in a small org,
            the person who owns the relationship owns the paperwork too.)
          </li>
          <li>
            Running the machinery of community: our advisory board, governance and
            elections, user groups, meetups.
          </li>
          <li>
            Whatever else needs doing that doesn't require writing code. Some weeks
            that's a launch webinar; some weeks it's untangling a member's billing
            question. If that grab-bag sounds chaotic, this is the wrong job. If it
            sounds like ownership, keep reading.
          </li>
        </ul>
        <p>
          This is not the community-manager role you've seen at other
          scholarly-infrastructure organizations. We're not looking for someone to
          schedule the webinars and keep the community from being a problem. We're
          looking for someone who sees a once-in-a-generation shakeup of how research
          works — open data, AI, the fall of the old gatekeepers — and wants to be the
          person lighting fires in the middle of it: a leader, an evangelist, an
          organizer. The kind of person who makes promises to a community and keeps them.
        </p>
      </section>

      <section>
        <h2>What we're looking for</h2>
        <p>
          Our <router-link to="/jobs">hiring page</router-link> says we're looking for
          people who are relentlessly resourceful, and that we measure results, not
          effort. Here's what that looks like for this role.
        </p>
        <p>
          Community work has a reputation as the soft side of the org chart — the place
          where effort is the product, where a full calendar of well-attended webinars
          counts as a good quarter. Not here. Delivering more in a week than most people
          can, in community terms, means: the member who was drifting away renews because
          you heard what was actually bothering them and fixed it. The advisory board
          meeting that used to be a status readout produces a decision. The conference
          talk turns into three new member conversations because you followed up the same
          day. Results in this job look like a community that's measurably bigger,
          warmer, and more committed — not a longer list of things you did.
        </p>
        <p>
          And in this job, patience <em>is</em> resourcefulness. Relationships compound
          the way ideas do: slowly, then suddenly. Listening to a frustrated librarian
          all the way to the end, staying warm with a member who's being difficult,
          following up in month six of a conversation that won't pay off until next year
          — that's not the opposite of moving fast; it's how this kind of work gets
          results. You like people, including difficult ones. This job is 90% people.
        </p>
        <p>You probably have:</p>
        <ul>
          <li>
            Years in the scholarly-communication world — a library, a research office, a
            publisher, a funder, research support. You know what the REF is, you have
            opinions about research evaluation, and when a librarian vents about
            metadata, you can vent along knowledgeably.
          </li>
          <li>
            A track record of making things happen without being asked: programs you
            started, events you willed into existence, communities that exist because of
            you.
          </li>
          <li>
            Writing and speaking that people remember — enthusiasm that's contagious
            rather than exhausting.
          </li>
        </ul>
        <p>
          You don't need a PhD (our CEO doesn't have one), a bench-research past, or to
          have ever had "community" in your job title.
        </p>
      </section>

      <section>
        <h2>Apply</h2>
        <p>
          Our process is short: apply below, a conversation or two, then a paid work
          trial — about $1,000/day.
        </p>
        <p>
          The application is three questions, and they do the heavy lifting (our
          <router-link to="/jobs">hiring page</router-link> explains our AI policy, which
          applies here too):
        </p>
        <ol>
          <li>What will you do in your first four weeks at OpenAlex?</li>
          <li>Why do you want to work here?</li>
        </ol>
        <p class="joblp-note">
          Draft note: third question (taste/agency) pending — Kyle's drafts land ~Aug 17.
        </p>
        <p class="joblp-note">
          Draft note: the application form itself lands here at launch. Fields for
          review: name · email · location + timezone · LinkedIn · GitHub · resume ·
          education (institution + degree, repeatable rows) · anything else we should
          know (free text).
        </p>
      </section>
    </article>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'JobsCommunityLeadPage' });

useHead({
  title: 'Community Lead',
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
  margin-top: 40px;
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
