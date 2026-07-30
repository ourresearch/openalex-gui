<template>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

defineOptions({ name: 'PageToc' });

const props = defineProps({
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

<!-- Unscoped on purpose: the shared right-rail nav for static pages. -->
<style lang="scss">
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
</style>
