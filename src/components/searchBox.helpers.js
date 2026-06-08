// Pure identifier-detection helpers for the homepage/SERP search box.
// Kept in a standalone module so they can be unit-tested without mounting the
// Vue component.

import { parseId } from '@/openalexId';

/**
 * Detect a pasted/typed OpenAlex entity ID and return its parsed form so the
 * search box can jump straight to the entity page (zd#8363), the way DOI/ORCID
 * already do. Returns the parseId() result `{ entityType, shortId, isNative,
 * normalized }` or null if the input isn't a native OpenAlex ID.
 *
 * Accepts the forms a user would paste:
 *   "A5017453014"                                  -> authors/a5017453014
 *   "https://openalex.org/A5017453014"             -> authors/a5017453014
 *   "https://openalex.org/authors/A5017453014"     -> authors/a5017453014
 *   "W2163605009", "S137773608", "I27837315", ...  -> works/sources/institutions/...
 *
 * Guards against hijacking ordinary searches:
 *  - single token only (a multi-word query that merely starts with an ID-shaped
 *    word is a real search, not an identifier lookup);
 *  - native entity types only (W/A/I/S/P/F/C/T/G), not namespaced externals
 *    like "sdgs/1";
 *  - the numeric part must be >=4 digits, so short tokens like "a5", "t2" or
 *    "c19" stay regular searches. (Real OpenAlex IDs are far longer.)
 *
 * The caller still verifies the ID resolves against the API before navigating,
 * so a non-existent-but-ID-shaped token falls through to a normal search.
 */
export function extractOpenalexId(str) {
  if (!str) return null;
  const trimmed = String(str).trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  const parsed = parseId(trimmed);
  if (!parsed || !parsed.isNative) return null;

  const digits = parsed.shortId.replace(/^[a-z]/i, '');
  if (!/^\d{4,}$/.test(digits)) return null;

  return parsed;
}

/**
 * Detect an ISSN-shaped query and normalize it to the canonical NNNN-NNNC form
 * (hyphenated, uppercase check digit). Returns null if the input isn't an ISSN.
 *
 * Designed to be paste-tolerant: ISSNs copied from journal pages, PDFs, or
 * Wikipedia frequently arrive with a Unicode dash (en-dash, non-breaking
 * hyphen, minus sign) instead of an ASCII hyphen, with a non-breaking/zero-width
 * space, or wrapped in a label / parenthetical. Typing always produces a clean
 * ASCII hyphen, which is why typing worked but pasting didn't (zd#8095).
 *
 * Accepts e.g.:
 *   "2041-1723"            -> "2041-1723"
 *   "20411723"             -> "2041-1723"   (missing hyphen)
 *   "2041–1723"       -> "2041-1723"   (en-dash)
 *   "ISSN: 2041-1723"      -> "2041-1723"   (labeled)
 *   "eISSN 2041-1723"      -> "2041-1723"
 *   "2041-1723 (Online)"   -> "2041-1723"   (trailing parenthetical)
 *   "1234-567X"            -> "1234-567X"   (X check digit)
 */
export function extractIssn(str) {
  if (!str) return null;

  let s = String(str)
    // Normalize the many Unicode hyphen/dash variants to an ASCII hyphen:
    // hyphen, non-breaking hyphen, figure/en/em dashes (U+2010–U+2015),
    // minus sign (U+2212), and the full-width hyphen (U+FF0D).
    .replace(/[‐-―−－]/g, '-')
    // Drop zero-width characters that can ride along on a paste.
    .replace(/[​-‍﻿]/g, '')
    // Non-breaking space -> regular space.
    .replace(/ /g, ' ')
    .trim();

  // Strip an optional leading label: "ISSN", "eISSN", "pISSN", "Online ISSN",
  // "Print ISSN", "ISSN-L", with optional colon and surrounding space.
  s = s.replace(/^(?:e|p|online|print)?\s*issn(?:-l)?\s*:?\s*/i, '').trim();

  // Exact ISSN, with or without the hyphen: NNNN-NNNC or NNNNNNNC.
  let m = s.match(/^(\d{4})-?(\d{3}[\dxX])$/);
  if (m) return `${m[1]}-${m[2].toUpperCase()}`;

  // Hyphenated ISSN embedded in surrounding text, e.g. "2041-1723 (Online)".
  // Require the hyphen here so we don't treat an arbitrary 8-digit run inside a
  // longer query as an ISSN; bound it by non-digits on both sides.
  m = s.match(/(?:^|[^\d-])(\d{4})-(\d{3}[\dxX])(?![\d-])/);
  if (m) return `${m[1]}-${m[2].toUpperCase()}`;

  return null;
}

/**
 * True if the query contains a `*` or `?` wildcard OUTSIDE of a quoted phrase.
 *
 * A wildcard only works on the no-stem (exact) field: on the default stemmed
 * search the engine strips the literal prefix at index time and silently returns
 * wrong results, so it rejects the query (#364). The advised fix — the
 * `search.exact=` param — can't be typed into the search box (it just becomes
 * part of the search string and loops the same error, zd#9012). So the search box
 * detects an unquoted wildcard and auto-routes to the exact field instead.
 *
 * Mirrors the backend `_has_unquoted_wildcard` (openalex-elastic-api
 * core/search.py): strip `"quoted phrases"` first (a wildcard inside quotes is a
 * separate, adjacency/proximity case the engine handles on its own), then a
 * wildcard in any remaining whitespace-separated token counts.
 */
export function hasUnquotedWildcard(str) {
  if (!str || typeof str !== 'string') return false;
  const unquoted = str.replace(/"[^"]*"/g, ' ');
  return unquoted.split(/\s+/).some(word => word.includes('*') || word.includes('?'));
}
