<template>
  <static-page title="Jobs">
    <template #intro>
      We're posting new jobs here soon. To hear about them first, join the
      <a href="https://groups.google.com/g/openalex-users" target="_blank" rel="noopener noreferrer">OpenAlex user group</a>
      — we'll announce openings there. In the meantime, you can
      <a href="mailto:support@openalex.org">drop us a line</a> or head
      <router-link to="/">back to the search</router-link>.
    </template>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'JobsPage' });

useHead({
  title: 'Jobs',
  meta: [
    // Placeholder until real listings land — keep it out of the index for now.
    { name: 'robots', content: 'noindex' },
  ],
});
</script>
