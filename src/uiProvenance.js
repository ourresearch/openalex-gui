// UI-provenance token manager (oxjob #338 Phase 5a / "P-A").
//
// Gives openalex.org API calls an *unforgeable* "this came from the real web
// GUI" marker, replacing the trivially-spoofable `mailto=ui@openalex.org` query
// param (bots copy that string verbatim, poisoning the UI-vs-API analytics
// split #338 and #340 both rely on).
//
// Flow: on app start we render an invisible Cloudflare Turnstile widget, swap
// the Turnstile solve for a short-TTL HMAC token from `POST /ui-token`, hold it
// in memory, and re-mint shortly before it expires. `axiosConfig()` attaches it
// as the `X-OpenAlex-UI` header on OpenAlex API calls.
//
// Since oxjobs #1691/#1692 the token earns the website's API perks (cheap search
// facets, no pausing of searches under load) and only works from the IP that
// minted it. So we keep it in localStorage (a page load needn't start without
// one; before this ~41% of the website's calls went out before the mint landed),
// and when the API answers `X-OpenAlex-UI-Token: refresh` (token expired, minted
// on another network, or unknown) we drop it and mint a new one.
//
// DESIGN INVARIANTS:
// - Never blocks: every failure path here (script not loaded, off-domain,
//   challenge unsolved, mint error, storage blocked) just means "no token" →
//   requests go out without it and are priced like any keyless call.
//   Nothing here may ever block, delay, or break an API call. It's best-effort.
// - Fully async / fire-and-forget: never awaited by the render path.

import axios from 'axios';
import { urlBase, UI_PROVENANCE_SITEKEY } from '@/apiConfig';

let _token = null;        // current minted token (or null)
let _expiresAtMs = 0;     // epoch ms when _token expires
let _widgetId = null;     // Turnstile widget id
let _initialized = false; // guard against double-init
let _remintTimer = null;
let _refreshing = false;  // a re-mint asked for by the API is in flight

// Re-mint this many ms before expiry so a valid token is (almost) always ready.
const REMINT_LEAD_MS = 60_000;
const STORAGE_KEY = 'openalexUiToken';
const STATUS_HEADER = 'x-openalex-ui-token'; // axios lower-cases response header names

/** Synchronous getter used by axiosConfig(). Returns a non-expired token or null. */
export function getUiToken() {
    if (_token && Date.now() < _expiresAtMs) return _token;
    return null;
}

function setToken(token, expiresAtMs) {
    _token = token;
    _expiresAtMs = expiresAtMs;
    try {
        if (token) localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: expiresAtMs }));
        else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage blocked or full: memory only */ }
}

function loadStoredToken() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved?.token && Number(saved.expiresAt) > Date.now() + REMINT_LEAD_MS) {
            _token = saved.token;
            _expiresAtMs = Number(saved.expiresAt);
            scheduleRemint(_expiresAtMs - Date.now());
        }
    } catch { /* unreadable: mint fresh */ }
}

// The Turnstile script (public/index.html) is async; window.turnstile may not
// exist yet. Poll up to ~5s, matching useTurnstile.js.
async function ensureTurnstileLoaded() {
    for (let i = 0; i < 50; i++) {
        if (window.turnstile) return true;
        await new Promise((r) => setTimeout(r, 100));
    }
    return false;
}

// Exchange a Turnstile solve for a minted UI-provenance token.
async function mintFromTurnstile(turnstileResponse) {
    try {
        const res = await axios.post(
            `${urlBase.api}/ui-token`,
            { turnstileResponse },
            { headers: { 'Content-Type': 'application/json' } },
        );
        const token = res?.data?.token;
        const expiresIn = res?.data?.expiresIn; // seconds
        if (token && expiresIn) {
            setToken(token, Date.now() + expiresIn * 1000);
            scheduleRemint(expiresIn * 1000);
        }
    } catch (e) {
        // Mint not configured (503), Turnstile rejected (403), capped (429), or network error.
        // Harmless — we keep any still-valid token (getUiToken checks expiry) or go without.
    } finally {
        _refreshing = false;
    }
}

// Force a fresh Turnstile solve (its token is short-lived/single-use), which
// triggers the render callback → mintFromTurnstile.
function refreshTurnstile() {
    if (_widgetId !== null && window.turnstile) {
        try { window.turnstile.reset(_widgetId); } catch { /* ignore */ }
    }
}

function scheduleRemint(ttlMs) {
    if (_remintTimer) clearTimeout(_remintTimer);
    const delay = Math.max(ttlMs - REMINT_LEAD_MS, 5_000);
    _remintTimer = setTimeout(refreshTurnstile, delay);
}

/**
 * The API refused the token this response was sent with: drop it and mint once,
 * however many responses in a burst carry the signal. A response to a request
 * sent with an older token than the current one is ignored.
 */
export function handleUiTokenStatus(response) {
    try {
        if (response?.headers?.[STATUS_HEADER] !== 'refresh') return;
        const sent = response?.config?.headers?.['X-OpenAlex-UI'];
        if (sent && sent !== _token) return;
        setToken(null, 0);
        if (_refreshing) return;
        _refreshing = true;
        refreshTurnstile();
    } catch { /* never break a response */ }
}

/**
 * Initialise UI provenance. Call once at app startup. Never throws, never
 * blocks — safe to call fire-and-forget.
 */
export async function initUiProvenance() {
    if (_initialized) return;
    _initialized = true;
    try {
        loadStoredToken();
        axios.interceptors.response.use(
            (response) => { handleUiTokenStatus(response); return response; },
            (error) => { handleUiTokenStatus(error?.response); return Promise.reject(error); },
        );

        const ready = await ensureTurnstileLoaded();
        if (!ready) return; // no Turnstile → no token; harmless

        // Headless + INVISIBLE TO USERS (oxjob #338): render into an OFF-SCREEN
        // anchor. When Cloudflare lets the widget pass silently the callback
        // still fires and we mint a token — the common case. If CF promotes to
        // an interactive challenge, it renders here off-screen so the user
        // NEVER sees a CAPTCHA; that cycle simply doesn't mint and the request
        // goes out untagged (untrusted server-side), which the design
        // invariants above already treat as fine. We deliberately do not
        // interrupt a real human for an analytics-only provenance token.
        // (Previously this anchor was pinned visible at bottom-right with a max
        // z-index "in case CF surfaces a challenge" — that surfaced a checkbox
        // mid-session and camped out showing "Success". Inverted on purpose.)
        const anchor = document.createElement('div');
        anchor.className = 'ui-provenance-turnstile';
        anchor.style.position = 'fixed';
        anchor.style.left = '-10000px';
        anchor.style.top = '0';
        anchor.style.pointerEvents = 'none';
        anchor.setAttribute('aria-hidden', 'true');
        document.body.appendChild(anchor);

        // Mints on every app start, as before; a stored token covers the calls made before it lands.
        _widgetId = window.turnstile.render(anchor, {
            sitekey: UI_PROVENANCE_SITEKEY,
            appearance: 'interaction-only', // silent pass mints; any interactive promo stays off-screen
            callback: (turnstileResponse) => { mintFromTurnstile(turnstileResponse); },
            'error-callback': () => { _refreshing = false; /* leave _token as-is; retry on next remint */ },
            'expired-callback': () => { refreshTurnstile(); },
        });
    } catch (e) {
        // Any failure here must not affect the app.
    }
}

/** Test hook: reset module state between tests. */
export function _resetForTests() {
    _token = null; _expiresAtMs = 0; _widgetId = null; _initialized = false; _refreshing = false;
    if (_remintTimer) clearTimeout(_remintTimer);
    _remintTimer = null;
}
