<template>
  <!-- The chat column of the one-mode search page (oxjob #1744): ask in plain words, and the
       answer sets the page to its OQL. A follow-up edits the query on screen. -->
  <div class="nl-chat">
    <div class="nl-col-head">
      <v-icon size="18" class="mr-2" color="primary">mdi-creation-outline</v-icon>
      <span class="nl-col-title">Ask</span>
      <v-spacer />
      <v-btn
        v-if="messages.length"
        variant="text"
        size="small"
        class="text-none"
        prepend-icon="mdi-plus"
        :disabled="asking"
        @click="newChat"
      >New chat</v-btn>
      <v-btn icon variant="text" size="small" aria-label="Hide the chat" @click="$emit('collapse')">
        <v-icon size="20">mdi-chevron-right</v-icon>
        <v-tooltip activator="parent" location="bottom" content-class="linear-tooltip">Hide the chat</v-tooltip>
      </v-btn>
    </div>

    <div ref="scrollEl" class="nl-chat-thread">
      <!-- Empty thread: say what this is and offer real questions to start from. -->
      <div v-if="!messages.length" class="nl-chat-welcome">
        <div class="nl-chat-welcome-title">Ask OpenAlex anything about research.</div>
        <div class="nl-chat-welcome-sub">
          Plain words in; the query appears above the results, where you can edit it. Ask a
          follow-up to change it.
        </div>
        <div class="nl-chat-examples">
          <button
            v-for="q in examples"
            :key="q"
            type="button"
            class="nl-chat-example"
            :disabled="asking || !signedIn"
            @click="ask(q)"
          >{{ q }}</button>
        </div>
      </div>

      <template v-for="(m, i) in messages" :key="i">
        <div v-if="m.role === 'user'" class="nl-msg nl-msg--user">{{ m.text }}</div>

        <div v-else-if="m.error" class="nl-msg nl-msg--bot nl-msg--error">
          <v-icon size="16" color="error" class="mr-1">mdi-alert-circle-outline</v-icon>{{ m.error }}
        </div>

        <!-- Help desk: an answer in words with its help-site link; the page stays put. -->
        <div v-else-if="m.route === 'help_desk'" class="nl-msg nl-msg--bot">
          <hiring-markdown class="nl-md" :source="m.answer || ''" />
          <a v-if="m.link" :href="m.link" target="_blank" rel="noopener" class="nl-link">
            {{ linkLabel(m.link) }} <v-icon size="14">mdi-open-in-new</v-icon>
          </a>
        </div>

        <!-- A query: its note, what it left out, and the OQL it set (click to go back to it). -->
        <div v-else class="nl-msg nl-msg--bot">
          <div v-if="m.note" class="nl-note">{{ m.note }}</div>
          <div v-for="a in m.asides || []" :key="a.kind" class="nl-aside">
            <span class="nl-aside-label">{{ a.label }}:</span> {{ a.text }}
          </div>
          <button
            v-if="m.shownOql"
            type="button"
            class="nl-oql-snippet"
            :class="{ 'nl-oql-snippet--current': isCurrent(m) }"
            :title="isCurrent(m) ? 'This is the query on the page' : 'Show this query again'"
            @click="useQuery(m)"
          >
            <code>{{ m.shownOql }}</code>
            <span class="nl-oql-snippet-foot">
              <span v-if="m.count != null">{{ countLabel(m.count) }}</span>
              <span v-if="!isCurrent(m)" class="nl-oql-snippet-use">
                <v-icon size="14">mdi-arrow-u-left-top</v-icon> Show again
              </span>
            </span>
          </button>
        </div>
      </template>

      <div v-if="asking" class="nl-msg nl-msg--bot nl-msg--thinking">
        <span class="nl-dots"><span /><span /><span /></span>
        <span class="nl-thinking-text">Writing the query{{ elapsed >= 2 ? ` · ${elapsed} s` : '' }}</span>
      </div>
    </div>

    <div class="nl-chat-input">
      <div v-if="!signedIn" class="nl-signin text-body-2">
        <router-link :to="{ name: 'Login', query: { redirect: $route.fullPath } }">Sign in</router-link>
        to ask in plain words.
      </div>
      <div class="nl-input-box" :class="{ 'nl-input-box--disabled': !signedIn }">
        <textarea
          ref="inputEl"
          v-model="draft"
          class="nl-textarea"
          rows="1"
          :placeholder="messages.length ? 'Ask a follow-up, or something new' : 'Ask a question about research'"
          :disabled="!signedIn"
          @keydown.enter.exact.prevent="send"
          @input="autoGrow"
        />
        <v-btn
          icon
          size="small"
          color="primary"
          variant="flat"
          class="nl-send"
          aria-label="Send"
          :disabled="!draft.trim() || asking || !signedIn"
          @click="send"
        >
          <v-icon size="18">mdi-arrow-up</v-icon>
        </v-btn>
      </div>
      <div class="nl-input-hint">Enter to send · Shift+Enter for a new line</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';

import { url } from '@/url';
import filters from '@/filters';
import HiringMarkdown from '@/components/Hiring/HiringMarkdown.vue';
import {
  askQueryText, oqlForAnswer, answerAsides, buildHistory, QUERY_ROUTES, loadThread, saveThread,
} from '@/components/NlSearch/nlChat';
import { EXAMPLE_QUESTIONS } from '@/components/NlSearch/nlExamples';

defineOptions({ name: 'NlChat' });

const emit = defineEmits(['collapse', 'answer']);

const store = useStore();
const route = useRoute();
const router = useRouter();

const messages = ref(loadThread());
const draft = ref('');
const asking = ref(false);
const elapsed = ref(0);
const scrollEl = ref(null);
const inputEl = ref(null);
const examples = EXAMPLE_QUESTIONS;

const signedIn = computed(() => !!store.getters['user/userId']);

watch(messages, (m) => saveThread(m), { deep: true });

// The OQL the page shows, sent with a follow-up so the model edits it. Only when the page
// holds a query someone made (an ?oql=, or filters / a search on a classic URL); the bare
// all-works page is no context.
const currentQuery = computed(() => {
  const q = route.query;
  const hasQuery = q.oql || q.filter || Object.keys(q).some((k) => k.startsWith('search'));
  // The URL's OQL keeps entity names, which help the model; the execute echo drops them.
  return hasQuery ? (q.oql || store.getters.shownOql || null) : null;
});

function collapse(s) {
  return url.oqlForUrl(String(s || '').trim());
}
function isCurrent(m) {
  return !!m.shownOql && collapse(m.shownOql) === collapse(route.query.oql || store.getters.shownOql);
}

function countLabel(n) {
  const what = n === 1 ? 'result' : 'results';
  return `${filters.toPrecision(n)} ${what}`;
}
function linkLabel(link) {
  try {
    const u = new URL(link);
    return u.hostname === 'help.openalex.org' ? 'Read more in the help center' : u.hostname;
  } catch (e) {
    return link;
  }
}

async function scrollToEnd() {
  await nextTick();
  const el = scrollEl.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function autoGrow() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
}

let timer = null;
function startClock() {
  elapsed.value = 0;
  const t0 = Date.now();
  timer = setInterval(() => { elapsed.value = Math.floor((Date.now() - t0) / 1000); }, 500);
}
function stopClock() {
  if (timer) clearInterval(timer);
  timer = null;
}
onBeforeUnmount(stopClock);

function send() {
  const text = draft.value.trim();
  if (!text || asking.value || !signedIn.value) return;
  draft.value = '';
  nextTick(autoGrow);
  ask(text);
}

async function ask(text) {
  if (asking.value) return;
  const history = buildHistory(messages.value);
  messages.value.push({ role: 'user', text });
  asking.value = true;
  startClock();
  scrollToEnd();
  const context = currentQuery.value;
  let msg;
  try {
    const answer = await askQueryText({ text, currentQuery: context, history });
    msg = {
      role: 'assistant',
      route: answer.route,
      note: answer.note || null,
      asides: answerAsides(answer),
      answer: answer.answer || null,
      link: answer.link || null,
      count: answer.count ?? null,
      oql: answer.oql || null,
      sort: answer.sort || null,
    };
    if (QUERY_ROUTES.has(answer.route) && answer.oql) {
      msg.shownOql = await oqlForAnswer(answer.oql, answer.sort);
    } else if (!answer.answer && !answer.note) {
      msg = { role: 'assistant', error: "I couldn't find a query for that. Try rewording it." };
    }
  } catch (e) {
    msg = { role: 'assistant', error: e.message };
  }
  stopClock();
  asking.value = false;
  messages.value.push(msg);
  scrollToEnd();
  if (msg.shownOql && runOql(msg.shownOql)) emit('answer', msg);
}

// Set the page to a query; true when that navigated (an answer equal to the page's query
// changes nothing).
function runOql(oql) {
  const next = collapse(oql);
  if (!next || next === (route.query.oql || '')) return false;
  store.commit('setOqlSubmitError', null);
  url.pushToRoute(router, { name: 'OqlQuery', query: { oql: next } });
  return true;
}

function useQuery(m) {
  if (isCurrent(m)) return;
  if (runOql(m.shownOql)) emit('answer', m);
}

function newChat() {
  messages.value = [];
  draft.value = '';
  nextTick(() => inputEl.value?.focus());
}

// `?ask=` starts the chat with a question (handy for links in slides), then leaves the URL.
onMounted(() => {
  scrollToEnd();
  const q = typeof route.query.ask === 'string' ? route.query.ask.trim() : '';
  if (q) {
    const query = { ...route.query };
    delete query.ask;
    router.replace({ name: route.name, params: route.params, query });
    if (signedIn.value) ask(q);
    else draft.value = q;
  } else {
    inputEl.value?.focus();
  }
});

defineExpose({ ask });
</script>

<style scoped>
.nl-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.nl-chat-thread {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.nl-chat-welcome {
  margin: auto 0 8px;
  padding-top: 24px;
}
.nl-chat-welcome-title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.87);
}
.nl-chat-welcome-sub {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.6);
}
.nl-chat-examples {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 16px;
}
.nl-chat-example {
  text-align: left;
  font-size: 14px;
  line-height: 1.4;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  background: #fff;
  color: rgba(0, 0, 0, 0.8);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}
