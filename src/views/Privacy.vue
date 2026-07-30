<template>
  <v-container class="mt-12 pt-12 legal-page">
    <div class="text-h3 mb-4">
      Privacy
    </div>
    <p>
      This is the OpenAlex privacy policy. It explains what information we collect, how we use it, and the choices
      you have. The canonical version is the PDF below
      (<a href="/OpenAlex_privacy_policy.pdf" target="_blank">download</a>).
    </p>
    <object
      data="/OpenAlex_privacy_policy.pdf"
      type="application/pdf"
      class="pdf-embed"
    >
      <p>
        Your browser can't display embedded PDFs —
        <a href="/OpenAlex_privacy_policy.pdf" target="_blank">open the Privacy Policy (PDF)</a> instead.
      </p>
    </object>
  </v-container>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'PrivacyPage' });

useHead({ title: 'Privacy' });
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
