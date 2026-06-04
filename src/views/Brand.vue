<template>
  <div class="brand-page">
    <!-- Table of Contents (right margin, large screens only) -->
    <nav class="page-toc">
      <div class="page-toc-heading">
        <v-icon size="16">mdi-text-box-outline</v-icon>
        On this page
      </div>
      <ul>
        <li v-for="s in sections" :key="s.id">
          <a
            :href="'#' + s.id"
            :class="{ active: activeSection === s.id }"
            @click.prevent="scrollToSection(s.id)"
          >
            {{ s.label }}
          </a>
        </li>
      </ul>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <h1 class="hero-headline">Brand</h1>
      <p class="hero-body">
        OpenAlex is infrastructure — the pipes under the scholarly city, not the towers
        above it. Our brand leans into that: black, white, and quietly out of the way, so
        your work can provide the color. It's all free to use — grab what you need below.
        For the story behind the logo, read
        <a href="https://blog.openalex.org/a-new-logo-for-openalex/" target="_blank" rel="noopener noreferrer">our blog post</a>.
      </p>
    </section>

    <!-- LOGO -->
    <section id="logo" class="section compact-section">
      <h2 class="section-header">
        Logo
        <a href="#logo" class="permalink" @click.prevent="scrollToSection('logo')"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        Our tricon logo is three connected dots — an
        <a href="https://en.wikipedia.org/wiki/Library_of_Alexandria" target="_blank" rel="noopener noreferrer">A for Alex</a>,
        a network graph, and an open door. There's
        <a href="https://blog.openalex.org/a-new-logo-for-openalex/" target="_blank" rel="noopener noreferrer">more on the thinking behind it</a>
        on our blog.
      </p>
      <p class="section-body mt-4">
        It comes as a full lockup (mark + wordmark) and as the standalone tricon mark. Use
        the dark versions on light backgrounds and the white versions on dark or photographic
        backgrounds, give it a little breathing room, and please don't recolor, stretch, or
        add effects.
      </p>

      <div class="logo-grid">
        <div v-for="asset in logoAssets" :key="asset.file" class="logo-card">
          <div class="logo-tile" :class="asset.dark ? 'tile-dark' : 'tile-light'">
            <img :src="asset.src" :alt="asset.label" />
          </div>
          <div class="logo-meta">
            <span class="logo-label">{{ asset.label }}</span>
            <a :href="asset.src" :download="asset.file" class="download-link">
              <v-icon size="small">mdi-tray-arrow-down</v-icon> PNG
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- COLORS -->
    <section id="colors" class="section compact-section">
      <h2 class="section-header">
        Colors
        <a href="#colors" class="permalink" @click.prevent="scrollToSection('colors')"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        It's black. It's like, how much more black could it be? None. None more black.
      </p>
      <div class="swatch-row">
        <button
          v-for="color in colors"
          :key="color.hex"
          class="swatch"
          type="button"
          @click="copyHex(color.hex)"
        >
          <span class="swatch-chip" :class="{ 'swatch-chip-bordered': color.border }" :style="{ background: color.hex }"></span>
          <span class="swatch-name">{{ color.name }}</span>
          <span class="swatch-hex">{{ copied === color.hex ? 'Copied!' : color.hex }}</span>
          <span class="swatch-rgb">{{ color.rgb }}</span>
        </button>
      </div>
    </section>

    <!-- TYPOGRAPHY -->
    <section id="typography" class="section compact-section">
      <h2 class="section-header">
        Typography
        <a href="#typography" class="permalink" @click.prevent="scrollToSection('typography')"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        OpenAlex is set in
        <a href="https://rsms.me/inter/" target="_blank" rel="noopener noreferrer">Inter</a>,
        a free and open-source typeface by Rasmus Andersson — modern and businesslike, but
        still human and approachable. It's available on
        <a href="https://fonts.google.com/specimen/Inter" target="_blank" rel="noopener noreferrer">Google Fonts</a>.
      </p>
      <div class="type-specimen">
        <div class="type-name">Inter</div>
        <div class="type-alphabet">AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz 0123456789</div>
        <div class="type-weights">
          <span style="font-weight:400">Regular</span>
          <span style="font-weight:500">Medium</span>
          <span style="font-weight:600">Semibold</span>
          <span style="font-weight:700">Bold</span>
        </div>
      </div>
    </section>

    <!-- DOWNLOAD -->
    <section id="download" class="section compact-section">
      <h2 class="section-header">
        Download
        <a href="#download" class="permalink" @click.prevent="scrollToSection('download')"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        Grab everything in one go — all logo variants as PNGs, including a square version for
        social avatars.
      </p>
      <v-btn
        color="black"
        size="large"
        rounded="lg"
        variant="flat"
        class="text-none mt-8"
        href="/brand-assets/openalex-brand.zip"
        download="openalex-brand.zip"
        prepend-icon="mdi-folder-zip-outline"
      >
        Download all assets (.zip)
      </v-btn>
    </section>

    <!-- USAGE -->
    <section id="usage" class="section compact-section">
      <h2 class="section-header">
        Usage
        <a href="#usage" class="permalink" @click.prevent="scrollToSection('usage')"><v-icon size="18">mdi-link-variant</v-icon></a>
      </h2>
      <p class="section-body">
        OpenAlex is an open, nonprofit project, and we're glad to have our name and logo used
        to refer to us. You're welcome to use the OpenAlex logo — without asking — for
        academic, educational, journalistic, and community purposes: to link to us, to credit
        us as a data source, in presentations and papers, in articles about OpenAlex, and at
        community events.
      </p>
      <p class="section-body mt-4">We just ask that you:</p>
      <ul class="usage-list">
        <li>don't modify the logo (no recoloring, stretching, rotating, or adding effects);</li>
        <li>don't use it in a way that suggests OpenAlex endorses or is affiliated with your
          product, organization, or viewpoint when it isn't; and</li>
        <li>get in touch first for commercial uses (for example, selling merchandise that
          features the mark).</li>
      </ul>
      <p class="section-body mt-4">
        Not sure whether your use is okay? Just
        <a href="https://openalex.zendesk.com/hc/requests/new" target="_blank" rel="noopener noreferrer">ask us</a> —
        we're friendly.
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useHead } from '@unhead/vue';

