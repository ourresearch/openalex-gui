<!--
  Asked before someone makes a collection of people (oxjob #646): in the create
  wizard and before Make a copy. Continue goes on; Cancel stops.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded class="pa-2">
      <v-card-title class="text-h6 text-wrap">
        <v-icon start class="warning-icon" aria-hidden="true">mdi-account-alert-outline</v-icon>
        A collection of people
      </v-card-title>
      <v-card-text class="warning-text">{{ PEOPLE_COLLECTION_WARNING }}</v-card-text>
      <v-card-actions class="px-4 pb-3">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn variant="flat" color="primary" @click="onContinue">Continue</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { PEOPLE_COLLECTION_WARNING } from "@/components/Collection/peopleCollectionWarning";

defineOptions({ name: "PeopleCollectionWarningDialog" });
defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue", "continue"]);

function onContinue() {
  emit("update:modelValue", false);
  emit("continue");
}
</script>

<style scoped>
.warning-icon {
  color: #7a4100;
}
.warning-text {
  color: rgba(0, 0, 0, 0.8);
  font-size: 1rem;
  line-height: 1.5;
}
</style>
