// Trips to orcid.org and back (oxjobs #1466, #1475, #2538).
//
// ORCID returns every sign-in to one registered page, /orcid-callback, with a one-time code. Each trip starts here:
// we save what the person is doing (log in, sign up, link in Settings, claim a profile) under a random `state`, and
// /orcid-callback uses a code only when its state is one this browser saved. Without that check anyone could send a
// signed-in person a link to /orcid-callback?code=<a code from their own ORCID>, link their ORCID to that person's
// account, and then log in to it with ORCID.
import { copy, orcidAuthorizeUrl } from '@/components/Entity/claimCopy.js';
import { sanitizeRedirectPath } from '@/util';

const KEY = 'orcidTrips';
const SIGNUP_KEY = 'orcidSignupKey';
const MAX_AGE_MS = 30 * 60 * 1000;
const MAX_TRIPS = 5;
export const ORCID_FLOWS = ['login', 'signup', 'settings', 'claim'];

function randomHex(cryptoObj, bytes = 16) {
  const buf = new Uint8Array(bytes);
  cryptoObj.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

function readTrips(storage, now) {
  let trips = {};
  try {
    trips = JSON.parse(storage.getItem(KEY) || '{}') || {};
  } catch (e) {
    trips = {};
  }
  // Drop expired trips; keep the newest few.
  const live = Object.entries(trips)
    .filter(([, t]) => t && now - t.at >= 0 && now - t.at <= MAX_AGE_MS)
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, MAX_TRIPS);
  return Object.fromEntries(live);
}

// Save the trip and return the orcid.org URL that starts it. localStorage, not sessionStorage, so a trip still
// matches when the browser brings ORCID's answer back in another tab. Linking (settings, claim) records the account
// that started it, and the return page refuses to link to any other.
export function orcidTripUrl({ flow, authorId = null, redirect = null, userId = null }, {
  storage = globalThis.localStorage, origin = globalThis.location?.origin, cryptoObj = globalThis.crypto, now = Date.now(),
} = {}) {
  if (!ORCID_FLOWS.includes(flow)) throw new Error(`Unknown ORCID trip: ${flow}`);
  if ((flow === 'settings' || flow === 'claim') && !userId) throw new Error('Linking an ORCID needs the signed-in account');
  const state = randomHex(cryptoObj);
  const trips = readTrips(storage, now);
  trips[state] = { flow, authorId, redirect, userId, at: now };
  storage.setItem(KEY, JSON.stringify(trips));
  return orcidAuthorizeUrl({ origin, state });
}

export function startOrcidTrip(trip) {
  window.location.assign(orcidTripUrl(trip));
}

// The trip `state` belongs to, {flow, authorId, redirect, userId}, or null when this browser didn't start it (or
// started it over 30 minutes ago). A state works once; other trips are left alone.
export function takeOrcidTrip(state, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  const trips = readTrips(storage, now);
  const trip = typeof state === 'string' && state ? trips[state] : null;
  if (trip) delete trips[state];
  storage.setItem(KEY, JSON.stringify(trips));
  if (!trip || !ORCID_FLOWS.includes(trip.flow)) return null;
  return { flow: trip.flow, authorId: trip.authorId || null, redirect: trip.redirect || null, userId: trip.userId || null };
}

// Sign-up with ORCID: the emailed link links the iD only when it is opened in this browser. We keep a random key per
// sign-up here (a few, for two tabs or a retry; two days, longer than a link lives) and send users-api only its
// SHA-256; the link page sends the keys themselves, and the one that matches links.
const SIGNUP_KEY_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000;

function readSignupKeys(storage, now) {
  let keys = [];
  try {
    keys = JSON.parse(storage.getItem(SIGNUP_KEY) || '[]');
  } catch (e) {
    keys = [];
  }
  return (Array.isArray(keys) ? keys : []).filter((k) => k && typeof k.key === 'string' && now - k.at <= SIGNUP_KEY_MAX_AGE_MS);
}

export async function newSignupKeyHash({ storage = globalThis.localStorage, cryptoObj = globalThis.crypto, now = Date.now() } = {}) {
  const key = randomHex(cryptoObj, 32);
  const keys = [{ key, at: now }, ...readSignupKeys(storage, now)].slice(0, MAX_TRIPS);
  storage.setItem(SIGNUP_KEY, JSON.stringify(keys));
  const digest = await cryptoObj.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// The keys to send with a link click; [] when there are none or storage can't be read (a login must never fail on
// this).
export function signupKeys({ storage = globalThis.localStorage, now = Date.now() } = {}) {
  try {
    return readSignupKeys(storage, now).map((k) => k.key);
  } catch (e) {
    return [];
  }
}

// After logging in with ORCID: welcome them and go where they were headed.
export function finishOrcidLogin({ store, router, redirect }) {
  store.commit('snackbar', copy.orcidSignIn.welcomeBack(store.getters['user/userName']));
  router.replace(sanitizeRedirectPath(redirect, '/'));
}
