/**
 * How an EntityDatumRow's extracted value decides between "these are entities I
 * can link to" and "these are just strings". Pulled out of the component so it
 * can be unit-tested (there's no component-mount harness in this repo).
 *
 * The rule that matters (oxjob #619, reported by CNRS/Inist): an entity list may
 * legitimately be MIXED. A work's authorship list carries one item per byline
 * entry, and not every byline entry resolves to an author profile — a corporate
 * or group byline like "WHO Consultation" on W2134293572 is a real author with
 * no author id, and `facetConfigs`' extractFn deliberately emits it with
 * `id: null`.
 *
 * This used to be all-or-nothing: the row demanded that EVERY item carry an id
 * before it would render links, so a single unresolved byline entry silently
 * demoted the WHOLE list to plain text and made every other author on the page
 * unclickable. Link what we can link; render the rest as text.
 */

/**
 * The items to render as entity links, or null if this value isn't an entity
 * list at all. A returned list can contain items with no `id` — those are not
 * linkable and the caller should render them as plain text.
 */
export function entityLinkItems(rawValue) {
  if (rawValue?.id) return [rawValue];
  if (!Array.isArray(rawValue)) return null;
  const validItems = rawValue.filter(o => o);
  // `some`, not `every`: one unlinkable member doesn't make the list unlinkable.
  if (validItems.length > 0 && validItems.some(o => o?.id)) return validItems;
  return null;
}

/**
 * The items to render as plain strings, or null when `entityLinkItems` has
 * already claimed this value. The null guard is load-bearing: the template
 * renders these two branches in separate `v-if`s, so a value that satisfied
 * both would render the list twice.
 */
export function stringItems(rawValue) {
  if (!Array.isArray(rawValue)) return null;
  if (entityLinkItems(rawValue)) return null;
  return rawValue
    .filter(v => v !== null && v !== undefined)
    .map(v => {
      if (typeof v === 'object' && v.display_name) return v.display_name;
      if (typeof v === 'string') return v;
      return String(v);
    });
}
