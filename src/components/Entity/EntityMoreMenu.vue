<template>
  <!-- The entity header's secondary actions (#1507): one "More actions" menu,
       the same on every entity type, on the full page and in the fly-in.
       Collection pages (#1508) reuse it with a different export label and
       their own items: `prepend-items` above Export, `append-items` at the end. -->
  <v-menu location="bottom end" offset="6" :z-index="zIndex ?? undefined">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon
        variant="text"
        aria-label="More actions"
      >
        <v-icon>mdi-dots-vertical</v-icon>
        <v-tooltip activator="parent" location="bottom" :z-index="zIndex ?? undefined">More actions</v-tooltip>
      </v-btn>
    </template>
    <v-list density="compact" min-width="220">
      <slot name="prepend-items" />
      <v-list-item
        v-if="showExport"
        prepend-icon="mdi-tray-arrow-down"
        :title="exportLabel"
        @click="$emit('export')"
      />
      <v-list-item
        v-if="apiUrl"
        prepend-icon="mdi-code-json"
        title="View in API"
        :href="apiUrl"
        target="_blank"
        rel="noopener"
      />
      <!-- Fly-in only: it has no other in-menu close. Same double-chevron as
           the control bar's close button. #641 -->
      <template v-if="showCloseItem">
        <v-divider class="my-1" />
        <v-list-item
          prepend-icon="mdi-chevron-double-right"
          title="Close panel"
          @click="$emit('close')"
        />
      </template>
      <slot name="append-items" />
    </v-list>
  </v-menu>
</template>

<script setup>
defineOptions({ name: "EntityMoreMenu" });

defineProps({
  // No URL, no "View in API" item (a private collection reads as not found
  // without the owner's key, so its page leaves this out).
  apiUrl: { type: String, default: "" },
  showExport: { type: Boolean, default: false },
  exportLabel: { type: String, default: "Export as CSV" },
  showCloseItem: { type: Boolean, default: false },
  // Only the entity fly-in sets this (it forces z-index 10000).
  zIndex: { type: Number, default: null },
});

defineEmits(["export", "close"]);
</script>
