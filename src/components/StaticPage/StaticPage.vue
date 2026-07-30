<template>
  <div class="static-page">
    <!-- Table of Contents (right margin, large screens only) -->
    <nav class="page-toc" v-if="sections.length">
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
      <h1 class="hero-headline">{{ title }}</h1>
      <p class="hero-body" v-if="$slots.intro">
        <slot name="intro" />
      </p>
    </section>

    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineOptions({ name: 'StaticPage' });

const props = defineProps({
  title: { type: String, required: true },
  // [{id, label}] — drives the right-rail TOC and scroll spy
  sections: { type: Array, default: () => [] },
});

const activeSection = ref(props.sections[0]?.id ?? null);
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
  props.sections.forEach(s => {
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

<!-- Unscoped on purpose: these are the house styles for all static (non-app)
     pages, namespaced under .static-page. Template: the /brand page. -->
<style lang="scss">
.static-page {
  background: #fff;

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

  @media (max-width: 1300px) {
    .page-toc {
      display: none;
    }
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
