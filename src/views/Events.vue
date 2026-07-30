<template>
  <v-container class="mt-12 pt-12 events-page">
    <div class="text-h3 mb-4">
      Events
    </div>
    <p>
      Webinars, office hours, conferences, and community meetings — all the ways to connect with the OpenAlex team and
      community.
    </p>

    <div class="text-h4" id="webinars">Webinars</div>
    <p>
      30-minute presentations on topics of broad relevance (recorded), followed by 15 minutes of Q&amp;A. Recordings of
      previous webinars are available on
      <a href="https://www.youtube.com/@OurResearch" target="_blank">our YouTube channel</a>.
    </p>
    <h5 class="text-h5">Upcoming webinars</h5>
    <p>
      We're re-grouping for the summer and will post more webinars soon. If you have ideas for webinars you'd like to
      see, send your suggestions to <a href="mailto:support@openalex.org">support@openalex.org</a>.
    </p>
    <h5 class="text-h5">Past webinars</h5>
    <ul class="webinar-list">
      <li v-for="w in pastWebinars" :key="w.title + w.date">
        {{ w.title }} ({{ w.date }})
        —
        <template v-for="(link, i) in w.links" :key="link.name">
          <template v-if="i > 0"> · </template>
          <a :href="link.href" target="_blank">{{ link.name }}</a>
        </template>
        <template v-if="!w.links.length">video coming soon</template>
      </li>
    </ul>

    <div class="text-h4" id="user-meeting">User conference</div>
    <p>
      The 2024 OpenAlex Virtual User Conference was a great success! We had a fantastic showing of presentations from
      around the world on May 30 and May 31, 2024 — more than thirty talks from users across five continents, on
      everything from institutional analytics to citation networks to new tools built on OpenAlex. The video
      recordings are available in
      <a href="https://youtube.com/playlist?list=PLe06345JQjNbCjTTQjO8_62HLdDS-MV3n&si=0kuV14a-HzRyWMxr"
        target="_blank">this YouTube playlist</a>.
    </p>

    <div class="text-h4" id="office-hours">Office hours</div>
    <p>
      We have regular office hours on Zoom: 1-hour informal drop-in/drop-off sessions to have conversations about
      using OpenAlex. Some are themed around OpenAlex developments and emerging topics; discussion on those topics is
      given precedence.
    </p>
    <p>
      We're taking a break from office hours at the moment, but will be back! Watch this page or the
      <a href="https://groups.google.com/g/openalex-users" target="_blank">mailing list</a> for the next schedule.
    </p>

    <div class="text-h4" id="conferences">Conferences and other events</div>
    <p>
      We attend conferences and community events throughout the year — come say hi if you'll also be there! Recently
      that has included the
      <a href="https://analyticssummit.uky.edu/" target="_blank">Research Analytics Summit</a> and the Barcelona
      Declaration Meeting. To hear where we'll be next, join the
      <a href="https://groups.google.com/g/openalex-users" target="_blank">mailing list</a>.
    </p>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({ name: 'EventsPage' });

useHead({ title: 'Events' });

