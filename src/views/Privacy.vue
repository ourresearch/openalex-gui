<template>
  <static-page title="Privacy" :sections="sections">
    <template #intro>
      This is the OpenAlex privacy policy. It explains what information we collect, how we
      use it, and the choices you have.
    </template>

    <static-section id="policy" title="Privacy policy">
      <p class="section-body">
        The canonical version is the PDF below
        (<a href="/OpenAlex_privacy_policy.pdf" target="_blank">download</a>).
      </p>
      <object
        data="/OpenAlex_privacy_policy.pdf"
        type="application/pdf"
        class="pdf-embed"
      >
        <p class="section-body">
          Your browser can't display embedded PDFs —
          <a href="/OpenAlex_privacy_policy.pdf" target="_blank">open the Privacy Policy (PDF)</a> instead.
        </p>
      </object>
    </static-section>

    <static-section id="related" title="Related documents">
      <ul class="section-list">
        <li><router-link to="/terms">Terms of service</router-link></li>
        <li><router-link to="/accessibility">Accessibility statement</router-link></li>
      </ul>
    </static-section>
  </static-page>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';

defineOptions({ name: 'PrivacyPage' });

useHead({ title: 'Privacy' });

const sections = [
  { id: 'policy', label: 'Privacy policy' },
  { id: 'related', label: 'Related documents' },
];
</script>