.nl-chat-example:hover:not(:disabled) {
  background: rgba(var(--v-theme-primary), 0.05);
  border-color: rgba(var(--v-theme-primary), 0.4);
}
.nl-chat-example:disabled {
  cursor: default;
  opacity: 0.6;
}
.nl-msg {
  font-size: 14px;
  line-height: 1.5;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.nl-msg--user {
  align-self: flex-end;
  max-width: 85%;
  background: rgba(var(--v-theme-primary), 0.09);
  color: rgba(0, 0, 0, 0.87);
  padding: 8px 12px;
  border-radius: 14px 14px 4px 14px;
  white-space: pre-wrap;
}
.nl-msg--bot {
  align-self: stretch;
  color: rgba(0, 0, 0, 0.87);
}
.nl-msg--error {
  color: rgb(var(--v-theme-error));
}
.nl-note {
  margin-bottom: 6px;
}
.nl-aside {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.62);
  margin-bottom: 4px;
}
.nl-aside-label {
  font-weight: 600;
}
.nl-md :deep(p:last-child) {
  margin-bottom: 4px;
}
.nl-link {
  font-size: 13px;
}
.nl-oql-snippet {
  display: block;
  width: 100%;
  text-align: left;
  margin-top: 6px;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.025);
  cursor: pointer;
}
.nl-oql-snippet code {
  display: block;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  line-height: 1.45;
  white-space: pre-wrap;
  color: rgba(0, 0, 0, 0.8);
  background: none;
  padding: 0;
}
.nl-oql-snippet--current {
  border-color: rgba(0, 0, 0, 0.22);
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  cursor: default;
}
.nl-oql-snippet-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
}
.nl-oql-snippet-use {
  color: rgb(var(--v-theme-primary));
}
.nl-msg--thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.6);
}
.nl-dots {
  display: inline-flex;
  gap: 3px;
}
.nl-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  opacity: 0.35;
  animation: nl-pulse 1.2s infinite ease-in-out;
}
.nl-dots span:nth-child(2) { animation-delay: 0.2s; }
.nl-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes nl-pulse {
  0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
  40% { opacity: 1; transform: scale(1); }
}
.nl-chat-input {
  flex: 0 0 auto;
  padding: 8px 16px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
}
.nl-signin {
  margin-bottom: 6px;
  color: rgba(0, 0, 0, 0.6);
}
.nl-input-box {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 14px;
  padding: 6px 6px 6px 12px;
  background: #fff;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.nl-input-box:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12);
}
.nl-input-box--disabled {
  opacity: 0.6;
}
.nl-textarea {
  flex: 1 1 auto;
  resize: none;
  border: none;
  outline: none;
  font: inherit;
  font-size: 15px;
  line-height: 1.45;
  padding: 5px 0;
  max-height: 160px;
  background: transparent;
  color: rgba(0, 0, 0, 0.87);
}
.nl-send {
  flex: 0 0 auto;
}
.nl-input-hint {
  margin-top: 4px;
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.42);
}
</style>
