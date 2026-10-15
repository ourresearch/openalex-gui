// oxjob #1689 SSR spike: browser-only globals, guarded so modules can load and
// components can set up in Node. On the server there is no visitor storage, so
// reads return null (a logged-out, default-preferences visitor).
import { ref } from 'vue';

export const IN_BROWSER = typeof window !== 'undefined';

// True while the client hydrates server HTML. The server can't see the
// visitor's login (the token lives in localStorage), so until hydration ends
// the client must render as logged out too, then apply the cached user.
export const isHydrating = ref(false);

export const storage = {
    getItem: (k) => (IN_BROWSER ? window.localStorage.getItem(k) : null),
    setItem: (k, v) => { if (IN_BROWSER) window.localStorage.setItem(k, v); },
    removeItem: (k) => { if (IN_BROWSER) window.localStorage.removeItem(k); },
};
