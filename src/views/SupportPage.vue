<template>
  <!-- Support intake (oxjob #751). Replaces the redirect to
       openalex.zendesk.com/hc/requests/new — the only ticket-intake path we had, and the
       reason the legacy Zendesk help center couldn't be retired (#811).

       Zendesk is still the system of record, but users never see it: this posts to
       users-api /users/me/tickets, which files the ticket attributed to the user's
       OpenAlex account. Login-required by design (it's what links a ticket to an
       account); mailto:support@ stays the path for people without one. -->
  <static-page title="Contact support">
    <template #intro>
      Found a problem in the data, or stuck on something? Send us a note and we'll take a look.
    </template>

    <div class="sf-wrap">
      <!-- Filed -->
      <div v-if="filed" class="sf-panel">
        <div class="sf-panel-title">Thanks — your request is in.</div>
        <p class="sf-panel-body">
          We've sent a confirmation to <strong>{{ accountEmail }}</strong
          ><span v-if="filedId"> (request {{ filedId }})</span>. You can reply to that email to
          add more detail.
        </p>
        <p class="sf-panel-body">
          We read everything, but we can't reply to every request — for common questions
          <a href="https://help.openalex.org/" target="_blank" rel="noopener">our help center</a>
          is usually faster.
        </p>
        <button type="button" class="sf-add-btn" @click="reset">Send another request</button>
      </div>

      <!-- Logged out: no fillable fields (you can't submit without an account anyway) -->
      <template v-else-if="!userId">
        <p class="sf-body">
          Please log in or create an account to submit this form. It's free and takes less than
          one minute.
        </p>
        <div class="sf-cta-row">
          <button type="button" class="sf-cta sf-cta--primary" @click="goLogin">Log in</button>
          <button type="button" class="sf-cta sf-cta--secondary" @click="goSignup">
            Create account
          </button>
        </div>
        <p class="sf-body sf-fallback">
          Or skip the form and just email us at
          <a href="mailto:support@openalex.org">support@openalex.org</a> — that works too.
        </p>
      </template>

      <!-- Logged in: the form -->
      <form v-else class="sf-form" novalidate @submit.prevent="submit">
        <p class="sf-identity">
          Filing as
          <router-link :to="{ name: 'settings-profile' }" class="sf-identity-link">{{
            accountName || accountEmail
          }}</router-link
          ><span v-if="accountName" class="sf-identity-email"> ({{ accountEmail }})</span>
        </p>

        <div class="sf-field">
          <label class="sf-label" for="sf-subject"
            >Subject <span class="sf-req" aria-hidden="true">*</span></label
          >
          <input
            id="sf-subject"
            v-model.trim="form.subject"
            class="sf-input"
            type="text"
            maxlength="150"
            placeholder="A one-line summary"
            aria-required="true"
          />
          <span v-if="errors.subject" class="sf-error">{{ errors.subject }}</span>
        </div>

        <div class="sf-field">
          <label class="sf-label" for="sf-body"
            >What's going on? <span class="sf-req" aria-hidden="true">*</span></label
          >
          <textarea
            id="sf-body"
            v-model="form.body"
            class="sf-input sf-textarea"
            rows="9"
            placeholder="Links to the affected records (works, authors, institutions) help a lot — as does what you expected to see."
            aria-required="true"
          ></textarea>
          <span v-if="errors.body" class="sf-error">{{ errors.body }}</span>
        </div>

        <p v-if="serverError" class="sf-error sf-error--server">{{ serverError }}</p>

        <div class="sf-submit-row">
          <button type="submit" class="sf-submit" :disabled="submitting">
            {{ submitting ? 'Sending…' : 'Send request' }}
          </button>
        </div>
      </form>
    </div>
  </static-page>
</template>


<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'SupportPage' });

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
const accountName = computed(() => store.getters['user/userName'] || '');
const accountEmail = computed(() => store.getters['user/userEmail'] || '');

// Mirrors the users-api validation so the user gets the message inline rather
// than as a 400 round-trip.
const MIN_BODY_LEN = 10;

const DRAFT_KEY = 'supportRequestDraft';

const blankForm = () => ({ subject: '', body: '' });

const form = reactive(blankForm());
const errors = reactive({});
const serverError = ref('');
const submitting = ref(false);
const filed = ref(false);
const filedId = ref(null);

function goLogin() { router.push({ name: 'Login' }); }
function goSignup() { router.push({ name: 'Signup' }); }

