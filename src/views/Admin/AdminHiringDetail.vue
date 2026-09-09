<template>
  <div>
    <DashboardBreadcrumbs :items="breadcrumbItems" />

    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <div v-else-if="error" class="py-8">
      <v-alert type="error" variant="tonal">{{ error }}</v-alert>
    </div>

    <div v-else-if="application">
      <!-- Header -->
      <div class="d-flex align-start justify-space-between flex-wrap mb-1">
        <div>
          <h1 class="text-h5 font-weight-bold">{{ name }}</h1>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ roleTitle(application.role_slug) }}
            <template v-if="basics.location"> · {{ basics.location }}</template>
            · applied {{ formatRelativeDate(application.created) }}
          </div>
          <div class="mt-2 header-links">
            <a v-if="basics.email" :href="`mailto:${basics.email}`">{{ basics.email }}</a>
            <a v-if="basics.linkedin" :href="basics.linkedin" target="_blank" rel="noopener">LinkedIn</a>
            <a v-if="basics.github" :href="basics.github" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>

        <!-- Stage / owner controls -->
        <div class="d-flex align-center ga-3 mt-2">
          <v-select
            v-model="stage"
            :items="stageOptions"
            variant="outlined"
            density="compact"
            hide-details
            label="Stage"
            class="control-select"
            :loading="saving"
            @update:model-value="saveField('stage', $event)"
          />
          <v-select
            v-model="owner"
            :items="ownerOptions"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            label="Owner"
            class="control-select control-select-narrow"
            :loading="saving"
            @update:model-value="saveField('owner', $event ?? null)"
          />
        </div>
      </div>

      <v-alert v-if="saveError" type="error" density="compact" class="my-2">{{ saveError }}</v-alert>

      <!-- Attributes -->
      <div v-if="attrEntries.length" class="mb-4 mt-2">
        <span v-for="[k, v] in attrEntries" :key="k" class="attr-chip">{{ k }}: {{ formatAttrValue(v) }}</span>
      </div>

      <!-- Ratings (oxjob #992) -->
      <v-card variant="outlined" class="bg-white mb-6">
        <v-card-text>
          <div class="section-label">Ratings</div>
          <div class="text-body-2 text-medium-emphasis mb-4">
            Same bar for all of us: <strong>yes</strong> = we're positive we want to talk to
            them — keep it rare. <strong>maybe</strong> = worth a second look if the yes pile
            runs dry. <strong>no</strong> = pass. Use whatever method you like to get there;
            the bar doesn't move.
          </div>
          <div v-for="r in RATERS" :key="r" class="d-flex align-center flex-wrap ga-3 rating-row">
            <span class="rater-name">{{ r }}</span>
            <template v-if="r === myRater">
              <span class="d-flex ga-1">
                <v-btn
                  v-for="v in VERDICTS"
                  :key="v"
                  size="small"
                  class="verdict-btn"
                  :variant="myVerdict === v ? 'flat' : 'outlined'"
                  :color="myVerdict === v ? verdictBtnColor(v) : undefined"
                  @click="myVerdict = myVerdict === v ? null : v"
                >{{ v }}</v-btn>
              </span>
              <v-text-field
                v-model="myComment"
                variant="outlined"
                density="compact"
                hide-details
                label="Comment (optional)"
                class="rating-comment-field"
                @keydown.enter="ratingDirty && myVerdict && saveRating()"
              />
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                :loading="savingRating"
                :disabled="!myVerdict || !ratingDirty"
                @click="saveRating"
              >Save</v-btn>
              <v-btn
                v-if="myRating"
                variant="outlined"
                size="small"
                :disabled="savingRating"
                @click="clearRating"
              >Clear</v-btn>
            </template>
            <template v-else>
              <span class="rating-chip" :class="`rating-chip--${ratings[r]?.verdict || 'unrated'}`">
                {{ ratings[r]?.verdict || '—' }}
              </span>
              <span v-if="ratings[r]?.comment" class="text-body-2 rating-comment">{{ ratings[r].comment }}</span>
              <span v-if="ratings[r]" class="text-medium-emphasis text-body-2">
                · {{ formatRelativeDate(ratings[r].updated) }}
              </span>
            </template>
          </div>
          <div v-if="ratingError" class="text-error text-body-2 mt-2">{{ ratingError }}</div>
        </v-card-text>
      </v-card>

      <!-- Application -->
      <v-card variant="outlined" class="bg-white mb-6">
        <v-card-text>
          <div class="section-label">Application</div>

          <template v-if="education.length">
            <div class="field-label">Education</div>
            <ul class="edu-list">
              <li v-for="(row, i) in education" :key="i">
                {{ row.institution }}<template v-if="eduQualification(row)"> — {{ eduQualification(row) }}</template>
              </li>
            </ul>
          </template>

          <template v-if="basics.anything_else">
            <div class="field-label">Anything else we should know</div>
            <div class="answer-text">{{ basics.anything_else }}</div>
          </template>

          <template v-for="q in questions" :key="q.key">
            <div v-if="answers[q.key]" class="field-label">{{ q.label }}</div>
            <div v-if="answers[q.key]" class="answer-text">{{ answers[q.key] }}</div>
          </template>

          <div class="field-label d-flex align-center">
            Resume
            <v-btn
              v-if="application.resume_markdown"
              variant="text"
              size="x-small"
              class="ml-2"
              @click="resumeOpen = !resumeOpen"
            >{{ resumeOpen ? 'Hide' : 'Show' }}</v-btn>
          </div>
          <HiringMarkdown v-if="application.resume_markdown && resumeOpen" :source="application.resume_markdown" />
          <div v-else-if="!application.resume_markdown" class="text-medium-emphasis text-body-2">No resume submitted.</div>
        </v-card-text>
      </v-card>

      <!-- Notes timeline -->
      <div class="section-label mb-2">Notes</div>
      <div v-if="!notes.length" class="text-medium-emphasis text-body-2 mb-4">No notes yet.</div>

      <v-card v-for="note in notes" :key="note.id" variant="outlined" class="bg-white mb-3">
        <v-card-text>
          <div class="d-flex align-center mb-2">
            <v-icon size="16" class="mr-2" color="grey-darken-1">{{ noteKindMeta(note.kind).icon }}</v-icon>
            <span class="font-weight-medium mr-2">{{ noteKindMeta(note.kind).title }}</span>
            <span v-if="note.title" class="text-medium-emphasis mr-2">· {{ note.title }}</span>
            <span class="text-medium-emphasis text-body-2">· {{ noteAuthor(note) }} · {{ formatRelativeDate(note.created) }}</span>
            <v-spacer />
            <template v-if="confirmingDelete === note.id">
              <v-btn size="x-small" color="error" variant="tonal" class="mr-1" @click="deleteNote(note)">Confirm delete</v-btn>
              <v-btn size="x-small" variant="text" @click="confirmingDelete = null">Cancel</v-btn>
            </template>
            <v-btn v-else icon variant="text" size="x-small" @click="confirmingDelete = note.id">
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
          <div :class="{ 'note-collapsed': isLong(note) && !expanded[note.id] }">
            <HiringMarkdown :source="note.body" />
          </div>
          <v-btn
            v-if="isLong(note)"
            variant="text"
            size="x-small"
            class="mt-1"
            @click="expanded[note.id] = !expanded[note.id]"
          >{{ expanded[note.id] ? 'Show less' : 'Show all' }}</v-btn>
        </v-card-text>
      </v-card>

      <!-- Add note -->
      <v-card variant="outlined" class="bg-white mt-4">
        <v-card-text>
          <div class="section-label">Add a note</div>
          <div class="d-flex align-center ga-3 mb-3 flex-wrap">
            <v-select
              v-model="newNote.kind"
              :items="noteKindOptions"
              variant="outlined"
              density="compact"
              hide-details
              label="Kind"
              class="control-select"
            />
            <v-text-field
              v-model="newNote.title"
              variant="outlined"
              density="compact"
              hide-details
              label="Title (optional)"
              class="note-title-field"
            />
          </div>
          <v-textarea
            v-model="newNote.body"
            variant="outlined"
            density="compact"
            hide-details
            auto-grow
            rows="4"
            placeholder="Markdown. Paste a transcript here as-is."
            class="mb-3"
          />
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            :loading="savingNote"
            :disabled="!newNote.kind || !newNote.body.trim()"
            @click="addNote"
          >Add note</v-btn>
          <span v-if="noteError" class="text-error text-body-2 ml-3">{{ noteError }}</span>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { formatRelativeDate } from '@/composables/useCurationDescriptor';
import DashboardBreadcrumbs from '@/components/DashboardBreadcrumbs.vue';
import HiringMarkdown from '@/components/Hiring/HiringMarkdown.vue';
import {
  roleTitle, STAGES, OWNERS, NOTE_KINDS, noteKindMeta, formatAttrValue,
  RATERS, RATER_BY_USER_ID, VERDICTS, VERDICT_COLORS,
} from './hiringVocab';

defineOptions({ name: 'AdminHiringDetail' });

const props = defineProps({
  applicationId: { type: String, required: true },
});

const application = ref(null);
const notes = ref([]);
const loading = ref(true);
const error = ref('');

const stage = ref(null);
const owner = ref(null);
const saving = ref(false);
const saveError = ref('');

const resumeOpen = ref(true);
const expanded = reactive({});
const confirmingDelete = ref(null);

const newNote = reactive({ kind: null, title: '', body: '' });
const savingNote = ref(false);
const noteError = ref('');

const store = useStore();
// Which rater the logged-in user is; admins who aren't raters see read-only rows.
const myRater = computed(() => RATER_BY_USER_ID[store.getters['user/userId']]);
const ratings = computed(() => application.value?.ratings || {});
const myRating = computed(() => (myRater.value ? ratings.value[myRater.value] : null));

const myVerdict = ref(null);
const myComment = ref('');
const savingRating = ref(false);
const ratingError = ref('');

const ratingDirty = computed(() =>
  myVerdict.value !== (myRating.value?.verdict || null)
  || myComment.value.trim() !== (myRating.value?.comment || ''));

function verdictBtnColor(v) {
  const c = VERDICT_COLORS[v];
  return c === 'grey' ? 'grey-darken-1' : c;
}

function syncRatingForm() {
  myVerdict.value = myRating.value?.verdict || null;
  myComment.value = myRating.value?.comment || '';
}

async function saveRating() {
  savingRating.value = true;
  ratingError.value = '';
  try {
    const payload = { verdict: myVerdict.value };
    if (myComment.value.trim()) payload.comment = myComment.value.trim();
    const res = await axios.put(`${apiBase.value}/rating`, payload, axiosConfig({ userAuth: true }));
    application.value = { ...application.value, ...res.data };
    syncRatingForm();
  } catch (e) {
    ratingError.value = e.response?.data?.message || 'Failed to save rating.';
  } finally {
    savingRating.value = false;
  }
}

async function clearRating() {
  savingRating.value = true;
  ratingError.value = '';
  try {
    const res = await axios.delete(`${apiBase.value}/rating`, axiosConfig({ userAuth: true }));
    application.value = { ...application.value, ...res.data };
    syncRatingForm();
  } catch (e) {
    ratingError.value = e.response?.data?.message || 'Failed to clear rating.';
  } finally {
    savingRating.value = false;
  }
}

const stageOptions = STAGES.map((s) => ({ value: s, title: s }));
const ownerOptions = OWNERS.map((o) => ({ value: o, title: o }));
const noteKindOptions = NOTE_KINDS.map((k) => ({ value: k.value, title: k.title }));

const questions = [
  { key: 'why_here', label: 'Why do you want to work here?' },
  { key: 'first_week', label: 'What will you do in your first week?' },
  { key: 'coolest_build', label: "What's the coolest thing you've ever built?" },
];

const basics = computed(() => application.value?.basics || {});
const answers = computed(() => application.value?.answers || {});
const education = computed(() => (basics.value.education || []).filter((r) => r && (r.institution || r.degree || r.field)));
const name = computed(() => basics.value.name || props.applicationId);
const attrEntries = computed(() => Object.entries(application.value?.attributes || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)));

