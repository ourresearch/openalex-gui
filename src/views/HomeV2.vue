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
               placeholder-override: fixed copy, no count (avoids the xpac-count confusion) -->
          <search-box v-if="oqlFlag" ref="searchBoxRef" single-row autofocus hide-submit
                      placeholder-override="Search papers, datasets, and more" />
          <search-box v-else ref="searchBoxRef" show-examples autofocus hide-submit
                      placeholder-override="Search papers, datasets, and more" />
        </div>

        <!-- primary Search + secondary Learn more CTAs; plain <button>s dodge the
             global v-btn / .v-icon house rules. Search runs the box's submit()
             (empty = show all works, same as the old magnifier). -->
        <div class="hero-cta">
          <button class="cta cta-primary" @click="runSearch">Search</button>
          <button class="cta cta-secondary" @click="scrollToContent">Learn more</button>
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
        <h2 class="openness-title">Open for everyone</h2>
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
              <span class="difficulty-dots" :class="'level-' + m.level">
                <v-tooltip activator="parent" location="top" content-class="linear-tooltip">Difficulty: {{ LEVEL_NAMES[m.level] }}</v-tooltip>
                <span v-for="d in 3" :key="d" class="dot" :class="{ filled: d <= LEVEL_FILL[m.level] }"></span>
              </span>
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
import { feedRecords } from '@/landingFeedData';
import { urlBase } from '@/apiConfig';

const store = useStore();
const goTo = useGoTo();

// #598: flag-on landing renders the Basic-mode single-row bar.
const oqlFlag = computed(() => !!store.getters.featureFlags['oql']);

useHead({
  title: 'OpenAlex: The open catalog to the global research system',
  titleTemplate: undefined,
});

import layerCake from '@/assets/landing/layer-cake.webp';

function scrollToContent() { goTo('#content'); }

// Search CTA — drives the SearchBox's exposed submit() (empty input shows all
// works, same as the removed in-box magnifier).
const searchBoxRef = ref(null);
function runSearch() { searchBoxRef.value?.submit(); }

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
  { src: sorbonneLogo, alt: 'Sorbonne University', cls: '' },
  { src: bayerLogo, alt: 'Bayer', cls: 'tall' },
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

const worksNum = ref('515 million');   // LIVE; fallback to a recent value
const pdfsNum = ref('49 million');     // LIVE; fallback to a recent value

// works: xpac-inclusive count (all works, not just core) -> ~515M
axios.get(`${urlBase.api}/works?filter=is_xpac:true|false&per-page=1&select=id&${MAILTO}`)
  .then(r => { const c = r.data?.meta?.count; if (c) worksNum.value = humanBig(c); })
  .catch(() => {});
// PDFs: works with a downloadable PDF -> ~49M
axios.get(`${urlBase.api}/works?filter=has_content.pdf:true&per-page=1&select=id&${MAILTO}`)
  .then(r => { const c = r.data?.meta?.count; if (c) pdfsNum.value = humanBig(c); })
  .catch(() => {});

// card content = Jason's 2026-08-03 wording (R10); works + PDFs numbers stay live
const stats = computed(() => [
  { num: '5.8 billion', label: 'relationships', sub: 'Our graph connects papers to disambiguated authors, institutions, funders, and (via citation) one another.' },
  { num: '1.1 billion', label: 'API calls monthly', sub: 'Thousands of universities, governments, and businesses count on our data.' },
  { num: worksNum.value, label: 'work records', sub: 'Rich metadata for papers, books, datasets, theses, preprints, and even software — updated daily.' },
  { num: pdfsNum.value, label: 'fulltext PDFs', sub: 'Download full text of open-access papers and preprints, all with license information.' },
]);

