<template>
  <static-page :title="title">
    <template #intro>
      {{ blurb }} In the meantime, you can
      <a href="mailto:support@openalex.org">drop us a line</a> or head
      <router-link to="/">back to the search</router-link>.
    </template>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'ComingSoonPage' });

const props = defineProps({
  title: { type: String, required: true },
  blurb: { type: String, default: 'This page is coming soon.' },
});

useHead({
  title: props.title,
  meta: [
    { name: 'robots', content: 'noindex' },
  ],
});
</script>
