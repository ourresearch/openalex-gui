<template>
  <static-page title="Accessibility" :sections="sections">
    <template #intro>
      We want OpenAlex to be usable by everyone. This is our accessibility statement.
    </template>

    <static-section id="statement" title="Accessibility statement">
      <p class="section-body">
        The canonical version is the PDF below
        (<a href="/accessibility-statement.pdf" target="_blank">download</a>).
      </p>
      <object
        data="/accessibility-statement.pdf"
        type="application/pdf"
        class="pdf-embed"
      >
        <p class="section-body">
          Your browser can't display embedded PDFs —
          <a href="/accessibility-statement.pdf" target="_blank">open the Accessibility Statement (PDF)</a> instead.
        </p>
      </object>
    </static-section>

    <static-section id="feedback" title="Feedback">
      <p class="section-body">
        If you hit an accessibility problem anywhere on OpenAlex, please
        <router-link to="/support">let us know</router-link> — we'd like to fix it.
      </p>
    </static-section>
  </static-page>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';

defineOptions({ name: 'AccessibilityPage' });

useHead({ title: 'Accessibility' });

const sections = [
  { id: 'statement', label: 'Statement' },
  { id: 'feedback', label: 'Feedback' },
];
</script>