// ---------------------------------------------------------------------------
// How to access it — 8 methods, one card each. learn-more links ->
// help.openalex.org (#354 ships first; trust it). OQL card carries a Beta badge.
// ---------------------------------------------------------------------------
const LEVEL_NAMES = { easy: 'Easy', med: 'Medium', hard: 'Hard' };
const LEVEL_FILL = { easy: 1, med: 2, hard: 3 };
// card copy = Jason's 2026-08-03 wording (light spelling/punctuation polish)
const accessMethods = [
  { name: 'Website', icon: 'mdi-magnify', level: 'easy', cta: 'Try', body: 'Search and filter by topic, date, full-text availability, and more, then export what you find.', href: 'https://help.openalex.org/' },
  { name: 'OQL', icon: 'mdi-code-braces', level: 'med', body: 'Use the OpenAlex Query Language (beta) to build and share complex queries. Great for systematic reviews.', href: 'https://help.openalex.org/' },
  { name: 'API', icon: 'mdi-cogs', level: 'med', body: 'Built for builders: fast and well-documented, with a generous free tier and pay-as-you-go after that.', href: 'https://developers.openalex.org/' },
  { name: 'CLI', icon: 'mdi-console', level: 'med', body: 'Query from your terminal and pipe the results into your own scripts. Agents love using it.', href: 'https://developers.openalex.org/' },
  { name: 'Agents', icon: 'mdi-robot-outline', level: 'easy', body: 'Just say "Use OpenAlex" to your agent and it\'ll handle the rest. Install the CLI for even better results.', href: 'https://developers.openalex.org/' },
  { name: 'Snapshot', icon: 'mdi-database-outline', level: 'hard', body: 'Download our entire dataset for free. Updated quarterly.', href: 'https://developers.openalex.org/download-all-data/openalex-snapshot' },
  { name: 'Sync', icon: 'mdi-sync', level: 'hard', body: 'Keep your database up to date with daily changes, via AWS or API.', href: 'https://developers.openalex.org/download-all-data/openalex-snapshot' },
  { name: 'Fulltext', icon: 'mdi-file-pdf-box', level: 'hard', body: 'Download 50M full-text PDFs with license info — and get new ones daily.', href: 'https://developers.openalex.org/' },
];

// ---------------------------------------------------------------------------
// FAQ — 3 obligations ruled in (junk/curation-as-query, two-tier fulltext,
// where-data-comes-from) + 2 from the current page's inventory.
// ---------------------------------------------------------------------------
const openFaq = ref(null);
function toggleFaq(index) { openFaq.value = openFaq.value === index ? null : index; }
// answers are PLACEHOLDER lorem ipsum (Jason 2026-08-03: dropping the old copy, will
// rewrite from scratch later; lengths kept close to the intended final answers).
const faqs = [
  {
    question: "What's in OpenAlex?",
    answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur, excepteur sint occaecat cupidatat non proident sunt in culpa.`,
  },
  {
    question: 'Do you have the full text, or just abstracts?',
    answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.`,
  },
  {
    question: 'Where does your data come from?',
    answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat quis.`,
  },
  {
    question: "If it's open, why do you charge money?",
    answer: `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa. Quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo, nemo enim ipsam voluptatem.`,
  },
  {
    question: 'How is OpenAlex different from Scopus or Google Scholar?',
    answer: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.`,
  },
];

// ---------------------------------------------------------------------------
// Hero live feed — faithful port of #686 work/prototypes/C3-live-feed.html.
// Scroll mode, direction down, speed 0.75x. Imperative DOM (no reactivity in
// the animation loop; acceptance test 4 = search must stay interactive).
// ---------------------------------------------------------------------------
const portRef = ref(null);
const beltRef = ref(null);
const tipRef = ref(null);
const addedRef = ref(null);
let cleanup = () => {};

