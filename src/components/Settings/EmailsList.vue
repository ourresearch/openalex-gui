<template>
  <div class="emails-list">
    <div class="emails-list-header">
      <div class="emails-list-description">{{ emails.length }} email{{ emails.length === 1 ? '' : 's' }} on your account</div>
      <v-btn
        variant="text"
        size="small"
        class="settings-action"
        @click="openAdd"
      >
        Add email
      </v-btn>
    </div>

    <div class="emails-list-rows">
      <div
        v-for="row in emails"
        :key="row.id"
        class="emails-list-row"
      >
        <div class="emails-list-row-main">
          <v-icon class="email-icon" size="18">mdi-email-outline</v-icon>
          <span class="email-text">{{ row.email }}</span>
          <v-tooltip v-if="row.is_primary" location="top" text="This is your main organizational affiliation.">
            <template #activator="{props}">
              <span class="badge badge-primary" v-bind="props">Primary</span>
            </template>
          </v-tooltip>
          <v-tooltip v-else-if="!row.verified_at" location="top" text="Please check your inbox for verification email.">
            <template #activator="{props}">
              <span class="email-status" v-bind="props">Unverified</span>
            </template>
          </v-tooltip>
        </div>
        <v-menu location="bottom end" :disabled="emails.length === 1">
          <template v-slot:activator="{props}">
            <v-btn
              icon
              variant="plain"
              size="small"
              v-bind="props"
              :disabled="emails.length === 1"
              aria-label="Email actions"
            >
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="220">
            <v-list-item
              :disabled="!canMakePrimary(row)"
              @click="canMakePrimary(row) && makePrimary(row)"
            >
              <v-list-item-title>Make primary</v-list-item-title>
            </v-list-item>

            <v-list-item
              v-if="!row.verified_at"
              @click="resend(row)"
            >
              <v-list-item-title>Resend verification</v-list-item-title>
            </v-list-item>

            <v-list-item @click="remove(row)">
              <v-list-item-title class="text-error">Remove</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-dialog v-model="addOpen" max-width="480">
      <v-card flat rounded>
        <v-card-title>Add email</v-card-title>
        <div class="dialog-body">
          <p class="help-text">
            We'll send a verification to the new address.
          </p>
          <input
            ref="inputEl"
            v-model="addEmailValue"
            type="email"
            class="settings-text-input"
            placeholder="name@example.com"
            :disabled="adding"
            @keydown.enter="submitAdd"
          />
          <div v-if="addError" class="error-text">{{ addError }}</div>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" rounded :disabled="adding" @click="addOpen = false">Cancel</v-btn>
          <v-btn
            variant="flat"
            rounded
            color="primary"
            :loading="adding"
            :disabled="!addEmailValue.trim() || adding"
            @click="submitAdd"
          >
            Send verification
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const emails = computed(() => store.state.user.emails || [])

const addOpen = ref(false)
const addEmailValue = ref('')
const addError = ref('')
const adding = ref(false)
const inputEl = ref(null)

onMounted(() => {
  if (!emails.value.length) {
    store.dispatch('user/fetchEmails').catch(() => {})
  }
})

watch(addOpen, (open) => {
  if (open) {
    addEmailValue.value = ''
    addError.value = ''
    nextTick(() => inputEl.value?.focus())
  }
})

const openAdd = () => { addOpen.value = true }

const submitAdd = async () => {
  if (!addEmailValue.value.trim() || adding.value) return
  addError.value = ''
  adding.value = true
  const submittedEmail = addEmailValue.value.trim()
  try {
    await store.dispatch('user/addEmail', submittedEmail)
    adding.value = false
    addOpen.value = false
    store.commit('snackbar', 'Verification email sent')
  } catch (e) {
    adding.value = false
    const data = e?.response?.data
    const code = data?.message?.error
    if (code === 'email_in_use') {
      addError.value = 'This email is already on another account.'
    } else if (code === 'already_yours') {
      addError.value = 'You already have this email.'
    } else if (e?.response?.status === 429) {
      addError.value = 'Too many verification requests. Try again later.'
    } else if (e?.response?.status === 400) {
      addError.value = 'Please enter a valid email address.'
    } else {
      addError.value = 'Something went wrong. Please try again.'
    }
  }
}

const canMakePrimary = (row) => !row.is_primary && !!row.verified_at

const makePrimary = async (row) => {
  try {
    await store.dispatch('user/makePrimary', row.id)
    store.commit('snackbar', `${row.email} is now your primary email`)
  } catch (e) {
    store.commit('snackbar', 'Failed to change primary email')
  }
}

const remove = async (row) => {
  try {
    await store.dispatch('user/removeEmail', row.id)
    store.commit('snackbar', `${row.email} removed`)
  } catch (e) {
    store.commit('snackbar', 'Failed to remove email')
  }
}

const resend = async (row) => {
  try {
    await store.dispatch('user/resendVerification', row.id)
    store.commit('snackbar', `Verification email resent to ${row.email}`)
  } catch (e) {
    store.commit('snackbar', 'Failed to resend verification email')
  }
}
</script>

<style scoped>
.emails-list {
  display: flex;
  flex-direction: column;
}

.emails-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #F0F0F0;
  gap: 24px;
}

.emails-list-description {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A1A;
  line-height: 1.4;
}

.email-icon {
  color: #6B6B6B;
}

.emails-list-rows {
  display: flex;
  flex-direction: column;
}

.emails-list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #F0F0F0;
  gap: 16px;
}

.emails-list-row:last-child {
  border-bottom: none;
}

.emails-list-row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}

.email-text {
  font-size: 14px;
  color: #1A1A1A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  line-height: 1;
}

.badge-primary {
  background: #F5F5F5;
  color: #1A1A1A;
  border: 1px solid #E5E5E5;
  cursor: help;
}

.email-status {
  font-size: 12px;
  color: #6B6B6B;
  cursor: help;
}

.dialog-body {
  padding: 0 24px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.help-text {
  font-size: 13px;
  color: #6B6B6B;
  line-height: 1.5;
  margin: 0;
}

.settings-text-input {
  font-size: 14px;
  padding: 0 12px;
  height: 36px;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  background: #FFFFFF;
  color: #1A1A1A;
  width: 100%;
  outline: none;
  transition: border-color 0.15s;
}

.settings-text-input:focus {
  border-color: #1A1A1A;
}

.settings-text-input::placeholder {
  color: #9CA3AF;
}

.error-text {
  color: #B91C1C;
  font-size: 13px;
}

@media (max-width: 600px) {
  .emails-list-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
