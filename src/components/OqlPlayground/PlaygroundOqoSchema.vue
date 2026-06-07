<template>
  <div class="playground-schema">
    <div class="schema-intro">
      <h2 class="text-h5">OQO Schema</h2>
      <p class="text-body-2 text-medium-emphasis">
        OQO is the canonical structured query object &mdash; the JSON form every
        surface (OQL, chips, NL, OXURL) compiles to. This is its
        <a href="https://json-schema.org/" target="_blank" rel="noopener">JSON&nbsp;Schema</a>,
        generated from the OQO dataclass
        (<code>python -m query_translation.regen_schema</code>) and served live from
        <code>docs/oqo-schema.json</code>.
      </p>
    </div>

    <v-progress-circular v-if="loading" indeterminate color="primary" class="my-8" />

    <v-alert v-else-if="error" type="error" variant="tonal" class="my-4">
      Couldn't load the OQO schema: {{ error }}
    </v-alert>

    <template v-else>
      <!-- Summary header from schema metadata -->
      <v-card flat border rounded class="pa-4 mb-4">
        <div class="text-subtitle-1 font-weight-medium">{{ schema.title || "OpenAlex Query Object" }}</div>
        <div v-if="schema.description" class="text-body-2 text-medium-emphasis mt-1">
          {{ schema.description }}
        </div>
        <div class="text-caption text-medium-emphasis mt-2">
          <code>{{ schema.$schema }}</code>
        </div>
      </v-card>

      <v-tabs v-model="tab" density="compact" class="mb-3">
        <v-tab value="props">Properties</v-tab>
        <v-tab value="raw">Raw JSON Schema</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="props">
          <v-table density="compact" class="schema-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in topProperties" :key="p.name">
                <td><code>{{ p.name }}</code></td>
                <td class="text-medium-emphasis">{{ p.type }}</td>
                <td>
                  <v-icon v-if="p.required" size="16" color="primary">mdi-check</v-icon>
                </td>
                <td class="text-body-2">{{ p.description }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <v-window-item value="raw">
          <pre class="json-block"><code>{{ pretty }}</code></pre>
        </v-window-item>
      </v-window>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { fetchOqoSchema } from "./oqlSpecApi";

defineOptions({ name: "PlaygroundOqoSchema" });

const loading = ref(true);
const error = ref(null);
const schema = ref({});
const tab = ref("props");

onMounted(async () => {
  try {
    schema.value = await fetchOqoSchema();
  } catch (e) {
    error.value = e?.response?.status ? `HTTP ${e.response.status}` : e?.message || "fetch failed";
  } finally {
    loading.value = false;
  }
});

function typeLabel(def) {
  if (!def) return "";
  if (def.type) return Array.isArray(def.type) ? def.type.join(" | ") : def.type;
  if (def.$ref) return def.$ref.split("/").pop();
  if (def.oneOf || def.anyOf) return (def.oneOf || def.anyOf).map(typeLabel).filter(Boolean).join(" | ");
  if (def.enum) return "enum";
  return "object";
}

const topProperties = computed(() => {
  const props = schema.value?.properties || {};
  const req = new Set(schema.value?.required || []);
  return Object.entries(props).map(([name, def]) => ({
    name,
    type: typeLabel(def),
    required: req.has(name),
    description: def.description || "",
  }));
});

const pretty = computed(() => JSON.stringify(schema.value, null, 2));
</script>

<style scoped>
.playground-schema {
  max-width: 900px;
}
.schema-intro {
  margin-bottom: 16px;
}
.schema-table code,
.json-block code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
.schema-table :deep(th) {
  font-weight: 600;
}
.json-block {
  background: #1e1e2e;
  color: #e6e6f0;
  padding: 16px 18px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre;
  max-height: 70vh;
}
</style>
