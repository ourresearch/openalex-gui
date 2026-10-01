<template>
  <!-- An ORCID iD the way ORCID's brand guidelines ask: the iD icon and the full orcid.org URL. -->
  <a
    :href="`https://orcid.org/${orcid}`"
    target="_blank"
    rel="noopener"
    class="orcid-id-link"
  >
    <OrcidIcon :size="16" class="mr-1" />https://orcid.org/{{ orcid }}
  </a>
</template>

<script setup>
import OrcidIcon from './OrcidIcon.vue';

defineOptions({ name: 'OrcidIdLink' });
defineProps({ orcid: { type: String, required: true } });
</script>

<style scoped>
.orcid-id-link {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  color: #1A1A1A;
  text-decoration: none;
}
.orcid-id-link:hover {
  text-decoration: underline;
}
</style>
