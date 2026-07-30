<template>
  <v-container class="mt-12 pt-12 legal-page">
    <div class="text-h3 mb-4">
      Terms
    </div>
    <p>
      These are the OpenAlex terms of service. The canonical version is the PDF below
      (<a href="/OpenAlex_termsofservice.pdf" target="_blank">download</a>).
    </p>
    <object
      data="/OpenAlex_termsofservice.pdf"
      type="application/pdf"
      class="pdf-embed"
    >
      <p>
        Your browser can't display embedded PDFs —
        <a href="/OpenAlex_termsofservice.pdf" target="_blank">open the Terms of Service (PDF)</a> instead.
      </p>
    </object>

    <div class="text-h4 mt-12 mb-4">Other legal documents</div>
    <ul>
      <li>
        <a href="/conflict-of-interest-policy.pdf" target="_blank">Conflict of Interest Policy</a>
      </li>
      <li>
        <a href="https://docs.google.com/spreadsheets/d/19HJtpWlintDX9J3etqi4AtvJvCwdVN4JnfyVcKICNKI/edit?gid=1539590034#gid=1539590034"
          target="_blank">Disclosures of Conflicts of Interest</a>
      </li>
      <li>
        <a href="/anti-fraud-and-bribery-policy.pdf" target="_blank">Anti-Fraud and Bribery Policy</a>
      </li>
    </ul>
    <p class="mt-6">
      Looking for our <router-link to="/privacy">privacy policy</router-link> or
      <router-link to="/accessibility">accessibility statement</router-link>? They have their own pages. Corporate
      documents (incorporation, bylaws, tax filings) live on the
      <router-link to="/about">about page</router-link>.
    </p>
  </v-container>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'TermsPage' });

useHead({ title: 'Terms' });
</script>

<style scoped lang="scss">
p {
  margin-bottom: 20px;
  max-width: 700px;
}

ul {
  padding-left: 15px;
}

.pdf-embed {
  width: 100%;
  max-width: 900px;
  height: 80vh;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
