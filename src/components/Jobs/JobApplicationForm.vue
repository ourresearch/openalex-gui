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
        Thanks — we've got your application for this role{{ appliedOn ? ` (submitted ${appliedOn})` : '' }},
        and we emailed you a copy of it. Applications can't be edited once submitted, so this
        one's locked. We'll email you either way once we've decided.
      </p>
    </div>

    <!-- Just submitted -->
    <div v-else-if="justSubmitted" class="jaf-panel jaf-panel--done">
      <div class="jaf-panel-title">Thanks — your application is in.</div>
      <p class="jaf-panel-body">
        We've emailed you a copy of everything you sent. We read every application, and
        we'll email you either way once we've decided.
      </p>
    </div>

    <!-- Loading the applied-state check -->
    <div v-else-if="checking" class="jaf-loading">Loading…</div>

    <!-- The application, numbered in three sections. Section 1 (Log in) is always
         shown and adapts to auth; sections 2 & 3 (the form) appear once logged in.
         Required fields carry a red asterisk (aria-required does the a11y work; the
         glyph is aria-hidden); we don't show an "* = required" legend. -->
    <div v-else class="jaf-app">
      <!-- SECTION 1 — Log in -->
      <section class="jaf-section">
        <header class="jaf-section-head">
          <h3 class="jaf-section-title"><span class="jaf-section-num">1</span>Log in</h3>
          <job-section-status :done="s1Done" />
        </header>

        <!-- Logged out: explain the flow, then two big CTAs. No fillable fields until
             logged in (you can't submit without an OpenAlex account anyway). -->
        <template v-if="!userId">
          <p class="jaf-section-body">
            Start by logging in to your OpenAlex account. Once that's done you can add basic
            info (location, resume, etc.) and then answer our three main getting-to-know-you
            questions:
          </p>
          <ol class="jaf-q-preview">
            <li v-for="q in questions" :key="q.key">{{ q.label }}</li>
          </ol>
          <div class="jaf-cta-row">
            <button type="button" class="jaf-cta jaf-cta--primary" @click="goLogin">Log in</button>
            <button type="button" class="jaf-cta jaf-cta--secondary" @click="goSignup">Create account</button>
          </div>
        </template>

        <!-- Logged in: plain-text identity; name links to account settings. -->
        <template v-else>
          <p class="jaf-identity">
            Logged in as
            <router-link :to="{ name: 'settings-profile' }" class="jaf-identity-link">{{ accountName || accountEmail }}</router-link><span v-if="accountName" class="jaf-identity-email"> ({{ accountEmail }})</span>
          </p>
          <p v-if="!accountName" class="jaf-error">
            Add your name in your <router-link :to="{ name: 'settings-profile' }">account settings</router-link> before applying.
          </p>
        </template>
      </section>

      <!-- SECTIONS 2 & 3 — the form (logged in only) -->
      <form v-if="userId" class="jaf-form" novalidate @submit.prevent="submit">
        <!-- SECTION 2 — The basics -->
        <section class="jaf-section">
          <header class="jaf-section-head">
            <h3 class="jaf-section-title"><span class="jaf-section-num">2</span>The basics</h3>
            <job-section-status :done="s2Done" />
          </header>

          <!-- Short single-line fields are paired into a 2-up grid: full-width inputs
               here are far wider than the content needs, and stacking them makes the
               page read as a run of horizontal stripes. -->
          <div class="jaf-row">
            <div class="jaf-field">
              <label class="jaf-label" for="jaf-location"><span class="jaf-fnum">2.1</span>Location <span class="jaf-req" aria-hidden="true">*</span></label>
              <input id="jaf-location" v-model.trim="form.location" class="jaf-input" type="text" placeholder="Austin, TX, USA" aria-required="true" />
              <span v-if="errors.location" class="jaf-error">{{ errors.location }}</span>
            </div>
          </div>

          <div class="jaf-row">
            <div class="jaf-field">
              <label class="jaf-label" for="jaf-linkedin"><span class="jaf-fnum">2.2</span>LinkedIn <span v-if="req.linkedin" class="jaf-req" aria-hidden="true">*</span></label>
              <input id="jaf-linkedin" v-model.trim="form.linkedin" class="jaf-input" type="url" placeholder="linkedin.com/in/janedoe" :aria-required="req.linkedin" />
              <span v-if="errors.linkedin" class="jaf-error">{{ errors.linkedin }}</span>
            </div>

            <div class="jaf-field">
              <label class="jaf-label" for="jaf-github"><span class="jaf-fnum">2.3</span>GitHub <span v-if="req.github" class="jaf-req" aria-hidden="true">*</span></label>
              <input id="jaf-github" v-model.trim="form.github" class="jaf-input" type="url" placeholder="github.com/janedoe" :aria-required="req.github" />
              <span v-if="errors.github" class="jaf-error">{{ errors.github }}</span>
            </div>
          </div>

          <!-- Education (repeatable). The rows are visually bound into one card so the
               block reads as a single field rather than a run of loose inputs. Column
               names live in a header row on desktop; each input still carries its own
               <label>, sr-only at desktop widths and visible once the row stacks on
               mobile. Placeholders are EXAMPLES, never the label. -->
          <div class="jaf-field">
            <label id="jaf-edu-label" class="jaf-label"><span class="jaf-fnum">2.4</span>Education <span class="jaf-req" aria-hidden="true">*</span></label>
            <p class="jaf-desc">One line per degree.</p>

            <div class="jaf-edu-card" role="group" aria-labelledby="jaf-edu-label">
              <div class="jaf-edu-head" aria-hidden="true">
                <span>Institution</span>
                <span>Degree</span>
                <span>Field</span>
                <span></span>
              </div>

              <div v-for="(row, i) in form.education" :key="i" class="jaf-edu-row">
                <div class="jaf-edu-cell">
                  <label class="jaf-edu-cell-label" :for="`jaf-edu-inst-${i}`">Institution</label>
                  <input :id="`jaf-edu-inst-${i}`" v-model.trim="row.institution" class="jaf-input" type="text" placeholder="University of Cambridge" />
                </div>

                <div class="jaf-edu-cell">
                  <label class="jaf-edu-cell-label" :for="`jaf-edu-degree-${i}`">Degree</label>
                  <select
                    :id="`jaf-edu-degree-${i}`"
                    v-model="row.degree"
                    class="jaf-input jaf-select"
                    :class="{ 'jaf-select--empty': !row.degree }"
                  >
                    <option value="">Select…</option>
                    <option v-for="d in degreeOptions" :key="d" :value="d">{{ d }}</option>
                  </select>
                </div>

                <div class="jaf-edu-cell">
                  <label class="jaf-edu-cell-label" :for="`jaf-edu-field-${i}`">Field</label>
                  <input :id="`jaf-edu-field-${i}`" v-model.trim="row.field" class="jaf-input" type="text" placeholder="Computer science" />
                </div>

                <!-- Ghost trash button; hidden (but layout-stable) when there's nothing to remove -->
                <button
                  type="button"
                  class="jaf-icon-btn"
                  :class="{ 'jaf-icon-btn--hidden': !canRemoveEducation(i) }"
                  :aria-label="`Remove degree ${i + 1}`"
                  @click="removeEducation(i)"
                ><v-icon size="18">mdi-trash-can-outline</v-icon></button>
              </div>

              <button type="button" class="jaf-ghost-btn" @click="addEducation">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
                  <path d="M8 3.5v9M3.5 8h9" />
                </svg>
                Add degree
              </button>
            </div>
            <span v-if="errors.education" class="jaf-error">{{ errors.education }}</span>
          </div>

          <!-- Resume (markdown, required) -->
          <div class="jaf-field">
            <label class="jaf-label" for="jaf-resume"><span class="jaf-fnum">2.5</span>Resume <span class="jaf-req" aria-hidden="true">*</span></label>
            <p class="jaf-desc">Paste Markdown or plain text.</p>
            <textarea id="jaf-resume" v-model="form.resume_markdown" class="jaf-input jaf-textarea" rows="8" :placeholder="resumePlaceholder" aria-required="true"></textarea>
            <span v-if="errors.resume_markdown" class="jaf-error">{{ errors.resume_markdown }}</span>
          </div>

          <div class="jaf-field">
            <label class="jaf-label" for="jaf-anything"><span class="jaf-fnum">2.6</span>Anything else we should know?</label>
            <textarea id="jaf-anything" v-model="form.anything_else" class="jaf-input jaf-textarea" rows="3"></textarea>
          </div>
        </section>

        <!-- SECTION 3 — Beyond the basics -->
        <section class="jaf-section">
          <header class="jaf-section-head">
            <h3 class="jaf-section-title"><span class="jaf-section-num">3</span>Beyond the basics</h3>
            <job-section-status :done="s3Done" />
          </header>
          <p class="jaf-section-body">
            We're looking for <em>remarkable, compelling people</em>&mdash;people who'll have
            remarkable, compelling answers to these questions. Feel free to use AI, or not.
          </p>

          <div v-for="q in questions" :key="q.key" class="jaf-field">
            <label class="jaf-label" :for="`jaf-${q.key}`"><span class="jaf-fnum">{{ q.num }}</span>{{ q.label }} <span class="jaf-req" aria-hidden="true">*</span></label>
            <textarea :id="`jaf-${q.key}`" v-model="form.answers[q.key]" class="jaf-input jaf-textarea" rows="6" aria-required="true"></textarea>
            <span v-if="errors[q.key]" class="jaf-error">{{ errors[q.key] }}</span>
          </div>
          <p class="jaf-section-body jaf-guidance">
            Answer at whatever length you like &mdash; we're looking for thoughtful answers, and
            three to six paragraphs is often a good fit.
          </p>
        </section>

        <!-- Submit / server error -->
        <p v-if="serverError" class="jaf-error jaf-error--server">{{ serverError }}</p>

        <div class="jaf-submit-row">
          <button type="submit" class="jaf-submit" :disabled="submitting">
            {{ submitting ? 'Submitting…' : 'Submit application' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>


<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import JobSectionStatus from '@/components/Jobs/JobSectionStatus.vue';

defineOptions({ name: 'JobApplicationForm' });

const props = defineProps({
  role: { type: String, required: true },  // 'software-engineer' | 'community-lead' | 'operations-associate'
});

const store = useStore();
const router = useRouter();

const userId = computed(() => store.getters['user/userId']);
// Name + email come from the applicant's OpenAlex account (shown as plain text in
// section 1, not editable); they're submitted from the account, not a form field.
const accountName = computed(() => store.getters['user/userName'] || '');
const accountEmail = computed(() => store.getters['user/userEmail'] || '');

const questions = [
  { key: 'why_here', num: '3.1', label: 'Why do you want to work here?' },
  { key: 'first_week', num: '3.2', label: 'What will you do in your first week?' },
  { key: 'coolest_build', num: '3.3', label: "What's the coolest thing you've ever built?" },
];

// Which basics fields are required depends on the role: location/education/resume for
// everyone; LinkedIn for the community lead; GitHub for the software role. The operations
// associate role requires neither (entry-level; many applicants will have no GitHub and a
// thin LinkedIn). "Anything else" is never required. (Enforced client-side; the API
// treats these as optional.)
const req = computed(() => ({
  location: true,
  linkedin: props.role === 'community-lead',
  github: props.role === 'software-engineer',
  education: true,
  resume: true,
}));

// Degree level is a closed list (it's a filter, not prose — free text gave us
// "PhD"/"Ph.D."/"doctorate" for the same thing). Stored verbatim as submitted, so
// the receipt email and the review pass need no mapping table. "Other" is the escape
// hatch: Education is required, and the entry-level roles will draw applicants with
// an associate degree, some college, or no degree at all.
const degreeOptions = ["Bachelor's", "Master's", 'Doctoral', 'Other'];

// Ends on a "keep going" line — without it the short sketch reads as the expected
// length, and we get four-line resumes. "etc..." carries that on its own; spelling it
// out ("your whole resume, not just…") only says what the reader already got.
const resumePlaceholder = [
  '# Jane Doe',
  'Austin, TX · jane@example.com',
  '',
  '## Experience',
  'Acme Corp — Staff Engineer, 2022–present',
  '',
  'etc...',
].join('\n');

const blankEducationRow = () => ({ institution: '', degree: '', field: '' });

const blankForm = () => ({
  location: '',
  linkedin: '',
  github: '',
  resume_markdown: '',
  anything_else: '',
  education: [blankEducationRow()],
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
  form.education.push(blankEducationRow());
}
function removeEducation(i) {
  form.education.splice(i, 1);
  if (form.education.length === 0) addEducation();
}
function canRemoveEducation(i) {
  const row = form.education[i];
  return form.education.length > 1 || !!(row && rowHasContent(row));
}
function rowHasContent(row) {
  return !!((row.institution || '').trim() || (row.degree || '').trim() || (row.field || '').trim());
}

// ---- per-section completion (the "Done / To do" pills) ----
// These mirror validate() exactly — a section reads Done iff nothing in it would
// block submission. They are progress affordances only; validate() is still the gate.
const s1Done = computed(() => !!userId.value && !!accountName.value.trim() && !!accountEmail.value.trim());
const s2Done = computed(() => (
  !!form.location.trim()
  && (!req.value.linkedin || !!form.linkedin.trim())
  && (!req.value.github || !!form.github.trim())
  && hasEducation()
  && !!form.resume_markdown.trim()
));
const s3Done = computed(() => questions.every(q => !!(form.answers[q.key] || '').trim()));

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
      form.education = [blankEducationRow()];
    }
    // Drafts saved before 2026-08-21 have {institution, degree} rows with a free-text
    // degree. Backfill `field` and drop any degree the <select> can't represent —
    // otherwise the control renders blank while the model still holds the stale value.
    form.education = form.education.map((row) => ({
      ...blankEducationRow(),
      ...row,
      degree: degreeOptions.includes(row?.degree) ? row.degree : '',
    }));
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
function hasEducation() {
  return form.education.some(rowHasContent);
}
function validate() {
  Object.keys(errors).forEach(k => delete errors[k]);
  // Identity comes from the account; the API needs a name + email, so block if the
  // account has no name (the section-1 link sends them to settings to add one).
  if (!accountName.value.trim() || !accountEmail.value.trim()) errors.identity = true;
  if (req.value.location && !form.location.trim()) errors.location = 'Please add your location.';
  if (req.value.linkedin && !form.linkedin.trim()) errors.linkedin = 'LinkedIn is required for this role.';
  if (req.value.github && !form.github.trim()) errors.github = 'GitHub is required for this role.';
  if (req.value.education && !hasEducation()) errors.education = 'Please add at least one entry.';
  if (req.value.resume && !form.resume_markdown.trim()) errors.resume_markdown = 'Please add your resume.';
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
    .filter(rowHasContent)
    .map(r => ({
      institution: (r.institution || '').trim(),
      degree: (r.degree || '').trim(),
      field: (r.field || '').trim(),
    }));
  const payload = {
    role: props.role,
    basics: {
      name: accountName.value.trim(),
      email: accountEmail.value.trim(),
      location: form.location.trim(),
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

// ---- numbered sections ----
// NOTE: the last-section reset is scoped to .jaf-form on purpose. Section 1 lives
// outside the form and is the ONLY <section> in its parent, so a bare :last-of-type
// zeroed its bottom margin and welded "Logged in as …" to the section below it.
.jaf-section {
  margin-bottom: 72px;
}

.jaf-form .jaf-section:last-of-type { margin-bottom: 0; }

// Section header: title left, Done/To do pill hard right, hairline underneath so the
// right-aligned pill reads as anchored rather than floating.
.jaf-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 14px;
  padding-bottom: 9px;
  border-bottom: 1px solid #F4F4F5;
}

.jaf-section-title {
  display: flex;
  align-items: baseline;
  font-size: 17px;
  font-weight: 600;
  color: #0A0A0A;
  margin: 0;
}

// The number is spacing, not decoration: it inherits the title's font, weight and
// colour. Greying it made the numbers *more* conspicuous — the eye read the gray as a
// separate column and the headings as a ragged left edge. No tabular-nums either; the
// fixed-width digits read as a monospace insert.
.jaf-section-num {
  display: inline-block;
  min-width: 22px;
}

.jaf-section-body {
  font-size: 15px;
  line-height: 1.6;
  color: #52525B;
  margin: 0 0 16px;
}

// Ordered list of the three questions in the logged-out section 1.
.jaf-q-preview {
  margin: 0 0 20px;
  padding-left: 22px;
  color: #52525B;
  font-size: 15px;
  line-height: 1.6;

  li { margin-bottom: 4px; }
}

// Linear-style fields
.jaf-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

// 2-up row for short single-line fields. A lone child lands in column 1, which is
// what keeps Location at half width instead of stretching across the column.
.jaf-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 20px;

  > .jaf-field { margin-bottom: 0; }
}

// Gray one-liner under a label. Explains the field; never repeats it.
.jaf-desc {
  font-size: 13px;
  line-height: 1.5;
  color: #71717A;
  margin: 0 0 8px;
}

.jaf-label {
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  margin-bottom: 6px;
}

// Decimal prefix (2.1, 3.2, …) on each field label. Same treatment as the section
// number above — inherits the label's colour and weight, and exists only for spacing.
.jaf-fnum {
  margin-right: 6px;
}

// Required marker — bold red asterisk. Purely visual (aria-hidden); a11y is carried
// by aria-required on the inputs, so no "* = required" legend is needed.
.jaf-req {
  color: #DC2626;
  font-weight: 700;
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

  &:disabled {
    background: #FAFAFA;
    color: #52525B;
    cursor: not-allowed;

    &:hover { border-color: #E4E4E7; }
  }
}

.jaf-textarea {
  resize: vertical;
  min-height: 84px;
}

// ---- education card ----
// Rows are bound into one bordered card so 2.4 reads as a single field. Inputs stay
// white against the card's off-white so they still read as inputs.
.jaf-edu-card {
  border: 1px solid #E4E4E7;
  border-radius: 10px;
  background: #FCFCFD;
  padding: 12px 14px 10px;
}

// Column names, shown once. aria-hidden — each input carries its own <label>.
.jaf-edu-head,
.jaf-edu-row {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr 1.1fr 34px;
  gap: 10px;
  align-items: center;
}

.jaf-edu-head {
  font-size: 12px;
  font-weight: 500;
  color: #71717A;
  margin-bottom: 7px;
}

.jaf-edu-row + .jaf-edu-row { margin-top: 8px; }

.jaf-edu-cell {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

// Visible only once the row stacks (mobile); the header row does the work on desktop.
.jaf-edu-cell-label {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// Native select dressed to match .jaf-input, with our own chevron.
.jaf-select {
  appearance: none;
  -webkit-appearance: none;
  padding-right: 30px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%2371717A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6.5l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 9px center;
  background-size: 15px;

  // Match the placeholder gray while nothing is chosen.
  &--empty { color: #A1A1AA; }

  option { color: #0A0A0A; }
}

// Ghost button (no border/background until hover), trash icon inside.
.jaf-icon-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #71717A;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover { background: #F4F4F5; color: #0A0A0A; }

  // Keep the grid column stable when the row has nothing to remove.
  &--hidden { visibility: hidden; }
}

// Ghost button — same vocabulary as .jaf-icon-btn (transparent until hover), one
// step below the solid .jaf-submit. Was a bare text link, which read as neither.
.jaf-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  // Negative left offset cancels the button's own padding so the label starts on the
  // same vertical as the Institution input above it.
  margin: 8px 0 0 -12px;
  padding: 7px 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #3F3F46;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #F4F4F5;
    border-color: #E4E4E7;
    color: #0A0A0A;
  }

  &:focus-visible {
    outline: none;
    border-color: #D4D4D8;
    box-shadow: 0 0 0 3px rgba(10, 10, 10, 0.06);
  }
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

  + .jaf-panel-body { margin-top: 10px; }
}

// ---- section 1: logged-out CTAs ----
.jaf-cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.jaf-cta {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;

  &--primary {
    background: #0A0A0A;
    color: #fff;
    border: 1px solid #0A0A0A;

    &:hover { opacity: 0.85; }
  }

  &--secondary {
    background: #fff;
    color: #0A0A0A;
    border: 1px solid #E4E4E7;

    &:hover { border-color: #0A0A0A; }
  }
}

// ---- section 1: logged-in identity ----
.jaf-identity {
  font-size: 15px;
  line-height: 1.6;
  color: #52525B;
  margin: 0;
}

.jaf-identity-link {
  color: #0A0A0A;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { opacity: 0.8; }
}

.jaf-identity-email { color: #71717A; }

@media (max-width: 620px) {
  // Pair fields stack.
  .jaf-row { grid-template-columns: 1fr; }
  .jaf-row > .jaf-field + .jaf-field { margin-top: 20px; }

  // Education rows stack: institution + trash on line 1, then degree, then field.
  // The column header can't apply here, so each cell shows its own label instead.
  .jaf-edu-head { display: none; }

  .jaf-edu-row {
    grid-template-columns: 1fr auto;
    gap: 8px 10px;
    align-items: end;
    padding-bottom: 12px;
    border-bottom: 1px solid #EFEFF1;

    > :nth-child(1) { grid-column: 1; grid-row: 1; }
    > :nth-child(2) { grid-column: 1; grid-row: 2; }
    > :nth-child(3) { grid-column: 1; grid-row: 3; }
    > :nth-child(4) { grid-column: 2; grid-row: 1; align-self: end; }
  }

  .jaf-edu-row:last-of-type {
    padding-bottom: 0;
    border-bottom: none;
  }

  .jaf-edu-cell-label {
    position: static;
    width: auto;
    height: auto;
    margin: 0 0 5px;
    overflow: visible;
    clip: auto;
    font-size: 12px;
    font-weight: 500;
    color: #71717A;
  }
}
</style>
