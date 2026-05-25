<template>
  <div class="collection-match-table">
    <div class="d-flex align-center mb-3">
      <div class="text-body-2">
        <span class="font-weight-medium">{{ matchedCount }}</span> matched,
        <span class="font-weight-medium text-error">{{ unmatchedCount }}</span> unmatched
        <span v-if="totalCount" class="text-grey">/ {{ totalCount }} total</span>
      </div>
      <v-spacer />
      <v-btn-toggle
        v-model="filterMode"
        density="compact"
        mandatory
        color="primary"
        variant="outlined"
      >
        <v-btn value="all">All</v-btn>
        <v-btn value="unmatched">Unmatched only</v-btn>
      </v-btn-toggle>
      <v-btn
        class="ml-2"
        variant="text"
        size="small"
        prepend-icon="mdi-download"
        @click="downloadCsv"
      >
        CSV
      </v-btn>
    </div>

    <v-card flat class="rounded-o">
      <div class="match-table-scroll">
        <v-table density="compact" class="match-table">
          <thead>
            <tr>
              <th class="status-col"></th>
              <th>Submitted</th>
              <th>Resolved</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filteredRows" :key="i">
              <td class="status-col">
                <v-tooltip
                  :text="row.resolved ? 'Matched' : (row.reason || 'Unmatched')"
                  location="bottom"
                >
                  <template #activator="{ props: tip }">
                    <v-icon
                      v-bind="tip"
                      size="x-small"
                      :color="row.resolved ? 'success' : 'error'"
                    >
                      {{ row.resolved ? 'mdi-check' : 'mdi-close' }}
                    </v-icon>
                  </template>
                </v-tooltip>
              </td>
              <td class="mono wrap">{{ row.input }}</td>
              <td class="wrap">
                <template v-if="row.resolved">
                  <div class="mono">{{ row.resolved }}</div>
                  <div v-if="row.display_name" class="display-name text-grey-darken-1">
                    {{ row.display_name }}
                  </div>
                </template>
                <span v-else class="mono">—</span>
              </td>
            </tr>
            <tr v-if="filteredRows.length === 0">
              <td colspan="3" class="text-grey text-center py-4">
                {{ filterMode === "unmatched" ? "No unmatched rows." : "No rows yet." }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  rows: { type: Array, default: () => [] },
});

const filterMode = ref("all");

const matchedCount = computed(() => props.rows.filter(r => !!r.resolved).length);
const unmatchedCount = computed(() => props.rows.filter(r => !r.resolved).length);
const totalCount = computed(() => props.rows.length);

const filteredRows = computed(() => {
  if (filterMode.value === "unmatched") {
    return props.rows.filter(r => !r.resolved);
  }
  return props.rows;
});

function downloadCsv() {
  const header = "submitted,resolved,display_name,status\n";
  const csv = props.rows.map(r => {
    const status = r.resolved ? "matched" : (r.reason || "not found");
    const cells = [r.input, r.resolved || "", r.display_name || "", status]
      .map(c => `"${String(c).replace(/"/g, '""')}"`);
    return cells.join(",");
  }).join("\n");
  const blob = new Blob([header + csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "collection-match-results.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style lang="scss" scoped>
.collection-match-table {
  // Confine the table to its parent (the wizard dialog body) so long titles
  // or URLs wrap onto extra lines instead of pushing the dialog wider.
  width: 100%;
  .match-table-scroll {
    max-height: 360px;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .match-table {
    width: 100%;
    table-layout: fixed;
  }
  .mono {
    font-family: "SF Mono", "Menlo", "Monaco", "Courier New", monospace;
    font-size: 12px;
  }
  // QA-049b: display_name subtitle under the resolved ID — same visual rank
  // as the table-row text (12px) but in lighter grey to keep the ID primary.
  .display-name {
    font-size: 12px;
    line-height: 1.3;
    margin-top: 2px;
  }
  .wrap {
    word-break: break-all;
    white-space: normal;
  }
  // Compact gutter for the status icon column.
  .status-col {
    width: 36px;
    padding-left: 8px;
    padding-right: 0;
  }
}
</style>
