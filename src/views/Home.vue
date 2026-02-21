<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero">
      <h1 class="hero-headline">
        <!-- The universal research database -->
        All the world's research, connected and open.
      </h1>
      <p class="hero-subhead">
        <!-- Search, filter, analyze, and download the world's scholarly record directly from your agents, scripts, and spreadsheets. Fully open. Nonprofit. -->
        Inspired by the Library of Alexandria, we catalog 474 million scholarly works, linking them to authors, institutions, funders, and more—all fully open.
      </p>
      <div class="hero-search">
        <search-box v-if="newSearchEnabled" show-examples autofocus />
        <shortcut-box v-else show-examples autofocus />
      </div>
      <v-btn variant="text" class="scroll-indicator" @click="scrollToContent">
        <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
    </section>

    <!-- Logos Section -->
    <section id="content" class="section logos-section">
      <p class="section-label">Trusted by leading research organizations worldwide</p>
      <div class="logos-row" :class="{ mobile: smAndDown }">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Logo_of_Sorbonne_University.svg/320px-Logo_of_Sorbonne_University.svg.png"
          alt="Sorbonne University"
          class="logo-img"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/American_Chemical_Society_logo.svg/240px-American_Chemical_Society_logo.svg.png"
          alt="American Chemical Society"
          class="logo-img tall"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Logo_EPFL_2019.svg/320px-Logo_EPFL_2019.svg.png"
          alt="EPFL"
          class="logo-img short"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/7/7d/Jisc_logo.png"
          alt="Jisc"
          class="logo-img"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Chan_Zuckerberg_Initiative.svg/320px-Chan_Zuckerberg_Initiative.svg.png"
          alt="Chan Zuckerberg Initiative"
          class="logo-img"
        />
      </div>
    </section>

    <!-- Big, Tidy, Open Section -->
    <section class="section value-props-section">
      <div class="value-props-container">
        <div class="value-prop">
          <h3 class="value-prop-title">Big</h3>
          <p class="value-prop-text">
            We index 450 million scholarly works, from journal articles and dissertations to datasets and preprints. The collection includes 60 million fulltext PDFs, 200,000 journals and repositories, 100,000 institutions, 100 million authors, 11 million grants, and over 2 billion citation links.
          </p>
        </div>

        <div class="value-prop">
          <h3 class="value-prop-title">Tidy</h3>
          <p class="value-prop-text">
            We merge data from PubMed, arXiv, Crossref, and thousands of other sources into one clean schema. Authors are deduplicated using ORCID and open-source algorithms. Works are tagged with licenses, multilevel topics, and keywords. Open-access PDFs from any repository are linked to their records and ready for download. Everything updates daily.
          </p>
        </div>

        <div class="value-prop">
          <h3 class="value-prop-title">Open</h3>
          <p class="value-prop-text">
            All data is CC0—use it anywhere without attribution. All code is open source, so you can audit every line. We're a 14-year-old nonprofit committed to keeping it open. Our API is built for agents and automation: high throughput, clear pricing, thorough documentation. You can download the entire dataset for free and host it yourself, with optional paid sync to stay current.
          </p>
        </div>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section class="section use-cases-section">
      <h2 class="section-header">Built for builders</h2>
      <v-row>
        <v-col cols="12" md="4" class="use-case">
          <h3 class="use-case-title">AI & Research Tools</h3>
          <p class="use-case-text">
            Power your research assistant, literature review tool, or recommendation engine with comprehensive, structured scholarly data.
          </p>
        </v-col>
        <v-col cols="12" md="4" class="use-case">
          <h3 class="use-case-title">Universities & Research Offices</h3>
          <p class="use-case-text">
            Track your institution's research output, monitor open access compliance, and analyze collaboration networks — without expensive proprietary databases.
          </p>
        </v-col>
        <v-col cols="12" md="4" class="use-case">
          <h3 class="use-case-title">Funders & Governments</h3>
          <p class="use-case-text">
            Understand the landscape of research you fund. Connect grants to outputs. Measure impact across your portfolio.
          </p>
        </v-col>
      </v-row>
    </section>

    <!-- FAQ Section -->
    <section class="section faq-section">
      <h2 class="section-header">Frequently asked questions</h2>
      <div class="faq-list">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
          :class="{ 'is-open': openFaq === index }"
        >
          <button class="faq-question" @click="toggleFaq(index)">
            <span>{{ faq.question }}</span>
            <v-icon class="faq-icon">{{ openFaq === index ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </button>
          <div v-if="openFaq === index" class="faq-answer">
            <p v-html="faq.answer"></p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { useGoTo, useDisplay } from 'vuetify';
import { useHead } from '@unhead/vue';
import { useStore } from 'vuex';
import ShortcutBox from '@/components/ShortcutBox.vue';
import SearchBox from '@/components/SearchBox.vue';
import { computed } from 'vue';

const goTo = useGoTo();
const store = useStore();
const newSearchEnabled = computed(() => store.getters.featureFlags.newSearch);
const { smAndDown } = useDisplay();

useHead({
  title: 'OpenAlex: The open catalog to the global research system',
  titleTemplate: undefined
});

function scrollToContent() {
  goTo('#content');
}

// FAQ data and state
const openFaq = ref(null);

const faqs = [
  {
    question: 'How is OpenAlex different from Google Scholar?',
    answer: 'Google Scholar is a search engine — you visit it to find papers, but you can\'t go beyond that, and you can\'t reuse or analyze the data. OpenAlex is infrastructure — you build on it. Our entire dataset is enriched with connections to authors, institutions, funders, and citations, and is downloadable, queryable via API, and available under CC0. You can\'t do that with Google Scholar.'
  },
  {
    question: 'How is OpenAlex different from Scopus or Web of Science?',
    answer: 'Coverage: We index 473M works vs. ~100M for the proprietary databases. And unlike the paywalled systems, our data is free for anyone to share, remix, and build on. As a nonprofit, we\'re committed to making research infrastructure open and accessible to all.'
  },
  {
    question: 'Is OpenAlex really free?',
    answer: 'Yes. The core data and API are free for everyone, forever. We offer premium tiers with additional features (higher rate limits, dedicated support, metadata curation) for organizations that need them — and that revenue helps keep the free tier free.'
  },
  {
    question: 'How do you fund OpenAlex?',
    answer: 'We\'re funded by philanthropic organizations including Arcadia, the Wellcome Trust, and the Navigation Fund. We also offer premium services to Supporter institutions and enterprise partners. In accordance with the POSI principles, we\'re en route to becoming fully sustainable through earned revenue.'
  },
  {
    question: 'How do I get started?',
    answer: 'Explore our web interface to search and browse the data. Check out the <a href="https://docs.openalex.org/" target="_blank">API documentation</a> to start building. Or <a href="https://docs.openalex.org/download-all-data/openalex-snapshot" target="_blank">download a snapshot</a> of the full dataset. All free, no signup required.'
  }
];

function toggleFaq(index) {
  openFaq.value = openFaq.value === index ? null : index;
}

// Reset state on mount
store.commit('user/setActiveSearchId', null);
store.state.entityType = 'works';
</script>


<script>
export default {
  name: 'HomePage'
};
</script>


<style lang="scss" scoped>
.landing-page {
  background: #fff;
}

// Hero Section
.hero {
  min-height: calc(100vh - var(--app-bar-height));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  padding: 0 24px;
  margin-top: -40px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.hero-headline {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: #0A0A0A;
  max-width: 750px;
  margin: 0 0 20px 0;
}

.hero-subhead {
  font-size: 19px;
  font-weight: 400;
  line-height: 1.65;
  color: #52525B;
  max-width: 600px;
  margin: 0 0 44px 0;
}

.hero-search {
  width: 100%;
  max-width: 600px;
}

.scroll-indicator {
  position: absolute;
  bottom: 24px;
  color: #A1A1AA;

  &:hover {
    color: #71717A;
  }
}

// Sections
.section {
  padding: 100px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #A1A1AA;
  text-align: center;
  margin-bottom: 32px;
}

.section-header {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  text-align: center;
  margin-bottom: 56px;
}

// Logos Section
.logos-section {
  padding-top: 40px;
  padding-bottom: 80px;
  border-bottom: 1px solid #F4F4F5;
}

.logos-row {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 40px;

  &.mobile {
    gap: 24px;

    .logo-img {
      height: 32px;

      &.tall {
        height: 38px;
      }

      &.short {
        height: 26px;
      }
    }
  }
}

.logo-img {
  height: 44px;
  filter: grayscale(1);
  opacity: 0.5;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.7;
  }

  &.tall {
    height: 56px;
  }

  &.short {
    height: 36px;
  }
}

// Value Props Section (Big, Tidy, Open)
.value-props-section {
  padding-top: 120px;
  padding-bottom: 120px;
  background: linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%);
  max-width: none;
}

.value-props-container {
  max-width: 680px;
  margin: 0 auto;
}

.value-prop {
  margin-bottom: 72px;

  &:last-child {
    margin-bottom: 0;
  }
}

.value-prop-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 16px 0;
}

