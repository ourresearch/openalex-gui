<template>
  <div class="static-page">
    <!-- Table of Contents (right margin, large screens only) -->
    <page-toc :sections="sections" />

    <!-- Hero (omitted when the page brings its own — pass no title) -->
    <section class="hero" v-if="title">
      <h1 class="hero-headline">{{ title }}</h1>
      <p class="hero-body" v-if="$slots.intro">
        <slot name="intro" />
      </p>
    </section>

    <slot />
  </div>
</template>

<script setup>
import PageToc from './PageToc.vue';

defineOptions({ name: 'StaticPage' });

defineProps({
  title: { type: String, default: '' },
  // [{id, label}] — drives the right-rail TOC and scroll spy
  sections: { type: Array, default: () => [] },
});
</script>

<!-- Unscoped on purpose: these are the house styles for all static (non-app)
     pages, namespaced under .static-page. Template: the /brand page. -->
<style lang="scss">
.static-page {
  background: #fff;

  // (Right-rail TOC styles live in PageToc.vue)

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

  .subsection-header {
    font-size: 19px;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: #0A0A0A;
    margin: 40px 0 12px 0;
  }

  .section-body {
    font-size: 16px;
    line-height: 1.7;
    color: #52525B;
    margin: 0 0 16px 0;

    a {
      color: #0A0A0A;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover { color: #52525B; }
    }
  }

  ul.section-list {
    font-size: 16px;
    line-height: 1.7;
    color: #52525B;
    margin: 8px 0 16px 0;
    padding-left: 24px;

    li { margin-bottom: 8px; }

    a {
      color: #0A0A0A;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover { color: #52525B; }
    }
  }

  .pdf-embed {
    width: 100%;
    height: 80vh;
    border: 1px solid #E4E4E7;
    border-radius: 12px;
    margin-top: 16px;
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
}
</style>
