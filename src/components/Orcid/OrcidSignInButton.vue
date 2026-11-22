<template>
  <div>
    <v-btn
      block
      :size="size"
      variant="outlined"
      rounded
      class="orcid-sign-in"
      @click="go"
    >
      <OrcidIcon :size="18" class="mr-2" />
      {{ flow === 'signup' ? words.signUp : words.logIn }}
    </v-btn>
    <div class="orcid-or text-medium-emphasis">
      <span>{{ words.or }}</span>
    </div>
  </div>
</template>

<script setup>
// "Log in with ORCID" / "Sign up with ORCID" (oxjob #2538), above the email form on the log-in and sign-up pages
// and dialogs. Both go to orcid.org and back to /orcid-callback, which logs in, or asks for an email to finish.
import OrcidIcon from './OrcidIcon.vue';
import { copy } from '@/components/Entity/claimCopy.js';
import { startOrcidTrip } from './orcidAuth.js';
import { sanitizeRedirectPath } from '@/util';

defineOptions({ name: 'OrcidSignInButton' });

const props = defineProps({
  flow: { type: String, default: 'login', validator: (v) => ['login', 'signup'].includes(v) },
  redirect: { type: String, default: null },
  size: { type: String, default: 'large' },
});

const words = copy.orcidSignIn;

function go() {
  startOrcidTrip({ flow: props.flow, redirect: sanitizeRedirectPath(props.redirect, null) });
}
</script>

<style scoped>
.orcid-sign-in {
  text-transform: none;
  letter-spacing: normal;
}
.orcid-or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  font-size: 13px;
}
.orcid-or::before,
.orcid-or::after {
  content: '';
  flex: 1;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
