<template>
  <div class="query-workbench">
    <!-- Sidebar -->
    <nav class="workbench-sidebar">
      <div class="sidebar-head">
        <div class="text-h6">Query</div>
        <div class="text-caption text-medium-emphasis">dev sandbox</div>
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
      <PlaygroundCases v-if="axis === 'oql' && section === 'cases'" />
      <PlaygroundNlEvals v-else-if="axis === 'nl' && section === 'cases'" />
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
import PlaygroundNlEvals from "@/components/OqlPlayground/PlaygroundNlEvals.vue";

defineOptions({ name: "QueryWorkbench" });

// axis ∈ {oql, nl}, section ∈ {cases, playground} — supplied as route params
// (validated by the route's regex constraints) so the URL is the source of truth.
const props = defineProps({
  axis: { type: String, required: true },
  section: { type: String, required: true },
});

const router = useRouter();

// The 2×2 map. The two "playground" tabs are placeholders for now: the OQL
// editor and the live NL→OQO submit page both still need to be built (the NL
// endpoint is also still disabled server-side).
const nav = [
  {
    axis: "oql",
    label: "OQL",
    sections: [
      { section: "cases", label: "Cases", icon: "mdi-table", disabled: false },
      { section: "playground", label: "Playground", icon: "mdi-code-braces", disabled: true },
    ],
  },
  {
    axis: "nl",
    label: "Natural language",
    sections: [
      { section: "cases", label: "Cases", icon: "mdi-robot", disabled: false },
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
