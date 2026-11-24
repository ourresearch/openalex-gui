import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// oxjob #2318: a click waits for the invisible check instead of sending no token, a refusal says why in plain words
// (and names Cloudflare's error code), and a re-created form div gets a new widget.

vi.mock('@/apiConfig', () => ({ TURNSTILE_SITEKEY: 'test-sitekey' }));
vi.mock('vue', async (orig) => ({ ...(await orig()), onBeforeUnmount: () => {} }));
vi.mock('@/util', () => ({ sleep: (ms) => new Promise((r) => setTimeout(r, ms)) }));

import { useTurnstile, checkWords, TOKEN_WAIT_MS } from '../composables/useTurnstile';

function fakeTurnstile() {
  const widgets = [];
  return {
    widgets,
    render: vi.fn((el, opts) => { widgets.push({ el, opts }); return `w${widgets.length}`; }),
    reset: vi.fn(),
    remove: vi.fn(),
    last: () => widgets[widgets.length - 1].opts,
  };
}

let ts;
beforeEach(() => {
  vi.useFakeTimers();
  ts = fakeTurnstile();
  globalThis.window = { turnstile: ts };
});
afterEach(() => {
  vi.useRealTimers();
  delete globalThis.window;
});

async function mounted() {
  const t = useTurnstile();
  t.turnstileEl.value = { id: 'div1' };
  await t.mountTurnstile();
  return t;
}

describe('waitForToken', () => {
  it('waits for a check still running, then returns its token', async () => {
    const t = await mounted();
    const p = t.waitForToken();
    await vi.advanceTimersByTimeAsync(2000);
    ts.last().callback('tok-1');
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe('tok-1');
  });

  it('returns at once when the token is already there', async () => {
    const t = await mounted();
    ts.last().callback('tok-2');
    await expect(t.waitForToken()).resolves.toBe('tok-2');
  });

  it('gives up after the wait with no token', async () => {
    const t = await mounted();
    const p = t.waitForToken();
    await vi.advanceTimersByTimeAsync(TOKEN_WAIT_MS + 200);
    await expect(p).resolves.toBe('');
  });
});

describe('refusalMessage', () => {
  it('says the check is still running when no token went and the widget showed no error', async () => {
    const t = await mounted();
    expect(t.refusalMessage('turnstile_required')).toBe(checkWords.stillChecking);
  });

  it("names Cloudflare's error code when the widget failed, and forgets it once a token comes", async () => {
    const t = await mounted();
    expect(ts.last()['error-callback']('300010')).toBe(true);
    expect(t.turnstileError.value).toContain('Cloudflare error 300010');
    expect(t.refusalMessage('turnstile_required')).toContain('Cloudflare error 300010');
    ts.last().callback('tok-3');
    expect(t.turnstileError.value).toBe('');
    expect(t.refusalMessage('turnstile_required')).toBe(checkWords.stillChecking);
  });

  it('says a fresh check started after a bad token', async () => {
    const t = await mounted();
    expect(t.refusalMessage('turnstile_failed')).toBe(checkWords.didNotPass);
  });
});

describe('mountTurnstile', () => {
  it('resets the widget when the same div is mounted again', async () => {
    const t = await mounted();
    await t.mountTurnstile();
    expect(ts.render).toHaveBeenCalledTimes(1);
    expect(ts.reset).toHaveBeenCalledWith('w1');
  });

  it('never renders two widgets when a click overlaps the first mount', async () => {
    const t = useTurnstile();
    t.turnstileEl.value = { id: 'div1' };
    const first = t.mountTurnstile();
    const second = t.mountTurnstile();
    await Promise.all([first, second]);
    expect(ts.render).toHaveBeenCalledTimes(1);
  });

  it('renders a new widget into a re-created div (the form came back after "Use a different email")', async () => {
    const t = await mounted();
    ts.last().callback('spent-token');
    t.turnstileEl.value = { id: 'div2' };
    await vi.advanceTimersByTimeAsync(0); // the watch on the div
    expect(ts.remove).toHaveBeenCalledWith('w1');
    expect(ts.render).toHaveBeenCalledTimes(2);
    expect(ts.widgets[1].el).toEqual({ id: 'div2' });
    expect(t.turnstileToken.value).toBe('');
  });

  it('says the check could not load when the script never arrives', async () => {
    globalThis.window = {};
    const t = useTurnstile();
    t.turnstileEl.value = { id: 'div1' };
    const p = t.mountTurnstile();
    await vi.advanceTimersByTimeAsync(11000);
    await p;
    expect(t.turnstileError.value).toBe(checkWords.notLoaded);
  });
});

describe('sendWithToken', () => {
  const refusal = (code) => Object.assign(new Error('403'), { response: { status: 403, data: { code } } });

  it('sends the token once the check finishes, and shows the wait meanwhile', async () => {
    const t = await mounted();
    const send = vi.fn(async (token) => `sent ${token}`);
    const p = t.sendWithToken(send);
    await vi.advanceTimersByTimeAsync(500);
    expect(t.turnstileChecking.value).toBe(true);
    expect(send).not.toHaveBeenCalled();
    ts.last().callback('tok-4');
    await vi.advanceTimersByTimeAsync(200);
    await expect(p).resolves.toBe('sent tok-4');
    expect(t.turnstileChecking.value).toBe(false);
  });

  it('leaves a still-running check alone after a refusal with no token sent', async () => {
    const t = await mounted();
    const p = t.sendWithToken(async () => { throw refusal('turnstile_required'); });
    const caught = p.catch((e) => e);
    await vi.advanceTimersByTimeAsync(TOKEN_WAIT_MS + 200);
    const e = await caught;
    expect(e.turnstileMessage).toBe(checkWords.stillChecking);
    expect(ts.reset).not.toHaveBeenCalled();
  });

  it('starts a fresh check after any refusal of a sent token (tokens are single-use)', async () => {
    const t = await mounted();
    ts.last().callback('tok-5');
    const e = await t.sendWithToken(async () => { throw refusal('turnstile_failed'); }).catch((x) => x);
    expect(e.turnstileMessage).toBe(checkWords.didNotPass);
    expect(ts.reset).toHaveBeenCalledWith('w1');
    expect(t.turnstileToken.value).toBe('');
  });

  it('does not wait when told not to (a plain login link)', async () => {
    const t = await mounted();
    const send = vi.fn(async (token) => token);
    await expect(t.sendWithToken(send, { wait: false })).resolves.toBe('');
    expect(send).toHaveBeenCalledWith('');
  });

  it('passes other errors through untouched', async () => {
    const t = await mounted();
    ts.last().callback('tok-6');
    const err = Object.assign(new Error('409'), { response: { status: 409, data: { code: 'email_in_use' } } });
    const e = await t.sendWithToken(async () => { throw err; }).catch((x) => x);
    expect(e).toBe(err);
    expect(e.turnstileMessage).toBeUndefined();
  });
});
