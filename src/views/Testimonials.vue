<template>
  <v-container class="page">

    <v-card
        rounded
        flat
    >
      <!--        class="pa-8 py-12"-->
      <!--        color="light-blue lighten-5" -->
      <div class="text-h1">Testimonials</div>
      <div class="text-h5 mt-4">
        Here's what some of our users have to say about OpenAlex:
      </div>

    </v-card>
    <v-card color="blue-grey lighten-5 pa-3 mb-6" flat rounded class="d-flex align-center mt-12">
      <!--      <v-icon large>mdi-filter</v-icon>-->
      <span class="mr-3 text-h5" v-if="!$vuetify.display.mobile">
                    <span class="font-weight-bold">{{ filteredItems.length }} </span>
                    testimonials
                  </span>

      <v-spacer />
      <v-chip-group v-model="selectedItemTypes">
        <v-chip
            filter
            v-for="itemType in itemTypes"
            :key="itemType.id"
            :value="itemType.id"
            :color="itemType.color"
            text-color="#fff"
        >

          {{ itemType.id }}

          ({{ items.filter(i => i.type === itemType.id).length }})

          <!--          <v-list-item-content>-->
          <!--            <div>-->
          <!--              <v-icon :color="itemType.color" left v-if="selectedItemTypes.includes(itemType.id)">-->
          <!--                mdi-checkbox-marked-->
          <!--              </v-icon>-->
          <!--              <v-icon :color="itemType.color" left v-else>mdi-checkbox-blank-outline</v-icon>-->
          <!--              <span :class="`${itemType.color}&#45;&#45;text`" class="font-weight-bold">-->
          <!--                {{ itemType.id }}-->
          <!--              </span>-->

          <!--            </div>-->

          <!--          </v-list-item-content>-->
          <!--          <v-list-item-action-text>-->
          <!--            {{ items.filter(i => i.type === itemType.id).length }}-->
          <!--          </v-list-item-action-text>-->
        </v-chip>
      </v-chip-group>

    </v-card>

    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col
              cols="12"
              md="4"
              class=""
              v-for="item in filteredItems"
              :key="item.name"
          >
            <v-card rounded outlined class="fill-height d-flex flex-column">
              <v-card-text class="flex-grow-1">
                <q style="font: 16px Roboto; line-height: 1.3" v-html="item.short"/>
                <div class="mt-3 d-flex">
                  <div class="mr-1">
                    &mdash;
                  </div>
                  <div>
                    {{ item.name }}, {{ item.org }}

                  </div>
                </div>
              </v-card-text>
              <v-card-actions class="pt-0">
                <v-btn small text @click="showMore(item)">More</v-btn>
                <v-spacer/>
                <v-chip small outlined :color="item.color">{{ item.type }}</v-chip>
              </v-card-actions>

            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <div>
      <v-alert rounded type="info" outlined text class="mt-8">
        <p>

          Want to share a testimonial of your own? We'd love to hear it!
        </p>
        <div>
          <v-btn rounded text color="primary" href="https://wkf.ms/42RdSkP" target="_blank">
            Share testimonial
            <v-icon right>mdi-open-in-new</v-icon>
          </v-btn>
        </div>
      </v-alert>
    </div>
    <v-dialog scrollable v-model="isDialogOpen" max-width="600">
      <v-card v-if="dialogData">
        <v-card-title>
          <!--          {{ dialogData.org }}-->
          <v-spacer/>
          <v-btn icon @click="closeDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text style="max-height: 80vh;">

          <q style="font: 16px Roboto; line-height: 1.3" v-html="dialogData.long"/>
          <div class="mt-3 d-flex">
            <div class="mr-1">
              &mdash;
            </div>
            <div>
              {{ dialogData.name }}, {{ dialogData.org }}
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-chip small outlined :color="dialogData.color">{{ dialogData.type }}</v-chip>
          <v-spacer/>
          <v-btn text @click="closeDialog()">Close</v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>

import {mapActions, mapGetters, mapMutations} from "vuex";