defineOptions({
  name: 'BrandPage',
});

useHead({ title: 'Brand' });

const logoAssets = ref([
  { label: 'Logo lockup', file: 'openalex-lockup.png', src: '/brand-assets/openalex-lockup.png', dark: false },
  { label: 'Logo lockup (white)', file: 'openalex-lockup-white.png', src: '/brand-assets/openalex-lockup-white.png', dark: true },
  { label: 'Tricon mark', file: 'openalex-mark.png', src: '/brand-assets/openalex-mark.png', dark: false },
  { label: 'Tricon mark (white)', file: 'openalex-mark-white.png', src: '/brand-assets/openalex-mark-white.png', dark: true },
]);

const colors = ref([
  { name: 'Black', hex: '#000000', rgb: 'rgb(0, 0, 0)' },
  { name: 'White', hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', border: true },
]);

const copied = ref(null);
const copyHex = (hex) => {
  navigator.clipboard?.writeText(hex);
  copied.value = hex;
  setTimeout(() => {
    if (copied.value === hex) copied.value = null;
  }, 1200);
};

// Table of contents / scroll spy
const sections = [
  { id: 'logo', label: 'Logo' },
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'download', label: 'Download' },
  { id: 'usage', label: 'Usage' },
];
const activeSection = ref('logo');
let observer = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px' }
  );
  sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
  window.history.replaceState(null, '', `#${id}`);
}
</script>

<style scoped lang="scss">
.brand-page {
  background: #fff;
}

