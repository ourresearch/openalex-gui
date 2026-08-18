<template>
  <!-- Embedded job application (oxjob #813). Linear-style form. Auth via the
       applicant's OpenAlex account; one-shot per (user, role); optional markdown
       resume. Posts to users-api /jobs/applications. Embedded in the listing
       pages' Application section (#812). -->
  <div class="jaf">
    <!-- Already applied (one-shot) -->
    <div v-if="applied" class="jaf-panel jaf-panel--done">
      <div class="jaf-panel-title">Application received</div>
      <p class="jaf-panel-body">
        Thanks — we've got your application for this role{{ appliedOn ? ` (submitted ${appliedOn})` : '' }}.
        Applications can't be edited once submitted, so this one's locked. We'll be in touch.
      </p>
    </div>

    <!-- Just submitted -->
    <div v-else-if="justSubmitted" class="jaf-panel jaf-panel--done">
      <div class="jaf-panel-title">Thanks — your application is in.</div>
      <p class="jaf-panel-body">We read every one. We'll be in touch.</p>
    </div>

    <!-- Loading the applied-state check -->
    <div v-else-if="checking" class="jaf-loading">Loading…</div>

    <!-- The form -->
    <form v-else class="jaf-form" @submit.prevent="submit">
      <h3 class="subsection-header">The basics</h3>

      <div class="jaf-grid">
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-name">Name</label>
          <input id="jaf-name" v-model.trim="form.name" class="jaf-input" type="text" autocomplete="name" />
          <span v-if="errors.name" class="jaf-error">{{ errors.name }}</span>
        </div>
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-email">Email</label>
          <input id="jaf-email" v-model.trim="form.email" class="jaf-input" type="email" autocomplete="email" />
          <span v-if="errors.email" class="jaf-error">{{ errors.email }}</span>
        </div>
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-location">Location</label>
          <input id="jaf-location" v-model.trim="form.location" class="jaf-input" type="text" placeholder="City, country" />
        </div>
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-timezone">Timezone</label>
          <input id="jaf-timezone" v-model.trim="form.timezone" class="jaf-input" type="text" placeholder="e.g. UTC−6 / CT" />
        </div>
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-linkedin">LinkedIn</label>
          <input id="jaf-linkedin" v-model.trim="form.linkedin" class="jaf-input" type="url" placeholder="https://…" />
        </div>
        <div class="jaf-field">
          <label class="jaf-label" for="jaf-github">GitHub</label>
          <input id="jaf-github" v-model.trim="form.github" class="jaf-input" type="url" placeholder="https://…" />
        </div>
      </div>

      <!-- Education (repeatable) -->
      <div class="jaf-field">
        <label class="jaf-label">Education</label>
        <div v-for="(row, i) in form.education" :key="i" class="jaf-edu-row">
          <input v-model.trim="row.institution" class="jaf-input" type="text" placeholder="Institution" />
          <input v-model.trim="row.degree" class="jaf-input" type="text" placeholder="Degree" />
          <button type="button" class="jaf-icon-btn" :aria-label="`Remove education row ${i + 1}`" @click="removeEducation(i)">×</button>
        </div>
        <button type="button" class="jaf-add-btn" @click="addEducation">+ Add education</button>
      </div>

      <!-- Resume (optional markdown) -->
      <div class="jaf-field">
        <label class="jaf-label" for="jaf-resume">Resume <span class="jaf-optional">— Markdown only, optional</span></label>
        <textarea id="jaf-resume" v-model="form.resume_markdown" class="jaf-input jaf-textarea" rows="5" placeholder="# Your name&#10;…"></textarea>
      </div>

      <div class="jaf-field">
        <label class="jaf-label" for="jaf-anything">Anything else we should know?</label>
        <textarea id="jaf-anything" v-model="form.anything_else" class="jaf-input jaf-textarea" rows="3"></textarea>
      </div>

      <h3 class="subsection-header">Beyond the basics</h3>
      <p class="section-body">
        We're looking for exceptional people, so we're looking for exceptional answers to
        these questions. If your answers fit in with everybody else's, then you probably fit
        in with everybody else&mdash;and you're probably not the right fit for this role. We
        encourage you to use AI; but if you use AI the same way everybody else does, that's
        not the kind of person we're looking for.
      </p>

      <div v-for="q in questions" :key="q.key" class="jaf-field">
        <label class="jaf-label" :for="`jaf-${q.key}`">{{ q.label }}</label>
        <textarea :id="`jaf-${q.key}`" v-model="form.answers[q.key]" class="jaf-input jaf-textarea" rows="6"></textarea>
        <span v-if="errors[q.key]" class="jaf-error">{{ errors[q.key] }}</span>
      </div>
      <p class="section-body jaf-guidance">
        Answer at whatever length you like &mdash; we're looking for thoughtful answers, and
        three to six paragraphs is often a good fit.
      </p>

      <!-- Submit / server error -->
      <p v-if="serverError" class="jaf-error jaf-error--server">{{ serverError }}</p>

      <div v-if="userId" class="jaf-submit-row">
        <button type="submit" class="jaf-submit" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit application' }}
        </button>
      </div>
      <div v-else class="jaf-panel jaf-panel--signin">
        <p class="jaf-panel-body">Log in or create a free OpenAlex account to submit your application. Your answers above are saved on this device.</p>
        <div class="jaf-signin-btns">
          <button type="button" class="jaf-submit" @click="goLogin">Log in</button>
          <button type="button" class="jaf-add-btn" @click="goSignup">Sign up</button>
        </div>
      </div>
    </form>
  </div>
</template>


<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';

defineOptions({ name: 'JobApplicationForm' });

const props = defineProps({
  role: { type: String, required: true },  // 'software-data-engineer' | 'community-lead'
});

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);

