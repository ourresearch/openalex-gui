<template>
  <v-container class="page">
    <v-card rounded flat>
      <div class="text-h1">About</div>
      <div class="text-h5 mt-4">
        OpenAlex is a free and open catalog of the world's scholarly research system
      </div>
    </v-card>

    <div class="text-h2 mb-4" id="what-we-do" style="margin-top: 100px;">
      What we do
    </div>
    <div>
      <p>
        The ancient <a href="https://en.wikipedia.org/wiki/Library_of_Alexandria">Library of Alexandria</a> aimed to
        create a universal
        collection of scholarship, indexed using the first library catalog, the
        <a href="https://en.wikipedia.org/wiki/Pinakes">Pinakes.</a> We're working toward that same goal, but making it
        completely open:
      </p>
      <ul>
        <li>
          Our data is free and reusable under a CC0 license, available via <a
            href="https://developers.openalex.org/download/overview">bulk download</a> or <a
            href="https://developers.openalex.org/">API,</a>
        </li>
        <li>
          <a href="https://github.com/orgs/ourresearch/repositories?language=&q=openalex&sort=&type=public">our code
          </a> is fully open-source, and
        </li>
        <li>
          we're governed by a sustainable and transparent nonprofit (<a href="#transparency">read more below</a>).
        </li>
      </ul>
      <p class="mt-6">
        We believe the global research system is one of humankind's most beautiful creations. OpenAlex aims to make that
        whole beautiful creation available to everyone, everywhere.
      </p>
    </div>

    <h4 class="text-h4" id="story">Our story</h4>
    <p>
      OpenAlex is built by a small nonprofit team. We've been building open scholarly infrastructure together since
      2011, when the first lines of what became our code were written at an all-night hackathon — open-source from day
      one, as everything we've made since has been. Along the way we built
      <a href="https://unpaywall.org/">Unpaywall</a> (an open index of Open Access publications) and
      <a href="https://unsub.org/">Unsub</a> (a tool helping librarians evaluate journal subscriptions); both now run on
      OpenAlex data.
    </p>
    <p>
      OpenAlex itself launched in beta on January 3, 2022, as a successor to Microsoft Academic Graph. The web
      application for exploring the data launched in October 2023. In late 2025 we shipped a complete rewrite of the
      OpenAlex codebase, which now lets us iterate on data quality in days instead of months.
    </p>
    <p>
      We're incorporated as a US 501(c)(3) nonprofit. The core OpenAlex data will always be free; to keep the
      infrastructure healthy and growing, we charge for <em>services</em> built on top of the data — in line with the
      <a href="https://openscholarlyinfrastructure.org/">POSI</a> principle of revenue based on services, not data. You
      can learn more on our <router-link to="/pricing">pricing page</router-link>.
    </p>

    <h4 class="text-h4" id="funders">Funders</h4>
    <p>
      Grant funding has been essential to building OpenAlex, and we're deeply grateful to our funders, past and
      present.
    </p>
    <p>
      <strong>Current funders:</strong>
      <a href="https://www.arcadiafund.org.uk/">Arcadia</a>,
      <a href="https://www.navigation.org/">The Navigation Fund</a>, and
      <a href="https://wellcome.org/">The Wellcome Trust</a>.
    </p>
    <p>
      <strong>Past funders:</strong>
      <a href="https://sloan.org/">The Alfred P. Sloan Foundation</a> and
      <a href="https://www.nsf.gov/">The National Science Foundation</a>.
    </p>
    <p>
      In the spirit of transparency, we publish all our grant proposals — both the successful ones and the ones that
      didn't get funded — along with annual and final grant reports, on
      <a href="https://www.ogrants.org">Open Grants</a> (search for "Priem" to find them).
    </p>

    <h4 class="text-h4" id="transparency">Transparency</h4>
    <p>
      We think that organizations working for Open should be open themselves — with their code and data, and with the
      details of their operation. We're doing our best to live up to that; this section is part of that effort.
    </p>

    <h5 class="text-h5" id="posi">Principles of Open Scholarly Infrastructure (POSI)</h5>
    <p>
      The <a href="https://openscholarlyinfrastructure.org/">sixteen POSI principles</a> offer a set of guidelines by
      which open scholarly infrastructure organizations can be run and sustained. When we first read them, we saw right
      away that they were solidly aligned with our core values of openness, progress, pragmatism, sustainability, and
      community — so we were thrilled to become the fifth organization to commit to them. You can read our most recent
      <a href="https://blog.openalex.org/recommitting-to-the-principles-of-open-scholarly-infrastructure-posi/">POSI
        self-assessment</a> on the blog.
    </p>

    <h5 class="text-h5" id="salaries">Salaries</h5>
    <p>
      Our board members are unpaid volunteers, except for Jason, who is on the board and is paid in his capacity as
      CEO. Historical salaries for Jason and any other employees can be found in our tax records (see below). For
      hourly workers (including workers on cloud platforms like <a
        href="https://en.wikipedia.org/wiki/Amazon_Mechanical_Turk">Mechanical Turk</a>), we pay a minimum wage of
      $25/hour.
    </p>

    <h5 class="text-h5" id="taxes">Tax filings</h5>
    <p>
      As a 501(c)(3), we're exempt from corporate taxes. However, the law does require that we file a Form 990 with the
      IRS every year. This is great, because you can look up any 501(c)(3) nonprofit's Form 990 and learn lots about
      their finances. You can find our annual Form 990 filings in many places online; <a
        href="https://projects.propublica.org/nonprofits/organizations/461599252">here are all our 990 filings</a> in
      Nonprofit Explorer by ProPublica, for example. If you search for our taxes on other sites, you'll probably want
      to search under "Impactstory" — we go by OpenAlex now, but that's a <a
        href="https://en.wikipedia.org/wiki/Trade_name">"doing business as" (DBA)</a> name; we're still Impactstory to
      the government.
    </p>

    <h5 class="text-h5" id="corporate">Corporate documents</h5>
    <p>
      We incorporated in North Carolina (USA) in 2012. Here are our <a href="/articles-of-incorporation.pdf">Articles
        of Incorporation</a> and our corporate <a href="/bylaws.pdf">by-laws.</a> Our IRS EIN (Employer Identification
      Number) is 46-1599252; here's our <a href="/IRS-w-9.pdf">IRS form W-9</a>, which is pretty much just a fancy way
      of sharing that number. We've also got a <a href="/canada-business-registration.pdf">Canadian business
        number.</a>
    </p>
    <p>
      To become a US 501(c)(3), we submitted this <a href="/IRS-1023.pdf">Form 1023</a> to the IRS, describing why we
      think we met the criteria for this type of nonprofit. The IRS thought about it for a while, and then issued us
      this <a href="/IRS-determination.pdf">determination letter,</a> granting us 501(c)(3) status.
    </p>

    <h5 class="text-h5" id="code">Open code</h5>
    <p>
      All our projects are open-source from day one, even before they're released. We license code under the <a
        href="https://en.wikipedia.org/wiki/MIT_License">MIT License,</a> a "permissive license" that imposes very few
      restrictions on downstream use. We're happy that our code has often been reused and repurposed, by both nonprofit
      and for-profit organizations. You can find the code for all our projects on <a
        href="https://github.com/ourresearch">GitHub.</a>
    </p>
    <p>
      If we (or GitHub) were to become sufficiently evil, this GitHub-hosted code could be removed or re-licensed. So
      it's important that our code is also held in the
      <a href="https://archive.softwareheritage.org/browse/search/?q=ourresearch&with_visit=true&with_content=true">Software
        Heritage archive,</a> maintained outside our control by a third-party nonprofit dedicated to the long-term
      preservation of its openness.
    </p>
    <p>
      Sometimes software source code is encumbered by patents. Ours isn't, and it never will be. This is our <a
        href="http://www.iphandbook.org/handbook/ch07/p06/">patent non-assertion covenant:</a> we confirm that we do
      not currently control any patents, and we irrevocably promise not to apply for or attempt to obtain patents in
      the future.
    </p>

    <h4 class="text-h4" id="sources">Sources</h4>
    <p>
      OpenAlex is not doing this alone! Rather, we're aggregating and standardizing data from a whole bunch of other
      great projects, like a river fed by many tributaries. Our two most important data sources are
      <a href="https://aka.ms/msracad">MAG</a> and
      <a href="https://www.crossref.org/">Crossref.</a> Other key sources include:
    </p>
    <ul>
      <li><a href="https://orcid.org">ORCID</a></li>
      <li><a href="https://ror.org">ROR</a></li>
      <li><a href="https://doaj.org">DOAJ</a></li>
      <li><a href="https://unpaywall.org">Unpaywall</a></li>
      <li><a href="https://pubmed.ncbi.nlm.nih.gov/">Pubmed</a></li>
      <li><a href="https://www.ncbi.nlm.nih.gov/pmc/">Pubmed Central</a></li>
      <li><a href="https://www.issn.org/">The ISSN International Centre</a></li>
      <li>
        Subject-area and institutional repositories from <a href="https://arxiv.org">arXiv</a> to <a
          href="https://zenodo.org">Zenodo</a> and everywhere in between.
      </li>
    </ul>
    <p>
      You can get the full list of sources <a
        href="https://developers.openalex.org/api-reference/sources">using our API.</a>
    </p>

    <h4 class="text-h4" id="contact">Contact</h4>
    <p>
      We'd love to hear from you! If you have a question, and you can't find the answer in our <a
        href="https://developers.openalex.org/">documentation</a>,
      submit a ticket via our <a href="/help">help page</a>. You can also stay in touch with us via the <a
        href="https://groups.google.com/g/openalex-users">OpenAlex User Group</a> mailing list.
    </p>

    <h4 class="text-h4" id="acknowledgements">Acknowledgements</h4>
    <p>
      We'd like to thank everyone behind all our <a href="#sources">data sources,</a> but especially the folks at <a
        href="https://aka.ms/msracad">MAG</a>
      for building a really audacious and cool thing, and providing us lots of help and support as we build its
      replacement. We're also grateful to our <router-link to="/members">institutional members</router-link> and the
      countless community members who contribute metadata corrections, bug reports, and feature requests.
    </p>
  </v-container>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'AboutPage',
});

useHead({ title: 'About' });
</script>


<style scoped lang="scss">
.text-h4 {
  padding-top: 50px;
}

.text-h5 {
  margin-top: 30px;
  margin-bottom: 10px;
}

p {
  margin-bottom: 20px;
}
</style>
