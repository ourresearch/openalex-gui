<template>
  <!-- #1689: top of a record page, for agents only (who sees it: server/lib/agentNotice.mjs).
       In the page body, not the head, so Markdown conversions keep it; data-nosnippet
       keeps it out of search snippets. -->
  <v-alert
    type="info"
    variant="tonal"
    density="compact"
    class="agent-notice"
    data-nosnippet
  >
    <strong>Notice to agents:</strong> this page is also available from the OpenAlex API, which has more
    data and is faster: <a :href="apiUrl">{{ apiUrl }}</a>. Docs and a free API key:
    <a :href="DOCS_URL">{{ DOCS_URL }}</a>
  </v-alert>
</template>

<script setup>
defineOptions({ name: 'AgentNotice' });

defineProps({
  // The record in the API (src/seo/recordHead.mjs apiUrl()), as in the head's rel=alternate.
  apiUrl: { type: String, required: true },
});

const DOCS_URL = 'https://help.openalex.org/api/llm-quick-reference/';
</script>
