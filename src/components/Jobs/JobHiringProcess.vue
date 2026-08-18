<template>
  <!-- Hiring-process steps (oxjob #812). Vuetify timeline restyled to the house
       Linear-ish register: numbered dots on a thin line, horizontal on desktop,
       vertical on mobile. Shared by both job listing pages. -->
  <v-timeline
    class="jhp"
    :direction="smAndDown ? 'vertical' : 'horizontal'"
    side="end"
    align="start"
    truncate-line="both"
    line-thickness="1"
    density="comfortable"
  >
    <v-timeline-item
      v-for="(step, i) in steps"
      :key="step"
      dot-color="white"
      fill-dot
      size="28"
    >
      <template #icon>
        <span class="jhp-num">{{ i + 1 }}</span>
      </template>
      <div class="jhp-label">{{ step }}</div>
    </v-timeline-item>
  </v-timeline>
</template>


<script setup>
import { useDisplay } from 'vuetify';

defineOptions({ name: 'JobHiringProcess' });

const { smAndDown } = useDisplay();

const steps = [
  'Application',
  'Screening interview',
  'In-depth interview',
  'One-day paid work trial',
  'Offer',
];
</script>


<style scoped lang="scss">
.jhp {
  margin-top: 4px;

  :deep(.v-timeline-divider__dot) {
    background: #fff;
    border: 1px solid #E4E4E7;
    box-shadow: none;
  }

  :deep(.v-timeline-divider__inner-dot) {
    background: #fff !important;
  }

  :deep(.v-timeline-divider__line) {
    background: #E4E4E7;
  }
}

.jhp-num {
  font-size: 13px;
  font-weight: 600;
  color: #52525B;
  line-height: 1;
}

.jhp-label {
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  line-height: 1.4;
}
</style>
