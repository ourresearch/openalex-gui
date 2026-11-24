// Cloudflare Turnstile invisible-CAPTCHA composable (oxjob #252 Phase 4; waiting and plain refusals, #2318).
//
// Usage in a form:
//   const { turnstileEl, turnstileError, turnstileChecking, mountTurnstile, sendWithToken } = useTurnstile()
//   // template: <div ref="turnstileEl" />, and :loading="turnstileChecking" on the submit button
//   // when the form is shown: mountTurnstile() (a re-created div gets a new widget by itself)
//   // on submit: await sendWithToken((token) => request(token)); a turnstile_* refusal carries
//   //   e.turnstileMessage, the words to show
//
// The widget renders into the bound div (appearance: 'interaction-only', so
// it's invisible unless Cloudflare promotes the user to an interactive
// challenge). Token TTL ~5 min; one use each; resetTurnstile() forces a fresh one.
//
// Why the waiting (#2318): the check takes a few seconds, and a click before it finished sent no token, so users-api
// refused with "Please complete the CAPTCHA challenge" while there was nothing on the page to complete. Resetting the
// widget then restarted the half-done check, so a quick second click failed too (about 840 sign-ups a week got
// through only on a later try).

import { ref, watch, onBeforeUnmount } from 'vue';
import { TURNSTILE_SITEKEY } from '@/apiConfig';
import { sleep } from '@/util';

// How long a click waits for the check to finish. Cloudflare's own retry after an error is 8 s.
export const TOKEN_WAIT_MS = 15000;

const TRY_INSTEAD = 'If it keeps happening, turn off ad or privacy blockers for openalex.org, '
  + 'or try another browser or network (a phone hotspot, say).';

export const checkWords = {
  notLoaded: "The automatic check that you're a person couldn't load. " + TRY_INSTEAD,
  stillChecking: "The automatic check that you're a person hasn't finished yet. Wait a few seconds and try again. "
    + TRY_INSTEAD,
  failed: (code) => `The automatic check that you're a person couldn't run in this browser`
    + `${code ? ` (Cloudflare error ${code})` : ''}. It retries by itself, so try again in a few seconds. ` + TRY_INSTEAD,
  didNotPass: "The automatic check that you're a person didn't pass. A fresh one has started: try again in a few "
    + 'seconds. ' + TRY_INSTEAD,
  unavailable: "We couldn't reach the service that checks you're a person. Please try again in a moment.",
};

// Polls every 100 ms until test() is truthy or ms pass; returns whether it held.
async function pollUntil(test, ms) {
  for (let waited = 0; !test() && waited < ms; waited += 100) {
    await sleep(100);
  }
  return !!test();
}

export function useTurnstile() {
  const turnstileEl = ref(null);
  const turnstileToken = ref('');
  const turnstileError = ref('');
  const turnstileChecking = ref(false); // a click is waiting for the check
  const widgetId = ref(null);
  let widgetEl = null;      // the div the current widget lives in
  let widgetError = null;   // the widget's last error code ('300010', or '' if none given); null once a token arrives

  const resetTurnstile = () => {
    turnstileToken.value = '';
    if (widgetId.value === null || !window.turnstile) return;
    try {
      window.turnstile.reset(widgetId.value);
    } catch (e) {
      console.error('Turnstile reset failed:', e);
    }
  };

  let mounting = null;      // the mount in flight, so overlapping calls never render two widgets
  const mountTurnstile = () => {
    mounting = mounting || mountNow().finally(() => { mounting = null; });
    return mounting;
  };

  const mountNow = async () => {
    turnstileError.value = '';
    // The Turnstile script (nuxt.config.ts) is <script async defer>, so window.turnstile may not exist yet.
    if (!(await pollUntil(() => window.turnstile, 10000))) {
      turnstileError.value = checkWords.notLoaded;
      return;
    }
    const el = turnstileEl.value;
    if (!el) return; // form was unmounted before we got here
    if (widgetId.value !== null) {
      if (el === widgetEl) {
        resetTurnstile();
        return;
      }
      // The form's div was re-created (v-if), and the old widget went with it: render a new one into this div.
      try { window.turnstile.remove(widgetId.value); } catch (e) { /* already gone with its div */ }
      widgetId.value = null;
    }
    turnstileToken.value = '';
    widgetError = null;
    widgetEl = el;
    widgetId.value = window.turnstile.render(el, {
      sitekey: TURNSTILE_SITEKEY,
      appearance: 'interaction-only',
      callback: (token) => {
        turnstileToken.value = token;
        turnstileError.value = '';
        widgetError = null;
      },
      'error-callback': (code) => {
        widgetError = code ? String(code) : '';
        turnstileError.value = checkWords.failed(code);
        return true; // handled here; Turnstile still retries by itself (retry: 'auto')
      },
      'expired-callback': () => {
        turnstileToken.value = '';
      },
    });
  };

  // A form's div re-created after its first widget (e.g. "Use a different email"): start the check there now.
  watch(turnstileEl, (el) => {
    if (el && widgetId.value !== null && el !== widgetEl) mountTurnstile();
  }, { flush: 'post' });

  // The token for a click: waits for the invisible check to finish (up to `ms`) instead of sending none.
  const waitForToken = async (ms = TOKEN_WAIT_MS) => {
    turnstileChecking.value = true;
    try {
      if (turnstileEl.value && turnstileEl.value !== widgetEl) await mountTurnstile(); // not rendered yet (slow script)
      await pollUntil(() => turnstileToken.value, ms);
    } finally {
      turnstileChecking.value = false;
    }
    return turnstileToken.value;
  };

  // The words for users-api's turnstile_* refusal. "turnstile_required" means no token went: say why (still checking,
  // or the widget's error) rather than ask for a challenge the page doesn't show.
  const refusalMessage = (code) => {
    if (code === 'turnstile_failed') return checkWords.didNotPass;
    if (code === 'turnstile_unavailable') return checkWords.unavailable;
    return widgetError !== null ? checkWords.failed(widgetError) : checkWords.stillChecking;
  };

  // One click's request, with the check's token (waited for unless `wait` is false). After any refusal, a sent token
  // is spent (single use), so a fresh check starts; with none sent, the check is still running, so it's left to
  // finish. A turnstile_* refusal is rethrown with `turnstileMessage`, the words to show.
  const sendWithToken = async (send, { wait = true } = {}) => {
    const token = wait ? await waitForToken() : turnstileToken.value;
    try {
      return await send(token);
    } catch (e) {
      if (token) resetTurnstile();
      const code = e?.response?.data?.code || '';
      if (code.startsWith('turnstile_')) e.turnstileMessage = refusalMessage(code);
      throw e;
    }
  };

  onBeforeUnmount(() => {
    if (widgetId.value !== null && window.turnstile) {
      window.turnstile.remove(widgetId.value);
      widgetId.value = null;
    }
  });

  return {
    turnstileEl,
    turnstileToken,
    turnstileError,
    turnstileChecking,
    mountTurnstile,
    resetTurnstile,
    waitForToken,
    refusalMessage,
    sendWithToken,
  };
}
