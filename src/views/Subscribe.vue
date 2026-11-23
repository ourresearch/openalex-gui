<template>
  <static-page title="Get updates" :sections="sections">
    <template #intro>
      Get OpenAlex news by email. Choose what you'd like to receive.
    </template>

    <static-section id="sign-up" title="Sign up">
      <v-form v-if="submitState !== 'done'" ref="formRef" class="signup-form" @submit.prevent="submit">
        <div class="list-options">
          <label v-for="list in LISTS" :key="list.id" class="list-option" :class="{ selected: chosen.includes(list.id) }">
            <v-checkbox-btn v-model="chosen" :value="list.id" density="compact" />
            <span>
              <span class="list-name">{{ list.name }}</span>
              <span class="list-description">{{ list.description }}</span>
            </span>
          </label>
        </div>
        <div v-if="showListError" class="form-error">Choose at least one.</div>

        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          variant="outlined"
          density="comfortable"
          :rules="[emailRule]"
        />
        <div class="name-org">
          <v-text-field v-model="name" label="Name (optional)" autocomplete="name" variant="outlined" density="comfortable" />
          <v-text-field v-model="organization" label="Organization (optional)" autocomplete="organization" variant="outlined" density="comfortable" />
        </div>

        <v-btn type="submit" color="primary" size="large" rounded="pill" variant="flat" :loading="submitState === 'sending'">
          <v-icon start>mdi-email-outline</v-icon>
          Sign me up
        </v-btn>
        <div class="fine-print">
          We use your email only to send what you chose. Stop any time by replying to any email.
          See our <router-link to="/privacy">privacy policy</router-link>.
        </div>
        <div v-if="submitState === 'error'" class="form-error">
          That didn't go through. Please try again, or email
          <a href="mailto:support@openalex.org">support@openalex.org</a>.
        </div>
      </v-form>

      <div v-else class="signup-done">
        <p class="section-body">
          <strong>You're signed up.</strong> We'll send {{ chosenNames }} to {{ email }}.
        </p>
        <v-btn variant="outlined" rounded="pill" @click="reset">Sign up another address</v-btn>
      </div>
    </static-section>

    <static-section id="funder-newsletter" title="Funder newsletter">
      <p class="section-body">
        A five-minute monthly update for research funders: one big idea about open funding data,
        what's new in funding data in OpenAlex, a funder putting OpenAlex to work, and what's coming
        next. Want your work profiled, or a topic covered? Tell us at
        <a href="mailto:support@openalex.org">support@openalex.org</a>. We're also glad to meet about
        your data in OpenAlex, your open-data strategy or how you'd like to use OpenAlex, and to take
        your grant list.
      </p>
      <h3 class="subsection-header">Past issues</h3>
      <p v-if="issuesState === 'loading'" class="section-body">Loading…</p>
      <ul v-else-if="issues.length" class="section-list issue-list">
        <li v-for="issue in issues" :key="issue.id">
          <a :href="issue.link" target="_blank" rel="noopener">{{ issue.title }}</a>
          <span class="issue-date">{{ issue.date }}</span>
        </li>
      </ul>
      <p v-else-if="issuesState === 'error'" class="section-body">
        Every issue is also posted on
        <a :href="ISSUE_ARCHIVE_URL" target="_blank" rel="noopener">our blog</a>.
      </p>
      <p v-else class="section-body">
        The first issue goes out at the end of November 2026. Every issue will be listed here.
      </p>

      <template v-if="funderPosts.length">
        <h3 class="subsection-header">Related blog posts</h3>
        <ul class="section-list issue-list">
          <li v-for="post in funderPosts" :key="post.id">
            <a :href="post.link" target="_blank" rel="noopener">{{ post.title }}</a>
            <span class="issue-date">{{ post.date }}</span>
          </li>
        </ul>
      </template>
    </static-section>

    <static-section id="blog" title="Blog">
      <p class="section-body">
        News, new features and ideas from the OpenAlex team. Read every post on
        <a :href="BLOG" target="_blank" rel="noopener">blog.openalex.org</a>.
      </p>
    </static-section>
  </static-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import StaticPage from '@/components/StaticPage/StaticPage.vue';
import StaticSection from '@/components/StaticPage/StaticSection.vue';

defineOptions({ name: 'SubscribePage' });

const BLOG = 'https://blog.openalex.org';
// Each newsletter issue is a WordPress page under the page `funder-newsletter` (blog.openalex.org/funder-newsletter/<month>/),
// so issues stay out of the blog's post list and feed. Funder-relevant blog posts carry the category or tag
// `funder-newsletter` and are listed as related posts.
const FUNDER_SLUG = 'funder-newsletter';
const ISSUE_ARCHIVE_URL = `${BLOG}/${FUNDER_SLUG}/`;

// `value` is the checkbox option text in the Google Form, so it must match the form exactly.
const LISTS = [
  {
    id: 'blog',
    name: 'Every blog post',
    value: 'Every blog post',
    description: 'An email whenever we publish on the OpenAlex blog.',
  },
  {
    id: 'funders',
    name: 'Funder newsletter',
    value: 'Funder newsletter',
    description: 'Monthly, for research funders. Five minutes to read.',
  },
];

