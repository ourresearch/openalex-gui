// The Visualization format's hookup (oxjob #1744). The chart itself is #1745's: it owns
// ./Chart/ (NlResultChart.vue: props oql + resultsObject; pickChart.js: pickChart(resultsObject,
// oql) -> {type, title, options} or null for a plain list). They're found with import.meta.glob
// so this page builds and ships whether or not that folder has landed yet.
import { isPipelineResponse } from '@/oqlPipeline';

const chartModules = import.meta.glob('./Chart/NlResultChart.vue');
const pickModules = import.meta.glob('./Chart/pickChart.js');

export const chartLoader = chartModules['./Chart/NlResultChart.vue'] || null;

let pickFn = null;
let pickPromise = null;

/** Load #1745's pickChart once (null when it hasn't landed). */
export function loadPickChart() {
  if (!pickPromise) {
    const load = pickModules['./Chart/pickChart.js'];
    pickPromise = (load ? load() : Promise.resolve(null))
      .then((m) => { pickFn = m?.pickChart || null; return pickFn; })
      .catch(() => null);
  }
  return pickPromise;
}

/** The format a chat answer opens on: a chart when one fits a calculation, else its table;
 *  the list for a list. */
export function defaultFormat(resultsObject, oql, pick = pickFn, hasChart = !!chartLoader) {
  const isPipeline = isPipelineResponse(resultsObject);
  if (pick && hasChart) {
    try {
      if (pick(resultsObject, oql)) return 'chart';
      return isPipeline ? 'table' : 'list';
    } catch (e) { /* fall through to the shape rule */ }
  }
  if (isPipeline) return hasChart ? 'chart' : 'table';
  return 'list';
}

// ---- The results view (oxjob #1744, Jason 2026-10-21) --------------------------------------
// What, then how: a calculation has two tabs, Groups (Chart | Table) and Works (List | Table);
// a plain list is only works (List | Table). One object holds the open tab and each tab's own
// format, so a plain list shows Works by the works format whatever tab a calculation left open.
export const DEFAULT_VIEW = Object.freeze({ tab: 'groups', groups: 'chart', works: 'list' });

/** A stored view made whole. A v1 format string ('table' | 'list' | 'chart') maps across. */
export function normalizeView(v) {
  if (typeof v === 'string') {
    if (v === 'table') return { tab: 'groups', groups: 'table', works: 'table' };
    if (v === 'list') return { ...DEFAULT_VIEW, tab: 'works' };
    return { ...DEFAULT_VIEW };
  }
  const o = v && typeof v === 'object' ? v : {};
  return {
    tab: o.tab === 'works' ? 'works' : 'groups',
    groups: o.groups === 'table' ? 'table' : 'chart',
    works: o.works === 'table' ? 'table' : 'list',
  };
}

/** The view a chat answer opens on, from defaultFormat's pick: a chart or table opens the
 *  Groups tab; the list sets the works format and leaves the tab, so a later calculation
 *  still opens on its groups. */
export function answerView(view, format) {
  const v = normalizeView(view);
  if (format === 'chart' || format === 'table') return { ...v, tab: 'groups', groups: format };
  return { ...v, works: 'list' };
}

// The Groups tab's label: the groups named by what they are (#1744, Jason Wed 21 Oct): "9 years",
// "2,612 sources", "2 countries by year" (two splits: the outer's count, then the inner).
// A calculation with no split is one row of numbers: "Summary".
function plural(name) {
  const words = String(name || '').trim().split(/\s+/);
  const last = words.pop() || 'group';
  let p;
  if (/^[A-Z0-9]+$/.test(last)) p = `${last}s`;
  else if (/(s|x|ch|sh)$/i.test(last)) p = `${last}es`;
  else if (/[^aeiou]y$/i.test(last)) p = `${last.slice(0, -1)}ies`;
  else p = `${last}s`;
  return [...words, p].join(' ');
}
function splitName(split) {
  // `country in (...)` and the like: the name is what comes before the values.
  return String(split?.oql || '').split(/\s+(?:in|from|except)\b|\(/)[0].trim() || 'group';
}
export function groupsTabLabel(meta) {
  const splits = meta?.splits || [];
  if (!splits.length) return 'Summary';
  const n = meta.groups_count ?? 0;
  const outer = splitName(splits[0]);
  const label = `${n.toLocaleString()} ${n === 1 ? outer : plural(outer)}`;
  return splits.length > 1 ? `${label} by ${splitName(splits[1])}` : label;
}
