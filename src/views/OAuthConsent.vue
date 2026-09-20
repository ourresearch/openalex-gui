<template>
  <v-container fluid class="auth-page fill-height">
    <v-row class="fill-height" align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4" xl="3">

        <!-- Bad link: missing/foreign return URL or request id -->
        <div v-if="!isValidRequest" class="text-center">
          <v-icon size="64" color="warning" class="mb-4">mdi-link-off</v-icon>
          <h1 class="text-h4 font-weight-bold mb-2">This link isn't valid</h1>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Go back to {{ clientName }} and connect OpenAlex again.
          </p>
          <v-btn variant="text" :to="{ name: 'Home' }">Go to OpenAlex</v-btn>
        </div>

        <!-- Consent -->
        <div v-else>
          <div class="text-center mb-8">
            <v-icon size="56" class="mb-3">mdi-shield-key-outline</v-icon>
            <h1 class="text-h4 font-weight-bold mb-2">Connect to OpenAlex</h1>
            <p class="text-body-1 text-medium-emphasis">
              <strong>{{ clientName }}</strong> wants to query OpenAlex on your behalf.
            </p>
          </div>

          <v-card flat class="pa-6" :loading="isLoading" :disabled="isLoading">
            <div class="text-body-2 mb-1 text-medium-emphasis">Signed in as</div>
            <div class="text-body-1 font-weight-medium mb-4">{{ userEmail }}</div>

            <div class="text-body-2 mb-1 text-medium-emphasis">Searches will use</div>
            <div class="text-body-1 font-weight-medium mb-1">
              <template v-if="isOrgOwner && organizationName">
                the <strong>{{ organizationName }}</strong> organization API key
              </template>
              <template v-else>
                your <strong>personal</strong> API key
              </template>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-6">
              <template v-if="isOrgOwner && organizationName">
                You own this organization, so its budget is spent instead of your personal one.
              </template>
              <template v-else>
                Every search {{ clientName }} runs counts against your daily budget, the same as the API.
              </template>
              It can read OpenAlex data only; it can't change your account.
            </p>

            <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
              {{ errorMessage }}
            </v-alert>

            <v-btn block size="large" color="primary" variant="flat" class="mb-2" @click="approve">
              Allow
            </v-btn>
            <v-btn block size="large" variant="text" @click="deny">
              Cancel
            </v-btn>
          </v-card>

          <p class="text-center mt-6 text-body-2 text-medium-emphasis">
            Not you?
            <a href="#" class="text-primary font-weight-medium" @click.prevent="switchAccount">Log in as someone else</a>
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { oauthReturnUrlIsAllowed } from '@/oauthConsent';

defineOptions({ name: 'OAuthConsentPage' });

const store = useStore();
const router = useRouter();
const route = useRoute();

useHead({ title: 'Connect to OpenAlex' });

const isLoading = ref(false);
const errorMessage = ref('');

const requestId = computed(() => String(route.query.request || ''));
const returnUrl = computed(() => String(route.query.return || ''));
const clientName = computed(() => String(route.query.client || 'This app').slice(0, 120));

const isValidRequest = computed(() =>
  /^[A-Za-z0-9_-]{20,64}$/.test(requestId.value) && oauthReturnUrlIsAllowed(returnUrl.value)
);

const userEmail = computed(() => store.getters['user/userEmail']);
const isOrgOwner = computed(() => store.getters['user/isOrgOwner']);
const organizationName = computed(() => store.getters['user/organizationName']);

const goBack = (params) => {
  const u = new URL(returnUrl.value);
  u.searchParams.set('request', requestId.value);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  window.location.assign(u.toString());
};

const approve = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const resp = await axios.post(
      urlBase.userApi + '/oauth/consent',
      { request_id: requestId.value, client_name: clientName.value },
      axiosConfig({ userAuth: true })
    );
    goBack({ code: resp.data.code });
  } catch (e) {
    isLoading.value = false;
    if (e.response?.status === 401) {
      router.push({ name: 'Login', query: { redirect: route.fullPath } });
      return;
    }
    errorMessage.value = e.response?.data?.message || 'Something went wrong. Please try again.';
  }
};

const deny = () => goBack({ error: 'access_denied' });

const switchAccount = () => {
  store.commit('user/logout');
  router.push({ name: 'Login', query: { redirect: route.fullPath } });
};
</script>

<style scoped lang="scss">
.auth-page {
  min-height: 100vh;
}
</style>
