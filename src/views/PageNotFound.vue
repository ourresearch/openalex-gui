<template>
  <div class="nf-page">
    <div class="nf-content">
      <div class="nf-eyebrow">
        <span class="nf-code">404</span>
        <span v-if="attemptedPath" class="nf-path">{{ attemptedPath }}</span>
      </div>
      <h1 class="nf-title">Page not found</h1>
      <p class="nf-lead">
        We index over 300&nbsp;million scholarly works — but this page
        isn&rsquo;t one of them. It may have moved, or the link may be broken.
      </p>
      <div class="nf-actions">
        <v-btn color="primary" variant="flat" to="/" class="nf-home-btn">
          Back to home
        </v-btn>
        <a href="https://help.openalex.org" target="_blank" rel="noopener" class="nf-help-link">
          Visit the help center
          <v-icon size="14" class="nf-help-arrow">mdi-arrow-top-right</v-icon>
        </a>
      </div>
    </div>
  </div>
</template>


<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  name: 'PageNotFound',
});

const route = useRoute();

// Echo the URL that missed (Linear/Vercel error-page pattern) so screenshots
// and support tickets carry the broken path with them.
const attemptedPath = computed(() => {
  const p = route.path || '';
  return p.length > 60 ? p.slice(0, 57) + '…' : p;
});
</script>


<style scoped lang="scss">
.nf-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 96px 24px;
}

.nf-content {
  max-width: 560px;
  text-align: center;
}

.nf-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  animation: nf-rise 0.5s ease both;
}

.nf-code {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ox-text-tertiary);
  border: 1px solid var(--ox-border-default);
  border-radius: 999px;
  padding: 3px 12px;
}

.nf-path {
  font-family: monospace;
  font-size: 13px;
  color: var(--ox-text-muted);
  overflow-wrap: anywhere;
}

.nf-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--ox-text-primary);
  margin: 0 0 20px;
  animation: nf-rise 0.5s 0.06s ease both;
}

.nf-lead {
  font-size: 17px;
  line-height: 1.65;
  color: var(--ox-text-tertiary);
  margin: 0 0 36px;
  animation: nf-rise 0.5s 0.12s ease both;
}

.nf-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  animation: nf-rise 0.5s 0.18s ease both;
}

.nf-help-arrow {
  margin-left: 2px;
  opacity: 0.6;
}

@keyframes nf-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nf-eyebrow, .nf-title, .nf-lead, .nf-actions {
    animation: none;
  }
}

@media (max-width: 600px) {
  .nf-page {
    padding: 64px 20px;
  }
  .nf-title {
    font-size: 36px;
  }
  .nf-actions {
    flex-direction: column;
    gap: 16px;
  }
}
</style>

<style lang="scss">
/* Beat the App.vue global blue-anchor rule (b=6, !important) — see AGENTS.md
   "global CSS overrides"; same b=7 recipe as SiteTopBar. */
.v-application .nf-page a.nf-help-link.nf-help-link.nf-help-link.nf-help-link.nf-help-link {
  color: var(--ox-text-secondary) !important;
  text-decoration: none !important;
  font-size: 15px;
  font-weight: 500;

  &:hover {
    color: var(--ox-text-primary) !important;
  }
}
</style>