const pastWebinars = ref([
  {
    title: 'Introducing OpenAlex: An open, comprehensive index of scholarship',
    date: 'September 14, 2023',
    links: [
      { name: 'Video', href: 'https://youtu.be/dKJgLK3wrTM' },
      { name: 'Slides', href: 'https://openalex.org/Intro_OpenAlex.pdf' },
    ],
  },
  {
    title: "Understand your University's research with OpenAlex",
    date: 'October 12, 2023',
    links: [
      { name: 'Video', href: 'https://youtu.be/FbbeUGd6i-4' },
      { name: 'Slides', href: 'https://openalex.org/Research.pdf' },
    ],
  },
  {
    title: 'International Intelligence with OpenAlex',
    date: 'November 9, 2023',
    links: [
      { name: 'Video', href: 'https://youtu.be/Ylr7xa7AMq8' },
      { name: 'Slides', href: 'https://openalex.org/OpenAlex_Webinar_International.pdf' },
    ],
  },
  {
    title: 'OpenAlex and VOSviewer: Uniting to enable free, easy, and high-quality research analytics',
    date: 'December 14, 2023',
    links: [
      { name: 'Video', href: 'https://youtu.be/MfwFzLQmUwo' },
      { name: 'Slides', href: 'https://openalex.org/Visualizing_Science_Using_OpenAlex_and_VOSviewer.pdf' },
    ],
  },
  {
    title: 'Institutional Profiles and Affiliation Curation in OpenAlex',
    date: 'February 8, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/pe1fJCyu3mE' },
    ],
  },
  {
    title: 'How EPFL uses OpenAlex for tailor-made scientometrics and benchmarking between Universities',
    date: 'February 22, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/DgQgbLN_uPc' },
      { name: 'Slides', href: 'https://drive.google.com/file/d/1VZzG2Q7_7lzXB9RAsiDx0SVKCpqGo-SA/view?usp=sharing' },
    ],
  },
  {
    title: 'How OpenAlex is helping power new commercial solutions and make science more accessible for everyone',
    date: 'March 28, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/leJP-pDfSsQ' },
      { name: 'ChronosHub slides', href: 'https://drive.google.com/file/d/1vWxNGXhcTjD7lGyoucnKYgOQwDHZDQie/view?usp=sharing' },
    ],
  },
  {
    title: 'The OpenAlex API Part 1: Getting Started',
    date: 'April 11, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/ycoHc8flx8U' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1PCe6PViKYUTxhKw11aDgUnM4Mi6velAt46nPlUngXvo/edit?usp=sharing' },
    ],
  },
  {
    title: 'The OpenAlex API Part 2: Diving In',
    date: 'April 25, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/DLKUgbw7FV4' },
      { name: 'Python Jupyter notebook', href: 'https://openalex.org/webinars/api-notebook-01' },
    ],
  },
  {
    title: 'Query building in OpenAlex: Creating Custom Research Areas',
    date: 'May 16, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/aoOjsdjLU2I' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1D4gOqMVOKNJxEYhDfS9jLzStZqqLJKwA2jF-IKDr9SA/edit?usp=sharing' },
    ],
  },
  {
    title: 'Finding, tracking, and analyzing research datasets in OpenAlex',
    date: 'June 20, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/cKUKXwxAlOM' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1yMaiNx1F8fBIFiaco6Xw7dcr6OUIykMBjrrQjmlHvOw/edit?usp=sharing' },
    ],
  },
  {
    title: 'openalexR: a glance into scholarly data analysis in R',
    date: 'July 18, 2024',
    links: [
      { name: 'Video', href: 'https://youtu.be/AUd6-mK76a0' },
      { name: 'R notebook with code examples', href: 'https://trangdata.github.io/openalexR-webinar/' },
    ],
  },
  {
    title: 'Author Profile Curation in OpenAlex',
    date: 'November 21, 2024',
    links: [
      { name: 'Video', href: 'https://www.youtube.com/watch?v=lgPv-JhoMdw' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1-6VhKdFhYLvQTTGEMTLeqsYm8jjo5rRze7Sri_SoUDs/edit?usp=sharing' },
    ],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q1-2025',
    date: 'January 15, 2025',
    links: [
      { name: 'Video', href: 'https://www.youtube.com/watch?v=ZqPmz92B-FU' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1Ino7zfkIX7_oWTMkWJ7wip_hcYVpzi8fGQY1mlPrWaY/edit' },
    ],
  },
  {
    title: 'OpenAlex en français dans le texte : publications, données, réseaux',
    date: 'February 6, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/h9MOzWIAMFY' },
      { name: 'Slides', href: 'https://drive.google.com/file/d/1VpKwuCL9w_OelYj5DC_KJYQ6KQli85Z5/view?usp=drive_link' },
    ],
  },
  {
    title: 'DOAJ & OpenAlex Collaborations for Improved Open Science',
    date: 'February 20, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/3YeG5YyJhcU' },
      { name: 'Slides', href: 'https://docs.google.com/presentation/d/1r9fRJRHeATL1u3dnBsjQ-bgUkrVvzd9zEI88JiNNi-A/edit?usp=sharing' },
    ],
  },
  {
    title: 'Innovations Enabled by OpenAlex',
    date: 'March 6, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/ki75iQ563p8' },
    ],
  },
  {
    title: 'OpenAlex Analytics Platform: First Steps',
    date: 'March 28, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/zH8HAvAwM20' },
    ],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q2-2025',
    date: 'April 17, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/d070TbIOOrw' },
    ],
  },
  {
    title: 'Working with the OpenAlex Snapshot',
    date: 'May 8, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/fTp_3y-CfQs' },
    ],
  },
  {
    title: 'OpenAlex & Sustainability',
    date: 'May 22, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/CZ5Q9To1zCc' },
    ],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q3-2025',
    date: 'June 26, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/m7eT9pDzaFk' },
    ],
  },
  {
    title: 'Funding metadata coming to OpenAlex!',
    date: 'July 10, 2025',
    links: [],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q4-2025',
    date: 'September 18, 2025',
    links: [
      { name: 'Video', href: 'https://youtu.be/_6Nt4xuN1jM' },
    ],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q1-2026',
    date: 'January 15, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/q9KF_eARJaY' },
    ],
  },
  {
    title: 'Vibe coding with OpenAlex',
    date: 'January 29, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/BX5qFM8j9MU' },
    ],
  },
  {
    title: 'Funding metadata in OpenAlex: update and future directions',
    date: 'February 19, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/BcnigbsDKpw' },
    ],
  },
  {
    title: "A beginner's guide to vibe coding with OpenAlex",
    date: 'February 26, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/-il55OzIKk8' },
    ],
  },
  {
    title: 'Accurate Affiliations, Accurate Attributions: How Institutions Can Improve Institutional Research Tracking with OpenAlex & ROR',
    date: 'March 19, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/0Z_oabr0V-c' },
    ],
  },
  {
    title: 'Townhall with CEO Jason Priem | Q2-2026',
    date: 'April 16, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/SfbXmKieAYg' },
    ],
  },
  {
    title: 'An Update on Research Funding Data in OpenAlex',
    date: 'June 11, 2026',
    links: [
      { name: 'Video', href: 'https://youtu.be/G3vPlE1c8sw' },
    ],
  },
]);
</script>

<style scoped lang="scss">
.events-page {
  max-width: 900px;
}

.text-h4 {
  margin-top: 50px;
  margin-bottom: 10px;
}

.text-h5 {
  margin-top: 30px;
  margin-bottom: 10px;
}

p {
  margin-bottom: 20px;
}

.webinar-list {
  padding-left: 15px;

  li {
    margin-bottom: 8px;
  }
}
</style>
