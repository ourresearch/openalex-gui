<template>
  <v-container class="page">
    <v-card rounded flat>
      <div class="text-h1">About</div>
      <div class="text-h5 mt-4">
        OpenAlex is a free and open catalog of the world's scholarly research system
      </div>

    </v-card>

    <div class="text-h2 mb-4" id="upcoming" style="margin-top: 100px;">
      What we do
      <v-btn icon to="#what-we-do">
        <v-icon>mdi-link</v-icon>
      </v-btn>
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
          Our data is free and <a href="https://docs.openalex.org/additional-help/faq#how-is-openalex-licensed"
            target="_blank">reusable</a>, available via <a
            href="https://docs.openalex.org/download-all-data/openalex-snapshot">bulk download</a> or <a
            href="https://docs.openalex.org/">API,</a>
        </li>
        <li>
          <a href="https://github.com/orgs/ourresearch/repositories?language=&q=openalex&sort=&type=public">our code
          </a> is fully open-source, and
        </li>
        <li>
          we're governed by a <a href="http://ourresearch.org/transparency">sustainable and transparent nonprofit.</a>
        </li>
      </ul>
      <p class="mt-6">
        We believe the global research system is one of humankind's most beautiful creations. OpenAlex aims to make that
        whole beautiful creation available to everyone, everywhere.
      </p>
    </div>

    <h4 class="text-h4" id="contact">Contact</h4>
    <p>
      We'd love to hear from you! If you have a question, and you can't find the answer in our <a
        href="https://docs.openalex.org/">documentation</a>,
      submit a ticket via our <a href="/help">help page</a>.
    </p>

    <p>
      You can also stay in touch with us via the <a href="https://groups.google.com/g/openalex-users">OpenAlex User
        Group</a> and via Twitter (<a href="https://twitter.com/openalex_org">@OpenAlex_org</a>) and Mastodon (<a
        href="https://mastodon.social/@OpenAlex">@OpenAlex@mastodon.social</a>).
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
        href="https://docs.openalex.org/api-entities/sources/get-lists-of-sources">using our API.</a>
    </p>

    <h4 class="text-h4" id="comparison">Comparison with other scholarly data sources</h4>
    <p>
      How does OpenAlex compare to other scholarly data sources like Dimensions, Scopus, Google Scholar, etc.?
    </p>
    <p>
      That is a big question! There are many ways to measure this, and we encourage you to try out the different options
      to see what is best for you.
    </p>
    <p>
      Here we offer a comparison of some of the different options available, across just a few aspects:
    </p>
    <v-table id="comparisonTable">
      <template v-slot:default>
        <thead>
          <tr>
            <th class="text-left">

            </th>
            <th class="text-left">
              Number of works
            </th>
            <th class="text-left">
              Open Access works
            </th>
            <th class="text-left">
              Citations
            </th>
            <th class="text-left">
              Price
            </th>
            <th class="text-left">
              Data Openness
            </th>
            <th class="text-left">
              Org structure
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparisonRows" :key="row.name">
            <td class="text-h6"><a :href="row.url" target="_blank" rel="noopener noreferrer">{{ row.name }}</a></td>
            <td v-html="row.numWorks"></td>
            <td v-html="row.numWorksOA"></td>
            <td v-html="row.numCitations"></td>
            <td v-html="row.price"></td>
            <td v-html="row.dataOpenness"></td>
            <td v-html="row.orgStructure"></td>
          </tr>
        </tbody>
      </template>
    </v-table>
    <h4 class="text-h4" id="acknowledgements">Acknowledgements</h4>
    <p>
      We'd like to thank everyone behind all our <a href="#sources">data sources,</a> but especially the folks at <a
        href="https://aka.ms/msracad">MAG</a>
      for building a really audacious and cool thing, and providing us lots of help and support as we build its
      replacement.
    </p>


  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'AboutPage',
});

useHead({ title: 'About' });

const comparisonRows = ref([
  {
    name: 'OpenAlex',
    url: 'https://openalex.org/',
    numWorks: '243M',
    numWorksOA: '48M',
    numCitations: '1.9B',
    price: 'Freemium',
    dataOpenness: 'Fully open, CC0 license',
    orgStructure: 'Non-profit',
  },
  {
    name: 'Scopus',
    url: 'https://www.elsevier.com/solutions/scopus',
    numWorks: '87M',
    numWorksOA:
      '20.5M (<a href="https://blog.scopus.com/posts/scopus-now-includes-90-million-content-records" target="_blank" rel="noopener noreferrer">ref</a>)',
    numCitations: '1.8B',
    price: 'Subscription',
    dataOpenness: 'Closed',
    orgStructure: 'For Profit',
  },
  {
    name: 'Web of Science (core)',
    url: 'https://clarivate.com/webofsciencegroup/solutions/web-of-science',
    numWorks:
      '87M (<a href="https://clarivate.libguides.com/librarianresources/coverage" target="_blank" rel="noopener noreferrer">ref</a>)',
    numWorksOA:
      '12M (<a href="https://clarivate.com/webofsciencegroup/solutions/open-access/" target="_blank" rel="noopener noreferrer">ref</a>)',
    numCitations: '1.8B',
    price: 'Subscription',
    dataOpenness: 'Closed',
    orgStructure: 'For Profit',
  },
  {
    name: 'Dimensions',
    url: 'https://www.dimensions.ai/',
    numWorks: '135M',
    numWorksOA:
      '29M (<a href="https://www.dimensions.ai/resources/evaluate-your-universitys-oa-status/" target="_blank" rel="noopener noreferrer">ref</a>)',
    numCitations: '1.7B',
    price: 'Freemium',
    dataOpenness: 'Partly open, personal use',
    orgStructure: 'For Profit',
  },
  {
    name: 'Google Scholar',
    url: 'https://scholar.google.com/',
    numWorks:
      '389M (<a href="https://doi.org/10.1007/s11192-018-2958-5" target="_blank" rel="noopener noreferrer">estimated</a>)',
    numWorksOA: '?',
    numCitations: '?',
    price: 'Free',
    dataOpenness: 'Closed',
    orgStructure: 'For Profit',
  },
  {
    name: 'Crossref',
    url: 'https://www.crossref.org/',
    numWorks: '145M',
    numWorksOA: '20M',
    numCitations: '1.45B',
    price: 'Free',
    dataOpenness: 'Fully open, CC0 license',
    orgStructure: 'Non-profit',
  },
]);
</script>


<style scoped lang="scss">
.text-h4 {
  padding-top: 50px;

}

#comparisonTable {
  max-width: 1500px;
}

#comparisonTable thead th {
  font-size: 1.2em;
}

#comparisonTable tbody td {
  font-size: 1em;
}
</style>