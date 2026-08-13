<!--
  ⚠️ ORPHAN PAGE (/query/oql/cases). Nothing in the app links here — the only way in
  is from the help center, which links to this cases browser from its OQL pages
  (help.openalex.org/access/oql and /access/oql-spec, "the worked-example corpus,
  browsable"). All the other /query/oql/* doc sections (cheatsheet, guide, api, spec,
  grammar, schema) were deleted in oxjob #778 — their content lives in the help
  center now, and the old URLs redirect there (see router/index.js). This page
  survives only because the cases corpus was never migrated. If it ever does migrate,
  delete this view, PlaygroundCases.vue, PlaygroundCaseDetail.vue, and the two
  /query/oql/cases routes — and update the help-center links.
-->
<template>
  <div class="cases-page">
    <div class="cases-head">
      <div class="d-flex align-center">
        <div class="text-h6">OQL Cases</div>
      </div>
      <div class="text-caption text-medium-emphasis">
        Worked examples for the OpenAlex Query Language — see the
        <a href="https://help.openalex.org/access/oql">OQL docs</a> for the language itself.
      </div>
    </div>
    <PlaygroundCases />
  </div>
</template>

<script setup>
import { useHead } from "@unhead/vue";
import PlaygroundCases from "@/components/OqlPlayground/PlaygroundCases.vue";

defineOptions({ name: "OqlCasesPage" });

useHead({ title: "Cases — OQL" });
</script>

<style scoped>
.cases-page {
  min-height: calc(100vh - 64px);
  padding: 24px 28px;
}
.cases-head {
  margin-bottom: 16px;
}
.cases-head a {
  color: inherit;
}
</style>
