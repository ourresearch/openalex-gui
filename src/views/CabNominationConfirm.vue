<template>
  <div class="confirm-page">
    <v-card variant="outlined" max-width="520" class="mx-auto">
      <v-card-text class="pa-8">
        <!-- Result state -->
        <template v-if="result">
          <div class="d-flex align-center mb-3">
            <v-icon size="32" :color="result.status === 'confirmed' ? 'success' : 'grey'" class="mr-3">
              {{ result.status === 'confirmed' ? 'mdi-check-circle' : 'mdi-close-circle-outline' }}
            </v-icon>
            <div class="text-h6 font-weight-bold">
              {{ result.status === 'confirmed' ? "You're on the ballot!" : 'Nomination declined' }}
            </div>
          </div>
          <div class="text-body-2 text-medium-emphasis">
            <template v-if="result.status === 'confirmed'">
              Thanks, {{ result.nominee_name }} — your candidacy for the OpenAlex Community
              Advisory Board is confirmed. Member organizations vote later this year, and the
              sitting board announces the new members in December. We'll be in touch.
            </template>
            <template v-else>
              No problem — you won't appear on the ballot, and the nominating organization can
              put someone else forward. Thanks for considering it.
            </template>
          </div>
        </template>

        <!-- Error state -->
        <template v-else-if="error">
          <div class="d-flex align-center mb-3">
            <v-icon size="32" color="warning" class="mr-3">mdi-alert-circle-outline</v-icon>
            <div class="text-h6 font-weight-bold">Something's not right</div>
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ error }}</div>
        </template>

        <!-- Action state -->
        <template v-else>
          <div class="text-h6 font-weight-bold mb-2">
            Community Advisory Board nomination
          </div>
          <div class="text-body-2 text-medium-emphasis mb-6">
            You've been nominated to stand for the OpenAlex Community Advisory Board. So you
            know what you'd be signing up for: a two-year term with quarterly 90-minute
            meetings, readings in advance of each meeting, and the possibility of serving on
            specific working groups. Please confirm whether you're willing to appear on the
            ballot.
          </div>
          <v-btn
            color="primary"
            variant="flat"
            class="mr-2"
            :loading="submitting === 'confirm'"
            :disabled="!!submitting"
            @click="respond('confirm')"
          >
            Confirm my candidacy
          </v-btn>
          <v-btn
            variant="outlined"
            :loading="submitting === 'decline'"
            :disabled="!!submitting"
            @click="respond('decline')"
          >
            Decline
          </v-btn>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'CabNominationConfirm' });

useHead({ title: 'Confirm your nomination - OpenAlex' });

const route = useRoute();

const result = ref(null);
const error = ref('');
const submitting = ref('');

// Deliberately click-to-confirm (never auto-submit on load): email link
// prefetchers follow GETs, and confirming candidacy should be a human act.
// The `action` query param from the email just labels which button was
// clicked there; the user still confirms on this page.

onMounted(() => {
  if (!route.query.token) {
    error.value = 'This confirmation link is missing its token. Please use the link from your email, or contact support@openalex.org.';
  }
});

async function respond(action) {
  submitting.value = action;
  try {
    const res = await axios.post(
      `${urlBase.userApi}/cab/nomination-confirmations`,
      { token: route.query.token, action },
      axiosConfig()
    );
    result.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'This link is invalid or has expired. Contact support@openalex.org if you think that\'s a mistake.';
  } finally {
    submitting.value = '';
  }
}
</script>

<style scoped>
.confirm-page {
  padding: 64px 16px;
  min-height: calc(100vh - var(--app-bar-height));
  background-color: #FAFAFA;
}
</style>
