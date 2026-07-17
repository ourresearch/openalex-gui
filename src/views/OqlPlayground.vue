<template>
  <div class="query-workbench">
    <!-- Sidebar -->
    <nav class="workbench-sidebar">
      <div class="sidebar-head">
        <div class="text-h6">Query</div>
        <div class="text-caption text-medium-emphasis">OpenAlex Query Language</div>
      </div>
      <v-list density="compact" nav>
        <template v-for="group in nav" :key="group.axis">
          <v-list-subheader class="axis-head">{{ group.label }}</v-list-subheader>
          <v-list-item
            v-for="page in group.sections"
            :key="page.section"
            :active="axis === group.axis && section === page.section"
            :disabled="page.disabled"
            @click="go(group.axis, page.section, page.disabled)"
          >
            <template #prepend>
              <v-icon :icon="page.icon" />
            </template>
            <v-list-item-title>{{ page.label }}</v-list-item-title>
            <template #append>
              <v-chip v-if="page.disabled" size="x-small" variant="tonal">soon</v-chip>
            </template>
          </v-list-item>
        </template>
      </v-list>
    </nav>

    <!-- Content -->
    <main class="workbench-content">
      <PlaygroundMarkdownDoc v-if="axis === 'oql' && section === 'cheatsheet'" slug="cheatsheet" />
      <PlaygroundCases v-else-if="axis === 'oql' && section === 'cases'" />
      <PlaygroundMarkdownDoc v-else-if="axis === 'oql' && section === 'guide'" slug="guide" />
      <PlaygroundMarkdownDoc v-else-if="axis === 'oql' && section === 'api'" slug="api" />
      <PlaygroundMarkdownDoc v-else-if="axis === 'oql' && section === 'spec'" slug="oql" />
      <PlaygroundGrammar v-else-if="axis === 'oql' && section === 'grammar'" />
      <PlaygroundOqoSchema v-else-if="axis === 'oql' && section === 'schema'" />
      <PlaygroundNlEvals v-else-if="axis === 'nl' && section === 'cases'" />
      <PlaygroundNlAnnotate v-else-if="axis === 'nl' && section === 'annotate'" :case-id="caseId" />
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
import PlaygroundCases from "@/components/OqlPlayground/PlaygroundCases.vue";
import PlaygroundMarkdownDoc from "@/components/OqlPlayground/PlaygroundMarkdownDoc.vue";
import PlaygroundGrammar from "@/components/OqlPlayground/PlaygroundGrammar.vue";
import PlaygroundOqoSchema from "@/components/OqlPlayground/PlaygroundOqoSchema.vue";
import PlaygroundNlEvals from "@/components/OqlPlayground/PlaygroundNlEvals.vue";
import PlaygroundNlAnnotate from "@/components/OqlPlayground/PlaygroundNlAnnotate.vue";

defineOptions({ name: "QueryWorkbench" });

// axis ∈ {oql, nl}; section ∈ {cheatsheet, cases, guide, spec, grammar, schema}
// (oql) or {cases, annotate, playground} (nl) — supplied as route params (validated
// by the route's regex constraints) so the URL is the source of truth. caseId is set
// only by the /query/nl/annotate/:id deep-link route.
const props = defineProps({
  axis: { type: String, required: true },
  section: { type: String, required: true },
  caseId: { type: String, default: undefined },
});

const router = useRouter();

// The axis → sections map. The OQL axis leads with the user-facing docs (Cheat
// sheet / Cases / Guide) and then the deeper reference pages (Spec / Grammar / OQO
// schema, #361 + #530). Editing OQL itself happens in the SERP (the "Show as OQL"
// panel + no-code builder), so there is no standalone editor page here (#530). The
// NL axis's "Playground" tab is still a placeholder (the live NL→OQO submit
// endpoint is disabled server-side).
const nav = [
  {
    axis: "oql",
    label: "OQL",
    sections: [
      { section: "cheatsheet", label: "Cheat sheet", icon: "mdi-card-text-outline", disabled: false },
      { section: "cases", label: "Cases", icon: "mdi-table", disabled: false },
      { section: "guide", label: "Guide", icon: "mdi-book-open-variant", disabled: false },
      { section: "api", label: "API", icon: "mdi-api", disabled: false },
      { section: "spec", label: "Spec", icon: "mdi-file-document-outline", disabled: false },
      { section: "grammar", label: "Grammar", icon: "mdi-sitemap-outline", disabled: false },
      { section: "schema", label: "OQO schema", icon: "mdi-code-json", disabled: false },
    ],
  },
  {
    axis: "nl",
    label: "Natural language",
    sections: [
      { section: "cases", label: "Cases", icon: "mdi-robot", disabled: false },
      { section: "annotate", label: "Annotate", icon: "mdi-pencil-box-outline", disabled: false },
      { section: "playground", label: "Playground", icon: "mdi-message-text-outline", disabled: true },
    ],
  },
];

const activeLabel = computed(() => {
  const group = nav.find((g) => g.axis === props.axis);
  const page = group?.sections.find((s) => s.section === props.section);
  return [group?.label, page?.label].filter(Boolean).join(" ");
});

useHead({ title: computed(() => `${activeLabel.value} — Query`) });

const go = (axis, section, disabled) => {
  if (disabled || (axis === props.axis && section === props.section)) return;
  router.push({ name: "Query", params: { axis, section } });
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
.axis-head {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.7;
}
.workbench-content {
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
