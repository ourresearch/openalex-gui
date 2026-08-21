<template>
  <!-- Done / To do pill shown at the right edge of a job-application section header
       (oxjob #812). Purely a progress affordance — the real gate is validate() on
       submit — so it carries no aria-live shouting; role="status" lets a screen
       reader pick up the flip if the user happens to be on the section. -->
  <span class="jss" :class="{ 'jss--done': done }" role="status">
    <svg v-if="done" class="jss-icon" viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
      <path d="M8 1.4a6.6 6.6 0 100 13.2A6.6 6.6 0 008 1.4zm3.06 4.7a.75.75 0 010 1.06l-3.6 3.6a.75.75 0 01-1.06 0L4.94 9.26A.75.75 0 116 8.2l1.93 1.93 3.07-3.07a.75.75 0 011.06 0z" />
    </svg>
    <svg v-else class="jss-icon" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2.4 2.4" aria-hidden="true">
      <circle cx="8" cy="8" r="6" />
    </svg>
    {{ done ? 'Done' : 'To do' }}
  </span>
</template>


<script setup>
defineOptions({ name: 'JobSectionStatus' });

defineProps({
  done: { type: Boolean, default: false },
});
</script>


<style scoped lang="scss">
.jss {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  padding: 3px 9px 3px 7px;
  border: 1px solid #E4E4E7;
  border-radius: 999px;
  background: transparent;
  color: #A1A1AA;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  line-height: 1.5;
  white-space: nowrap;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;

  &--done {
    border-color: #BBF7D0;
    background: #F0FDF4;
    color: #15803D;
  }
}

.jss-icon {
  display: block;
  flex: none;
}

// The check pops in when a section flips to done. Skipped for reduced-motion.
.jss--done .jss-icon {
  animation: jss-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes jss-pop {
  from { transform: scale(0.4); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .jss { transition: none; }
  .jss--done .jss-icon { animation: none; }
}
</style>