const questions = [
  { key: 'why_here', label: 'Why do you want to work here?' },
  { key: 'first_week', label: 'What will you do in your first week?' },
  { key: 'coolest_build', label: "What's the coolest thing you've ever built?" },
];

const blankForm = () => ({
  name: '',
  email: '',
  location: '',
  timezone: '',
  linkedin: '',
  github: '',
  resume_markdown: '',
  anything_else: '',
  education: [{ institution: '', degree: '' }],
  answers: { why_here: '', first_week: '', coolest_build: '' },
});

const form = reactive(blankForm());
const errors = reactive({});
const serverError = ref('');
const submitting = ref(false);
const justSubmitted = ref(false);
const applied = ref(false);
const appliedOn = ref('');
const checking = ref(true);

const draftKey = computed(() => `jobApplicationDraft:${props.role}`);

// ---- education rows ----
function addEducation() {
  form.education.push({ institution: '', degree: '' });
}
function removeEducation(i) {
  form.education.splice(i, 1);
  if (form.education.length === 0) addEducation();
}

// ---- auth prompts ----
function goLogin() { router.push({ name: 'Login' }); }
function goSignup() { router.push({ name: 'Signup' }); }

// ---- draft persistence (localStorage) ----
function saveDraft() {
  try {
    localStorage.setItem(draftKey.value, JSON.stringify(form));
  } catch (e) { /* quota / private mode — non-fatal */ }
}
function restoreDraft() {
  try {
    const raw = localStorage.getItem(draftKey.value);
    if (!raw) return;
    const saved = JSON.parse(raw);
    Object.assign(form, blankForm(), saved);
    if (!Array.isArray(form.education) || form.education.length === 0) {
      form.education = [{ institution: '', degree: '' }];
    }
    if (!form.answers) form.answers = { why_here: '', first_week: '', coolest_build: '' };
  } catch (e) { /* corrupt draft — ignore */ }
}
function clearDraft() {
  try { localStorage.removeItem(draftKey.value); } catch (e) { /* ignore */ }
}

let saveTimer = null;
watch(form, () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 400);
}, { deep: true });

// ---- already-applied check (one-shot) ----
async function checkApplied() {
  checking.value = true;
  if (!userId.value) { checking.value = false; return; }
  try {
    const resp = await axios.get(`${urlBase.userApi}/jobs/applications/me`, axiosConfig({ userAuth: true }));
    const mine = (resp.data?.applications || []).find(a => a.role_slug === props.role);
    if (mine) {
      applied.value = true;
      appliedOn.value = mine.created ? mine.created.slice(0, 10) : '';
    }
  } catch (e) { /* if this fails, fall through to the form; submit still guards via 409 */ }
  checking.value = false;
}

