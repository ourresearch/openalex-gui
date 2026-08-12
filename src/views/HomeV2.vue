<template>
  <div class="landing-v2">

    <!-- ===================== HERO (#686) ===================== -->
    <section class="hero">
      <div class="hero-copy">
        <!-- ⚠️ headline is the approved PLACEHOLDER (#686); Jason revisits it on the
             assembled page. Don't reopen before assembly. -->
        <h1 class="hero-headline">Unlock the<br>world's research</h1>
        <p class="hero-subhead">
          Inspired by the Library of Alexandria, we index half a billion scholarly
          works and make them easy to search, analyze, and&nbsp;reuse.
        </p>
        <div class="hero-search">
          <!-- hide-submit: no in-box magnifier; the Search CTA below drives it (#681).
               placeholder-override: fixed copy, no count (avoids the xpac-count confusion).
               Always the new single-row bar — OQL launched for everyone (#464); the old
               oqlFlag fork to the legacy two-row box was dropped 2026-08-12 (Jason).
               Legacy-opt-out devices get this box too; its OQL probe self-gates on the
               flag, so their submits still route to the legacy SERP form. -->
          <search-box single-row two-deck autofocus hide-submit
                      placeholder-override="Search papers, datasets, and more" />
        </div>
      </div>

      <!-- live feed: rows are built imperatively in onMounted (faithful port of the
           #686 C3 prototype — prototype wins ties). -->
      <div class="hero-viz">
        <!-- feed header intentionally removed (Jason 2026-08-03): the "N works added
             today" bar made the column busier, and the feed is now a curated best-of
             sample, not a live "today" claim. Kept commented in case it returns. -->
        <!-- <div class="added">
          <span class="live-dot"></span>
          <span><b ref="addedRef">…</b> works added today</span>
        </div> -->
        <div class="feedport" ref="portRef"><div class="belt" ref="beltRef"></div></div>
      </div>

      <!-- bottom-center Learn more (R22): ghost + down chevron, scrolls one screen.
           Raw span.mdi (not v-icon) dodges the global 18px !important icon rule. -->
      <button class="cta cta-secondary hero-learnmore" @click="scrollToContent">
        Learn more <span class="mdi mdi-chevron-down"></span>
      </button>
    </section>

    <!-- ===================== SOCIAL PROOF (#404 band, static grid per Jason 2026-08-03) ===================== -->
    <section id="content" class="logos-section">
      <div class="logo-grid" role="group" aria-label="Logos of organizations that use OpenAlex">
        <img v-for="(logo, i) in bandLogos" :key="i"
             :src="logo.src" :alt="logo.alt" class="band-logo" :class="logo.cls" />
      </div>
    </section>

    <!-- ===================== WHAT IT IS (copy + #711 graphic) ===================== -->
    <section class="whatis-section">
      <div class="whatis-grid">
        <div class="whatis-copy">
          <h2 class="whatis-title">A new kind of library</h2>
          <p>
            Research is transforming: moving from siloed scholars paging through
            dusty journals, to a collaborative ecosystem of humans and agents that
            analyze, create, review at network speed.
          </p>
          <p>
            But an ecosystem needs nutrients. That's where we come in. OpenAlex
            <b>gathers,</b> <b>organizes,</b> and <b>shares</b> all kinds of
            research content so others can build on it.
          </p>
          <p>
            We're a new kind of library for a new kind of research: we're the
            soil for the scholarly ecosystem.
          </p>
          <!-- ghost CTA (R22) → help-center data reference -->
          <a class="whatis-cta novice-link" href="https://help.openalex.org/data/" target="_blank" rel="noopener">
            Learn about our data <span class="mdi mdi-arrow-right"></span>
          </a>
        </div>

        <!-- #711 soil-core graphic. Markup + annot-css lifted near-verbatim from
             work/label-drafts-v5.html; geometry is px-tuned to 900px art width and
             scaled to fit via the wrappers. color-scheme:light required.
             Art and labels are SIBLING grid columns (text / graphic / labels, per
             Jason 2026-08-03); both zoom by the same --cake-scale and have equal
             pre-zoom heights (1170px), so align-items:center keeps rows aligned. -->
        <div class="whatis-graphic">
          <div class="cake-art"><img :src="layerCake" alt="How OpenAlex works: research content is gathered, organized, and shared, growing into the scholarly ecosystem" /></div>
        </div>
        <div class="whatis-labels">
          <div class="cake-annot">
              <!-- reading-order cue: (1) bottom → (2) → (3) top, up-arrows between -->
              <div class="cake-arrow a-upper"></div>
              <div class="cake-arrow a-lower"></div>
              <div class="cake-labels l-eco">
                <div class="num">3</div>
                <div class="title">Humans and agents</div>
                <div class="subtitle">collaborate at scale</div>
              </div>
              <div class="cake-labels l-openalex">
                <div class="num">2</div>
                <div class="title">OpenAlex</div>
                <div class="subtitle"><b>gathers,</b> <b>organizes,</b> and <b>shares</b> knowledge graph</div>
              </div>
              <div class="cake-labels l-works">
                <div class="num">1</div>
                <div class="title">Research content</div>
                <div class="subtitle">is published across 250k journals and repositories</div>
              </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== FOUR KEY STATS (after About: the numbers land as
         proof of the claims the prose just made) ===================== -->
    <section class="stats-section">
      <div class="stats-row">
        <div v-for="(s, i) in stats" :key="i" class="stat-card">
          <div class="stat-num">{{ s.num }}</div>
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-sub">{{ s.sub }}</div>
        </div>
      </div>
    </section>

    <!-- ===================== OPENNESS (headline left, copy right, no art) ===================== -->
    <section class="openness-section">
      <div class="openness-grid">
        <h2 class="openness-title"><span class="openness-kicker">Driven by Mission,</span>Open for All</h2>
        <div class="openness-copy">
          <p>
            Ever since our start in an all-night hackathon, we've been obsessed with
            opening access to research. The interlinked scholarly corpus is one of
            humankind's most beautiful and powerful achievements. We built it together,
            as humans, and it shouldn't &ldquo;belong&rdquo; to anyone.
          </p>
          <p>
            That's why all our data is open under the
            <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">CC0 public-domain license</a>,
            and it's why all our code is open. It's why we're a 501(c)(3) nonprofit. And
            it's why we charge for <router-link to="/pricing">premium services</router-link>
            on top of the data&mdash;to make sure we can keep this data open for the long term.
          </p>
        </div>
      </div>
    </section>

    <!-- ===================== HOW TO ACCESS IT (cards) ===================== -->
    <section class="access-section">
      <div class="access-inner">
        <h2 class="section-header">Easy, powerful access</h2>
        <p class="section-intro">
          There's a route in for everyone — from a quick search on the website
          to running your own copy of the entire dataset.
        </p>
        <div class="access-cards">
          <div v-for="(m, i) in accessMethods" :key="i" class="access-card">
            <div class="access-card-head">
              <span class="access-icon mdi" :class="m.icon"></span>
              <h3 class="access-card-title">{{ m.name }}</h3>
            </div>
            <div class="access-card-body">
              <p>{{ m.body }}</p>
            </div>
            <div class="access-card-foot">
              <!-- novice-link = official escape from the global blue-link !important rule -->
              <a class="access-btn novice-link" :href="m.href" target="_blank" rel="noopener">
                {{ m.cta || 'More' }} <span class="mdi mdi-arrow-right"></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== FAQ ===================== -->
    <section class="faq-section">
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

    <!-- floating tooltip for the hero feed (mirrors App.vue TOOLTIP STYLES) -->
    <div class="feed-tip" ref="tipRef"></div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGoTo } from 'vuetify';
import { useHead } from '@unhead/vue';
import { useStore } from 'vuex';
import axios from 'axios';

import SearchBox from '@/components/SearchBox.vue';
import { getTypeIcon } from '@/typeIcons';
import { heroWorks } from '@/heroWorks';
import { urlBase } from '@/apiConfig';

const store = useStore();
const goTo = useGoTo();

useHead({
  title: 'OpenAlex: The open catalog to the global research system',
  titleTemplate: undefined,
});

import layerCake from '@/assets/landing/layer-cake.webp';

function scrollToContent() { goTo('#content'); }

// ---------------------------------------------------------------------------
// Social-proof band — Linear-style: 8 logos, ONE static row, small (Jason
// 2026-08-03, follows linear.app's homepage row). Picked from the #404
// signed-off list; the other 16 sourced assets stay in assets/partner-logos/
// as the bench (provenance: oxjob #404 work/logos/manifest.csv). Grayscale +
// one-ink comes from CSS on .band-logo, so the SVGs keep their native fills —
// but they must be dark-on-transparent (white-fill assets were recolored at
// source; keep any future swap-ins dark).
// ---------------------------------------------------------------------------
// astrazeneca.svg + bayer.svg are recolored ALL-BLACK in assets (brand colors
// grayscaled to mismatched greys next to the black wordmarks — Jason 2026-08-03)
import anthropicLogo from '@/assets/partner-logos/anthropic.svg';
import astrazenecaLogo from '@/assets/partner-logos/astrazeneca.svg';
import stanfordLogo from '@/assets/partner-logos/stanford.svg';
import ibmLogo from '@/assets/partner-logos/ibm.svg';
import sorbonneLogo from '@/assets/partner-logos/sorbonne.svg';
import bayerLogo from '@/assets/partner-logos/bayer.svg';
import cambridgeLogo from '@/assets/partner-logos/cambridge.svg';
const bandLogos = [
  { src: anthropicLogo, alt: 'Anthropic', cls: 'short' },
  { src: astrazenecaLogo, alt: 'AstraZeneca', cls: 'tall' },
  { src: stanfordLogo, alt: 'Stanford University', cls: '' },
  { src: ibmLogo, alt: 'IBM', cls: '' },
  { src: sorbonneLogo, alt: 'Sorbonne University', cls: 'tall centered' },
  { src: bayerLogo, alt: 'Bayer', cls: 'tall centered' },
  { src: cambridgeLogo, alt: 'University of Cambridge', cls: '' },
];

// ---------------------------------------------------------------------------
// Four key stats. works + PDFs go LIVE; connections + API-calls are static.
// ---------------------------------------------------------------------------
const MAILTO = 'mailto=ui@openalex.org';
// "515 million" / "5.8 billion" style
function humanBig(n, approx = false) {
  if (!n) return null;
  const p = approx ? '~' : '';
  if (n >= 1e9) { const x = n / 1e9; return `${p}${x < 10 ? Math.round(x * 10) / 10 : Math.round(x)} billion`; }
  if (n >= 1e6) return `${p}${Math.round(n / 1e6)} million`;
  return p + n.toLocaleString();
}

const worksNum = ref('517 million');   // LIVE; fallback to a recent all-corpus value
const pdfsNum = ref('66 million');     // LIVE; fallback to a recent all-corpus value

// Both stats use the ALL corpus (core + expansion), same scope as the FAQ
// numbers — Jason's R20 ruling: corpus=all scope for every number on the page.
// (#763 shipped 2026-08-12: corpus=all is the first-class REST spelling; the
// legacy include_xpac usages here were swapped per the #681 launch gate.)
// works: all corpus -> ~517M
axios.get(`${urlBase.api}/works?corpus=all&per-page=1&select=id&${MAILTO}`)
  .then(r => { const c = r.data?.meta?.count; if (c) worksNum.value = humanBig(c); })
  .catch(() => {});
// PDFs: works with a downloadable PDF, all corpus -> ~66M
axios.get(`${urlBase.api}/works?filter=has_content.pdf:true&corpus=all&per-page=1&select=id&${MAILTO}`)
  .then(r => { const c = r.data?.meta?.count; if (c) pdfsNum.value = humanBig(c); })
  .catch(() => {});

// card content = Jason's 2026-08-11 wording (R17); works + PDFs numbers stay live
const stats = computed(() => [
  { num: '5.8 billion', label: 'relationships', sub: 'Our graph connects papers to each other and disambiguated authors, orgs, funders, and more.' },
  { num: '1.1 billion', label: 'API calls monthly', sub: 'Thousands of universities, governments, and businesses worldwide rely on our data.' },
  { num: worksNum.value, label: 'work records', sub: 'Rich metadata for papers, books, datasets, theses, preprints, and more, updated daily.' },
  { num: pdfsNum.value, label: 'fulltext PDFs', sub: 'Open-access papers and preprints with license data for each.' },
]);

// ---------------------------------------------------------------------------
// How to access it — 8 methods, one card each. learn-more links deep-link
// into help.openalex.org (R16). Difficulty dots removed R17 (confusing).
// ---------------------------------------------------------------------------
// card copy = Jason's 2026-08-03 wording (light spelling/punctuation polish)
const accessMethods = [
  { name: 'Website', icon: 'mdi-magnify', cta: 'Try', body: 'Search and filter by topic, date, full-text availability, and more, then export what you find.', href: 'https://help.openalex.org/access/website-basic/' },
  { name: 'OQL', icon: 'mdi-code-braces', body: 'Use the OpenAlex Query Language (beta) to build and share complex queries. Great for systematic reviews.', href: 'https://help.openalex.org/access/oql/' },
  { name: 'API', icon: 'mdi-cogs', body: 'Built for builders: fast and well-documented, with a generous free tier and pay-as-you-go after that.', href: 'https://help.openalex.org/api/' },
  { name: 'CLI', icon: 'mdi-console', body: 'Query from your terminal and pipe the results into your own scripts. Agents love using it.', href: 'https://help.openalex.org/access/cli/' },
  { name: 'Agents', icon: 'mdi-robot-outline', body: 'Just say "Use OpenAlex" to your agent and it\'ll handle the rest. Install the CLI for even better results.', href: 'https://help.openalex.org/access/agents/' },
  { name: 'Snapshot', icon: 'mdi-database-outline', body: 'Download our entire dataset for free. Updated quarterly.', href: 'https://help.openalex.org/access/snapshot/' },
  { name: 'Sync', icon: 'mdi-sync', body: 'Keep your database up to date with daily changes, via AWS or API.', href: 'https://help.openalex.org/access/sync/' },
  { name: 'Fulltext', icon: 'mdi-file-pdf-box', body: 'Download 65M full-text PDFs with license info — and get new ones daily.', href: 'https://help.openalex.org/access/fulltext/' },
];

// ---------------------------------------------------------------------------
// FAQ — 3 obligations ruled in (junk/curation-as-query, two-tier fulltext,
// where-data-comes-from) + 2 from the current page's inventory.
// ---------------------------------------------------------------------------
const openFaq = ref(null);
function toggleFaq(index) { openFaq.value = openFaq.value === index ? null : index; }
// answers = Jason's 2026-08-12 copy (R18), light polish + fact-checked numbers.
// FAQ-2 numbers all use the ALL corpus (R20 ruling), matching the stats stripe:
// fulltext 65.7M / abstracts 272.7M / metadata-only 244.1M, each linking to the
// search that shows that count. Re-check counts pre-ship. (#763 launch gate
// cleared 2026-08-12: links use the first-class corpus=all spelling.)
const faqs = [
  {
    question: "What's in OpenAlex?",
    answer: `OpenAlex starts with scholarly <b>works</b> — papers, books, preprints, datasets, and so forth. From there, we map the whole ecosystem around those works: authors, organizations, funders, and all the relationships between them. <a href="https://help.openalex.org/data/" target="_blank" rel="noopener">Learn more about our data</a>.`,
  },
  {
    question: 'Do you have the full text, or just abstracts?',
    answer: `We find and share whatever's legally open for each work. In round numbers, that means open-access full text for <a href="/works?filter=has_content.pdf:true&amp;corpus=all" target="_blank">65 million</a> works, abstracts for <a href="/works?filter=has_abstract:true&amp;corpus=all" target="_blank">275 million</a>, and just metadata for another <a href="/works?filter=has_abstract:false&amp;corpus=all" target="_blank">250 million</a>.`,
  },
  {
    question: 'Where does your data come from?',
    answer: `Where <i>doesn't</i> it come from? We gather data from indexes like Crossref, DataCite, DOAJ, ORCID, and ROR, and we harvest directly from repositories like arXiv, PubMed, and HAL — plus thousands more worldwide. Learn more about <a href="https://help.openalex.org/data/how-its-built/" target="_blank" rel="noopener">how we gather and organize the data</a>.`,
  },
  {
    question: "If it's open, why do you charge money?",
    answer: `The OpenAlex <i>dataset</i> is free; we charge for some <i>services</i> built on that data, so that we can keep the project sustainable. <a href="/pricing">Learn more about pricing</a>.`,
  },
  {
    question: 'How is OpenAlex different from other scholarly databases?',
    answer: `First, OpenAlex is intentionally comprehensive — in fact, with over half a billion work records, we're the most complete scholarly index ever. And second, OpenAlex is fully open data, meaning you can build on it, analyze it, and remix it all you want — and share as you like.`,
  },
];

// ---------------------------------------------------------------------------
// Hero live feed — faithful port of #686 work/prototypes/C3-live-feed.html.
// Scroll mode, direction UP (rows rise; new rows enter at the bottom — Jason
// 2026-08-04, was ↓), speed 0.75x. Imperative DOM (no reactivity in the
// animation loop; acceptance test 4 = search must stay interactive).
//
// Data: a hand-curated ~100-work ID list (`@/heroWorkIds`, #686) is shuffled
// client-side and lazy-fetched a chunk (~2-3 screens) at a time via
// `ids.openalex:` pipe-OR, prefetching the next chunk before the belt drains.
// Zero per-view cost beyond the visible works; no baked snapshot to go stale.
// ---------------------------------------------------------------------------
const portRef = ref(null);
const beltRef = ref(null);
const tipRef = ref(null);
const addedRef = ref(null);
let cleanup = () => {};

// select only what a row needs — NOT author/source works_count (dropped from the
// tooltips, #686), so it's one clean /works call per chunk.
const FEED_SELECT = 'id,display_name,publication_year,type,authorships,primary_location,best_oa_location';
const FEED_CHUNK = 20;   // ~2-3 screens per fetch; well under the ids.openalex OR cap

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const shortId = u => (u || '').split('/').pop();
function shapeWork(w) {
  const pdf = (w.best_oa_location && w.best_oa_location.pdf_url)
    || (w.primary_location && w.primary_location.pdf_url) || null;
  const auths = (w.authorships || []).slice(0, 2)
    .filter(a => a.author && a.author.id && a.author.display_name)
    .map(a => ({ id: shortId(a.author.id), name: a.author.display_name }));
  const s = w.primary_location && w.primary_location.source;
  return {
    type: w.type || 'other',
    title: (w.display_name || '').trim(),
    url: (w.id || '').replace('https://openalex.org/', 'https://openalex.org/works/'),
    pdf,
    authors: auths,
    nauthors: (w.authorships || []).length,
    source: (s && s.id && s.display_name) ? { id: shortId(s.id), name: s.display_name } : null,
    year: w.publication_year || null,
  };
}

// Thumb-on-scale opening: from a fresh shuffle, greedily choose the first HEAD_N
// works so the first screen always shows a pdf/non-pdf mix, a non-Latin-script
// title, a current-year AND a pre-2000 work, and a spread of work types. The rest
// stays randomly shuffled. Uses only the baked sort-key flags in heroWorks. Runs
// every mount, so each page load differs. Returns the ordered id list.
const HEAD_N = 8, OLD_BEFORE = 2000;
function composeOpeningIds(works) {
  const curYear = Math.max(...works.map(w => w.year || 0));
  const pool = shuffled(works), head = [];
  const has = pred => head.some(pred);
  while (head.length < HEAD_N && pool.length) {
    const needNL = !has(w => w.nonlatin);
    const needCur = !has(w => w.year === curYear);
    const needOld = !has(w => w.year && w.year < OLD_BEFORE);
    const pdfs = head.filter(w => w.pdf).length;
    const wantPdf = pdfs <= head.length - pdfs;          // keep pdf ≈ half
    let best = 0, bestScore = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const w = pool[i];
      let s = Math.random();                              // fresh tiebreak each load
      if (needNL && w.nonlatin) s += 100;
      if (needCur && w.year === curYear) s += 100;
      if (needOld && w.year && w.year < OLD_BEFORE) s += 100;
      if (w.pdf === wantPdf) s += 8;
      if (has(h => h.type === w.type)) s -= 15;           // type spread in the opening
      if (s > bestScore) { bestScore = s; best = i; }
    }
    head.push(pool.splice(best, 1)[0]);
  }
  return shuffled(head).concat(pool).map(w => w.id);      // shuffle head so slot order varies
}

onMounted(() => {
  const port = portRef.value, belt = beltRef.value, tip = tipRef.value;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // lazy-loaded record buffer (grows as chunks arrive; cycles once all are in).
  // ids are ordered so the first screen hits the diversity constraints (composeOpeningIds).
  const ids = composeOpeningIds(heroWorks);
  const records = [];
  let fetchCursor = 0, fetching = false, allLoaded = false;
  async function fetchChunk() {
    if (fetching || allLoaded) return;
    fetching = true;
    const batch = ids.slice(fetchCursor, fetchCursor + FEED_CHUNK);
    try {
      const filter = 'ids.openalex:' + batch.join('|');
      const url = `${urlBase.api}/works?filter=${filter}&per-page=${batch.length}&select=${FEED_SELECT}&${MAILTO}`;
      const { data } = await axios.get(url);
      const byId = {};
      (data.results || []).forEach(w => { byId[shortId(w.id)] = w; });
      batch.forEach(id => { const w = byId[id]; if (w && w.display_name) records.push(shapeWork(w)); }); // keep shuffle order
      fetchCursor += FEED_CHUNK;
      if (fetchCursor >= ids.length) allLoaded = true;
    } catch (e) {
      // leave cursor unadvanced; a later prefetch (or the mount retry) tries again
    } finally {
      fetching = false;
    }
  }

  const ADDED_TODAY = 212411; // placeholder until #699 /stats ships
  if (addedRef.value) addedRef.value.textContent = ADDED_TODAY.toLocaleString('en-US');

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const TYPE_DEFS = {
    'article': 'A paper published in a journal or repository, presenting original research.',
    'preprint': 'A paper shared publicly before peer review.',
    'review': 'A paper that surveys and evaluates existing research on a topic.',
    'dataset': 'A collection of research data.',
    'data-paper': 'A paper describing a research dataset.',
    'software': 'Research software or code.',
    'software-paper': 'A paper describing research software.',
    'book': 'A scholarly book or monograph.',
    'book-chapter': 'A chapter from a scholarly book.',
    'book-review': 'A published review of a scholarly book.',
    'reference-entry': 'An entry in an encyclopedia, dictionary, or other reference work.',
    'dissertation': 'A thesis written for a graduate degree.',
    'conference-paper': 'A paper presented at a scholarly conference.',
    'conference-abstract': 'A short summary of a conference presentation.',
    'report': 'A report from an institution, agency, or working group.',
    'standard': 'A formal technical standard or specification.',
    'editorial': "An opinion or commentary piece from a journal's editors.",
    'letter': 'A short letter or communication published in a journal.',
    'peer-review': 'A published peer review of another work.',
    'erratum': 'A published correction to an earlier work.',
    'retraction': 'A notice formally withdrawing a published work.',
    'paratext': 'Publishing material about a venue or work, like covers and mastheads.',
    'supplementary-materials': 'Extra files that support a published work.',
    'libguides': 'A research guide curated by librarians.',
    'other': "A work that doesn't fit any other category.",
  };
  const lastName = n => n.trim().split(/\s+/).pop();
  const srcName = n => n.replace(/\s*\([^)]*\)\s*$/, '');
  const AUTHOR_ICON = 'mdi-account-outline';
  const SOURCE_ICON = 'mdi-book-open-outline';

  // "novice-link" exempts these from the global `.v-application a { color: blue
  // !important }` house rule, so the feed's own colors apply.
  function link(cls, href, text, tipText, inlIcon) {
    const ic = inlIcon ? `<span class="inl mdi ${inlIcon}"></span>` : '';
    return `<a class="novice-link ${cls}" href="${esc(href)}" target="_blank" rel="noopener" data-tip="${esc(tipText)}">${ic}${esc(text)}</a>`;
  }

  let idx = 0;
  function makeItem() {
    if (!records.length) return null;                 // nothing loaded yet
    // stay a few screens ahead: prefetch the next chunk before the belt drains it
    if (!allLoaded && !fetching && idx >= records.length - FEED_CHUNK) fetchChunk();
    const r = records[idx++ % records.length];
    const typeName = r.type.replace(/-/g, ' ');
    const typeTip = `data-tip-title="${esc(typeName[0].toUpperCase() + typeName.slice(1))}" data-tip="${esc(TYPE_DEFS[r.type] || '')}"`;
    const eyebrow = `<span class="eyebrow" ${typeTip}>${esc(typeName)}</span>`;
    const names = r.authors.map(a =>
      link('w w-author', 'https://openalex.org/works?filter=authorships.author.id:' + a.id,
        lastName(a.name), `View all works by ${a.name}`, AUTHOR_ICON));
    const etAl = r.nauthors > r.authors.length;
    const authors = (names.length === 2 && !etAl)
      ? names.join(' and ')
      : names.join(', ') + (etAl ? ', et al.' : '');
    const src = r.source
      ? ` in ${link('w w-source', 'https://openalex.org/works?filter=primary_location.source.id:' + r.source.id,
          srcName(r.source.name), `View all works published in ${srcName(r.source.name)}`, SOURCE_ICON)}`
      : '';
    // no tooltip on the PDF button — the "PDF" label already says what it is (#681)
    const pdf = r.pdf
      ? `<a class="novice-link pdf" href="${esc(r.pdf)}" target="_blank" rel="noopener">PDF</a>`
      : '';
    // lead the byline with the publication year (plain black, not a link) — works
    // span multiple years now that the feed is a curated sample, not "today" (#681)
    const yr = r.year ? `${esc(String(r.year))} ` : '';
    const icon = `<span class="lead mdi ${getTypeIcon(r.type)}" ${typeTip}></span>`;
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `${eyebrow}${icon}<a class="novice-link t" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>${pdf}<span class="by">${yr}by ${authors}${src}</span>`;
    return el;
  }

  // tooltips
  const onOver = e => {
    const a = e.target.closest('[data-tip]');
    if (!a) return;
    if (a.dataset.tipTitle) tip.innerHTML = `<b>${esc(a.dataset.tipTitle)}</b>${esc(a.dataset.tip)}`;
    else tip.textContent = a.dataset.tip;
    const r = a.getBoundingClientRect();
    tip.classList.add('on');
    const w = tip.offsetWidth;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tip.style.top = (r.top - tip.offsetHeight - 7) + 'px';
  };
  const onOut = e => { if (e.target.closest('[data-tip]')) tip.classList.remove('on'); };
  belt.addEventListener('pointerover', onOver);
  belt.addEventListener('pointerout', onOut);

  function makeSlot() {
    const item = makeItem();
    if (!item) return null;                    // buffer not ready yet
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.appendChild(item);
    return slot;
  }

  let rafId = null;
  let paused = false, y = 0, lastT = 0;
  const SCROLL_BASE = 22, speed = 0.75; // px/s at 1x, 0.75x per #686
  const onEnter = () => { paused = true; };
  const onLeave = () => { paused = false; };

  function scrollTick(now) {
    const dt = Math.min(now - lastT, 100) / 1000; lastT = now;
    if (!paused && !document.hidden) {
      y += SCROLL_BASE * speed * dt;   // scroll UP: new rows enter at the bottom
      // keep content below the fold to scroll into
      while (belt.offsetHeight - y < port.offsetHeight + 60) { const s = makeSlot(); if (!s) break; belt.appendChild(s); }
      // drop rows scrolled off the top, compensating y so the rest holds still
      let first;
      while ((first = belt.firstElementChild) && first.offsetHeight <= y - 200) { y -= first.offsetHeight; belt.removeChild(first); }
      belt.style.transform = `translateY(${-y}px)`;
    }
    rafId = requestAnimationFrame(scrollTick);
  }

  let started = false;
  function startFeed() {
    if (started || !records.length) return;
    started = true;
    // initial fill (guarded — the belt is absolutely positioned so its height
    // can't feed back into the port's, but cap iterations defensively anyway)
    let guard = 0;
    while (belt.offsetHeight < port.offsetHeight + 60 && guard++ < 200) {
      const s = makeSlot(); if (!s) break; belt.appendChild(s);
    }
    // reduced motion: a static (non-scrolling) list is the correct behavior.
    if (reduced) return;
    port.addEventListener('pointerenter', onEnter);
    port.addEventListener('pointerleave', onLeave);
    lastT = performance.now();
    rafId = requestAnimationFrame(scrollTick);
  }

  // bootstrap: load the first chunk (retry a few times on a network hiccup), then
  // fill + animate. The feed is secondary to search, so a hard failure just leaves
  // it empty rather than blocking anything.
  (async () => {
    for (let attempt = 0; attempt < 4 && !records.length; attempt++) {
      await fetchChunk();
      if (!records.length) await new Promise(r => setTimeout(r, 1200));
    }
    startFeed();
  })();

  cleanup = () => {
    if (rafId) cancelAnimationFrame(rafId);
    port.removeEventListener('pointerenter', onEnter);
    port.removeEventListener('pointerleave', onLeave);
    belt.removeEventListener('pointerover', onOver);
    belt.removeEventListener('pointerout', onOut);
  };
});

onBeforeUnmount(() => cleanup());

// Reset state on mount (mirrors Home.vue)
store.commit('user/setActiveSearchId', null);
store.state.entityType = 'works';
</script>


<script>
export default { name: 'HomeV2Page' };
</script>


<style lang="scss" scoped>
// #711: force light so Chrome's Auto Dark Mode can't invert the art.
.landing-v2 {
  background: #fff;
  color: #0A0A0A;
  color-scheme: light;
  --ink: #0A0A0A; --muted: #52525B; --faint: #A1A1AA; --hair: #F0F0F2;
  --w-author: #047857; --w-source: #B45309;
}

// ===================== HERO =====================
.hero {
  position: relative;
  min-height: calc(100vh - var(--app-bar-height));
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 88px; // more air between the copy and the feed (Jason 2026-08-03)
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}
.hero > * { min-width: 0; }

.hero-headline {
  font-size: 60px; font-weight: 700; line-height: 1.05;
  letter-spacing: -0.03em; color: var(--ink); margin: 0 0 20px 0;
}
.hero-subhead {
  font-size: 18px; line-height: 1.65; color: var(--muted);
  max-width: 520px; margin: 0 0 40px 0;
}
// ~80% of the former 600px so the box doesn't crowd toward the feed (Jason 2026-08-03)
.hero-search { width: 100%; max-width: 480px; }
// Linear-style chrome on the landing search box (Jason 2026-08-03): tighter 8px
// radius (was 16px — way too round) to match the CTA buttons, subtle 1px border.
// Scoped to the hero so the SERP's SearchBox is unaffected.
.hero-search :deep(.search-box) {
  border-radius: 8px;
  border-color: #333; // darker chrome on the two-deck box (R23, was #E3E3E6)
}

// Ghost button (plain <button>/<a> so the global v-btn house rules don't touch it)
.cta {
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
  // tighter 8px radius = Linear button shape (was 10px), matches the search box
  padding: 10px 24px; border-radius: 8px; line-height: 1;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
// borderless ghost: text-only until hover reveals a soft rounded-rect bg
.cta-secondary {
  background: transparent; color: var(--muted); border: 1.5px solid transparent;
  &:hover { color: var(--ink); background: rgba(0, 0, 0, .05); }
}
// bottom-center of the first screen (R22): Learn more + down chevron
.hero-learnmore {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 2px; z-index: 2;
  .mdi { font-size: 18px; line-height: 1; }
}

// live feed — R22: 15vh of top+bottom padding shrinks the cascade so it no
// longer runs the full viewport (was edge-to-edge; the bottom-center Learn
// more needs the room, and the shorter column reads calmer)
.hero-viz {
  display: flex; flex-direction: column; gap: 0;
  align-self: stretch;
  padding: 15vh 0;
}
.added {
  font-size: 13px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase;
  color: var(--faint); display: grid; grid-template-columns: 18px minmax(0, 1fr);
  column-gap: 8px; align-items: center; padding: 0 2px 12px;
  border-bottom: 1px solid #D4D4D8; position: relative; z-index: 2; background: #fff;
  box-shadow: 0 5px 6px -5px rgba(0,0,0,.10);
}
:deep(.added b) { color: var(--muted); font-variant-numeric: tabular-nums; }
.live-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #43A047;
  justify-self: center; animation: pulse 2s ease-out infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(67,160,71,.5); }
  70% { box-shadow: 0 0 0 8px rgba(67,160,71,0); }
  100% { box-shadow: none; }
}
.feedport {
  // fills the stretched hero-viz below the ADDED TODAY bar (was min(66vh,560px))
  flex: 1; min-height: 0; overflow: hidden; position: relative;
  // fade at BOTH ends (Jason 2026-08-04; 24% in R17, back to 15% in R22 — the
  // port is shorter now and full-ink text needs the room).
  // R19 PERF: was a mask-image on this container — that forced Chrome to
  // re-rasterize the entire masked column on EVERY frame of the belt's
  // translateY (constant high CPU; DevTools unusable). White gradient overlays
  // are visually identical on this white page, but leave the belt free to
  // animate on the compositor with no per-frame paint. Don't reintroduce a
  // mask (or any filter/opacity wrapper) around the moving belt.
  &::before, &::after {
    content: ''; position: absolute; left: 0; right: 0; height: 15%;
    z-index: 1; pointer-events: none;
  }
  &::before { top: 0; background: linear-gradient(180deg, #fff, rgba(255,255,255,0)); }
  &::after { bottom: 0; background: linear-gradient(0deg, #fff, rgba(255,255,255,0)); }
}
// belt MUST be absolutely positioned: the mount fill loop appends rows until
// belt.offsetHeight >= port.offsetHeight + 60, and with the port flex-sized in
// an auto-height column, an in-flow belt's height feeds back into the port's
// size — the loop never terminates and the page hangs blank (R9 postmortem).
// Taking the belt out of flow makes the port's height independent of its rows.
.belt { position: absolute; top: 0; left: 0; width: 100%; will-change: transform; }

// feed row internals (imperative DOM -> :deep)
// R17: everything scaled ~1.2x (Jason: feed felt overwhelming — bigger type,
// fewer rows on screen at once; proportions unchanged)
:deep(.item) {
  display: grid; grid-template-columns: 22px minmax(0, 1fr) 58px; gap: 3px 10px;
  padding: 15px 2px; border-top: 1px solid var(--hair); align-items: start;
}
:deep(.eyebrow) {
  // justify-self:start shrinks the grid item to its text so the tooltip (which
  // centers on the hovered element's box) anchors over the label, not the whole
  // column (Jason 2026-08-04). Without it the box spans col 2 and the tip drifts right.
  grid-column: 2; grid-row: 1; justify-self: start; font-size: 10px; font-weight: 400;
  letter-spacing: .07em; text-transform: uppercase; color: var(--ink);
}
:deep(.lead) { grid-column: 1; grid-row: 2; padding-top: 2px; }
:deep(.lead.mdi) { font-size: 19px; color: var(--ink); line-height: 1; }
:deep(.t) {
  grid-column: 2; grid-row: 2; font-size: 16px; font-weight: 400; line-height: 1.4;
  color: #2563EB; text-decoration: none; // link-blue trial (R23) — was var(--ink)
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
}
:deep(.t:hover) { text-decoration: underline; }
:deep(.pdf) {
  grid-column: 3; grid-row: 2; justify-self: end; font-size: 13px; font-weight: 600;
  color: var(--ink); text-decoration: none; white-space: nowrap;
  border: 1px solid var(--ink); border-radius: 6px; padding: 3px 10px;
}
:deep(.pdf:hover) { background: var(--ink); color: #fff; }
:deep(.by) { grid-column: 2; grid-row: 3; font-size: 14px; line-height: 1.55; color: var(--ink); }
:deep(.w) { font-weight: 600; text-decoration: none; }
:deep(.w:hover) { text-decoration: underline; }
// the global `.v-application span a` house rule is blue !important with
// specificity (0,3,2) and no .novice-link escape — outgun it.
:deep(.by .w-author.novice-link) { color: var(--w-author) !important; }
:deep(.by .w-source.novice-link) { color: var(--w-source) !important; }
:deep(.inl) {
  font-size: 14px; line-height: 1; vertical-align: -0.5px; margin-right: 1px; display: inline-block;
}

// floating tooltip (mirrors App.vue TOOLTIP STYLES)
.feed-tip {
  position: fixed; z-index: 10; background: #fff; color: #1A1A1A;
  border: 1px solid rgba(0,0,0,.15); box-shadow: 0 2px 8px rgba(0,0,0,.08);
  font-size: 12px; line-height: 1.35; padding: 6px 10px; border-radius: 6px;
  max-width: 210px; pointer-events: none; opacity: 0; transform: translateY(3px);
  transition: opacity .12s ease, transform .12s ease;
  &.on { opacity: 1; transform: none; }
}
:deep(.feed-tip b) { display: block; margin-bottom: 1px; }

// ===================== SOCIAL PROOF RIBBON =====================
// padding + top border = Jason's DevTools tuning 2026-08-03 (screenshot)
.logos-section {
  padding: 78px 0 86px; background: #fafafa;
  border-top: 1px solid #F4F4F5; border-bottom: 1px solid #F4F4F5;
  overflow: hidden;
}
// Linear-style single row: 7 small logos, evenly spread, no motion, no header.
// Sizes + full-black treatment (no opacity fade) = Jason's DevTools tuning 2026-08-03.
// flex-end bottom-aligns the imgs = shared baseline for the wordmarks (none of the
// seven has descenders; AstraZeneca's glyph is baseline-locked to its wordmark, so it
// MUST stay on the baseline). `.centered` marks (Sorbonne, Bayer) are symmetric logos
// whose art sits mid-box, so bottom-align floats them high — nudge them down by half the
// tall/default height delta ((42-23)/2 = 9.5px) to optically center them on the text line.
.logo-grid {
  display: flex; align-items: flex-end; justify-content: space-between;
  max-width: 1150px; margin: 0 auto; padding: 0;
}
.band-logo {
  height: 23px; filter: grayscale(1); flex: none;
  &.tall { height: 42px; }
  &.short { height: 16px; }
  &.centered { transform: translateY(9.5px); }  // optical-center on the wordmark baseline
}
@media (max-width: 1200px) {
  .logo-grid { padding: 0 32px; }
}
@media (max-width: 900px) {
  // narrow screens: fall back to a centered wrap
  .logo-grid { flex-wrap: wrap; justify-content: center; column-gap: 40px; row-gap: 24px; }
}
@media (max-width: 700px) {
  .logo-grid { column-gap: 28px; row-gap: 18px; }
  .band-logo {
    height: 18px; &.tall { height: 32px; } &.short { height: 13px; }
    &.centered { transform: translateY(7px); }  // (32-18)/2, scaled for the mobile sizes
  }
}

// ===================== STATS =====================
// R10 (Jason 2026-08-03): borderless white cards ("four short columns", ~2:1
// height:width) on a full-bleed pale-grey stripe with a subtle gradient that
// matches the logos band. Number = extra-heavy Inter, label = normal weight
// for contrast, then a 1–2 sentence description.
// full-bleed stripe: horizontal padding lives on the inner row (so its content
// left-edge matches the non-full-bleed sections — shared section left margin)
.stats-section {
  padding: 96px 0;
  background: linear-gradient(180deg, #FBFBFC 0%, #F7F7F8 100%);
  border-top: 1px solid #F4F4F5; border-bottom: 1px solid #F4F4F5;
}
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px;
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
}
// R12 (Jason 2026-08-03): flat left-aligned columns — no card box/aspect-ratio.
// Big number, label, then a thin rule, then the muted description.
.stat-card { display: flex; flex-direction: column; }
.stat-num {
  font-size: 42px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink);
  line-height: 1.05; font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 19px; font-weight: 400; color: var(--ink);
  line-height: 1.3; margin-top: 6px;
}
// description sits under a hairline rule (Jason's DevTools spec 2026-08-03)
.stat-sub {
  font-size: 14px; line-height: 1.6; color: var(--muted);
  border-top: 1px solid #ddd; padding-top: 10px; margin-top: 7px;
}

// ===================== WHAT IT IS =====================
.whatis-section { padding: 80px 24px 100px; max-width: 1200px; margin: 0 auto; }
// three columns: text / graphic / labels (Jason 2026-08-03 — the old 2-col layout
// crammed art + labels into one column). Graphic + label columns size to their
// zoomed content; text takes the rest.
// zero gap + top alignment (Jason 2026-08-03: "smushed together pretty tightly")
.whatis-grid {
  display: grid; grid-template-columns: 1fr auto auto; gap: 0; align-items: start;
}
.whatis-title {
  font-size: 50px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
  margin: 0 0 24px 0; line-height: 1.1;
}
.whatis-copy p {
  font-size: 17px; line-height: 1.7; color: var(--muted); margin: 0 0 20px 0;
  &:last-child { margin-bottom: 0; }
  a { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
}
// ghost CTA under the story grafs (R22) — house ghost style; negative left
// margin keeps the label's left edge on the text column's edge at rest
.whatis-cta {
  display: inline-flex; align-items: center; gap: 6px; margin: 24px 0 0 -16px;
  font-size: 15px; font-weight: 600; line-height: 1;
  color: var(--muted); text-decoration: none;
  padding: 10px 16px; border-radius: 8px;
  transition: background .12s ease, color .12s ease;
  .mdi { font-size: 16px; line-height: 1; }
  &:hover { color: var(--ink); background: rgba(0, 0, 0, .05); }
}

// #711 graphic — art is tightly cropped (907x1378, no bleed); annot geometry is
// px-tuned 1:1 to the cropped art's pixels. Overall size = --cake-scale alone.
.whatis-graphic, .whatis-labels { display: flex; justify-content: center; }
// Art at 85% (907 → 770); rows are EQUAL thirds (alignment-to-layers convention
// dropped — the numbers + colors carry the correspondence). `zoom` (unlike
// transform:scale) shrinks the LAYOUT box too, so the auto grid columns size to
// the scaled footprint; art + annot share --cake-scale and equal pre-zoom
// heights (1170px), keeping their rows aligned across the two columns.
.cake-art { width: 770px; zoom: var(--cake-scale, 0.4); }
.cake-art img { display: block; width: 100%; height: auto; }
.cake-annot {
  display: grid; position: relative;
  grid-template-rows: repeat(3, 1fr);
  // height = art display height (1378 × 770/907) — must match .cake-art so the
  // sibling columns' rows stay aligned
  height: 1170px;
  // no fixed width (Jason 2026-08-03): the auto column sizes to the longest
  // label line, so subtitles run unwrapped like the mock
  // padding-left = the number column; kept at 124 (arrows anchor to this text
  // edge via their Jason-tuned left:124) — circles sit inside it with a 28px gap
  row-gap: 12px; padding-left: 124px;
  zoom: var(--cake-scale, 0.4);
  font-family: Inter, -apple-system, sans-serif;
}
.cake-labels {
  align-self: center; display: flex; flex-direction: column; position: relative;
  // NOTE: .cake-annot is zoom-scaled (0.4 desktop), so displayed size
  // = these values × --cake-scale. 60px here ≈ 24px on screen.
  .title { font-size: 60px; font-weight: 700; letter-spacing: -.015em; line-height: 1.15; }
  .subtitle { font-size: 38px; font-weight: 400; line-height: 1.3; margin-top: 8px; }
  // number circle hangs in the left column, centered on the title's first line
  // (numbered-list hanging indent): (69px line-height − 80px circle) / 2 ≈ −6px;
  // left keeps a 28px gap to the text (annot padding-left stays 124 — the
  // arrows' Jason-tuned left:124 anchors to that text edge)
  .num {
    position: absolute; left: -108px; top: -6px;
    width: 80px; height: 80px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-size: 43px; font-weight: 700;
  }
}
.cake-labels.l-eco { grid-row: 1; color: #6E9446; .num { background: #6E9446; } }
.cake-labels.l-openalex { grid-row: 2; color: #745233; .num { background: #745233; } }
.cake-labels.l-works { grid-row: 3; color: #64645E; .num { background: #64645E; } }
// up-arrows between the circles (bottom-to-top reading cue): super-light-grey
// BLOCK arrows sitting BEHIND the labels (z-index), left edge flush with the
// circles' left edge (not past it); tops/heights are px-tuned to the rendered
// circle positions — re-measure if labels rewrap.
.cake-arrow {
  // left 124 (Jason-tuned in DevTools) starts the shaft at the text edge; the
  // 280px head spans from the circles' midline rightward
  position: absolute; left: 124px; width: 150px; background: #EFEFED; z-index: 0;
  // arrowhead: 280w × 80h shallow triangle overlapping the shaft top by 10px
  &::before {
    content: ''; position: absolute; top: -70px; left: 50%; transform: translateX(-50%);
    border-left: 140px solid transparent; border-right: 140px solid transparent;
    border-bottom: 80px solid #EFEFED;
  }
}
.cake-labels { z-index: 1; }
.cake-arrow.a-upper { top: 369px; height: 104px; }
.cake-arrow.a-lower { top: 753px; height: 80px; }

// ===================== OPENNESS =====================
// max-width 1200 (was 1100) so its content left-edge matches every other section
.openness-section { padding: 80px 24px; max-width: 1200px; margin: 0 auto; }
.openness-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start;
}
.openness-title {
  font-size: 50px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
  margin: 0; line-height: 1.1;
}
// first line: black but LIGHT (300) to set it off from the 700 second line
// (R22, was muted grey); own block + 30px breathing room below (was cramped)
.openness-kicker {
  color: var(--ink); font-weight: 300; display: block; margin-bottom: 15px;
}
.openness-copy p {
  font-size: 17px; line-height: 1.7; color: var(--muted); margin: 0 0 20px 0;
  &:last-child { margin-bottom: 0; }
  a { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
}

// ===================== SHARED SECTION HEADER =====================
// consistent across sections (R10): same size/weight as the intro's
// "A new kind of library" title, always left-aligned
.section-header {
  font-size: 50px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
  text-align: left; margin: 0 0 40px 0; line-height: 1.1;
}
.section-intro {
  font-size: 17px; line-height: 1.7; color: var(--muted);
  max-width: 640px; margin: -28px 0 40px 0;
}

// ===================== HOW TO ACCESS =====================
// R10: white Linear-style cards (tight radius, subtle hairline border) on a
// full-bleed pale-grey stripe matching the logos band, with a subtle gradient
.access-section {
  padding: 80px 0;
  background: linear-gradient(180deg, #FBFBFC 0%, #F7F7F8 100%);
  border-top: 1px solid #F4F4F5; border-bottom: 1px solid #F4F4F5;
}
// max-width 1200 + own side padding so its content aligns with the other sections
.access-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.access-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.access-card {
  position: relative; background: #fff; border: 1px solid #ECECEE;
  border-radius: 8px; padding: 0;
  display: flex; flex-direction: column;
  transition: border-color .12s ease, box-shadow .12s ease;
  &:hover { border-color: #E0E0E3; box-shadow: 0 1px 3px rgba(0,0,0,.04); }
}
// header / body / footer each own their y-padding so they read as distinct
// card regions (R10: no more one-size card padding)
.access-card-head {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 16px 12px;
}
.access-icon { font-size: 18px; line-height: 1; color: var(--ink); }
.access-card-title { font-size: 15px; font-weight: 600; color: var(--ink); margin: 0; }
.access-card-body {
  padding: 0 16px; flex: 1; display: flex; flex-direction: column;
  p { font-size: 13.5px; line-height: 1.6; color: var(--muted); margin: 0; }
}
.access-card-foot {
  display: flex; justify-content: flex-end;
  padding: 12px 8px 8px 16px;
}
// Linear-style ghost button: black text, borderless, soft rounded hover bg
.access-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 13.5px; font-weight: 600; color: var(--ink); text-decoration: none;
  border-radius: 6px; padding: 5px 10px;
  transition: background .12s ease;
  .mdi { font-size: 14px; line-height: 1; }
  &:hover { background: rgba(0, 0, 0, .05); text-decoration: none; }
}

// ===================== FAQ =====================
// full main-column width (matches stats/access sections)
.faq-section { padding: 80px 24px 120px; max-width: 1200px; margin: 0 auto; }
.faq-item {
  border-bottom: 1px solid #E4E4E7;
  &:last-child { border-bottom: none; }
}
.faq-question {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 24px 0; background: none; border: none; cursor: pointer; text-align: left;
  font-size: 16px; font-weight: 500; color: var(--ink); font-family: inherit;
  &:hover { color: #000; }
  &:focus { outline: none; }
}
.faq-icon { color: var(--faint); flex-shrink: 0; margin-left: 16px; }
.faq-answer {
  padding-bottom: 24px;
  p { margin: 0; font-size: 15px; line-height: 1.7; color: var(--muted); }
  :deep(a) { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
}

// ===================== RESPONSIVE =====================
@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; padding-top: 80px; gap: 32px; }
  .hero-viz { display: none; } // feed is decorative; keep search above the fold
  .hero-headline { font-size: 42px; }
  .whatis-title, .openness-title, .section-header { font-size: 38px; }
  .whatis-grid { grid-template-columns: 1fr; gap: 40px; }
  .whatis-graphic, .whatis-labels { --cake-scale: 0.32; }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 40px 24px; }
  .openness-grid { grid-template-columns: 1fr; gap: 24px; }
  .access-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .hero { padding: 80px 20px 0; }
  .hero-headline { font-size: 34px; }
  .whatis-title, .openness-title, .section-header { font-size: 30px; }
  .faq-section, .whatis-section, .openness-section { padding-left: 20px; padding-right: 20px; }
  .stats-row, .access-inner { padding-left: 20px; padding-right: 20px; }
  .stat-num { font-size: 32px; }
  .stat-label { font-size: 20px; }
  .access-cards { grid-template-columns: 1fr; }
}
</style>
