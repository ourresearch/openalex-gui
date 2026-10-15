// oxjob #1689 SSR spike: stand-in browser globals for Node, which RECORD every
// access site (file:line) so each one can be counted as production work.
// Import before loading the app. sites() returns the access report.
const hits = new Map(); // "global.prop @ file:line" -> count
const phase = { name: 'load' };
function site() {
  const stack = new Error().stack.split('\n').slice(3);
  for (const l of stack) {
    const m = l.match(/(\/src\/[^:)]+):(\d+)/) || l.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\/[^:)]*:(\d+)/);
    if (m && !l.includes('browser-globals-shim')) return `${m[1]}:${m[2]}`;
  }
  return '(unknown)';
}
function record(name) {
  const k = `${phase.name}\t${name}\t${site()}`;
  hits.set(k, (hits.get(k) || 0) + 1);
}
function traced(name, target) {
  return new Proxy(target, {
    get(t, p, r) {
      if (typeof p === 'string') record(`${name}.${p}`);
      return Reflect.get(t, p, r);
    },
  });
}
const store = new Map();
const localStorageImpl = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
const locationImpl = {
  href: 'https://openalex.org/', origin: 'https://openalex.org', protocol: 'https:',
  host: 'openalex.org', hostname: 'openalex.org', port: '', pathname: '/', search: '', hash: '',
};
const documentImpl = {
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: () => {}, removeEventListener: () => {}, createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  readyState: 'loading', cookie: '', documentElement: { style: {}, classList: { add() {}, remove() {} } }, body: { style: {}, classList: { add() {}, remove() {} } },
  head: { appendChild() {} }, visibilityState: 'visible', hidden: false, referrer: '',
};
const historyImpl = { state: null, replaceState() {}, pushState() {}, back() {} };
const windowImpl = {
  location: traced('location', locationImpl),
  localStorage: traced('localStorage', localStorageImpl),
  sessionStorage: traced('sessionStorage', { ...localStorageImpl }),
  document: traced('document', documentImpl),
  history: traced('history', historyImpl),
  navigator: globalThis.navigator,
  console, setTimeout, clearTimeout, setInterval, clearInterval,
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  innerWidth: 1280, innerHeight: 800, scrollTo: () => {}, scrollY: 0, devicePixelRatio: 1,
  ResizeObserver: class { observe() {} unobserve() {} disconnect() {} },
  IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
  MutationObserver: class { observe() {} disconnect() {} },
  requestAnimationFrame: (cb) => setTimeout(cb, 0), cancelAnimationFrame: (id) => clearTimeout(id),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
};
const win = traced('window', windowImpl);
windowImpl.window = win; windowImpl.self = win; windowImpl.top = win;

export function install() {
  for (const [name, val] of Object.entries({
    window: win, document: windowImpl.document, localStorage: windowImpl.localStorage,
    sessionStorage: windowImpl.sessionStorage, location: windowImpl.location, history: windowImpl.history,
    matchMedia: windowImpl.matchMedia, ResizeObserver: windowImpl.ResizeObserver,
    IntersectionObserver: windowImpl.IntersectionObserver, requestAnimationFrame: windowImpl.requestAnimationFrame,
  })) {
    Object.defineProperty(globalThis, name, { value: val, configurable: true, writable: true });
  }
}
export function setPhase(n) { phase.name = n; }
export function sites() { return [...hits.entries()].map(([k, n]) => k + '\t' + n).sort(); }
