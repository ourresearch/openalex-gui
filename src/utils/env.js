// oxjob #1689 Nuxt trial: one place to ask "is there a browser here?"
export const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// True while the browser app is hydrating server-rendered HTML (set by the Nuxt
// store plugin). Anything personal (login state, saved lists) must render the
// logged-out version until hydration is done, or it won't match the server HTML.
let _hydrating = false;
export function setHydrating(v) { _hydrating = !!v; }
export function isHydrating() { return _hydrating; }
