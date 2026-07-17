<template>
  <div class="query-workbench">
    <!-- Sidebar -->
    <nav class="workbench-sidebar">
      <div class="sidebar-head">
        <div class="d-flex align-center">
          <div class="text-h6">Natural language</div>
          <v-chip color="amber-darken-2" variant="tonal" size="x-small" class="ml-2 alpha-chip">alpha</v-chip>
        </div>
        <div class="text-caption text-medium-emphasis">Ask OpenAlex in plain English</div>
      </div>
      <v-list density="compact" nav>
        <v-list-item
          v-for="page in sections"
          :key="page.section"
          :active="section === page.section"
          :disabled="page.disabled"
          @click="go(page.section, page.disabled)"
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
    <main class="workbench-content">
      <v-alert
        type="info"
        variant="tonal"
        density="comfortable"
        class="alpha-alert mb-6"
        icon="mdi-flask-outline"
      >
        Natural-language querying is in <strong>alpha</strong>, expected to launch in summer
        2026. It may change without warning —
        <a href="mailto:support@openalex.org">tell us what you think</a>.
      </v-alert>

      <PlaygroundNlEvals v-if="section === 'cases'" />
      <PlaygroundNlAnnotate v-else-if="section === 'annotate'" :case-id="caseId" />
      <div v-else class="placeholder">
        <v-icon size="48" color="grey-lighten-1">mdi-tools</v-icon>
        <p class="text-body-1 mt-3">{{ activeLabel }} coming soon.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import PlaygroundNlEvals from "@/components/OqlPlayground/PlaygroundNlEvals.vue";
import PlaygroundNlAnnotate from "@/components/OqlPlayground/PlaygroundNlAnnotate.vue";

defineOptions({ name: "NlWorkbench" });

// The natural-language tools, moved out of the /query workbench to their own /nl
// page (Jason, 2026-07-17). section ∈ {cases, annotate, playground} — a route param
// validated by the route regex. caseId is set only by the /nl/annotate/:id deep link.
const props = defineProps({
  section: { type: String, required: true },
  caseId: { type: String, default: undefined },
});

const router = useRouter();

// "Playground" (the live NL→OQO submit endpoint) is still a placeholder — the
// submit endpoint is disabled server-side.
const sections = [
  { section: "cases", label: "Cases", icon: "mdi-robot", disabled: false },
  { section: "annotate", label: "Annotate", icon: "mdi-pencil-box-outline", disabled: false },
  { section: "playground", label: "Playground", icon: "mdi-message-text-outline", disabled: true },
];

const activeLabel = computed(
  () => sections.find((s) => s.section === props.section)?.label || "Natural language"
);

useHead({ title: computed(() => `${activeLabel.value} — Natural language`) });

const go = (section, disabled) => {
  if (disabled || section === props.section) return;
  router.push({ name: "Nl", params: { section } });
};
</script>

<style scoped>
.query-workbench {
  display: flex;
  min-height: calc(100vh - 64px);
}
.workbench-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  padding: 16px 8px;
}
.sidebar-head {
  padding: 8px 12px 12px;
}
.alpha-chip {
  font-weight: 600;
  letter-spacing: 0.02em;
}
.workbench-content {
  flex: 1;
  min-width: 0;
  padding: 24px 28px;
}
.alpha-alert {
  max-width: 820px;
  font-size: 0.9rem;
}
.alpha-alert :deep(a) {
  color: inherit;
  font-weight: 600;
  text-decoration: underline;
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
  .query-workbench {
    flex-direction: column;
  }
  .workbench-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
}
</style>
