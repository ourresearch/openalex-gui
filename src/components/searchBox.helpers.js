// Pure identifier-detection helpers for the homepage/SERP search box.
// Kept in a standalone module so they can be unit-tested without mounting the
// Vue component.

/**
 * Detect an ISSN-shaped query and normalize it to the canonical NNNN-NNNC form
 * (hyphenated, uppercase check digit). Returns null if the input isn't an ISSN.
 *
 * Accepts:
 *   "2041-1723"        -> "2041-1723"
 *   "20411723"         -> "2041-1723"   (missing hyphen)
 *   "ISSN: 2041-1723"  -> "2041-1723"   (labeled)
 *   "1234-567X"        -> "1234-567X"   (X check digit)
 */
export function extractIssn(str) {
  if (!str) return null;
  let trimmed = str.trim();

  // Strip an optional "ISSN:" / "ISSN " label.
  const labelMatch = trimmed.match(/^issn[:\s]\s*(.+)$/i);
  if (labelMatch) trimmed = labelMatch[1].trim();

  // Bare ISSN, with or without the hyphen: NNNN-NNNC or NNNNNNNC.
  const m = trimmed.match(/^(\d{4})-?(\d{3}[\dxX])$/);
  if (m) return `${m[1]}-${m[2].toUpperCase()}`;

  return null;
}