.value-prop-text {
  font-size: 17px;
  line-height: 1.7;
  color: #52525B;
  margin: 0;
}

// Use Cases Section
.use-cases-section {
  padding-top: 120px;
  padding-bottom: 120px;
  max-width: none;

  .v-row {
    max-width: 1000px;
    margin: 0 auto;
  }
}

.use-case {
  padding-bottom: 24px;
}

.use-case-title {
  font-size: 18px;
  font-weight: 600;
  color: #0A0A0A;
  margin: 0 0 12px 0;
}

.use-case-text {
  font-size: 15px;
  line-height: 1.65;
  color: #52525B;
  margin: 0;
}

// FAQ Section
.faq-section {
  padding-top: 120px;
  padding-bottom: 140px;
  max-width: 700px;
}

.faq-list {
  // Nothing needed on container
}

.faq-item {
  border-bottom: 1px solid #E4E4E7;

  &:last-child {
    border-bottom: none;
  }
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 16px;
  font-weight: 500;
  color: #0A0A0A;
  font-family: inherit;

  &:hover {
    color: #000;
  }

  &:focus {
    outline: none;
  }
}

.faq-icon {
  color: #A1A1AA;
  flex-shrink: 0;
  margin-left: 16px;
}

.faq-answer {
  padding-bottom: 24px;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: #52525B;
  }

  a {
    color: #2563EB;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// Responsive
@media (max-width: 960px) {
  .hero-headline {
    font-size: 44px;
  }

  .hero-subhead {
    font-size: 17px;
  }

  .section {
    padding: 80px 20px;
  }

  .section-header {
    font-size: 28px;
    margin-bottom: 48px;
  }

  .value-props-section,
  .use-cases-section {
    padding-top: 80px;
    padding-bottom: 80px;
  }

  .value-prop {
    margin-bottom: 56px;
  }

  .value-prop-title {
    font-size: 24px;
  }
}

@media (max-width: 600px) {
  .hero-headline {
    font-size: 36px;
  }

  .hero-subhead {
    font-size: 16px;
    max-width: 100%;
  }

  .section {
    padding: 64px 16px;
  }

  .section-header {
    font-size: 24px;
    margin-bottom: 40px;
  }

  .value-props-section,
  .use-cases-section,
  .faq-section {
    padding-top: 64px;
    padding-bottom: 64px;
  }

  .value-prop {
    margin-bottom: 48px;
  }

  .value-prop-title {
    font-size: 22px;
  }

  .value-prop-text {
    font-size: 16px;
  }
}
</style>
