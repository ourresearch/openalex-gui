// The one-mode search page's chat (oxjob #1744): plain words in, OQL out.
//
// The model lives behind api.openalex.org/query/text (oxjob #1494; Jason's account only for now,
// `QUERY_TEXT_ACCOUNTS` in the proxy). POST {text, current_query} -> {route, oql, sort, note,
// left_out, out_of_reach, howto, answer, link, count, ...}. A follow-up sends the OQL the page
// shows as `current_query`, so "only since 2023" edits the query on screen.
//
// The page's query state is the URL's `?oql=` in the new OQL form (x_new_oql, #1555), which
// carries the sort ("..., most cited first"). The answer's sort comes separately and /query
// ignores a sibling sort, so it is folded in through the OQO's `sort_by`.

import axios from 'axios';
import { urlBase, axiosConfig } from '@/apiConfig';
import { api } from '@/api';
import { validateOql } from '@/components/OqlPlayground/oqlEditorApi';
import { shortThrottleWaitMs } from '@/throttleRetry';

// Routes whose answer is a query to run (the help desk answers in words instead).
export const QUERY_ROUTES = new Set(['query', 'title', 'search_string']);

/** Ask the model. Resolves to the answer; rejects with an Error whose message is fit to show.
 *  `history` is context only (#1494 reads it so); `currentQuery` is what a follow-up edits. */
export async function askQueryText({ text, currentQuery = null, history = [] }) {
  const body = { text };
  if (currentQuery) body.current_query = currentQuery;
  if (history.length) body.history = history;
  try {
    const resp = await axios.post(`${urlBase.api}/query/text`, body, axiosConfig());
    return resp.data;
  } catch (e) {
    throw new Error(friendlyError(e));
  }
}

/**
 * One question to the chat's assistant message: {role, route, note, asides, answer, link, count,
 * oql, sort, how, shownOql}, or {role, error} when it fails or finds nothing. Never throws.
 * Shared by the chat and the homepage box, which waits on the landing page for it (#1744).
 */
export async function answerQuestion({ text, currentQuery = null, history = [] }) {
  try {
    const answer = await askQueryText({ text, currentQuery, history });
    const msg = {
      role: 'assistant',
      route: answer.route,
      note: answer.note || null,
      asides: answerAsides(answer),
      answer: answer.answer || null,
      link: answer.link || null,
      count: answer.count ?? null,
      oql: answer.oql || null,
      sort: answer.sort || null,
      how: stepsLine(answer.meta),
    };
    if (QUERY_ROUTES.has(answer.route) && answer.oql) {
      msg.shownOql = await oqlForAnswer(answer.oql, answer.sort);
    } else if (!answer.answer && !answer.note) {
      return { role: 'assistant', error: "I couldn't find a query for that. Try rewording it." };
    }
    return msg;
  } catch (e) {
    return { role: 'assistant', error: e.message };
  }
}

/** What to tell the person when /query/text fails. Never throws. */
export function friendlyError(e) {
  const status = e?.response?.status;
  const msg = e?.response?.data?.message || e?.response?.data?.error;
  if (status === 401) return 'Sign in to ask questions in plain words.';
  if (status === 403) return msg || 'Asking in plain words is open to a few test accounts for now.';
  if (status === 422) {
    return msg || "I couldn't turn that into a query. Try saying what you want (works, authors, "
      + 'institutions, journals...) and how to narrow it.';
  }
  if (status === 429) return msg || "You've hit a rate or credit limit. Try again in a minute.";
  if (status === 502 || status === 503 || status === 504) return "The model didn't answer this time. Try again.";
  if (status === 400) return msg || "That question didn't go through. Try rewording it.";
  if (!e?.response) return "Couldn't reach OpenAlex. Check your connection and try again.";
  return msg || 'Something went wrong. Try again.';
}

/** "cited_by_count:desc" -> [{column_id: "cited_by_count", direction: "desc"}]; null if none. */
export function sortToSortBy(sort) {
  if (!sort || typeof sort !== 'string') return null;
  const out = [];
  for (const part of sort.split(',')) {
    const [col, dir] = part.trim().split(':');
    if (!col) continue;
    out.push({ column_id: col, direction: dir === 'asc' ? 'asc' : 'desc' });
  }
  return out.length ? out : null;
}

/**
 * The page's ?oql=: whitespace collapsed onto one line, entity names KEPT. The site's
 * url.oqlForUrl strips `[name]` annotations (#603), which in the new form leaves bare codes
 * such as `versus(BY)` that the parser reads as a keyword; the parser ignores names, so
 * keeping them is safe and the link reads. Compare queries with url.oqlForUrl on both sides.
 */
