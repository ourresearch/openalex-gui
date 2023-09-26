<template>
  <v-container class="page">
    <h3 class="text-h3">About</h3>
    <p>
      OpenAlex is a free and open catalog of the world's scholarly papers, researchers, journals, and institutions
      &mdash; along with all the ways they're connected to one another.
    </p>
    <p>

      Using OpenAlex, you can <strong>build</strong> your own scholarly search engine, recommender service, or trend
      detector. You can help <strong>manage</strong> research by tracking impact, spotting emerging fields, and
      identifying key groups. And you can do <strong>research</strong> to better understand how scholarship works..
    </p>
    <p>
      Because we think all research should be free and open, OpenAlex is free and open itself:
    </p>
    <ul>
      <li>
        We're operated by a <a href="http://ourresearch.org/transparency">sustainable and transparent nonprofit,</a>
      </li>
      <li>
        our <a href="https://docs.openalex.org/download-all-data/openalex-snapshot">complete dataset</a> is free under the
        <a href="https://creativecommons.org/share-your-work/public-domain/cc0/">CC0 license,</a>
      </li>
      <li>
        We offer a
        <a href="https://docs.openalex.org/">free API,</a>
        and
      </li>
      <li>
        <a href="https://github.com/orgs/ourresearch/repositories?language=&q=openalex&sort=&type=public">Our code
        </a> is fully open-source.
      </li>
    </ul>

    <p class="mt-6">
      We believe the global research system is one of humankind's most beautiful creations. OpenAlex aims to make that
      whole beautiful creation available to everyone, everywhere.
    </p>


    <h4 class="text-h4" id="past-and-future">Past and future</h4>
    <p>
      Let's start <em>way</em> back at the beginning, with the ancient <a
        href="https://en.wikipedia.org/wiki/Library_of_Alexandria">Library of Alexandria.</a> Working create a Universal
      Library, they didn't just gather knowledge &mdash; they made it useful by indexing it in the
      world's first library catalog, the
      <a href="https://en.wikipedia.org/wiki/Pinakes">Pinakes.</a> That's what we're trying to do, too, and so our name
      is an homage to them!
    </p>
    <p>
      Fast forward a few millenia: OpenAlex had been a dream at
      <a href="https://ourresearch.org">our little nonprofit</a> for a long time, but two doors opened simultaneously in
      May 2021. First,
      <a href="https://blog.ourresearch.org/arcadia-2021-grant/">we received a generous grant</a> from <a
        href="https://www.arcadiafund.org.uk/">Arcadia, a charitable fund of Lisbet Rausing and Peter Baldwin.</a>
      Second, Microsoft announced it would shutter <a
        href="https://www.microsoft.com/en-us/research/project/microsoft-academic-graph/">Microsoft Academic Graph
        (MAG),</a> which much of the community has come to rely upon as our best index of scholarly communication. So, we
      had the means and the opportunity, and we ran with it!
    </p>
    <p>
      OpenAlex beta launched on January 3rd, 2022. Currently the data is available via an <a
        href="https://docs.openalex.org/">API</a> and a full <a
        href="https://docs.openalex.org/download-all-data/openalex-snapshot">database snapshot.</a> We're also working
      on a web-based graphical user interface.
    </p>

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
      That is a big question! There are many ways to measure this, and we encourage you to try out the different options to see what is best for you.
    </p>
    <p>
      Here we offer a comparison of some of the different options available, across just a few aspects:
    </p>
    <div class="tg-wrap">
      <v-table class="tg" style="undefined;table-layout: fixed; width: 1514px">
        <colgroup>
          <col style="width: 196.666666px">
          <col style="width: 240.333333px">
          <col style="width: 247.333333px">
          <col style="width: 199.333333px">
          <col style="width: 186.333333px">
          <col style="width: 273.333333px">
          <col style="width: 170.333333px">
        </colgroup>
        <thead>
          <tr>
            <th class="tg-loku"></th>
            <th class="tg-q56f">Number of works</th>
            <th class="tg-q56f">Open Access works</th>
            <th class="tg-q56f">Citations</th>
            <th class="tg-q56f">Price</th>
            <th class="tg-q56f">Data Openness</th>
            <th class="tg-q56f">Org structure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="tg-lhf6"><a href="https://openalex.org/">OpenAlex</a></td>
            <td class="tg-loku">243M</td>
            <td class="tg-loku">48M</td>
            <td class="tg-loku">1.9B</td>
            <td class="tg-loku">Freemium</td>
            <td class="tg-loku">Fully open, CC0 license</td>
            <td class="tg-loku">Non-profit</td>
          </tr>
          <tr>
            <td class="tg-lhf6"><a href="https://www.elsevier.com/solutions/scopus" target="_blank" rel="noopener noreferrer">Scopus</a></td>
            <td class="tg-loku">87M</td>
            <td class="tg-loku"><span style="font-style:normal">20.5M (</span><a
                href="https://blog.scopus.com/posts/scopus-now-includes-90-million-content-records" target="_blank" rel="noopener noreferrer">ref</a><span
                style="font-style:normal">)</span></td>
            <td class="tg-loku">1.8B</td>
            <td class="tg-loku">Subscription</td>
            <td class="tg-loku">Closed</td>
            <td class="tg-loku">For Profit</td>
          </tr>
          <tr>
            <td class="tg-lhf6"><a href="https://clarivate.com/webofsciencegroup/solutions/web-of-science" target="_blank" rel="noopener noreferrer">Web of
                Science (core)</a></td>
            <td class="tg-loku"><span style="font-style:normal">87M (</span><a
                href="https://clarivate.libguides.com/librarianresources/coverage" target="_blank" rel="noopener noreferrer">ref</a><span
                style="font-style:normal">)</span></td>
            <td class="tg-loku"><span style="font-style:normal">12M (</span><a
                href="https://clarivate.com/webofsciencegroup/solutions/open-access/" target="_blank" rel="noopener noreferrer">ref</a><span
                style="font-style:normal">)</span></td>
            <td class="tg-loku">1.8B</td>
            <td class="tg-loku">Subscription</td>
            <td class="tg-loku">Closed</td>
            <td class="tg-loku">For Profit</td>
          </tr>
          <tr>
            <td class="tg-lhf6"><a href="https://www.dimensions.ai/" target="_blank" rel="noopener noreferrer">Dimensions</a></td>
            <td class="tg-loku">135M</td>
            <td class="tg-loku"><span style="font-style:normal">29M (</span><a
                href="https://www.dimensions.ai/resources/evaluate-your-universitys-oa-status/" target="_blank" rel="noopener noreferrer">ref</a><span
                style="font-style:normal">)</span></td>
            <td class="tg-loku">1.7B</td>
            <td class="tg-loku">Freemium</td>
            <td class="tg-loku">Partly open, personal use</td>
            <td class="tg-loku">For Profit</td>
          </tr>
          <tr>
            <td class="tg-lhf6"><a href="https://scholar.google.com/" target="_blank" rel="noopener noreferrer">Google Scholar</a></td>
            <td class="tg-loku"><span style="font-style:normal">389M (</span><a
                href="https://doi.org/10.1007/s11192-018-2958-5" target="_blank" rel="noopener noreferrer">estimated</a><span style="font-style:normal">)</span>
            </td>
            <td class="tg-loku">?</td>
            <td class="tg-loku">?</td>
            <td class="tg-loku">Free</td>
            <td class="tg-loku">Closed</td>
            <td class="tg-loku">For Profit</td>
          </tr>
          <tr>
            <td class="tg-lhf6"><a href="https://www.crossref.org/" target="_blank" rel="noopener noreferrer">Crossref</a></td>
            <td class="tg-loku">145M</td>
            <td class="tg-loku">20M</td>
            <td class="tg-loku">1.45B</td>
            <td class="tg-loku">Free</td>
            <td class="tg-loku">Fully open, CC0 license</td>
            <td class="tg-loku">Non-profit</td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <h4 class="text-h4" id="acknowledgements">Acknowledgements</h4>
    <p>
      We'd like to thank everyone behind all our <a href="#sources">data sources,</a> but especially the folks at <a
        href="https://aka.ms/msracad">MAG</a>
      for building a really audacious and cool thing, and providing us lots of help and support as we build its
      replacement.
    </p>


  </v-container>
</template>

<script>
export default {
  name: "About",
  metaInfo: { title: "About" }
}
</script>

<style scoped lang="scss">
.text-h4 {
  padding-top: 50px;

}

.tg {
  border-collapse: collapse;
  border-spacing: 0;
  margin: 0px auto;
  font-size: 1.2em;
}

.tg td {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  overflow: hidden;
  padding: 10px 15px;
  word-break: normal;
}

.tg th {
  border-color: black;
  border-style: solid;
  border-width: 1px;
  font-weight: normal;
  font-size: 1.1em;
  overflow: hidden;
  padding: 10px 15px;
  word-break: normal;
}

.tg .tg-lhf6 {
  border-color: inherit;
  color: #06C;
  font-weight: bold;
  font-size: 1.1em;
  text-align: left;
  text-decoration: underline;
  vertical-align: middle
}

.tg .tg-loku {
  border-color: inherit;
  text-align: left;
  vertical-align: middle
}

.tg .tg-q56f {
  border-color: inherit;
  font-weight: bold;
  text-align: center;
  text-decoration: underline;
  vertical-align: middle
}

.tg-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>