// ---- validation ----
function validate() {
  Object.keys(errors).forEach(k => delete errors[k]);
  if (!form.name.trim()) errors.name = 'Please add your name.';
  if (!form.email.trim()) errors.email = 'Please add your email.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) errors.email = "That email doesn't look right.";
  for (const q of questions) {
    if (!form.answers[q.key] || !form.answers[q.key].trim()) errors[q.key] = 'This one\'s required.';
  }
  return Object.keys(errors).length === 0;
}

// ---- submit ----
async function submit() {
  serverError.value = '';
  if (!userId.value) { goLogin(); return; }
  if (!validate()) return;
  submitting.value = true;
  const education = form.education
    .filter(r => r.institution.trim() || r.degree.trim())
    .map(r => ({ institution: r.institution.trim(), degree: r.degree.trim() }));
  const payload = {
    role: props.role,
    basics: {
      name: form.name.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      timezone: form.timezone.trim(),
      linkedin: form.linkedin.trim(),
      github: form.github.trim(),
      anything_else: form.anything_else.trim(),
      education,
    },
    resume_markdown: form.resume_markdown.trim() || null,
    answers: {
      why_here: form.answers.why_here.trim(),
      first_week: form.answers.first_week.trim(),
      coolest_build: form.answers.coolest_build.trim(),
    },
  };
  try {
    await axios.post(`${urlBase.userApi}/jobs/applications`, payload, axiosConfig({ userAuth: true }));
    clearDraft();
    justSubmitted.value = true;
  } catch (e) {
    const status = e.response?.status;
    const msg = e.response?.data?.message;
    if (status === 409) {
      applied.value = true;
    } else if (status === 401) {
      goLogin();
    } else {
      serverError.value = msg || 'Something went wrong submitting your application. Please try again.';
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  restoreDraft();
  // Prefill from the logged-in account only where the applicant hasn't typed / no draft.
  if (userId.value) {
    if (!form.name) form.name = store.getters['user/userName'] || '';
    if (!form.email) form.email = store.getters['user/userEmail'] || '';
  }
  await checkApplied();
});
</script>


<style scoped lang="scss">
.jaf {
  margin-top: 8px;
}

.jaf-loading {
  color: #A1A1AA;
  font-size: 15px;
  padding: 16px 0;
}

// Linear-style fields
.jaf-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
  margin-bottom: 20px;
}

.jaf-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.jaf-grid .jaf-field {
  margin-bottom: 0;
}

.jaf-label {
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  margin-bottom: 6px;
}

.jaf-optional {
  font-weight: 400;
  color: #A1A1AA;
}

.jaf-input {
  width: 100%;
  padding: 9px 12px;
  font-size: 15px;
  line-height: 1.5;
  color: #0A0A0A;
  background: #fff;
  border: 1px solid #E4E4E7;
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;

  &::placeholder { color: #A1A1AA; }

  &:hover { border-color: #D4D4D8; }

  &:focus {
    outline: none;
    border-color: #0A0A0A;
    box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.06);
  }
}

.jaf-textarea {
  resize: vertical;
  min-height: 84px;
}

.jaf-edu-row {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.jaf-icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #E4E4E7;
  border-radius: 8px;
  background: #fff;
  color: #71717A;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { border-color: #A1A1AA; color: #0A0A0A; }
}

.jaf-add-btn {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  cursor: pointer;

  &:hover { color: #0A0A0A; }
}

.jaf-guidance {
  color: #71717A;
  font-size: 15px;
}

.jaf-error {
  color: #DC2626;
  font-size: 13px;
  margin-top: 6px;

  &--server {
    margin: 4px 0 16px;
    font-size: 14px;
  }
}

.jaf-submit-row {
  margin-top: 8px;
}

.jaf-submit {
  background: #0A0A0A;
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

.jaf-panel {
  border: 1px solid #E4E4E7;
  border-radius: 12px;
  padding: 20px 22px;

  &--done { background: #FAFAFA; }
  &--signin { margin-top: 8px; }
}

.jaf-panel-title {
  font-size: 17px;
  font-weight: 600;
  color: #0A0A0A;
  margin-bottom: 6px;
}

.jaf-panel-body {
  font-size: 15px;
  line-height: 1.6;
  color: #52525B;
  margin: 0;
}

.jaf-signin-btns {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
}

@media (max-width: 600px) {
  .jaf-grid { grid-template-columns: 1fr; gap: 20px; }
  .jaf-edu-row { grid-template-columns: 1fr 1fr auto; }
}
</style>