// ---- draft persistence ----
// Support requests are often long and written while the user is already annoyed;
// losing one to an accidental navigation is the worst possible moment for it.
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  } catch (e) { /* quota / private mode — non-fatal */ }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
}
try {
  const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  if (saved) Object.assign(form, blankForm(), saved);
} catch (e) { /* corrupt draft — ignore */ }

let saveTimer = null;
watch(form, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 400);
}, { deep: true });

// ---- validation ----
function validate() {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.subject.trim()) errors.subject = 'Please add a subject.';
  const body = form.body.trim();
  if (!body) {
    errors.body = 'Please describe the problem.';
  } else if (body.length < MIN_BODY_LEN) {
    errors.body = 'Please add a bit more detail.';
  }
  return Object.keys(errors).length === 0;
}

function reset() {
  Object.assign(form, blankForm());
  filed.value = false;
  filedId.value = null;
  serverError.value = '';
}

// ---- submit ----
async function submit() {
  serverError.value = '';
  if (!userId.value) { goLogin(); return; }
  if (!validate()) return;
  submitting.value = true;
  try {
    const resp = await axios.post(
      `${urlBase.userApi}/users/me/tickets`,
      { subject: form.subject.trim(), body: form.body.trim() },
      axiosConfig({ userAuth: true }),
    );
    filedId.value = resp.data?.id || null;
    clearDraft();
    filed.value = true;
  } catch (e) {
    const status = e.response?.status;
    if (status === 401) {
      goLogin();
    } else if (status === 503) {
      serverError.value =
        "Support requests aren't available right now. Please email support@openalex.org instead.";
    } else {
      serverError.value =
        e.response?.data?.message ||
        "We couldn't send your request. Please try again, or email support@openalex.org.";
    }
  } finally {
    submitting.value = false;
  }
}
</script>


<style scoped lang="scss">
.sf-wrap {
  max-width: 848px;
  margin: 0 auto;
  padding: 8px 24px 96px;
}

.sf-body {
  font-size: 15px;
  line-height: 1.6;
  color: #52525b;
  margin: 0 0 20px;
}

.sf-fallback {
  margin-top: 24px;
  color: #71717a;

  a { color: #0a0a0a; }
}

// ---- identity ----
.sf-identity {
  font-size: 15px;
  line-height: 1.6;
  color: #52525b;
  margin: 0 0 24px;
}

.sf-identity-link {
  color: #0a0a0a;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { opacity: 0.8; }
}

.sf-identity-email { color: #71717a; }

// ---- fields (house Linear-style, matching JobApplicationForm) ----
.sf-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.sf-label {
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
  margin-bottom: 6px;
}

.sf-req {
  color: #dc2626;
  font-weight: 700;
}

.sf-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #0a0a0a;
  background: #fff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;

  &::placeholder { color: #a1a1aa; }

  &:hover { border-color: #d4d4d8; }

  &:focus {
    outline: none;
    border-color: #0a0a0a;
    box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.06);
  }
}

.sf-textarea {
  resize: vertical;
  min-height: 160px;
}

.sf-error {
  color: #dc2626;
  font-size: 13px;
  margin-top: 6px;

  &--server {
    margin: 4px 0 16px;
    font-size: 14px;
  }
}

.sf-submit-row { margin-top: 8px; }

.sf-submit {
  background: #0a0a0a;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover { opacity: 0.85; }
  &:disabled { opacity: 0.5; cursor: default; }
}

// ---- logged-out CTAs ----
.sf-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sf-cta {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease, border-color 0.15s ease;

  &--primary {
    background: #0a0a0a;
    color: #fff;
    border: 1px solid #0a0a0a;

    &:hover { opacity: 0.85; }
  }

  &--secondary {
    background: #fff;
    color: #0a0a0a;
    border: 1px solid #e4e4e7;

    &:hover { border-color: #0a0a0a; }
  }
}

// ---- filed panel ----
.sf-panel {
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 20px 22px;
  background: #fafafa;
}

.sf-panel-title {
  font-size: 17px;
  font-weight: 600;
  color: #0a0a0a;
  margin-bottom: 6px;
}

.sf-panel-body {
  font-size: 15px;
  line-height: 1.6;
  color: #52525b;
  margin: 0;

  + .sf-panel-body { margin-top: 10px; }

  a { color: #0a0a0a; }
}

.sf-add-btn {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 4px 0;
  margin-top: 14px;
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
  cursor: pointer;

  &:hover { color: #0a0a0a; }
}
</style>
