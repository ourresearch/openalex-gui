// Which canonical OQL the site shows (oxjob #1555, Jason 2026-10-13). Until the flip the API
// returns both forms wherever it returns canonical OQL: `oql` (today's form) and `x_new_oql`
// (OQL core v3: get / rank / break down), on meta.x_query, /query and /validate. The
// `new_oql` feature flag shows the new form everywhere the site shows a query's OQL; off,
// nothing changes. Every display reads through pickOql (or the store's `shownOql` getter for
// the current results), so the swap and anything that rewrites the OQL can't drift apart.

export const NEW_OQL_FLAG = 'new_oql';

/** The canonical OQL to show from anything carrying `oql` (and `x_new_oql`): an execute
 *  response's meta.x_query, a /query or /validate response. With the flag on, the new form
 *  when the API gave one, else today's. */
export function pickOql(obj, newOql) {
  if (!obj) return null;
  return (newOql && obj.x_new_oql) || obj.oql || null;
}
