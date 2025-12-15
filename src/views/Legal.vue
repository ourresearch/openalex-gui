<template>
  <div class="container mx-auto px-4 mt-12 pt-12">
    <h1 class="text-3xl font-bold mb-6">
      Legal
    </h1>
    <ul class="space-y-2 pl-4">
      <li>
        <a href="/conflict-of-interest-policy.pdf" target="_blank" class="text-primary hover:underline">Conflict of Interest Policy</a>
      </li>
      <li>
        <a href="https://docs.google.com/spreadsheets/d/19HJtpWlintDX9J3etqi4AtvJvCwdVN4JnfyVcKICNKI/edit?gid=1539590034#gid=1539590034" target="_blank" class="text-primary hover:underline">Disclosures of Conflicts of Interest</a>
      </li>
      <li>
        <a href="/accessibility-statement.pdf" target="_blank" class="text-primary hover:underline">Accessibility Statement</a>
      </li>
      <li>
        <a href="/OpenAlex_privacy_policy.pdf" target="_blank" class="text-primary hover:underline">OpenAlex Privacy Policy</a>
      </li>
      <li>
        <a href="/OpenAlex_termsofservice.pdf" target="_blank" class="text-primary hover:underline">OpenAlex Terms of Service</a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { useHead } from '@unhead/vue';

defineOptions({ name: 'Legal' });

useHead({ title: 'Legal' });
</script>

<style scoped>
/* Styles handled via Tailwind classes */
</style>