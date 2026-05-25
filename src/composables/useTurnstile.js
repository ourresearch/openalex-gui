// Cloudflare Turnstile invisible-CAPTCHA composable (oxjob #252 Phase 4).
//
// Usage in a signup form:
//   const { turnstileEl, turnstileToken, turnstileError, mountTurnstile,
//           resetTurnstile } = useTurnstile()
//   // template: <div ref="turnstileEl" />
//   // when the form is shown: mountTurnstile()
//   // on submit: pass turnstileToken.value with the request
//   // on `turnstile_*` rejection: resetTurnstile() and let user retry
//
// The widget renders into the bound div (appearance: 'interaction-only', so
// it's invisible unless Cloudflare promotes the user to an interactive
// challenge). Token TTL ~5 min; resetTurnstile() forces a fresh one.

import { ref, onBeforeUnmount } from 'vue';
import { TURNSTILE_SITEKEY } from '@/apiConfig';

export function useTurnstile() {
  const turnstileEl = ref(null);
  const turnstileToken = ref('');
  const turnstileError = ref('');
  const widgetId = ref(null);

  // The Turnstile script in public/index.html is <script async defer>, so
  // window.turnstile may not exist yet when a form mounts. Poll for ~5s.
  const ensureLoaded = async () => {
    for (let i = 0; i < 50; i++) {
      if (window.turnstile) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  const mountTurnstile = async () => {
    turnstileError.value = '';
    const ready = await ensureLoaded();
    if (!ready) {
      turnstileError.value = 'CAPTCHA failed to load. Refresh the page and try again.';
      return;
    }
    if (!turnstileEl.value) return; // form was unmounted before we got here
    if (widgetId.value !== null) {
      window.turnstile.reset(widgetId.value);
      return;
    }
    widgetId.value = window.turnstile.render(turnstileEl.value, {
      sitekey: TURNSTILE_SITEKEY,
      appearance: 'interaction-only',
      callback: (token) => {
        turnstileToken.value = token;
        turnstileError.value = '';
      },
      'error-callback': () => {
        turnstileError.value = 'CAPTCHA failed. Refresh and try again.';
      },
      'expired-callback': () => {
        turnstileToken.value = '';
      },
    });
  };

  const resetTurnstile = () => {
    turnstileToken.value = '';
    if (widgetId.value !== null && window.turnstile) {
      window.turnstile.reset(widgetId.value);
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
    mountTurnstile,
    resetTurnstile,
  };
}