const breadcrumbItems = computed(() => [
  { text: 'Hiring', to: '/admin/hiring' },
  { text: name.value },
]);

function eduQualification(row) {
  const degree = (row.degree || '').trim();
  const field = (row.field || '').trim();
  if (degree && field) return `${degree} in ${field}`;
  return degree || field;
}

function noteAuthor(note) {
  return note.author || '—';
}

function isLong(note) {
  return (note.body || '').length > 2500;
}

const apiBase = computed(() => `${urlBase.userApi}/jobs/applications/${props.applicationId}`);

async function fetchApplication() {
  loading.value = true;
  error.value = '';
  try {
    const res = await axios.get(apiBase.value, axiosConfig({ userAuth: true }));
    application.value = res.data;
    notes.value = res.data.notes || [];
    stage.value = res.data.stage;
    owner.value = res.data.owner;
    syncRatingForm();
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load application.';
  } finally {
    loading.value = false;
  }
}

async function saveField(field, value) {
  saving.value = true;
  saveError.value = '';
  try {
    const res = await axios.patch(apiBase.value, { [field]: value }, axiosConfig({ userAuth: true }));
    application.value = { ...application.value, ...res.data };
    stage.value = res.data.stage;
    owner.value = res.data.owner;
  } catch (e) {
    saveError.value = e.response?.data?.message || `Failed to save ${field}.`;
    stage.value = application.value.stage;
    owner.value = application.value.owner;
  } finally {
    saving.value = false;
  }
}

