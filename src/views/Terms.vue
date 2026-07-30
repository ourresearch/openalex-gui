<template>
  <static-page title="Terms" :sections="sections">
    <template #intro>
      The terms of service for OpenAlex, plus our other legal and governance documents.
    </template>

    <static-section id="tos" title="Terms of service">
      <p class="section-body">
        The canonical version is the PDF below
        (<a href="/OpenAlex_termsofservice.pdf" target="_blank">download</a>).
      </p>
      <object
        data="/OpenAlex_termsofservice.pdf"
        type="application/pdf"
        class="pdf-embed"
      >
        <p class="section-body">
          Your browser can't display embedded PDFs —
          <a href="/OpenAlex_termsofservice.pdf" target="_blank">open the Terms of Service (PDF)</a> instead.
        </p>
      </object>
    </static-section>

    <static-section id="other" title="Other legal documents">
      <ul class="section-list">
        <li>
          <a href="/conflict-of-interest-policy.pdf" target="_blank">Conflict of Interest Policy</a>
        </li>
        <li>
          <a href="https://docs.google.com/spreadsheets/d/19HJtpWlintDX9J3etqi4AtvJvCwdVN4JnfyVcKICNKI/edit?gid=1539590034#gid=1539590034"
            target="_blank" rel="noopener noreferrer">Disclosures of Conflicts of Interest</a>
        </li>
        <li>
          <a href="/anti-fraud-and-bribery-policy.pdf" target="_blank">Anti-Fraud and Bribery Policy</a>
        </li>
      </ul>
      <p class="section-body">
        Looking for our <router-link to="/privacy">privacy policy</router-link> or
        <router-link to="/accessibility">accessibility statement</router-link>? They have
        their own pages. Corporate documents (incorporation, bylaws, tax filings) live on
        the <router-link to="/about">about page</router-link>.
      </p>
    </static-section>
  </static-page>
</template>

<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';

defineOptions({ name: 'TermsPage' });

useHead({ title: 'Terms' });

const sections = [
  { id: 'tos', label: 'Terms of service' },
  { id: 'other', label: 'Other documents' },
];
</script>
