<template>
  <div
    class="search-error-alert text-error text-body-2 d-flex align-start px-4 py-3"
    role="alert"
  >
    <v-icon size="18" class="mr-2 mt-1" color="error">mdi-alert-circle-outline</v-icon>
    <div>{{ message }}</div>
  </div>
</template>

<script setup>
// Shows a search/query error (e.g. malformed boolean, unsupported wildcard shape)
// right under the search box, where the user typed it — not buried down in the
// results card. zd#9012 / oxjob #397.
defineProps({
  message: { type: String, required: true },
});
</script>

<style scoped>
.search-error-alert {
  border: 1px solid rgb(var(--v-theme-error));
  border-radius: 4px;
  background: rgba(var(--v-theme-error), 0.04);
}
</style>
