// oxjob #1689 Nuxt trial: one place to ask "is there a browser here?"
export const hasBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

// #1689: true only inside the Nuxt server build (Vite replaces import.meta.server at
// build time); false in the browser build and in unit tests, which run app modules in
// Node without a window but are not a server render.
export const isServerRender = !!import.meta.server;

// True while the browser app is hydrating server-rendered HTML (set by the Nuxt
// store plugin). Anything personal (login state, saved lists) must render the
// logged-out version until hydration is done, or it won't match the server HTML.
let _hydrating = false;
export function setHydrating(v) { _hydrating = !!v; }
export function isHydrating() { return _hydrating; }
