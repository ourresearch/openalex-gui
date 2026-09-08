<template>
  <!-- Support intake (oxjob #751). Replaces the redirect to
       openalex.zendesk.com/hc/requests/new — the only ticket-intake path we had, and the
       reason the legacy Zendesk help center couldn't be retired (#811).

       Zendesk is still the system of record, but users never see it: the form posts to
       users-api /users/me/tickets, which files the ticket attributed to the user's
       OpenAlex account. Login-required by design (it's what links a ticket to an
       account); mailto:support@ stays the path for people without one.

       The form itself lives in SupportRequestForm.vue (#823) — it's also shown in the
       New-request dialog on settings/tickets, so keep this page a thin shell. -->
  <static-page title="Contact support">
    <template #intro>
      Found a problem in the data, or stuck on something? Send us a note and we'll take a look.
    </template>

    <div class="sf-wrap">
      <support-request-form />
    </div>
  </static-page>
</template>


<script setup>
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import SupportRequestForm from '@/components/SupportRequestForm.vue';

defineOptions({ name: 'SupportPage' });
</script>


<style scoped lang="scss">
.sf-wrap {
  max-width: 848px;
  margin: 0 auto;
  padding: 8px 24px 96px;
}
</style>
