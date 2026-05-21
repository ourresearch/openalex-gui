<template>
  <div class="label-match-table">
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
      <v-table density="compact" class="match-table">
        <thead>
          <tr>
            <th>Submitted</th>
            <th>Resolved</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in filteredRows" :key="i">
            <td class="mono">{{ row.input }}</td>
            <td class="mono">{{ row.resolved || "—" }}</td>
            <td>
              <span v-if="row.resolved" class="text-success">
                <v-icon size="x-small" color="success">mdi-check</v-icon>
                Matched
              </span>
              <span v-else class="text-error">
                <v-icon size="x-small" color="error">mdi-close</v-icon>
                {{ row.reason || "Not found" }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredRows.length === 0">
            <td colspan="3" class="text-grey text-center py-4">
              {{ filterMode === "unmatched" ? "No unmatched rows." : "No rows yet." }}
            </td>
          </tr>
        </tbody>
      </v-table>
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
  const header = "submitted,resolved,status\n";
  const csv = props.rows.map(r => {
    const status = r.resolved ? "matched" : (r.reason || "not found");
    const cells = [r.input, r.resolved || "", status].map(c => `"${String(c).replace(/"/g, '""')}"`);
    return cells.join(",");
  }).join("\n");
  const blob = new Blob([header + csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "label-match-results.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>

<style lang="scss" scoped>
.label-match-table {
  .mono {
    font-family: "SF Mono", "Menlo", "Monaco", "Courier New", monospace;
    font-size: 12px;
  }
  .match-table {
    max-height: 360px;
    overflow-y: auto;
  }
}
</style>