export default {
  name: "Template",
  components: {},
  props: {},
  data() {
    return {
      isDialogOpen: false,
      dialogData: null,
      itemTypes: [
        {
          id: "enterprise",
          color: "orange",
        },

        {
          id: "analytics",
          color: "teal",
        },

        {
          id: "research",
          color: "purple",
        },

      ],
      selectedItemTypes: [],
      items: [
        {
          short: `The OpenAlex dataset was <strong>a game changer....</strong>an open dataset that allows for transparency is essential.`,
          long: `Dragonfly Data Science is a New Zealand based consulting company that specializes in data science, statistical analysis and machine learning.<br><br>

 For a report commissioned by the New Zealand Ministry for Business, Innovation and Employment, we were tasked with looking at changes in the New Zealand research workforce over a twenty year period, to be used in a reimagining of the New Zealand science system.<br><br>

OpenAlex provided us with a single consistent dataset of publications, allowing us to look at researchers by subject area and institution. From their publication history, we could look at peoples careers, how they had moved between New Zealand and other countries, how they had moved between institutions, and how long they had remained actively publishing.<br><br>

The OpenAlex dataset was a game changer for us. As we are informing public policy, using an open dataset that allows for transparency is essential. We are planning to release a small dataset, derived from OpenAlex, that is of New Zealand researchers only. This will be widely accessible. This kind of repurposing would not be possible without the open licensing provided by OpenAlex`,
          name: "Edward Abraham",
          org: "Dragonfly Data Science",
          type: "analytics",
        },


        {
          short: `With its extensive catalog of scholarly papers, OpenAlex has enabled us to <strong>effortlessly locate the right sources</strong> that students are searching for.`,
          long: `Scribbr is a multilingual editing service guiding students on their journey to become better academic writers through AI tools and expert feedback.<br><br>

When assisting students one of our core free services is providing citation generation. Our previous external data solutions for this were slow and not as dependable as we’d like. They left students frustrated.<br><br>

OpenAlex is faster and more dependable; it has transformed the way we assist students with their citations. With its extensive catalog of scholarly papers, OpenAlex has enabled us to effortlessly locate the right sources that students are searching for.<br><br>

Since incorporating OpenAlex into our Citation Generator, our service has become more streamlined and user-friendly than ever before.
We strongly recommend OpenAlex to anyone seeking a reliable and fast source of scholarly papers.`,
          name: "Sven Hanssen",
          org: `Scribbr`,
          type: "enterprise",
        },


        {
          short: `OpenAlex provides <strong>accurate affiliation data, effortlessly and quickly</strong>`,
          long: `INSERES is a software company that makes Piri Discovery Service, a search-focused, enterprise-level tool specifically tailored for academic professionals, researchers, and students.<br><br>

Before OpenAlex, we faced challenges in listing publications affiliated with the given institutions; furthermore, we had no citation information for institution-affiliated publications, except for data provided by OpenCitations. Additionally, there was no discipline-specific data available for these institution-affiliated publications. We attempted to collect affiliation data from our various data sources including CrossRef, but none of these yielded satisfactory results. <br><br>

OpenAlex sovled this by providing publication information, citation data, and discipline-specific insights for institution-affiliated publications. This support proved to be invaluable for our operations. OpenAlex provides accurate affiliation data, effortlessly and quickly; this has been a great advantage for us. Furthermore, OpenAlex’s daily updates ensure our clients always have access to the most current information. <br><br>

We are impressed with OpenAlex's ability to establish relationships between various data points: it connects publications with authors, institutions with authors, and publications with disciplines. I would definitely recommend OpenAlex to others. In my opinion, OpenAlex has the potential to become an essential service used globally. To be honest, we are heavily reliant on SciVal and InCites for institutional statistics. Scopus and Web of Science (WoS) companies are quite strict with their data due to this dependence. I see OpenAlex as an important initiative that could eventually replace these products...I believe OpenAlex holds great promise for the future.`,
          name: "Ahmet Mungen",
          org: `INSERES`,
          type: "enterprise",
        },


        {
          short: `OpenAlex helps <strong>significantly optimize the performance of our literature search,</strong> and thus shorten our overall R&D time.`,
          long: `In early development of the drug discovery process at BMS, we have to do a lot of literature search, often across different sources like bioRxiv, medRxiv, PubMed, etc. <br><br>

          OpenAlex helps streamline this process and significantly optimize the performance of our literature search, and thus shorten our overall R&D time. We highly recommend OpenAlex to anyone who needs a unified interface to acquire open scholarly metadata.`,
          name: "Trang Le",
          org: `Bristol Myers Squibb`,
          type: "enterprise",
        },


        {
          short: `The OpenAlex API helps us to <strong>consolidate and accelerate </strong>our data collection.`,
          long: `The Open Access team at TU Berlin (Germany) works with publication data of affiliated researchers in various ways: analyzing institutional output, monitoring open access, assisting authors with self-archiving, and consluting for publication strategy.<br><br>

To do this, we have to pull data from various sources (e.g. Web of Science, Scopus, ORCID, etc) and aggregate data from various services (e.g. Crossref, Unpaywall, etc).<br><br>

The OpenAlex API helps us to consolidate and accelerate our data collection, so that we can support TU Berlin researchers more efficiently. In the long run we hope a GUI will meet researchers needs for searching/browsing. We recommend university libraries use OpenAlex to build and maintain sustainable, noncommercial scholary infrastructures.`,
          name: "Michaela Voigt",
          org: `Technische Universität Berlin (University library)`,
          type: "analytics",
        },


        {
          short: `[We] have now <strong>moved 100% to OpenAlex</strong>...data and metadata are very complete.`,
          long: `Kenedict is an innovation analytics consultancy and uses OpenAlex to collect data on scientific output, authors and institutions for client projects. The data is mapped as graphs / networks to provide clients a connected perspective on scientific activity.<br><br>

 We previously relied on a combination of paid databases, the Microsoft Academic API and The Lens, but have now moved 100% to OpenAlex. The API is super speedy, has generous rate limits and is easy to work with, data and metadata are very complete, all at no cost. <br><br>

 We have used OpenAlex data in various projects now, providing clients with valuable insights on themes and peers of their interest. We would definitely recommend OpenAlex to anyone working with scientific publication data.`,
          name: "André Vermeij",
          org: `Kenedict`,
          type: "analytics",
        },


        {
          short: `OpenAlex is <strong>CC0 and we can share everything</strong> without worrying or talking to lawyers! It is really great.
`,
          long: `Our research lab looks at the migration of researchers. We use bibliometric data to detect changes in affiliations of individual scholars.<br><br>

We used to only use Scopus, which has okay data quality. But now we want to share not only our results, but detailed replication data so that other researchers can build on top of our methods. But the licensing terms restrict us from doing so.<br><br>

OpenAlex is CC0 and we can share everything without worrying or talking to lawyers! It is really great.<br><br>

 We compared the data and found some differences (E.g.. OA: better coverage in South America, lower coverage in China; Author disambiguation is a bit better with Scopus; Affiliation disambiguation with ROR ids is more useful at OpenAlex), but overall we are happy with the data quality. I recommend everyone to try OpenAlex for bibliometric research.`,
          name: "Tom Theile",
          org: `Max-Planck-Institute for demographic research`,
          type: "research",
        },


        {
          short: `OpenAlex is highly recommended for its<strong> fast, open, and high-quality</strong> scholarly data`,
          long: `Local Citation Network is an open source bibliometric web app for visualizing citation graphs and literature discovery. <br><br>

 It requires an easily accessible, comprehensive, up-to-date database of the global citation graph as its data source. Microsoft Academic used to be our primary source but was discontinued in the end of 2021.<br><br>

OpenAlex has successfully bridged this gap and now provides even more relevant information as the new primary source, for example links to the authors' ORCID pages or whether a paper has been retracted. OpenAlex is highly recommended for  its fast, open, and high-quality scholarly data and its track record of continuous innovation.
`,
          name: "Tim Wölfle",
          org: `Local Citation Network`,
          type: "enterprise",
        },


        {
          short: `OpenAlex gives me an open-source alternative that's <strong> large, free, and has an easy-to-use API.</strong>`,
          long: `I am a PhD student with research interests in science & technology policy, scientometrics, machine learning, and data science. OpenAlex is helping me to gain access to large-scale bibliometric data with its convenient and free API. I am using the data OpenAlex provides to research the evolution of scientific communities through citation network analysis of directed acyclic graphs.<br><br>

Before learning about OpenAlex, I had to rely on paid services like Web of Science, Scopus, or Dimensions for bibliometric data.  But now OpenAlex gives me an open-source alternative that's large, free, and has an easy-to-use API.<br><br>

Although there are other options available for academic or corporate researchers who can afford costly subscription services, a service like OpenAlex levels the playing field and makes data equally accessible to researchers. This may help researchers have a common source of information for comparison, instead of trying to compare data from one paid service to another.<br><br>

I would highly recommend OpenAlex to others with scientometric and bibliometric interests. Some of the most important advances in our world are attributable to increasing access to technologies. Its open-access values encourage a common data framework of accessibility, equity, and diversity. `,
          name: "Chris B.",
          org: `PhD student at US research university`,
          type: "research",
        },


        {
          short: `<strong>The best solution</strong> for academic use cases like ours that are working to further diversity and equity in research.`,
          long: `I am the lead student researcher for Georgia Tech's Executive VP of Research. A primary aim of our office is to document research and faculty collaboration of the college with HBCU institutions as a part of institute collaboration goals. <br><br>

 We used OpenAlex extensively as a ground truth to document research across Georgia Tech and its HBCU partners.<br><br>

  OpenAlex is an easy to use solution with excellent documentation, extensive and improving database, and a robust yet simple API that's  free of charge. This makes it the best solution for academic use cases like ours that are working to further diversity and equity in research. I recommend OpenAlex to whoever I know to be working in the domain of scientometrics.`,
          name: "Chinar Dankhara",
          org: `Georgia Institute of Technology`,
          type: "analytics",
        },


        {
          short: `This is a powerful tool that has already cemented itself as an <strong> integral and vital</strong> part of bibliographic studies.`,
          long: `I am a Collection Analysis Librarian, responsible for better understanding our campus publishing patterns and helping to negotiate open publishing agreements with publishers. I need high quality bibliographic metadata to do this work, and while I do have access to some subscription products, I still use the OpenAlex API every week (sometimes every day).<br><br>

The clear syntax makes it easy to construct a query, and the grouping, filtering, and limiting gives us snapshots of trends very quickly. This is a powerful tool that has already cemented itself as an integral and vital part of bibliographic studies.`,
          name: "Eric Schares",
          org: `Iowa State University Library`,
          type: "analytics",
        },


        {
          short: `OpenAlex is the best in terms of completeness, data quality, and ease of use....OpenAlex is <strong>better than the paid data sources</strong>`,
          long: `Clear Skies detects signs of research fraud in the academic literature. Some of our methods rely on article metadata. OpenAlex is an excellent source of that data.<br><br>

Prior to OpenAlex, we used Microsoft Academic Graph, Semantic Scholar, Crossref, PubMed and ArXiv. All of these are excellent in their own way, but OpenAlex is the best in terms of completeness, data quality, and ease of use. The API is fast and intuitive. The regular snapshots facilitate moden data engineering practices. It's also free. We don't have the financial resources to use any paid data source and OpenAlex is better than the paid data sources we know of.<br><br>

The latest version of the Papermill Alarm was trained on OpenAlex data (for the most part). Building it took months of work. Throughout that work, OpenAlex was solidly reliable. The result is a tool that, as far as I know, has the highest recall for papermill detection.`,
          name: "Adam Day",
          org: `Clear Skies`,
          type: "enterprise",
        },


        {
          short: `OpenAlex is of crucial importance... it offers a <strong>better performance than other databases</strong>...a fundamental building block.`,
          long: `I am the main developer of VOSviewer, one of the most popular software tools worldwide for visualizing scientific literature based on bibliographic data. VOSviewer supports a large number of bibliographic databases. However, most of these databases have important limitations:<br><br>

<ul>
<li>They require an expensive subscription (Web of Science, Scopus),</li>
<li>their coverage of the scientific literature is limited (Web of Science, Scopus),</li>
<li>they allow only small amounts of data to be exported (Web of Science, Scopus, Dimensions),</li>
 <li>they are restricted to specific disciplines (PubMed, Europe PMC),
 <li>there are major gaps in their data (PubMed, Europe PMC, Crossref, OpenCitations), and/or</li>
 <li>downloading data is very slow (Crossref, OpenCitations).</li>
 </ul><br>

                     OpenAlex is of crucial importance for VOSviewer users because it offers a better performance than other databases on all the above-mentioned criteria.<br><br>

                      VOSviewer users regularly run into problems because of the limitations of bibliographic databases. When they ask me for help, I often refer them to OpenAlex as an alternative database that is likely to offer a solution to their problem. I consider OpenAlex to be a fundamental building block for an ecosystem of open infrastructures for high-quality research analytics.`,
          name: "Nees Jan van Eck",
          org: `Centre for Science and Technology Studies (CWTS), Leiden University`,
          type: "research",
        },

        {
          short: `OpenAlex has been at the core of my research...the OpenAlex API has <strong>vastly improved my workflow</strong> and has (almost) eliminated any setup costs.`,
          long: `I am a PhD student at the Haas School of Business, UC Berkeley. I work on issues related to diffusion of scientific knowledge and identifying channels through which knowledge travels from universities to industry. <br><br>

OpenAlex has been at the core of my research as it provides free access to bibliometric data that is relatively clean and easy to access via the API. I was using MAG before it was discontinued and had to download the entire dataset on my local computer. It took me a few months to set up MAG to run simple queries. OpenAlex API has vastly improved my workflow and has (almost) eliminated any setup costs. <br><br>

In my current project, OpenAlex author disambiguation and affiliation data havs been helpful in identifying the sources of scientific knowledge and in matching the information to media data. <br><br>

I have recommended OpenAlex to many colleagues.`,
          name: "Saqib Mumtaz",
          org: `UC Berkeley`,
          type: "research",
        },


        {
          short: `I am currently moving all of my projects to use OpenAlex... [it] has among the <strong> best available data </strong> on disambiguated authorship and author metadata that I have encountered.`,
          long: `I am a sociologist who researches the dynamics of scholarly communication. My research relies centrally on high quality and reliable data on citations, publication metadata, author characteristics, and other aspects of the publication ecosystem.<br><br>

Previously (and currently) I use expensive proprietary data sources for my research, but I am currently moving all of my projects to use OpenAlex. Not only is OpenAlex more affordable, but it provides more convenient access (well structured data downloads and an extremely well designed API), and I have found the data to be often of higher quality. In particular, OpenAlex has among the best available data on disambiguated authorship and author metadata that I have encountered. It also offers up-to-date data from a variety of sources, without undue focus on only, e.g., books or journals.<br><br>

As one example, an ongoing project requires both bibliometric data and full text of published articles. OpenAlex makes it extremely easy to find high-quality versions of open-access publications that can be processed programmatically. There is no better solution for this kind of project that I know of.<br><br>

I would, and often do, recommend OpenAlex to others who need this kind of data.`,
          name: "Peter McMahan",
          org: `McGill University`,
          type: "research",
        },


        {
          short: `OpenAlex has enabled me to build a cleanly assembled dataset... with <strong> minimal effort and maximum confidence</strong> in data quality.`,
          long: `My name is Manuela Collis and I am a doctoral student at University of Toronto. I study gender gaps in organizations, entrepreneurship, and the innovation process and how we can close them.<br><br>

My challenges are three-fold. First, I need the dataset that best identifies and matches scientists by name. OpenAlex has made the biggest effort at disambiguation of scientists. Second, I needed a dataset that allowed me to collect a very specific set of variables. OpenAlex's API makes this incredibly easy, and I can assemble exactly the dataset I need. Third, I was looking for detailed geo-location data for every institution in my dataset. OpenAlex can provide me with latitudinal and longitudinal details, which is perfect for my needs. Lastly, it is a huge plus that I can access OpenAlex with a Python script!<br><br>

I used CADRE's Web of Science dataset which was less transparent in terms of data coverage and quality and did not offer me a solution to the challenges I faced. There was also essentially no customer service to provide me with information or possible solutions to my questions or concerns.<br><br>

I have found OpenAlex’s data quality to be excellent.  In addition, the continuous push for improvement is a big benefit versus other data providers. This is a huge consideration for researchers overall (increasingly so). Their documentation expressed efforts and transparency which gives me more confidence in my data quality (or at least allows me and potential readers of my research to evaluate the quality).  The easy to use API makes accessing the data much simpler versus other sources like CADRE.
OpenAlex has enabled me to build a cleanly assembled dataset of publications by my set of scientists of interest with minimal effort and maximum confidence in data quality.<br><br>

OpenAlex’s ease of use, transparent and high standards with regard to data quality and expansion of data coverage are invaluable to me.    I would definitely recommend OpenAlex to other leading researchers in the field.  `,
          name: "Manuela Collis",
          org: `University of Toronto`,
          type: "research",
        },

        {
          short: `the API has turned out to be highly valuable for us as it provides <strong> fast and easy</strong> access to the data we need.`,
          long: `The Research Intelligence team at the Vrije Universiteit Amsterdam creates dashboards and reports for policy makers within and outside the university.<br><br>

 While our own publications are registered in-house, we rely on scholarly databases for analyses with a broader scope such as international benchmarking.<br><br>

  OpenAlex has been very beneficial for us and promises to be a worthy alternative to commercial databases. Especially the API has turned out to be highly valuable for us as it provides fast and easy access to the data we need, even allowing us to quickly generate aggregated overviews via the groupby parameter, for instance a summary of our open access percentages.<br><br>

   We highly recommend OpenAlex to anyone looking for a straightforward integration of scholarly metadata into BI solutions such as dashboards.
`,
          name: "Max Paulus",
          org: `Vrije Universiteit Amsterdam (Research Intelligence team)`,
          type: "analytics",
        },


        {
          short: `The <strong>amazing data quality,</strong> breadth and depth of coverage, and the good support make a difference.`,
          long: `The purpose of Open Access Helper is to provide a browser extension which puts finding legal open access copies right in the user’s workflow quickly.  <br><br>

Before OpenAlex I incorporated the APIs of CORE,  Europe PMC and the Unpaywall Data Feed. CORE’s API was easy, the data quality sufficient but call rates were limited.<br><br>


OpenAlex has the better, more performant API with higher call rates. Information about OpenAccess copies is very reliable.   In addition, the quality of the metadata is excellent. The data structure uses identifiers, to make lateral searching very easy.  Overall, the amazing data quality, breadth and depth of coverage and the good support make a difference.  OpenAlex is also very well documented.  <br><br>

While users of my iOS App have the choice of search providers, greater than 93% chose OpenAlex. Yes, I would definitely recommend OpenAlex to other solution providers and developers as the leading source of academic metadata, which is freely available and follows open principles.`,
          name: "Claus Wolf",
          org: `Open Access Helper`,
          type: "enterprise",
        },


        {
          short: `Before OpenAlex I had to use Scopus. <strong>OpenAlex is a better solution</strong> because of their transparency...the coverage is also much larger.`,
          long: `I am a data scientist working on scientometrics, evidence-based policy making and impact/specialization analysis of research and public institutions.<br><br>

Before OpenAlex I had to use Scopus.
OpenAlex is a better solution because of their transparency and their being an open data solution. The amount of metadata per publication and the coverage are also much larger.<br><br>
A concrete good outcome of using OpenAlex is that the data we use can be pubic and accessible to everyone to know more from our analysis, and this is an advantage for the researchers for whom we do the analysis.
I am recommending OpenAlex constantly!`,
          name: "Alessandro Seri",
          org: `Siris Academic`,
          type: "analytics",
        },


        {
          short: `We highly recommend OpenAlex to any institution or startup that needs <strong>fast, responsive and comprehensive </strong> access to scholarly metadata.`,
          long: `Scholarcy breaks documents down into bite-sized, interactive flashcards that you read, share and annotate on any device....<br><br>

To do this, we need to be able to retrieve academic papers from often limited information....Previously, we had a two step process:<br><br>
<ol>
<li>Try to locate the paper in a variety of repositories (CrossRef, ArXiv, bioRxiv ...) and retrieve metadata from there, including the DOI.</li>
<li>If there is a DOI, look it up in Unpaywall to see if there is an open-access version of the paper.</li>
</ol><br>

Now, using OpenAlex, we can do this in a single step, retrieving both metadata and the 'best' location of the paper. This is much faster - often by several seconds per article. What's more, the help and support we get from the OpenAlex team is great, and they helped us accelerate our adoption and implementation.<br><br>

We highly recommend OpenAlex to any institution or startup that needs fast, responsive and comprehensive access to scholarly metadata.`,
          name: "Phil Gooch",
          org: `Scholarcy`,
          type: "enterprise",
        },


        {
          short: `[OpenAlex] will <strong>save us months of work</strong> and makes our vision much more possible`,
          long: `Cooplit is a project in progress looking to map out academia on a Google-maps style interface, showing who-does-what-where.<br><br>
 Originally, we were planning to develop all of our own algorithms to collect information about scholars from literature directly.<br><br>

  Now, we don't have to do that because of OpenAlex. Instead, we can collect data directly from OpenAlex and use their example database infrastructures to help us build our own. This will save us months of work and makes our vision much more possible. <br><br>

  I try to tell everyone I can who would find OpenAlex useful about it.`,
          name: "Megan Wancura",
          org: `Cooplit`,
          type: "analytics",
        },


        {
          short: `OpenAlex offers an alternative [to Scopus and Web of Science] that is openly available and<strong> more rigorously formatted.</strong>`,
          long: `Egestabase is a open platform that collates evidence from research on nutrient recovery from wastewater streams for reuse in agriculture.<br><br>

 We have used bibliographic information from Elsevier Scopus and Clarivate Web of Science as basis for metadata coding. OpenAlex offers an alternative data source that is openly available and more rigorously formatted. Interacting with the Open Alex API is easier and not limited depending on subscription status.<br><br>

  Thus, we are planning to do future searches and updates of Egestabase using OpenAlex. We would highly recommend OpenAlex for scholars working with metadata of large sets of scientific papers.
`,
          name: "Robin Harder",
          org: `Swedish University of Agricultural Sciences`,
          type: "research",
        },


        {
          short: `[OpenAlex] provides <strong> uniquely high-quality data,</strong> rich documentation, [and] is open-source.`,
          long: `Evidence Prime creates software tools for evidence-based research. One of our products is Laser AI. Its goal is to help gather and synthesize evidence from academic papers and allow institutions to make informed decisions in medicine. In order to make it easier and more effective to find, compare, and extract data from papers related to the researched topic, we need our own comprehensive database of scholarly data.<br><br>

We are currently developing such a database and OpenAlex is our primary resource. It provides uniquely high-quality data, rich documentation, is open-source and makes it easy to synchronize a local copy of data thanks to manifest files and snapshots. For these reasons we would definitely recommend OpenAlex to others.<br><br>

 Thanks to OpenAlex we will be
able to add crucial features to our tool and increase researchers' productivity, allow for better quality systematic reviews and make a better understanding of current medical knowledge possible.`,
          name: "Marcin Makulec",
          org: `Evidence Prime`,
          type: "enterprise",
        },


      ]
    }
  },
  computed: {
    ...mapGetters([

    ]),
    filteredItems() {

      return this.items
          .filter(item => !this.selectedItemTypes?.length || this.selectedItemTypes.includes(item.type))
          .map(item => {
            return {
              ...item,
              color: this.itemTypes.find(itemType => itemType.id === item.type)?.color
            }
          })
    },
    isOpen: {
      get() {
        if (!this.$vuetify.display.mobile) return true
        return this.$store.state.showFiltersDrawer
      },
      set(val) {
        if (!this.$vuetify.display.mobile) return // you can't falsify isOpen on desktop
        this.$store.state.showFiltersDrawer = val
      },
    },
  },

  methods: {
    ...mapMutations([
      "snackbar",
    ]),
    ...mapActions([]),
    showMore(item) {
      this.dialogData = item
      this.isDialogOpen = true
    },
    closeDialog() {
      this.isDialogOpen = false
      this.dialogData = null
    },
    toggleSelectedItemType(itemTypeId) {
      if (this.selectedItemTypes.includes(itemTypeId)) {
        this.selectedItemTypes = this.selectedItemTypes.filter(i => i !== itemTypeId)
      } else {
        this.selectedItemTypes.push(itemTypeId)
      }
    }


  },
  created() {
  },
  mounted() {
  },
  watch: {
    isOpen(to, from) {
    }
  }
}
</script>

<style scoped lang="scss">

</style>