<template>
  <!-- No StaticPage title: this page brings its own centered hero. -->
  <static-page>
    <section class="jobs-hero">
      <p class="jobs-eyebrow">Careers at OpenAlex</p>
      <h1 class="jobs-headline">New roles,<br>coming soon.</h1>
      <p class="jobs-sub">
        We're building the team behind the open catalog of the world's research.
        Openings will be posted here — and announced first to our user group.
      </p>
      <div class="jobs-cta">
        <a
          class="jobs-button"
          href="https://groups.google.com/g/openalex-users"
          target="_blank"
          rel="noopener noreferrer"
        >
          Join the user group
          <svg class="jobs-button-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M4 10L10 4M10 4H5M10 4V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
      <p class="jobs-note">We'll post a notification there the moment new jobs go live.</p>
    </section>
  </static-page>
</template>


<script setup>
import { useHead } from '@unhead/vue';
import StaticPage from '@/components/StaticPage/StaticPage.vue';

defineOptions({ name: 'JobsPage' });

useHead({
  title: 'Jobs',
  meta: [
    // Placeholder until real listings land — keep it out of the index for now.
    { name: 'robots', content: 'noindex' },
  ],
});
</script>


<style scoped lang="scss">
.jobs-hero {
  min-height: 72vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 96px 24px;
  max-width: 620px;
  margin: 0 auto;
}

.jobs-eyebrow {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #A1A1AA;
  margin: 0 0 20px 0;
}

.jobs-headline {
  font-size: 56px;
  font-weight: 600;
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: #0A0A0A;
  margin: 0 0 24px 0;
}

.jobs-sub {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.65;
  color: #52525B;
  max-width: 460px;
  margin: 0 0 36px 0;
}

.jobs-cta {
  margin: 0 0 20px 0;
}

.jobs-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #0A0A0A;
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  padding: 12px 20px;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;

  &:hover {
    background: #27272A;
    transform: translateY(-1px);
  }
}

.jobs-button-arrow {
  transition: transform 0.15s ease;
}

.jobs-button:hover .jobs-button-arrow {
  transform: translate(1px, -1px);
}

.jobs-note {
  font-size: 13px;
  font-weight: 400;
  color: #A1A1AA;
  margin: 0;
}

@media (max-width: 600px) {
  .jobs-hero {
    min-height: 68vh;
    padding: 72px 20px;
  }

  .jobs-headline {
    font-size: 40px;
  }

  .jobs-sub {
    font-size: 16px;
  }
}
</style>
