// Pure identifier-detection helpers for the homepage/SERP search box.
// Kept in a standalone module so they can be unit-tested without mounting the
// Vue component.

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