// Sign-ups go to the Google Form "OpenAlex email subscribers (sign-up form)" in Kyle's Drive;
// responses land in the Sheet "OpenAlex email subscribers (sign-ups)", which we BCC from.
const SIGNUP_FORM = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSeO1VuIFqySOkXCVF-1ToYFVpDmopUwcpZBvtxSiChv2zCYrw/formResponse',
  fields: { lists: 'entry.1490707328', email: 'entry.1744011966', name: 'entry.271217855', organization: 'entry.484953588' },
};

const sections = [
  { id: 'sign-up', label: 'Sign up' },
  { id: 'funder-newsletter', label: 'Funder newsletter' },
  { id: 'blog', label: 'Blog' },
];

const route = useRoute();
// /updates?list=funders (and /funder-newsletter, /subscribe?list=funders) preselects one list.
const preselected = LISTS.some(l => l.id === route.query.list) ? [route.query.list] : [];

const formRef = ref(null);
const chosen = ref(preselected);
const email = ref('');
const name = ref('');
const organization = ref('');
const submitState = ref('idle');
const showListError = ref(false);

const emailRule = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '') || 'Enter a valid email address';
const chosenNames = computed(() =>
  LISTS.filter(l => chosen.value.includes(l.id)).map(l => l.id === 'blog' ? 'every blog post' : 'the funder newsletter').join(' and '));

async function submit() {
  showListError.value = !chosen.value.length;
  const { valid } = await formRef.value.validate();
  if (!valid || showListError.value) return;
  submitState.value = 'sending';
  const body = new URLSearchParams({
    [SIGNUP_FORM.fields.email]: email.value.trim(),
    [SIGNUP_FORM.fields.name]: name.value.trim(),
    [SIGNUP_FORM.fields.organization]: organization.value.trim(),
  });
  LISTS.filter(l => chosen.value.includes(l.id)).forEach(l => body.append(SIGNUP_FORM.fields.lists, l.value));
  try {
    // Google Forms sends no CORS headers, so the response is opaque; a network failure still throws.
    await fetch(SIGNUP_FORM.action, { method: 'POST', mode: 'no-cors', body });
    submitState.value = 'done';
  } catch {
    submitState.value = 'error';
  }
}

function reset() {
  email.value = name.value = organization.value = '';
  submitState.value = 'idle';
}

const issues = ref([]);
const funderPosts = ref([]);
const issuesState = ref('loading');

const toItem = p => ({
  id: p.id,
  link: p.link,
  title: decodeEntities(p.title.rendered),
  date: new Date(p.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
});

async function loadIssues() {
  try {
    const getJson = path => fetch(`${BLOG}/wp-json/wp/v2/${path}`).then(r => r.json());
    const [parentPages, funderCats, funderTags] = await Promise.all([
      getJson(`pages?slug=${FUNDER_SLUG}&_fields=id`),
      getJson(`categories?slug=${FUNDER_SLUG}&_fields=id`),
      getJson(`tags?slug=${FUNDER_SLUG}&_fields=id`),
    ]);
    const filters = [
      funderCats.length && `categories=${funderCats[0].id}`,
      funderTags.length && `tags=${funderTags[0].id}`,
    ].filter(Boolean);
    const fields = '_fields=id,date,link,title';
    const [issuePages, related] = await Promise.all([
      parentPages.length ? getJson(`pages?parent=${parentPages[0].id}&orderby=date&order=desc&per_page=100&${fields}`) : [],
      filters.length
        ? getJson(`posts?${filters.join('&')}${filters.length > 1 ? '&tax_relation=OR' : ''}&per_page=100&${fields}`)
        : [],
    ]);
    issues.value = issuePages.map(toItem);
    funderPosts.value = related.map(toItem);
    issuesState.value = issues.value.length ? 'loaded' : 'empty';
  } catch {
    issuesState.value = 'error';
  }
}

function decodeEntities(html) {
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
}

onMounted(loadIssues);
</script>

<style scoped lang="scss">
.signup-form {
  max-width: 560px;
}
.list-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.list-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px 12px 6px;
  border: 1px solid #E4E4E7;
  border-radius: 10px;
  cursor: pointer;
  &.selected {
    border-color: #0A0A0A;
  }
  :deep(.v-selection-control) {
    flex: 0 0 auto;
  }
}
.list-name {
  display: block;
  font-weight: 600;
  color: #0A0A0A;
  margin-top: 6px;
}
.list-description {
  display: block;
  font-size: 14px;
  color: #52525B;
}
.name-org {
  display: flex;
  gap: 12px;
  > * { flex: 1; }
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 0;
  }
}
.fine-print {
  margin-top: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
}
.form-error {
  margin: -8px 0 16px;
  font-size: 14px;
  color: rgb(var(--v-theme-error));
}
.static-page ul.issue-list {
  list-style: none;
  padding-left: 0;
}
.issue-list li {
  display: flex;
  gap: 12px;
  align-items: baseline;
}
.issue-date {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
}
</style>
