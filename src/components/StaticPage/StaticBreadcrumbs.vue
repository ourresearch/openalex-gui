<template>
  <!-- Static-page breadcrumb eyebrow. Vue port of the help-center trail
       (openalex-help Breadcrumbs.astro): muted crumbs, chevron separators, the
       page's own title lives in the H1 below and is never a crumb. -->
  <nav class="static-breadcrumbs" aria-label="Breadcrumb">
    <ol>
      <li v-for="(c, i) in crumbs" :key="i">
        <svg
          v-if="i > 0"
          class="sep"
          width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        ><polyline points="9 18 15 12 9 6" /></svg>
        <router-link v-if="c.to" :to="c.to">{{ c.label }}</router-link>
        <span v-else>{{ c.label }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
defineOptions({ name: 'StaticBreadcrumbs' });

defineProps({
  // [{ label, to? }] — a crumb with `to` is a link, without is plain text
  crumbs: { type: Array, default: () => [] },
});
</script>

<style scoped lang="scss">
.static-breadcrumbs {
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    font-size: 13px;
    color: #71717A;
  }

  li {
    display: flex;
    align-items: center;
  }

  .sep {
    flex: none;
    margin: 0 5px;
    color: #C4C4C9;
  }

  a {
    color: #71717A;
    text-decoration: none;

    &:hover {
      color: #0A0A0A;
      text-decoration: none;
    }
  }

  span {
    color: #71717A;
  }
}
</style>
