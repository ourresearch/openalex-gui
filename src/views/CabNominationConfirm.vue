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
              {{ result.status === 'confirmed' ? "You're on the ballot!" : "You're off the ballot" }}
            </div>
          </div>
          <div class="text-body-2 text-medium-emphasis">
            <template v-if="result.status === 'confirmed'">
              Thanks, {{ result.nominee_name }} — your candidacy for the OpenAlex Community
              Advisory Board is confirmed. Member organizations vote later this year, and the
              sitting board announces the new members in December. We'll be in touch.
            </template>
            <template v-else>
              No problem — you've been removed from the ballot, and the nominating organization
              can put someone else forward. Thanks for considering it.
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
            You've been nominated to stand for the OpenAlex Community Advisory Board, and your
            nominating organization has confirmed you agreed — so you're on the ballot, and if
            you're happy to stand there's nothing you need to do. If you did not agree to this
            nomination, or you'd rather not stand this year, you can remove yourself here.
          </div>
          <!-- Two-step so a stray click can't take someone off the ballot. -->
          <v-btn
            v-if="!armed"
            variant="outlined"
            color="error"
            @click="armed = true"
          >
            Remove me from the ballot
          </v-btn>
          <template v-else>
            <div class="text-body-2 mb-3">
              This takes you off the ballot for this election. Are you sure?
            </div>
            <v-btn
              color="error"
              variant="flat"
              class="mr-2"
              :loading="submitting"
              @click="respond('decline')"
            >
              Yes, remove me
            </v-btn>
            <v-btn variant="outlined" :disabled="submitting" @click="armed = false">
              Cancel
            </v-btn>
          </template>
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

useHead({ title: 'Your nomination - OpenAlex' });

const route = useRoute();

const result = ref(null);
const error = ref('');
const submitting = ref(false);
const armed = ref(false);

// Nominations are confirmed at submission (the nominator attests consent), so
// this page is the nominee's escape hatch: the tokened link in their record
// email lands here, and the only action is removing themselves from the
// ballot. Deliberately click-to-act (never auto-submit on load): email link
// prefetchers follow GETs, and leaving the ballot should be a human act.

onMounted(() => {
  if (!route.query.token) {
    error.value = 'This link is missing its token. Please use the link from your email, or contact support@openalex.org.';
  }
});

async function respond(action) {
  submitting.value = true;
  try {
    // userAuth (not the default config): the default attaches the
    // X-OpenAlex-UI provenance header meant for api.openalex.org, which the
    // user API's CORS preflight rejected — the bug that broke this page for
    // HHMI's nominee. The emailed token is the only credential needed here.
    const res = await axios.post(
      `${urlBase.userApi}/cab/nomination-confirmations`,
      { token: route.query.token, action },
      axiosConfig({ userAuth: true })
    );
    result.value = res.data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'This link is invalid or has expired. Contact support@openalex.org if you think that\'s a mistake.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.confirm-page {
  padding: 64px 16px;
  min-height: calc(100vh - var(--chrome-height));
  background-color: #FAFAFA;
}
</style>
