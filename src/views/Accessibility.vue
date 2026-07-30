<template>
  <v-container class="mt-12 pt-12 legal-page">
    <div class="text-h3 mb-4">
      Accessibility
    </div>
    <p>
      We want OpenAlex to be usable by everyone. This is our accessibility statement; the canonical version is the PDF
      below (<a href="/accessibility-statement.pdf" target="_blank">download</a>).
    </p>
    <object
      data="/accessibility-statement.pdf"
      type="application/pdf"
      class="pdf-embed"
    >
      <p>
        Your browser can't display embedded PDFs —
        <a href="/accessibility-statement.pdf" target="_blank">open the Accessibility Statement (PDF)</a> instead.
      </p>
    </object>
    <p class="mt-6">
      If you hit an accessibility problem anywhere on OpenAlex, please
      <router-link to="/contact">let us know</router-link> — we'd like to fix it.
    </p>
  </v-container>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'AccessibilityPage' });

useHead({ title: 'Accessibility' });
</script>

<style scoped lang="scss">
p {
  margin-bottom: 20px;
  max-width: 700px;
}

.pdf-embed {
  width: 100%;
  max-width: 900px;
  height: 80vh;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}
</style>
