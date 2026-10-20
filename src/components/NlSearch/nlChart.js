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

/** The format a chat answer opens on: a chart when one fits the result, else the list. */
export function defaultFormat(resultsObject, oql, pick = pickFn, hasChart = !!chartLoader) {
  if (pick && hasChart) {
    try {
      return pick(resultsObject, oql) ? 'chart' : 'list';
    } catch (e) { /* fall through to the shape rule */ }
  }
  if (isPipelineResponse(resultsObject)) return hasChart ? 'chart' : 'table';
  return 'list';
}
