<template>
  <div class="landing-v2">

    <!-- ===================== HERO (#686) ===================== -->
    <section class="hero">
      <div class="hero-copy">
        <!-- ⚠️ headline is the approved PLACEHOLDER (#686); Jason revisits it on the
             assembled page. Don't reopen before assembly. -->
        <h1 class="hero-headline">Unlock the world's research</h1>
        <p class="hero-subhead">
          Inspired by the Library of Alexandria, we index half a billion scholarly
          works and make them easy to search, analyze, and&nbsp;reuse.
        </p>
        <div class="hero-search">
          <search-box v-if="oqlFlag" single-row autofocus />
          <search-box v-else show-examples autofocus />
        </div>
      </div>

      <!-- live feed: rows are built imperatively in onMounted (faithful port of the
           #686 C3 prototype — prototype wins ties). -->
      <div class="hero-viz">
        <div class="added">
          <span class="live-dot"></span>
          <span><b ref="addedRef">…</b> works added today</span>
        </div>
        <div class="feedport" ref="portRef"><div class="belt" ref="beltRef"></div></div>
      </div>

      <!-- plain <button>: dodges the global text-variant v-btn + .v-icon house rules -->
      <button class="scroll-indicator" @click="scrollToContent">
        Learn more <span class="mdi mdi-chevron-down"></span>
      </button>
    </section>

    <!-- ===================== SOCIAL PROOF (#404 band, static grid per Jason 2026-08-03) ===================== -->
    <section id="content" class="logos-section">
      <p class="logos-label">Powering research at</p>
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
            gathers, organizes, and shares all kinds of research content so others
            can build on it. We're a new kind of library for a new kind of research:
            we're the soil for the scholarly ecosystem.
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
        <div v-for="(s, i) in stats" :key="i" class="stat">
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
            We do it all in the open. Our data is free for anyone to use under a
            <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">CC0 public-domain license</a>,
            our code is open source, and we're a nonprofit — so our only obligation
            is to the mission, not to shareholders. We keep the lights on by selling
            <router-link to="/pricing">premium services</router-link> to the
            organizations that can afford them, which keeps the open foundation free
            for everyone else.
          </p>
        </div>
      </div>
    </section>

    <!-- ===================== HOW TO ACCESS IT (cards) ===================== -->
    <section class="access-section">
      <h2 class="section-header">How to access it</h2>
      <div class="access-cards">
        <div v-for="(m, i) in accessMethods" :key="i" class="access-card">
          <div class="access-card-head">
            <span class="access-icon mdi" :class="m.icon"></span>
            <h3 class="access-card-title">{{ m.name }}</h3>
            <span class="access-chip" :class="'chip-' + m.level">{{ LEVEL_NAMES[m.level] }}</span>
          </div>
          <span v-if="m.beta" class="beta-badge">Beta</span>
          <p class="access-card-body">{{ m.body }}</p>
          <a class="access-learn" :href="m.href" target="_blank" rel="noopener">
            {{ m.cta || 'Learn more' }} <span class="mdi mdi-arrow-right"></span>
          </a>
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

// ---------------------------------------------------------------------------
// Social-proof band — Linear-style: 8 logos, ONE static row, small (Jason
// 2026-08-03, follows linear.app's homepage row). Picked from the #404
// signed-off list; the other 16 sourced assets stay in assets/partner-logos/
// as the bench (provenance: oxjob #404 work/logos/manifest.csv). Grayscale +
// one-ink comes from CSS on .band-logo, so the SVGs keep their native fills —
// but they must be dark-on-transparent (white-fill assets were recolored at
// source; keep any future swap-ins dark).
// ---------------------------------------------------------------------------
import anthropicLogo from '@/assets/partner-logos/anthropic.svg';
import astrazenecaLogo from '@/assets/partner-logos/astrazeneca.svg';
import yaleLogo from '@/assets/partner-logos/yale.svg';
import exaLogo from '@/assets/partner-logos/exa.svg';
import stanfordLogo from '@/assets/partner-logos/stanford.svg';
import samsungLogo from '@/assets/partner-logos/samsung.svg';
import bayerLogo from '@/assets/partner-logos/bayer.svg';
import cambridgeLogo from '@/assets/partner-logos/cambridge.svg';
const bandLogos = [
  { src: anthropicLogo, alt: 'Anthropic', cls: 'short' },
  { src: astrazenecaLogo, alt: 'AstraZeneca', cls: '' },
  { src: yaleLogo, alt: 'Yale University', cls: '' },
  { src: exaLogo, alt: 'Exa', cls: '' },
  { src: stanfordLogo, alt: 'Stanford University', cls: '' },
  { src: samsungLogo, alt: 'Samsung', cls: 'short' },
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

// descending order (Jason 2026-08-02)
const stats = computed(() => [
  { num: '5.8 billion', label: 'connections', sub: 'citations, authorships, and more' },
  { num: '1.1 billion', label: 'API calls', sub: 'served monthly' },
  { num: worksNum.value, label: 'scholarly works', sub: 'papers, datasets, and more' },
  { num: pdfsNum.value, label: 'fulltext PDFs', sub: 'ready for download' },
]);

// ---------------------------------------------------------------------------
// How to access it — 8 methods, one card each. learn-more links ->
// help.openalex.org (#354 ships first; trust it). OQL card carries a Beta badge.
// ---------------------------------------------------------------------------
const LEVEL_NAMES = { easy: 'Easy', med: 'Medium', hard: 'Hard' };
const accessMethods = [
  { name: 'Website', icon: 'mdi-magnify', level: 'easy', cta: 'Try it', body: 'Search and browse half a billion works right here — no code, no login. Filter by author, institution, topic, funder, and more, then export what you find.', href: 'https://help.openalex.org/' },
  { name: 'OQL', icon: 'mdi-code-braces', level: 'med', beta: true, body: 'Use the OpenAlex Query Language (beta) to build and share complex queries. Great for systematic reviews.', href: 'https://help.openalex.org/' },
  { name: 'API', icon: 'mdi-api', level: 'med', body: 'A fast, thoroughly documented REST API built for automation. High throughput, transparent pricing, no lock-in — the same API that serves over a billion calls a month.', href: 'https://developers.openalex.org/' },
  { name: 'CLI', icon: 'mdi-console', level: 'med', body: 'Query OpenAlex straight from your terminal and pipe the results into your own scripts and data pipelines.', href: 'https://developers.openalex.org/' },
  { name: 'Agents', icon: 'mdi-robot-outline', level: 'easy', body: 'OpenAlex is built for AI. Point your agents at our API and let them read across the whole literature — structured, connected, and machine-ready.', href: 'https://developers.openalex.org/' },
  { name: 'Snapshot', icon: 'mdi-database-outline', level: 'hard', body: 'Download the entire dataset — every work, author, source, and institution — as a free snapshot, and host your own copy.', href: 'https://developers.openalex.org/download-all-data/openalex-snapshot' },
  { name: 'Sync', icon: 'mdi-sync', level: 'hard', body: 'Keep your local copy current with daily change files, so it never falls behind the live index.', href: 'https://developers.openalex.org/download-all-data/openalex-snapshot' },
  { name: 'Fulltext', icon: 'mdi-file-pdf-box', level: 'hard', body: 'Download full-text PDFs for tens of millions of open-access works — cached, deduplicated, and ready to process.', href: 'https://developers.openalex.org/' },
];

// ---------------------------------------------------------------------------
// FAQ — 3 obligations ruled in (junk/curation-as-query, two-tier fulltext,
// where-data-comes-from) + 2 from the current page's inventory.
// ---------------------------------------------------------------------------
const openFaq = ref(null);
function toggleFaq(index) { openFaq.value = openFaq.value === index ? null : index; }
const faqs = [
  {
    question: "What's in OpenAlex?",
    answer: `OpenAlex indexes everything — not just a hand-picked "prestige" subset. That kind of selectivity was always a coping mechanism for scarce human attention; in the AI age, you no longer have to decide what's worth indexing up front. Instead, curation becomes a query: filter by peer-review status, citations, topic, source, or your own criteria at the moment you search, and get exactly the slice you want.`,
  },
  {
    question: 'Do you have the full text, or just abstracts?',
    answer: `For every open-access work, we index the full text — so you can search and analyze what papers actually say, not just their titles and abstracts. Where the full text isn't openly available, we still provide complete metadata: authors, affiliations, citations, topics, and more. You get full-text depth where it's open, and comprehensive coverage everywhere else.`,
  },
  {
    question: 'Where does your data come from?',
    answer: `We gather metadata from hundreds of sources — including Crossref, ORCID, PubMed, arXiv, DataCite, ROR, and the world's institutional repositories — then disambiguate, deduplicate, and connect it into one clean, unified dataset. Everything updates daily.`,
  },
  {
    question: "If it's open, why do you charge money?",
    answer: `Yes. The full dataset and API are free for everyone, forever, under a CC0 public-domain license. We offer premium tiers — higher rate limits, dedicated support, custom curation — for organizations that need them, and that revenue keeps the free tier free.`,
  },
  {
    question: 'How is OpenAlex different from Scopus or Google Scholar?',
    answer: `Those are destinations: you visit them to look something up. OpenAlex is infrastructure: you build on it. Our entire dataset — over 500 million works, richly connected to authors, institutions, funders, and citations — is queryable by API and downloadable under CC0. And we cover far more of the world's research than the paywalled databases, openly.`,
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
        lastName(a.name), `View all ${fmt(a.count)} works by ${a.name}`, AUTHOR_ICON));
    const etAl = r.nauthors > r.authors.length;
    const authors = (names.length === 2 && !etAl)
      ? names.join(' and ')
      : names.join(', ') + (etAl ? ', et al.' : '');
    const src = r.source
      ? ` in ${link('w w-source', 'https://openalex.org/works?filter=primary_location.source.id:' + r.source.id,
          srcName(r.source.name), `View all ${fmt(r.source.count)} works published in ${srcName(r.source.name)}`, SOURCE_ICON)}`
      : '';
    const pdf = r.pdf
      ? `<a class="novice-link pdf" href="${esc(r.pdf)}" target="_blank" rel="noopener" data-tip="View PDF">PDF</a>`
      : '';
    const icon = `<span class="lead mdi ${getTypeIcon(r.type)}" ${typeTip}></span>`;
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = `${eyebrow}${icon}<a class="novice-link t" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a>${pdf}<span class="by">by ${authors}${src}</span>`;
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
  grid-template-columns: 1.05fr 1fr;
  gap: 48px;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}
.hero > * { min-width: 0; }

.hero-headline {
  font-size: 52px; font-weight: 700; line-height: 1.05;
  letter-spacing: -0.03em; color: var(--ink); margin: 0 0 20px 0;
}
.hero-subhead {
  font-size: 18px; line-height: 1.65; color: var(--muted);
  max-width: 520px; margin: 0 0 40px 0;
}
.hero-search { width: 100%; max-width: 600px; }

// Linear-style ghost button: borderless; a soft rounded-rect bg appears on hover
.scroll-indicator {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: inline-flex; align-items: center; gap: 6px;
  font: inherit; font-size: 14px; font-weight: 500; color: var(--muted);
  background: transparent; border: none; border-radius: 8px;
  padding: 8px 14px; cursor: pointer;
  transition: color .12s ease, background .12s ease;
  .mdi { font-size: 16px; line-height: 1; }
  &:hover { color: var(--ink); background: rgba(0, 0, 0, .05); }
}

// live feed
.hero-viz { display: flex; flex-direction: column; gap: 0; }
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
  height: min(66vh, 560px); overflow: hidden; position: relative;
  -webkit-mask-image: linear-gradient(180deg, #000 0, #000 86%, transparent);
          mask-image: linear-gradient(180deg, #000 0, #000 86%, transparent);
}

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
.logos-section {
  padding: 48px 0 56px; border-bottom: 1px solid #F4F4F5; overflow: hidden;
}
.logos-label {
  font-size: 14px; font-weight: 500; color: var(--faint);
  text-align: center; margin-bottom: 32px;
}
// Linear-style single row: 8 small logos, evenly spread, no motion
.logo-grid {
  display: flex; align-items: center; justify-content: space-between;
  max-width: 1150px; margin: 0 auto; padding: 0 32px;
}
.band-logo {
  height: 28px; filter: grayscale(1); opacity: 0.5; flex: none;
  &.tall { height: 36px; }
  &.short { height: 22px; }
}
@media (max-width: 900px) {
  // narrow screens: fall back to a centered 2x4 wrap
  .logo-grid { flex-wrap: wrap; justify-content: center; column-gap: 40px; row-gap: 28px; }
}
@media (max-width: 700px) {
  .logo-grid { column-gap: 28px; row-gap: 22px; }
  .band-logo { height: 22px; &.tall { height: 28px; } &.short { height: 18px; } }
}

// ===================== STATS =====================
// sized to Jason's 2026-08-02 mock: big number, near-as-big bold label, grey sub
.stats-section { padding: 96px 24px; max-width: 1200px; margin: 0 auto; }
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; text-align: center;
}
.stat-num {
  font-size: 48px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
  line-height: 1.1; font-variant-numeric: tabular-nums;
}
.stat-label {
  font-size: 30px; font-weight: 700; letter-spacing: -0.01em; color: var(--ink);
  line-height: 1.15; margin-top: 8px;
}
.stat-sub { font-size: 15px; color: var(--muted); margin-top: 16px; }

// ===================== WHAT IT IS =====================
.whatis-section { padding: 80px 24px 100px; max-width: 1200px; margin: 0 auto; }
// three columns: text / graphic / labels (Jason 2026-08-03 — the old 2-col layout
// crammed art + labels into one column). Graphic + label columns size to their
// zoomed content; text takes the rest.
.whatis-grid {
  display: grid; grid-template-columns: 1fr auto auto; gap: 56px; align-items: center;
}
.whatis-title {
  font-size: 34px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
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
.openness-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; }
.openness-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start;
}
.openness-title {
  font-size: 34px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink);
  margin: 0; line-height: 1.1;
}
.openness-copy p {
  font-size: 17px; line-height: 1.7; color: var(--muted); margin: 0;
  a { color: #2563EB; text-decoration: none; &:hover { text-decoration: underline; } }
}

// ===================== SHARED SECTION HEADER =====================
.section-header {
  font-size: 32px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink);
  text-align: center; margin-bottom: 48px;
}

// ===================== HOW TO ACCESS =====================
.access-section { padding: 80px 24px; max-width: 1100px; margin: 0 auto; }
.access-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
// Linear-style card: flat soft-grey fill, no border, no shadow
.access-card {
  position: relative; background: #F7F8F8; border-radius: 12px; padding: 24px;
  display: flex; flex-direction: column;
  transition: background .12s ease;
  &:hover { background: #F1F2F4; }
}
.access-chip {
  margin-left: auto; flex: none;
  font-size: 10.5px; font-weight: 600; letter-spacing: .02em;
  border-radius: 6px; padding: 2px 7px; line-height: 1.5;
}
.chip-easy { color: #0E7A46; background: #E4F3EA; }
.chip-med  { color: #92600A; background: #F8EFDC; }
.chip-hard { color: #A8382F; background: #F9E8E5; }
.access-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.access-icon { font-size: 20px; line-height: 1; color: var(--ink); }
.access-card-title { font-size: 16px; font-weight: 600; color: var(--ink); margin: 0; }
.beta-badge {
  align-self: flex-start; margin: -4px 0 8px;
  font-size: 10px; font-weight: 600; letter-spacing: .03em; color: #2563EB;
  background: #EFF6FF; border-radius: 5px; padding: 1px 6px; line-height: 1.5;
}
.access-card-body { font-size: 14px; line-height: 1.6; color: var(--muted); margin: 0 0 16px 0; flex: 1; }
.access-learn {
  font-size: 14px; font-weight: 600; color: #2563EB; text-decoration: none;
  display: inline-flex; align-items: center; gap: 4px;
  .mdi { font-size: 15px; line-height: 1; }
  &:hover { text-decoration: underline; }
}

// ===================== FAQ =====================
// full main-column width (matches stats/access sections)
.faq-section { padding: 80px 24px 120px; max-width: 1100px; margin: 0 auto; }
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
  .whatis-grid { grid-template-columns: 1fr; gap: 40px; }
  .whatis-graphic, .whatis-labels { --cake-scale: 0.32; }
  .stats-row { grid-template-columns: repeat(2, 1fr); gap: 40px 24px; }
  .openness-grid { grid-template-columns: 1fr; gap: 24px; }
  .access-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .hero { padding: 80px 20px 0; }
  .hero-headline { font-size: 34px; }
  .stats-section, .access-section, .faq-section, .whatis-section, .openness-section { padding-left: 20px; padding-right: 20px; }
  .stat-num { font-size: 32px; }
  .stat-label { font-size: 20px; }
  .access-cards { grid-template-columns: 1fr; }
}
</style>