// Table of Contents (right margin)
.page-toc {
  position: fixed;
  top: 140px;
  left: calc(50% + 460px);
  width: 180px;
  z-index: 10;

  .page-toc-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #71717A;
    margin-bottom: 12px;
    letter-spacing: 0.01em;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border-left: 1px solid #E4E4E7;
  }

  li a {
    display: block;
    padding: 8px 0 8px 16px;
    font-size: 14px;
    color: #A1A1AA;
    text-decoration: none;
    border-left: 2px solid transparent;
    margin-left: -1px;
    transition: all 0.15s ease;

    &:hover {
      color: #52525B;
    }

    &.active {
      color: #0A0A0A;
      border-left-color: #0A0A0A;
      font-weight: 500;
    }
  }
}

@media (max-width: 1300px) {
  .page-toc {
    display: none;
  }
}

// Hero
.hero {
  padding: 80px 24px 20px;
  max-width: 848px;
  margin: 0 auto;
}

.hero-headline {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: #0A0A0A;
  margin: 0 0 20px 0;
}

.hero-body {
  font-size: 17px;
  font-weight: 400;
  line-height: 1.7;
  color: #52525B;
  margin: 0;

  a {
    color: #0A0A0A;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover { color: #52525B; }
  }
}

// Sections
.section {
  padding: 64px 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.compact-section {
  max-width: 848px;
}

.section-header {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0A0A0A;
  margin: 0 0 16px 0;

  .permalink {
    opacity: 0;
    transition: opacity 0.15s ease;
    color: #C4C4C9;
    margin-left: 6px;
    vertical-align: middle;
    text-decoration: none;

    &:hover { color: #71717A; }
  }

  &:hover .permalink { opacity: 1; }
}

.section-body {
  font-size: 16px;
  line-height: 1.7;
  color: #52525B;
  margin: 0;

  a {
    color: #0A0A0A;
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover { color: #52525B; }
  }
}

.usage-list {
  font-size: 16px;
  line-height: 1.7;
  color: #52525B;
  margin: 8px 0 0 0;
  padding-left: 24px;

  li { margin-bottom: 8px; }
}

// Logo grid
.logo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 32px;
}

@media (max-width: 600px) {
  .logo-grid { grid-template-columns: 1fr; }
}

.logo-card {
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.logo-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-height: 160px;
}

.logo-tile img {
  max-width: 80%;
  max-height: 90px;
  object-fit: contain;
}

.tile-light { background: #FAFAFA; }
.tile-dark { background: #0A0A0A; }

.logo-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #F0F0F0;
}

.logo-label {
  font-size: 13px;
  font-weight: 500;
  color: #3F3F46;
}

.download-link {
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  color: #0A0A0A;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover { color: #52525B; }
}

// Color swatches
.swatch-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 28px;
}

.swatch {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 220px;
  padding: 16px;
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 150ms ease, box-shadow 150ms ease;
  font-family: inherit;

  &:hover {
    border-color: #A1A1AA;
    box-shadow: 0 3px 6px -2px rgba(0, 0, 0, 0.06);
  }
}

.swatch-chip {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.swatch-chip-bordered {
  border: 1px solid #E4E4E7;
}

.swatch-name {
  font-size: 14px;
  font-weight: 600;
  color: #0A0A0A;
}

.swatch-hex {
  font-size: 13px;
  font-weight: 500;
  color: #52525B;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}

.swatch-rgb {
  font-size: 12px;
  color: #A1A1AA;
}

// Type specimen
.type-specimen {
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 28px;
  margin-top: 28px;
}

.type-name {
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #0A0A0A;
}

.type-alphabet {
  font-size: 18px;
  color: #3F3F46;
  margin-top: 12px;
  word-break: break-word;
}

.type-weights {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  font-size: 18px;
  color: #0A0A0A;
}

@media (max-width: 960px) {
  .hero-headline { font-size: 40px; }
  .section-header { font-size: 24px; }
}

@media (max-width: 600px) {
  .hero { padding: 60px 20px 20px; }
  .hero-headline { font-size: 32px; }
  .section { padding: 48px 20px; }
}
</style>
