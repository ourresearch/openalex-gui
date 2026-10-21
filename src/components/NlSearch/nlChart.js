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
