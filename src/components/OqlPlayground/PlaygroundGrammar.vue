<template>
  <div class="playground-grammar">
    <div class="grammar-intro">
      <h2 class="text-h5">OQL Grammar</h2>
      <p class="text-body-2 text-medium-emphasis">
        The machine-readable OQL grammar in
        <a href="https://www.w3.org/TR/xml/#sec-notation" target="_blank" rel="noopener">W3C&nbsp;EBNF</a>,
        rendered as a railroad diagram. Hand-derived from the spec and
        <strong>corpus-gated</strong> against the real parser so it can't drift
        (see the no-drift note below). Served live from
        <code>docs/oql/grammar.ebnf</code>.
      </p>
    </div>

    <v-tabs v-model="tab" density="compact" class="mb-3">
      <v-tab value="railroad">Railroad</v-tab>
      <v-tab value="ebnf">EBNF</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="railroad">
        <v-alert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3 text-body-2"
        >
          A railroad diagram reads left-to-right: follow any path through the
          tracks to form a valid query. It is rendered from the same EBNF shown
          on the next tab.
        </v-alert>
        <iframe
          :src="railroadUrl"
          class="railroad-frame"
          title="OQL grammar railroad diagram"
          loading="lazy"
        ></iframe>
      </v-window-item>

      <v-window-item value="ebnf">
        <v-progress-circular v-if="loading" indeterminate color="primary" class="my-6" />
        <v-alert v-else-if="error" type="error" variant="tonal" class="my-4">
          Couldn't load the grammar: {{ error }}
        </v-alert>
        <CodeBlock v-else :code="ebnf" max-height="70vh" />
      </v-window-item>
    </v-window>

    <v-alert
      type="success"
      variant="tonal"
      density="compact"
      class="mt-4 text-body-2"
      icon="mdi-shield-check"
    >
      <strong>No drift:</strong> this grammar is a derived documentation artifact,
      not the parser (the parser stays hand-written &mdash; charter decision&nbsp;13).
      A conformance gate (<code>tests/oql/test_grammar_ebnf.py</code>) asserts every
      keyword the grammar declares is one the production parser recognizes, and that
      every query in the normative corpus tokenizes under it &mdash; so if the docs
      grammar and the parser ever diverge, CI goes red.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { fetchGrammarEbnf, grammarRailroadUrl } from "./oqlSpecApi";
import CodeBlock from "@/components/CodeBlock.vue";

defineOptions({ name: "PlaygroundGrammar" });

const tab = ref("railroad");
const loading = ref(true);
const error = ref(null);
const ebnf = ref("");
const railroadUrl = grammarRailroadUrl();

onMounted(async () => {
  try {
    ebnf.value = await fetchGrammarEbnf();
  } catch (e) {
    error.value = e?.response?.status ? `HTTP ${e.response.status}` : e?.message || "fetch failed";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.playground-grammar {
  max-width: 900px;
}
.grammar-intro {
  margin-bottom: 12px;
}
.railroad-frame {
  width: 100%;
  height: 70vh;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: #fff;
}
code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
</style>