async function addNote() {
  savingNote.value = true;
  noteError.value = '';
  try {
    const payload = { kind: newNote.kind, body: newNote.body };
    if (newNote.title.trim()) payload.title = newNote.title.trim();
    const res = await axios.post(`${apiBase.value}/notes`, payload, axiosConfig({ userAuth: true }));
    notes.value = [...notes.value, res.data];
    newNote.kind = null;
    newNote.title = '';
    newNote.body = '';
  } catch (e) {
    noteError.value = e.response?.data?.message || 'Failed to add note.';
  } finally {
    savingNote.value = false;
  }
}

async function deleteNote(note) {
  confirmingDelete.value = null;
  try {
    await axios.delete(`${apiBase.value}/notes/${note.id}`, axiosConfig({ userAuth: true }));
    notes.value = notes.value.filter((n) => n.id !== note.id);
  } catch (e) {
    noteError.value = e.response?.data?.message || 'Failed to delete note.';
  }
}

onMounted(fetchApplication);
</script>

<style lang="scss" scoped>
.header-links {
  display: flex;
  gap: 16px;
  font-size: 14px;

  a {
    color: #1976d2;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }
}

.control-select {
  min-width: 160px;
  max-width: 190px;
}

.control-select-narrow {
  min-width: 130px;
  max-width: 150px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 10px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  margin: 14px 0 4px;
}

.answer-text {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.edu-list {
  font-size: 14px;
  padding-left: 22px;
  margin-bottom: 4px;
}

.attr-chip {
  display: inline-block;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 2px 8px;
  margin: 2px 6px 2px 0;
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.7);
}

.note-collapsed {
  max-height: 260px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: auto 0 0 0;
    height: 60px;
    background: linear-gradient(transparent, #fff);
  }
}

.note-title-field {
  max-width: 320px;
}

.rating-row {
  min-height: 44px;
  padding: 2px 0;
}

.rater-name {
  width: 56px;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.verdict-btn {
  text-transform: none;
  letter-spacing: normal;
}

.rating-comment-field {
  max-width: 340px;
}

.rating-comment {
  max-width: 420px;
}

.rating-chip {
  display: inline-block;
  min-width: 52px;
  text-align: center;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 12.5px;
  font-weight: 600;
}

.rating-chip--yes {
  background: rgba(76, 175, 80, 0.18);
  color: #2e7d32;
}

.rating-chip--maybe {
  background: rgba(255, 193, 7, 0.25);
  color: #9c6f00;
}

.rating-chip--no {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.55);
}

.rating-chip--unrated {
  background: transparent;
  border: 1px dashed rgba(0, 0, 0, 0.15);
  color: rgba(0, 0, 0, 0.25);
  font-weight: 400;
}
</style>