onMounted(() => {
  const port = portRef.value, belt = beltRef.value, tip = tipRef.value;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const recs = feedRecords;

  const ADDED_TODAY = 212411; // placeholder until #699 /stats ships
  if (addedRef.value) addedRef.value.textContent = ADDED_TODAY.toLocaleString('en-US');

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const fmt = n => {
    const u = [[1e9, 'B'], [1e6, 'M'], [1e3, 'K']].find(([d]) => n >= d);
    if (!u) return String(n);
    const x = n / u[0];
    return (x < 10 ? x.toFixed(1).replace(/\.0$/, '') : Math.round(x)) + u[1];
  };
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
    const r = recs[idx++ % recs.length];
    const typeName = r.type.replace(/-/g, ' ');
    const typeTip = `data-tip-title="${esc(typeName[0].toUpperCase() + typeName.slice(1))}" data-tip="${esc(TYPE_DEFS[r.type] || '')}"`;
    const eyebrow = `<span class="eyebrow" ${typeTip}>${esc(typeName)}</span>`;
    const names = r.authors.map(a =>
      link('w w-author', 'https://openalex.org/works?filter=authorships.author.id:' + a.id,
        lastName(a.name), a.count ? `View all ${fmt(a.count)} works by ${a.name}` : `View all works by ${a.name}`, AUTHOR_ICON));
    const etAl = r.nauthors > r.authors.length;
    const authors = (names.length === 2 && !etAl)
      ? names.join(' and ')
      : names.join(', ') + (etAl ? ', et al.' : '');
    const src = r.source
      ? ` in ${link('w w-source', 'https://openalex.org/works?filter=primary_location.source.id:' + r.source.id,
          srcName(r.source.name), r.source.count ? `View all ${fmt(r.source.count)} works published in ${srcName(r.source.name)}` : `View all works published in ${srcName(r.source.name)}`, SOURCE_ICON)}`
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
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.appendChild(makeItem());
    return slot;
  }

  // initial fill
  while (belt.offsetHeight < port.offsetHeight + 60) belt.appendChild(makeSlot());

  // reduced motion: a static (non-scrolling) list is the correct behavior.
  if (reduced) {
    cleanup = () => { belt.removeEventListener('pointerover', onOver); belt.removeEventListener('pointerout', onOut); };
    return;
  }

  let paused = false, y = 0, lastT = 0, rafId = null;
  const SCROLL_BASE = 22, speed = 0.75; // px/s at 1x, 0.75x per #686
  const onEnter = () => { paused = true; };
  const onLeave = () => { paused = false; };
  port.addEventListener('pointerenter', onEnter);
  port.addEventListener('pointerleave', onLeave);

  function scrollTick(now) {
    const dt = Math.min(now - lastT, 100) / 1000; lastT = now;
    if (!paused && !document.hidden) {
      y -= SCROLL_BASE * speed * dt;
      while (y < 60) { const s = makeSlot(); belt.prepend(s); y += s.offsetHeight; }
      while (belt.offsetHeight - y > port.offsetHeight + 200) belt.removeChild(belt.lastElementChild);
      belt.style.transform = `translateY(${-y}px)`;
    }
    rafId = requestAnimationFrame(scrollTick);
  }
  lastT = performance.now();
  rafId = requestAnimationFrame(scrollTick);

  cleanup = () => {
    cancelAnimationFrame(rafId);
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
  border-color: #E3E3E6;
}

// Primary "Search" + secondary "Learn more" CTAs under the box. Plain <button>s
// so the global v-btn house rules don't touch them.
.hero-cta {
  display: flex; align-items: center; gap: 12px; margin-top: 20px;
}
.cta {
  font: inherit; font-size: 15px; font-weight: 600; cursor: pointer;
  // tighter 8px radius = Linear button shape (was 10px), matches the search box
  padding: 10px 24px; border-radius: 8px; line-height: 1;
  transition: background .12s ease, border-color .12s ease, color .12s ease;
}
.cta-primary {
  background: var(--ink); color: #fff; border: 1.5px solid var(--ink);
  &:hover { background: #000; }
}
// borderless ghost so it doesn't compete with the search box + primary button
// (Jason 2026-08-03): text-only until hover reveals a soft rounded-rect bg
.cta-secondary {
  background: transparent; color: var(--muted); border: 1.5px solid transparent;
  &:hover { color: var(--ink); background: rgba(0, 0, 0, .05); }
}

// live feed — full above-the-fold height (Jason 2026-08-03): stretch to the
// hero's viewport-height row instead of centering at a capped height
.hero-viz {
  display: flex; flex-direction: column; gap: 0;
  // no top padding (Jason 2026-08-03): the cascade should read as coming straight
  // from the very top of the viewport
  align-self: stretch;
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
  -webkit-mask-image: linear-gradient(180deg, #000 0, #000 86%, transparent);
          mask-image: linear-gradient(180deg, #000 0, #000 86%, transparent);
}
// belt MUST be absolutely positioned: the mount fill loop appends rows until
// belt.offsetHeight >= port.offsetHeight + 60, and with the port flex-sized in
// an auto-height column, an in-flow belt's height feeds back into the port's
// size — the loop never terminates and the page hangs blank (R9 postmortem).
// Taking the belt out of flow makes the port's height independent of its rows.
.belt { position: absolute; top: 0; left: 0; width: 100%; }

// feed row internals (imperative DOM -> :deep)
:deep(.item) {
  display: grid; grid-template-columns: 18px minmax(0, 1fr) 48px; gap: 2px 8px;
  padding: 12px 2px; border-top: 1px solid var(--hair); align-items: start;
}
:deep(.eyebrow) {
  grid-column: 2; grid-row: 1; font-size: 8px; font-weight: 400;
  letter-spacing: .07em; text-transform: uppercase; color: var(--ink);
}
:deep(.lead) { grid-column: 1; grid-row: 2; padding-top: 2px; }
:deep(.lead.mdi) { font-size: 16px; color: var(--ink); line-height: 1; }
:deep(.t) {
  grid-column: 2; grid-row: 2; font-size: 14.5px; font-weight: 550; line-height: 1.4;
  color: var(--ink); text-decoration: none;
  display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden;
}
:deep(.t:hover) { text-decoration: underline; }
:deep(.pdf) {
  grid-column: 3; grid-row: 2; justify-self: end; font-size: 11px; font-weight: 600;
  color: var(--ink); text-decoration: none; white-space: nowrap;
  border: 1px solid var(--ink); border-radius: 6px; padding: 2px 8px;
}
:deep(.pdf:hover) { background: var(--ink); color: #fff; }
:deep(.by) { grid-column: 2; grid-row: 3; font-size: 13px; line-height: 1.55; color: var(--ink); }
:deep(.w) { font-weight: 600; text-decoration: none; }
:deep(.w:hover) { text-decoration: underline; }
// the global `.v-application span a` house rule is blue !important with
// specificity (0,3,2) and no .novice-link escape — outgun it.
:deep(.by .w-author.novice-link) { color: var(--w-author) !important; }
:deep(.by .w-source.novice-link) { color: var(--w-source) !important; }
:deep(.inl) {
  font-size: 13px; line-height: 1; vertical-align: -0.5px; margin-right: 1px; display: inline-block;
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
// seven has descenders; Bayer/Cambridge marks sit on the same line).
.logo-grid {
  display: flex; align-items: flex-end; justify-content: space-between;
  max-width: 1150px; margin: 0 auto; padding: 0;
}
.band-logo {
  height: 23px; filter: grayscale(1); flex: none;
  &.tall { height: 42px; }
  &.short { height: 16px; }
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
  .band-logo { height: 18px; &.tall { height: 32px; } &.short { height: 13px; } }
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
// difficulty dots: 1/2/3 filled = easy/med/hard; unfilled grey; house tooltip
.difficulty-dots {
  margin-left: auto; flex: none; display: inline-flex; gap: 4px; align-items: center;
  cursor: default;
}
.dot { width: 6px; height: 6px; border-radius: 50%; background: #E0E0E3; }
.level-easy .dot.filled { background: #14A056; }
.level-med  .dot.filled { background: #D9A514; }
.level-hard .dot.filled { background: #D14E42; }
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
