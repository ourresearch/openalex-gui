<template>
  <v-container class="py-12" style="max-width: 560px;">
    <v-card rounded flat border class="pa-6">
      <div class="text-h6 mb-3">{{ copy.title }}</div>
      <p v-if="stage === 'linking'">{{ copy.orcidCallback.linking }}</p>
      <p v-else-if="stage === 'checking'">{{ copy.checking }}</p>
      <p v-else-if="stage === 'approved'">{{ copy.approved }}</p>
      <template v-else-if="stage === 'needs_evidence'">
        <p class="font-weight-medium">{{ copy.notYet }}</p>
        <p style="white-space: pre-line;">{{ reason }}</p>
      </template>
      <p v-else-if="stage === 'still'">{{ copy.stillChecking }}</p>
      <p v-else class="text-error">{{ errorMessage || copy.orcidCallback.failed }}</p>
      <v-btn v-if="authorId && stage !== 'linking' && stage !== 'checking'" class="mt-2" rounded color="primary" variant="flat" :to="`/${authorId}`">
        Open the profile
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup>
// ORCID sign-in return page (oxjob #1466). orcid.org sends the user here with
// ?code=...&state=<author id>. We link the iD to the account, claim the
// profile, and wait for the verifier's answer (a matching iD approves it).
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { copy, reasonText } from '@/components/Entity/claimCopy.js';

defineOptions({ name: 'OrcidCallback' });

const store = useStore();
const route = useRoute();
const stage = ref('linking');
const errorMessage = ref('');
const authorId = computed(() => (/^A\d+$/i.test(route.query.state || '') ? String(route.query.state).toUpperCase() : null));
const reason = computed(() => {
  const c = store.getters['user/userClaim'];
  return reasonText(c?.feedback_code, { email: store.getters['user/userEmail'], link: c?.feedback_link });
});

onMounted(async () => {
  const code = route.query.code;
  if (!code || route.query.error) {
    stage.value = 'error';
    return;
  }
  try {
    await store.dispatch('user/linkOrcid', { code, redirectUri: `${window.location.origin}/orcid-callback` });
    if (authorId.value && !store.getters['user/userAuthorId']) {
      const claim = store.getters['user/userClaim'];
      const sameProfile = claim && (claim.author_id || '').split('/').pop().toUpperCase() === authorId.value;
      if (!sameProfile || claim.decision !== 'pending') {
        await store.dispatch('user/setAuthorId', { authorId: authorId.value, evidence: '' });
      }
    }
    stage.value = 'checking';
    const claim = await store.dispatch('user/pollClaim', { timeoutMs: 90000 });
    stage.value = store.getters['user/userAuthorId'] ? 'approved'
      : claim?.decision === 'needs_evidence' ? 'needs_evidence'
        : 'still';
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || '';
    stage.value = 'error';
  }
});
</script>
