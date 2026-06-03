<template>
  <div class="oql-playground">
    <!-- Sidebar -->
    <nav class="playground-sidebar">
      <div class="sidebar-head">
        <div class="text-h6">OQL Playground</div>
        <div class="text-caption text-medium-emphasis">dev sandbox</div>
      </div>
      <v-list density="compact" nav>
        <v-list-item
          v-for="page in subpages"
          :key="page.key"
          :active="activeSubpage === page.key"
          :disabled="page.disabled"
          @click="activeSubpage = page.key"
        >
          <template #prepend>
            <v-icon :icon="page.icon" />
          </template>
          <v-list-item-title>{{ page.label }}</v-list-item-title>
          <template #append>
            <v-chip v-if="page.disabled" size="x-small" variant="tonal">soon</v-chip>
          </template>
        </v-list-item>
      </v-list>
    </nav>

    <!-- Content -->
    <main class="playground-content">
      <PlaygroundCases v-if="activeSubpage === 'cases'" />
      <div v-else class="placeholder">
        <v-icon size="48" color="grey-lighten-1">mdi-tools</v-icon>
        <p class="text-body-1 mt-3">{{ activeSubpageLabel }} subpage coming soon.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useHead } from "@unhead/vue";
import PlaygroundCases from "@/components/OqlPlayground/PlaygroundCases.vue";

defineOptions({ name: "OqlPlayground" });

useHead({ title: "OQL Playground" });

// NL evals start as a future subpage; per #345 it may instead become extra
// columns on Cases (coordinated with #344). Left disabled for now.
const subpages = [
  { key: "cases", label: "Cases", icon: "mdi-table", disabled: false },
  { key: "editor", label: "Editor", icon: "mdi-code-braces", disabled: true },
  { key: "nl-evals", label: "NL evals", icon: "mdi-robot", disabled: true },
];

const activeSubpage = ref("cases");
const activeSubpageLabel = computed(
  () => subpages.find((p) => p.key === activeSubpage.value)?.label ?? ""
);
</script>

<style scoped>
.oql-playground {
  display: flex;
  min-height: calc(100vh - 64px);
}
.playground-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px 8px;
}
.sidebar-head {
  padding: 8px 12px 12px;
}
.playground-content {
  flex: 1;
  min-width: 0;
  padding: 24px 28px;
}
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: rgba(0, 0, 0, 0.5);
}
@media (max-width: 700px) {
  .oql-playground {
    flex-direction: column;
  }
  .playground-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>
