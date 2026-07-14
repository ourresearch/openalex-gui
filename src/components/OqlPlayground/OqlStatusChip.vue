<template>
  <!-- OqlStatusChip (#611) — the OQL tab's validity/activity state as a chip-style
       pill, rendered by the HOST in its card footer (far left, balancing the Search
       button) instead of by OqlEditor's built-in bottom-right badge (which the host
       turns off via :show-badge="false"). Same state machine as the editor badge:
       activity ("querying…") wins while it's happening; otherwise validity — clean
       valid (green check), invalid (red, hover for errors), valid-but-warned (amber,
       hover for warnings). Renders nothing while there's no settled state (empty
       editor, or a keystroke's /validate round-trip still in flight). -->
  <div class="oql-status-chip">
    <span v-if="status" class="oql-chip oql-chip--busy">{{ status }}…</span>

    <template v-else-if="validation">
      <span v-if="!isInvalid && !hasWarnings" class="oql-chip oql-chip--ok" title="Valid OQL">
        <v-icon size="14">mdi-check-circle</v-icon>
        valid
      </span>

      <!-- invalid OR valid-with-warnings: the chip is the popover activator. Opens on
           HOVER (not click) — users won't know to click. (oxjob #428, Jason.) -->
      <v-menu v-else location="top start" open-on-hover :close-on-content-click="false">
        <template #activator="{ props: menuProps }">
          <button
            type="button"
            class="oql-chip"
            :class="isInvalid ? 'oql-chip--bad' : 'oql-chip--warn'"
            :title="chipSummary"
            v-bind="menuProps"
          >
            <v-icon size="14">{{ isInvalid ? 'mdi-alert-circle' : 'mdi-alert-outline' }}</v-icon>
            {{ chipLabel }}
          </button>
        </template>
        <v-card class="oql-errors" min-width="280" max-width="460">
          <v-list density="compact" class="py-1">
            <v-list-item
              v-for="(d, i) in problems"
              :key="i"
              class="oql-errors__item"
            >
              <template #prepend>
                <v-icon
                  size="16"
                  :color="d.severity === 'warning' ? 'warning' : 'error'"
                  class="mt-1"
                >
                  {{ d.severity === 'warning' ? 'mdi-alert-outline' : 'mdi-alert-circle-outline' }}
                </v-icon>
              </template>
              <div class="oql-errors__msg">{{ d.message }}</div>
              <div v-if="d.fixit" class="oql-errors__fix">💡 {{ d.fixit }}</div>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </template>
  </div>
</template>

<script setup>
import { computed } from "vue";

defineOptions({ name: "OqlStatusChip" });

const props = defineProps({
  // host-driven activity label ("querying" | null) — replaces the validity chip.
  status: { type: String, default: null },
  // the OqlEditor @validation payload (valid, oql, oqo, diagnostics) or null.
  validation: { type: Object, default: null },
});

// Same derivations as OqlEditor's badge (kept in step deliberately — this IS that
// badge, relocated to the host footer and re-chromed as a chip).
const isInvalid = computed(() => !!props.validation && props.validation.valid === false);
const problems = computed(() =>
  (props.validation?.diagnostics || [])
    .filter((d) => d.severity !== "info")
    .sort((a, b) => (a.severity === "warning" ? 1 : 0) - (b.severity === "warning" ? 1 : 0))
);
const errorCount = computed(() =>
  problems.value.filter((d) => d.severity !== "warning").length
);
const warningCount = computed(() =>
  problems.value.filter((d) => d.severity === "warning").length
);
const hasWarnings = computed(() => !isInvalid.value && warningCount.value > 0);
const chipLabel = computed(() =>
  isInvalid.value
    ? "invalid"
    : `${warningCount.value} warning${warningCount.value === 1 ? "" : "s"}`
);
const chipSummary = computed(() => {
  if (isInvalid.value) {
    const n = errorCount.value || problems.value.length || 1;
    return `${n} error${n === 1 ? "" : "s"} — hover to view`;
  }
  return `${warningCount.value} warning${warningCount.value === 1 ? "" : "s"} — hover to view`;
});
</script>

<style scoped>
/* Chip chrome (#611): back to the pill look the editor badge had before #530 QA r3
   went plain-text — icon + label, rounded-full, tinted fill on the alert states. */
.oql-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.oql-chip--busy {
  color: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.oql-chip--ok {
  color: #047857;
  border-color: rgba(4, 120, 87, 0.25);
  background: rgba(236, 253, 245, 0.92);
}
.oql-chip--bad {
  color: #b91c1c;
  border-color: rgba(185, 28, 28, 0.25);
  background: rgba(254, 242, 242, 0.92);
  cursor: pointer;
  font: inherit;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
}
.oql-chip--bad:hover {
  background: #fee2e2;
}
.oql-chip--warn {
  color: #b45309;
  border-color: rgba(180, 83, 9, 0.3);
  background: rgba(255, 251, 235, 0.92);
  cursor: pointer;
  font: inherit;
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 0.72rem;
}
.oql-chip--warn:hover {
  background: #fef3c7;
}

/* error popover (same rules as OqlEditor's) */
.oql-errors__item {
  align-items: flex-start;
}
.oql-errors__msg {
  font-size: 0.83rem;
  color: #0f172a;
  white-space: normal;
}
.oql-errors__fix {
  margin-top: 2px;
  font-size: 0.78rem;
  color: #475569;
}
</style>
