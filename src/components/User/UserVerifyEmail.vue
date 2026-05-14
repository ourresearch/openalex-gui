<template>
  <v-container class="d-flex justify-center fill-height">
    <v-card v-if="isLoading" loading max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-loading mdi-spin</v-icon>
        Verifying email...
      </v-card-title>
    </v-card>

    <v-card v-else-if="hasError" max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start color="error">mdi-alert-circle</v-icon>
        Verification link invalid
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          This verification link has expired or is invalid.
        </p>
        <p class="text-body-2 text-medium-emphasis mt-2">
          You can request a new one from your settings page.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn color="primary" variant="flat" rounded @click="goToSettings">
          Back to settings
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-card v-else max-width="500" min-width="300" flat rounded>
      <v-card-title class="d-flex align-center">
        <v-icon start color="success">mdi-check-circle</v-icon>
        Email verified
      </v-card-title>
      <v-card-text>
        <p class="text-body-1">
          {{ verifiedEmail }} is now verified. Redirecting...
        </p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'VerifyEmail' })

const store = useStore()
const route = useRoute()
const router = useRouter()

const isLoading = ref(true)
const hasError = ref(false)
const verifiedEmail = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    isLoading.value = false
    hasError.value = true
    return
  }
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
})

const goToSettings = () => {
  router.push(localStorage.getItem('token') ? '/settings/profile' : '/login')
}
</script>