export function oqlForPageUrl(oql) {
  return String(oql ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim();
}

/**
 * The OQL the page should run for an answer: the new form, with the answer's sort folded in,
 * provided it re-reads; else today's canonical form; else the answer's own OQL. Never strands
 * an answer. `getQuery` and `validate` are injectable for tests.
 */
export async function oqlForAnswer(oql, sort, getQuery = api.getQuery, validate = validateOql) {
  if (!oql) return null;
  let first;
  try {
    first = await retryShortThrottle(() => getQuery({ oql }));
  } catch (e) {
    return oql;
  }
  let candidate = first?.x_new_oql || null;
  const sortBy = sortToSortBy(sort);
  if (sortBy && first?.oqo) {
    try {
      const sorted = await retryShortThrottle(() => getQuery({ oqo: { ...first.oqo, sort_by: sortBy } }));
      if (sorted?.x_new_oql) candidate = sorted.x_new_oql;
    } catch (e) { /* keep the unsorted new form */ }
  }
  if (candidate) {
    try {
      const v = await retryShortThrottle(() => validate(oqlForPageUrl(candidate)));
      if (v?.valid) return candidate;
    } catch (e) { /* treat as not re-reading */ }
  }
  return first?.oql || oql;
}

// These calls come in a burst right after the answer, so a per-second throttle (429 with a
// Retry-After of about a second) is likely; wait it out once, as api.get does (Kyle, 2026-10-16).
// Seen live 2026-10-20 05:12 CT: the sort fold 429'd and the order was nearly lost.
export async function retryShortThrottle(fn) {
  try {
    return await fn();
  } catch (e) {
    const waitMs = shortThrottleWaitMs(e?.response);
    if (waitMs === null) throw e;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return fn();
  }
}

/**
 * The earlier turns, for the model's context (agreed with #1494, 2026-10-20): oldest first, the
 * last `max`, each {text, oql} where oql is the query that turn set (new form, with names) or
 * null when it answered in words or failed.
 */
export function buildHistory(messages, max = 6) {
  const turns = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m?.role !== 'user') continue;
    const reply = messages[i + 1]?.role === 'assistant' ? messages[i + 1] : null;
    turns.push({ text: m.text, oql: reply?.shownOql || null });
  }
  return turns.slice(-max);
}

/**
 * One quiet line on how the model got its answer, from meta.steps (#1494, 2026-10-20: [{tool, detail, ms}],
 * tool "find_entity" (detail "<type>: <name>") or "run_oql" (detail = a draft query, not shown)):
 * "Looked up University of Cape Town · tried 1 query · 11.6 s". With no steps (a pasted title, or the
 * live version before steps), just the time. Null when there's nothing to say.
 */
export function stepsLine(meta) {
  if (!meta) return null;
  const steps = Array.isArray(meta.steps) ? meta.steps : [];
  const names = steps
    .filter((s) => s?.tool === 'find_entity' && s.detail)
    .map((s) => String(s.detail).replace(/^[^:]*:\s*/, ''));
  const queries = steps.filter((s) => s?.tool === 'run_oql').length;
  const parts = [];
  if (names.length) {
    const shown = names.slice(0, 2).join(', ');
    parts.push(`Looked up ${shown}${names.length > 2 ? ` and ${names.length - 2} more` : ''}`);
  }
  if (queries) parts.push(`tried ${queries} ${queries === 1 ? 'query' : 'queries'}`);
  const ms = Number(meta.elapsed_ms);
  if (Number.isFinite(ms) && ms > 0) parts.push(`${(ms / 1000).toFixed(1)} s`);
  if (!parts.length) return null;
  const line = parts.join(' · ');
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** The lines the chat shows under an answer's note: what was left out, out of reach, how-to. */
export function answerAsides(answer) {
  const out = [];
  if (answer?.left_out) out.push({ kind: 'left_out', label: 'Left out', text: answer.left_out });
  if (answer?.out_of_reach) out.push({ kind: 'out_of_reach', label: 'Out of reach', text: answer.out_of_reach });
  if (answer?.howto) out.push({ kind: 'howto', label: 'How to', text: answer.howto });
  return out;
}

// ---- the thread, kept for the browser tab so a reload doesn't lose it ----------------------
const THREAD_KEY = 'nlChat.thread.v1';
const MAX_KEPT = 40;

export function loadThread(storage = globalThis.sessionStorage) {
  try {
    const raw = storage?.getItem(THREAD_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function saveThread(messages, storage = globalThis.sessionStorage) {
  try {
    storage?.setItem(THREAD_KEY, JSON.stringify(messages.slice(-MAX_KEPT)));
  } catch (e) { /* private mode / quota: the thread just won't survive a reload */ }
}
