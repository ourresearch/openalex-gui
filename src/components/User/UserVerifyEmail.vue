<template>
  <v-container class="d-flex justify-center align-center fill-height">
    <!-- Ready state: require an explicit click before consuming the token.
         Email security scanners (Mimecast, Defender Safe Links, Proofpoint, …)
         pre-fetch links and execute page JS, but do not click buttons. Auto-
         verifying on mount let those scanners consume the single-use token
         before the real user clicked, so their click hit a dead token and saw
         "Verification link invalid". Same root cause + fix as the magic-login
         page (oxjob #321 → #326). -->
    <v-card v-if="isReady" class="verify-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="primary" class="mb-4">mdi-email-check-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">Verify your email</h1>
      <p class="text-body-2 text-medium-emphasis mb-8">
        Click below to confirm your email address.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        block
        @click="doVerify"
      >
        Verify email
      </v-btn>
    </v-card>

    <!-- Loading state -->
    <v-card v-else-if="isLoading" class="verify-card text-center" width="400" rounded="xl" elevation="0">
      <v-progress-circular indeterminate color="primary" size="32" width="3" class="mb-4"/>
      <h1 class="text-h6 font-weight-medium mb-2">Verifying email…</h1>
      <p class="text-body-2 text-medium-emphasis">
        Confirming your email address.
      </p>
    </v-card>

    <!-- Error state -->
    <v-card v-else-if="hasError" class="verify-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="error" class="mb-4">mdi-alert-circle-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">Verification link invalid</h1>
      <p class="text-body-2 text-medium-emphasis mb-8">
        This link has expired or has already been used. You can request a fresh
        one from your settings page.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        block
        @click="goToSettings"
      >
        Back to settings
      </v-btn>
    </v-card>

    <!-- Success state (brief, before redirect) -->
    <v-card v-else class="verify-card text-center" width="400" rounded="xl" elevation="0">
      <v-icon size="28" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
      <h1 class="text-h6 font-weight-medium mb-2">Email verified</h1>
      <p class="text-body-2 text-medium-emphasis">
        {{ verifiedEmail }} is now verified. Redirecting…
      </p>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { sanitizeLoginToken } from '@/util'

defineOptions({ name: 'VerifyEmail' })

const store = useStore()
const route = useRoute()
const router = useRouter()

// Start in the "ready" state showing a Verify button. We deliberately do NOT
// consume the token on mount: email link scanners load this page and run its
// JS, but don't click buttons, so gating consumption behind a real click keeps
// the single-use token alive for the actual user (oxjob #326).
const isReady = ref(true)
const isLoading = ref(false)
const hasError = ref(false)
const verifiedEmail = ref('')

const doVerify = async () => {
  // Strip any stray char a mail gateway appended to the link's URL (#8891).
  const token = sanitizeLoginToken(route.query.token)
  if (!token) {
    isReady.value = false
    hasError.value = true
    return
  }
  isReady.value = false
  isLoading.value = true
  try {
    const resp = await store.dispatch('user/verifyEmail', token)
    verifiedEmail.value = resp?.email?.email || 'Your email'
    isLoading.value = false
    store.commit('snackbar', `${verifiedEmail.value} verified`)
    setTimeout(() => {
      router.push(localStorage.getItem('token') ? '/settings/profile' : '/login')
    }, 800)
  } catch (e) {
    console.error('Email verification failed:', e)
    isLoading.value = false
    hasError.value = true
  }
}

const goToSettings = () => {
  router.push(localStorage.getItem('token') ? '/settings/profile' : '/login')
}
</script>

<style scoped>
.verify-card {
  /* Matches the magic-login card (UserMagicToken.vue): roomy, centered,
     hairline border, full-width primary CTA. */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 36px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.verify-card :deep(.v-btn) {
  width: 100%;
}
</style>
